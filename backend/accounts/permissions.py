from rest_framework.permissions import BasePermission
from django.utils import timezone


class IsAdmin(BasePermission):
    """Allow access only to superusers or staff."""

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        
        # Check for superuser or staff status
        return user.is_superuser or user.is_staff


class IsAgent(BasePermission):
    """Allow access only to users in the 'agent' group (or superusers)."""

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        # Check if user is superuser or in agent group
        return user.is_superuser or user.groups.filter(name='agent').exists()


class HasActiveSubscription(BasePermission):
    """
    Allow access only to agents with an active subscription.
    Admins bypass this check.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        
        # Admins bypass subscription check
        if user.is_superuser:
            return True
        
        # Check if user is an agent
        if not user.groups.filter(name='agent').exists():
            return False
        
        # Check subscription status
        try:
            agent_profile = user.agentprofile
            
            # Check if subscription is active
            if not agent_profile.subscription_active:
                return False
            
            # Check if subscription has expired
            if agent_profile.subscription_expires:
                if agent_profile.subscription_expires < timezone.now():
                    # Auto-deactivate expired subscription
                    agent_profile.subscription_active = False
                    agent_profile.save()
                    return False
            
            return True
        except:
            return False


class HasFeatureAccess(BasePermission):
    """
    Check if user's subscription plan includes a specific feature.
    Usage: Add feature_code to view's class attributes.
    Example: feature_code = 'create_listing'
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        
        # Admins bypass feature checks
        if user.is_superuser:
            return True
        
        # Get required feature code from view
        feature_code = getattr(view, 'feature_code', None)
        if not feature_code:
            # If no feature code specified, allow access
            return True
        
        # Check if user is an agent with active subscription
        if not user.groups.filter(name='agent').exists():
            return False
        
        try:
            agent_profile = user.agentprofile
            
            # Check subscription is active
            if not agent_profile.subscription_active:
                return False
            
            # Check if subscription has expired
            if agent_profile.subscription_expires:
                if agent_profile.subscription_expires < timezone.now():
                    agent_profile.subscription_active = False
                    agent_profile.save()
                    return False
            
            # Check if current plan includes the required feature
            if agent_profile.current_plan:
                from properties.models import Feature
                
                # Check if feature exists and is active
                try:
                    feature = Feature.objects.get(code=feature_code, is_active=True)
                except Feature.DoesNotExist:
                    # Feature doesn't exist or is inactive
                    return False
                
                # Check if plan includes this feature
                return agent_profile.current_plan.features.filter(id=feature.id).exists()
            
            return False
        except:
            return False
