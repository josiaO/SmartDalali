from decimal import Decimal

from rest_framework import serializers
from .models import (
    AgentProfile, Property, MediaProperty, PropertyFeature, PropertyVisit,
    Payment, SupportTicket, TicketReply, Feature, SubscriptionPlan, AgentRating,
    PropertyLike
)
from accounts.models import Profile
from utils.google_maps import geocode_address, build_maps_url


class MediaPropertySerializer(serializers.ModelSerializer):
    Images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()

    class Meta:
        model = MediaProperty
        fields = ['id', 'Images', 'videos', 'caption']

    def get_Images(self, obj):
        if not obj.Images:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.Images.url)
        return obj.Images.url

    def get_videos(self, obj):
        if not obj.videos:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.videos.url)
        return obj.videos.url


class PropertyFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyFeature
        fields = ['id', 'features', 'property']

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features = FeatureSerializer(many=True, read_only=True)
    feature_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Feature.objects.all(), source='features'
    )

    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'duration_days', 'description', 'features', 'feature_ids', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PropertyVisitSerializer(serializers.ModelSerializer):
    visitor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyVisit
        fields = ['id', 'property', 'visitor', 'visitor_name', 'scheduled_time', 'status', 'notes', 'created_at']
        read_only_fields = ['visitor', 'visitor_name', 'created_at']
    
    def get_visitor_name(self, obj):
        """Return the visitor's full name or username"""
        if obj.visitor.first_name and obj.visitor.last_name:
            return f"{obj.visitor.first_name} {obj.visitor.last_name}"
        return obj.visitor.username

class SerializerProperty(serializers.ModelSerializer):
    # use the related_name from MediaProperty and PropertyFeature models
    media = MediaPropertySerializer(source='MediaProperty', many=True, required=False)
    property_features = PropertyFeatureSerializer(many=True, required=False)
    agent = serializers.SerializerMethodField()
    main_image_url = serializers.SerializerMethodField()
    address = serializers.CharField(source='adress', required=False, allow_blank=True)
    maps_url = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price', 'status', 'type',
            'rooms', 'bedrooms', 'bathrooms', 'area', 'city', 'address',
            'latitude', 'longitude', 'google_place_id', 'maps_url',
            'is_published', 'is_paid', 'parking', 'year_built',
            'featured_until', 'view_count', 'owner', 'created_at', 'updated_at',
            'media', 'property_features', 'agent', 'main_image_url',
            'like_count', 'is_liked'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at', 'view_count', 'google_place_id', 'maps_url', 'like_count', 'is_liked']

    def _get_absolute_url(self, file_field):
        if not file_field:
            return None
        try:
            url = file_field.url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return None

    def get_agent(self, obj):
        try:
            user = obj.owner
            profile = getattr(user, 'profile', None) # accounts.Profile instance
            profile_pic = getattr(profile, 'image', None) if profile else None
            
            return {
                'id': str(user.id), # Ensure ID is string as per frontend
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': getattr(profile, 'phone_number', None) if profile else None,
                'profile_picture': self._get_absolute_url(profile_pic),
            }
        except Exception:
            return {
                'id': None,
                'username': None,
                'first_name': None,
                'last_name': None,
                'email': None,
                'phone_number': None,
                'profile_picture': None,
            }

    def get_main_image_url(self, obj):
        try:
            # Prefer first MediaProperty image
            first = getattr(obj, 'MediaProperty', None)
            if first is not None:
                first_item = first.first()
                if first_item and getattr(first_item, 'Images', None):
                    return self._get_absolute_url(first_item.Images)
        except Exception:
            return None
        return None

    def get_maps_url(self, obj):
        lat, lng = obj.get_lat_lng()
        if lat and lng:
            return build_maps_url(lat, lng)
        return None

    def get_like_count(self, obj):
        """Return the total number of likes for this property"""
        return obj.likes.count()

    def get_is_liked(self, obj):
        """Return whether the current user has liked this property"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data, owner=None):
        # Handle nested lists if provided in validated_data
        media_data = validated_data.pop('MediaProperty', [])
        features_data = validated_data.pop('property_features', [])

        if owner is not None:
            validated_data['owner'] = owner

        request = self.context.get('request') if hasattr(self, 'context') else None
        # Accept multiple possible upload keys for backwards-compatibility
        file_keys = ['MediaProperty', 'ImagesProperty', 'images', 'media']
        video_keys = ['videos', 'video']
        
        # Enforce image limit
        new_images_count = 0
        if request is not None:
            for key in file_keys:
                new_images_count += len(request.FILES.getlist(key))
        
        # Also count images in media_data if any (though usually create doesn't have existing media)
        for m in media_data:
            if isinstance(m, dict) and m.get('Images'):
                new_images_count += 1

        if new_images_count > 10:
            raise serializers.ValidationError({"media": "Maximum of 10 images allowed per property."})

        property_instance = Property.objects.create(**validated_data)
        
        if request is not None:
            # Handle Images
            for key in file_keys:
                files = request.FILES.getlist(key)
                for f in files:
                    # MediaProperty model field for image is 'Images'
                    MediaProperty.objects.create(property=property_instance, Images=f)
            
            # Handle Videos
            for key in video_keys:
                files = request.FILES.getlist(key)
                for f in files:
                    MediaProperty.objects.create(property=property_instance, videos=f)

            # Features can be provided as repeated form fields
            if hasattr(request.POST, 'getlist'):
                feats = request.POST.getlist('property_features') or request.POST.getlist('features')
                for feat in feats:
                    PropertyFeature.objects.create(property=property_instance, features=feat)

        # If nested JSON was provided, create related instances too
        for m in media_data:
            # m may be a dict like {'Images': <file>} or {'Images': <url>}
            img = m.get('Images') if isinstance(m, dict) else None
            vid = m.get('videos') if isinstance(m, dict) else None
            if img or vid:
                MediaProperty.objects.create(property=property_instance, Images=img, videos=vid)

        for feat in features_data:
            if isinstance(feat, dict):
                val = feat.get('features')
            else:
                val = feat
            if val:
                PropertyFeature.objects.create(property=property_instance, features=val)

        self._sync_coordinates(property_instance, validated_data)
        return property_instance

    def update(self, instance, validated_data):
        """Update Property instance and optionally replace nested media and features.

        Behavior:
        - Update scalar fields present in validated_data.
        - If 'Features_Property' is present in the payload, replace existing Features with the provided list.
        - If 'MediaProperty' is present in the payload, replace existing MediaProperty items with the provided list.
        - If request.FILES contains upload keys, append those uploads to the media gallery.
        """
        media_data = validated_data.pop('MediaProperty', None)
        features_data = validated_data.pop('property_features', None)

        # Prevent owner changes via API
        validated_data.pop('owner', None)

        # Enforce image limit
        request = self.context.get('request') if hasattr(self, 'context') else None
        
        existing_count = instance.MediaProperty.exclude(Images='').count()
        
        # If media_data is provided, it replaces existing media, so we count that instead
        if media_data is not None:
            existing_count = 0
            for m in media_data:
                if isinstance(m, dict) and m.get('Images'):
                    existing_count += 1
        
        new_files_count = 0
        if request is not None:
            file_keys = ['MediaProperty', 'ImagesProperty', 'images', 'media']
            for key in file_keys:
                new_files_count += len(request.FILES.getlist(key))
        
        if existing_count + new_files_count > 10:
            raise serializers.ValidationError({"media": "Maximum of 10 images allowed per property."})

        # Update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace features if provided
        if features_data is not None:
            # remove existing features
            PropertyFeature.objects.filter(property=instance).delete()
            for feat in features_data:
                if isinstance(feat, dict):
                    val = feat.get('features')
                else:
                    val = feat
                if val:
                    PropertyFeature.objects.create(property=instance, features=val)

        # Replace media if provided (note: this will remove existing media records)
        if media_data is not None:
            MediaProperty.objects.filter(property=instance).delete()
            for m in media_data:
                img = m.get('Images') if isinstance(m, dict) else None
                vid = m.get('videos') if isinstance(m, dict) else None
                if img or vid:
                    MediaProperty.objects.create(property=instance, Images=img, videos=vid)

        # Handle uploaded files in the incoming request (append to gallery)
        if request is not None:
            file_keys = ['MediaProperty', 'ImagesProperty', 'images', 'media']
            video_keys = ['videos', 'video']
            
            for key in file_keys:
                files = request.FILES.getlist(key)
                for f in files:
                    MediaProperty.objects.create(property=instance, Images=f)
            
            for key in video_keys:
                files = request.FILES.getlist(key)
                for f in files:
                    MediaProperty.objects.create(property=instance, videos=f)

        should_refresh_coordinates = any(
            field in validated_data for field in ('adress', 'city')
        ) or instance.latitude is None or instance.longitude is None
        if should_refresh_coordinates:
            self._sync_coordinates(instance, validated_data)
        return instance

    def _sync_coordinates(self, instance, data, save=True):
        """Use Google Maps Geocoding API to fill latitude/longitude."""
        address = data.get('adress', instance.adress)
        city = data.get('city', instance.city)
        geo = geocode_address(address, city)
        if not geo:
            return
        lat = geo.get('lat')
        lng = geo.get('lng')
        place_id = geo.get('place_id')
        updated_fields = []
        if lat is not None:
            instance.latitude = Decimal(str(lat))
            updated_fields.append('latitude')
        if lng is not None:
            instance.longitude = Decimal(str(lng))
            updated_fields.append('longitude')
        if place_id:
            instance.google_place_id = place_id
            updated_fields.append('google_place_id')
        if updated_fields and save is not False:
            instance.save(update_fields=updated_fields)


# Serializers from payments app
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'user', 'property', 'method', 'amount', 'status', 'transaction_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class SubscriptionPaymentSerializer(serializers.Serializer):
    """For handling subscription payment requests."""
    plan = serializers.ChoiceField(choices=['monthly', 'annual'])
    phone = serializers.CharField(max_length=20)  # For M-Pesa number


# Serializers from support app
class TicketReplySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketReply
        fields = ['id', 'user', 'user_name', 'user_role', 'message', 'is_admin_reply', 'created_at']
        read_only_fields = ['user', 'is_admin_reply', 'created_at']
    
    def get_user_role(self, obj):
        if obj.user.is_superuser:
            return 'admin'
        elif obj.user.groups.filter(name='agent').exists():
            return 'agent'
        else:
            return 'user'


class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'user', 'user_name', 'user_email',
            'title', 'description', 'category', 'priority', 'status',
            'assigned_to', 'assigned_to_name', 'admin_reply', 'user_reply',
            'created_at', 'updated_at', 'closed_at', 'replies', 'reply_count'
        ]
        read_only_fields = ['user', 'ticket_number', 'created_at', 'updated_at', 'closed_at']
    
    def get_reply_count(self, obj):
        return obj.replies.count()


class CreateSupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['title', 'description', 'category', 'priority']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AgentRatingSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.username', read_only=True)
    agent_email = serializers.CharField(source='agent.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True)
    
    class Meta:
        model = AgentRating
        fields = [
            'id', 'agent', 'agent_name', 'agent_email',
            'user', 'user_name', 'user_email',
            'rating', 'review', 'property', 'property_title',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value
    
    def validate(self, data):
        # Prevent users from rating themselves
        request = self.context.get('request')
        if request and data.get('agent') == request.user:
            raise serializers.ValidationError('You cannot rate yourself')
        return data


class CreateAgentRatingSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating agent ratings."""
    class Meta:
        model = AgentRating
        fields = ['agent', 'rating', 'review', 'property']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)