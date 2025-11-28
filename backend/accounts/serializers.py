from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from properties.models import AgentProfile
from .roles import get_user_role

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    agent_profile = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'date_joined',
            'last_login', 'profile', 'agent_profile', 'role', 'groups'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'name': profile.name,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'image': profile.image.url if profile.image else None,
                'code': profile.code,
                'created_at': profile.created_at
            }
        except:
            return None
    
    def get_agent_profile(self, obj):
        try:
            agent_profile = obj.agentprofile
            return {
                'agency_name': agent_profile.agency_name,
                'phone': agent_profile.phone,
                'verified': agent_profile.verified,
                'verified': agent_profile.verified,
                'subscription_active': agent_profile.subscription_active,
                'subscription_expires': agent_profile.subscription_expires,
                'current_plan': {
                    'id': agent_profile.current_plan.id,
                    'name': agent_profile.current_plan.name,
                    'features': [f.code for f in agent_profile.current_plan.features.all()]
                } if agent_profile.current_plan else None
            }
        except:
            return None
    
    def get_role(self, obj):
        # Use centralized role determination logic
        return get_user_role(obj)

class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'name', 'phone_number', 'address', 'image', 'code', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'code', 'created_at', 'password']

class AgentProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    property_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AgentProfile
        fields = [
            'id', 'user', 'user_email', 'user_username', 'agency_name', 'phone',
            'verified', 'subscription_active', 'subscription_expires', 'current_plan',
            'first_name', 'last_name', 'property_count'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'user_username', 'first_name', 'last_name']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.current_plan:
            representation['current_plan'] = {
                'id': instance.current_plan.id,
                'name': instance.current_plan.name,
                'features': [f.code for f in instance.current_plan.features.all()]
            }
        return representation
    
    def get_property_count(self, obj):
        from properties.models import Property
        return Property.objects.filter(owner=obj.user).count()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    is_agent = serializers.BooleanField(default=False, write_only=True)
    email = serializers.EmailField(required=True)

    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'is_agent', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
            
        return data

    def create(self, validated_data):
        is_agent = validated_data.pop('is_agent', False)
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Auto-activate for now (or keep inactive if email verification is strict)
        user.is_active = True 
        user.save()
        
        # Profile is created by signal, but we can update role here if needed
        # However, signal handles role assignment based on groups usually.
        # Let's explicitly handle agent group assignment here.
        
        if is_agent:
            from django.contrib.auth.models import Group
            agent_group, _ = Group.objects.get_or_create(name='agent')
            user.groups.add(agent_group)
            # AgentProfile creation is also handled in views or signals usually, 
            # but we can ensure it here to be safe or rely on the signal.
            # The existing signal in models.py checks for group 'agent'.
            
            # We need to save user again or trigger the signal logic if it depends on groups being present *during* creation?
            # Actually, the signal 'create_or_update_profile' runs on post_save.
            # If we add group AFTER create_user, the signal ran already with no group.
            # So we might need to update the profile role manually or save user again.
            
            profile = user.profile
            profile.role = 'agent'
            profile.save()
            
            try:
                AgentProfile.objects.get_or_create(user=user, profile=profile)
            except Exception:
                pass
        
        return user