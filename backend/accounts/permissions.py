from rest_framework.permissions import BasePermission
from .roles import is_agent, is_admin


class IsAgent(BasePermission):
    """Allow access only to users in the 'agent' group (or superusers)."""

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        try:
            return user.profile.role in ['agent', 'admin'] or user.is_superuser
        except:
            return False


class IsAdmin(BasePermission):
    """Allow access only to superusers or admin role."""

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        try:
            return user.profile.role == 'admin' or user.is_superuser
        except:
            return False
