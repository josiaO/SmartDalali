from decimal import Decimal

from rest_framework import serializers
from .models import (
    AgentProfile, Property, MediaProperty, Features, PropertyVisit,
    Payment, SupportTicket, TicketReply
)
from accounts.models import Profile
from utils.google_maps import geocode_address, build_maps_url


class MediaPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaProperty
        fields = ['id', 'Images', 'videos', 'caption']


class FeaturesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Features
        fields = ['id', 'features', 'property']

class PropertyVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyVisit
        fields = ['id', 'property', 'visitor', 'scheduled_time', 'status', 'notes', 'created_at']

class SerializerProperty(serializers.ModelSerializer):
    # use the related_name from MediaProperty and Features models
    MediaProperty = MediaPropertySerializer(many=True, required=False)
    Features_Property = FeaturesSerializer(many=True, required=False)
    agent = serializers.SerializerMethodField()
    main_image_url = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    maps_url = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price', 'status', 'type',
            'rooms', 'bedrooms', 'bathrooms', 'area', 'city', 'address',
            'latitude', 'longitude', 'google_place_id', 'maps_url',
            'is_published', 'is_paid',
            'featured_until', 'view_count', 'owner', 'created_at', 'updated_at',
            'MediaProperty', 'Features_Property', 'agent', 'main_image_url'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at', 'view_count', 'google_place_id', 'maps_url']

    def get_agent(self, obj):
        try:
            user = obj.owner
            profile = getattr(user, 'profile', None)
            return {
                'id': user.id,
                'username': getattr(user, 'username', None),
                'name': getattr(profile, 'name', None) if profile else None,
                'phone': getattr(profile, 'phone_number', None) if profile else None,
            }
        except Exception:
            return {'id': None, 'username': None, 'name': None, 'phone': None}

    def get_main_image_url(self, obj):
        try:
            # Prefer first MediaProperty image
            first = getattr(obj, 'MediaProperty', None)
            if first is not None:
                first_item = first.first()
                if first_item and getattr(first_item, 'Images', None):
                    try:
                        return first_item.Images.url
                    except Exception:
                        return None
        except Exception:
            return None
        return None

    def get_address(self, obj):
        # model currently has a typo 'adress' — expose it as 'address' for API consistency
        return getattr(obj, 'adress', None)

    def get_maps_url(self, obj):
        lat, lng = obj.get_lat_lng()
        if lat and lng:
            return build_maps_url(lat, lng)
        return None

    def create(self, validated_data, owner=None):
        # Handle nested lists if provided in validated_data
        media_data = validated_data.pop('MediaProperty', [])
        features_data = validated_data.pop('Features_Property', [])

        if owner is not None:
            validated_data['owner'] = owner

        property_instance = Property.objects.create(**validated_data)

        request = self.context.get('request') if hasattr(self, 'context') else None
        # Accept multiple possible upload keys for backwards-compatibility
        file_keys = ['MediaProperty', 'ImagesProperty', 'images', 'media']
        if request is not None:
            for key in file_keys:
                files = request.FILES.getlist(key)
                for f in files:
                    # MediaProperty model field for image is 'Images'
                    MediaProperty.objects.create(property=property_instance, Images=f)

            # Features can be provided as repeated form fields
            if hasattr(request.POST, 'getlist'):
                feats = request.POST.getlist('Features_Property') or request.POST.getlist('features')
                for feat in feats:
                    Features.objects.create(property=property_instance, features=feat)

        # If nested JSON was provided, create related instances too
        for m in media_data:
            # m may be a dict like {'Images': <file>} or {'Images': <url>}
            img = m.get('Images') if isinstance(m, dict) else None
            MediaProperty.objects.create(property=property_instance, Images=img)

        for feat in features_data:
            if isinstance(feat, dict):
                val = feat.get('features')
            else:
                val = feat
            if val:
                Features.objects.create(property=property_instance, features=val)

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
        features_data = validated_data.pop('Features_Property', None)

        # Prevent owner changes via API
        validated_data.pop('owner', None)

        # Update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace features if provided
        if features_data is not None:
            # remove existing features
            Features.objects.filter(property=instance).delete()
            for feat in features_data:
                if isinstance(feat, dict):
                    val = feat.get('features')
                else:
                    val = feat
                if val:
                    Features.objects.create(property=instance, features=val)

        # Replace media if provided (note: this will remove existing media records)
        if media_data is not None:
            MediaProperty.objects.filter(property=instance).delete()
            for m in media_data:
                img = m.get('Images') if isinstance(m, dict) else None
                MediaProperty.objects.create(property=instance, Images=img)

        # Handle uploaded files in the incoming request (append to gallery)
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request is not None:
            file_keys = ['MediaProperty', 'ImagesProperty', 'images', 'media']
            for key in file_keys:
                files = request.FILES.getlist(key)
                for f in files:
                    MediaProperty.objects.create(property=instance, Images=f)

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