"""
API endpoint to get agent public profile with their properties.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from properties.models import Property
from properties.serializers import SerializerProperty


@api_view(['GET'])
@permission_classes([AllowAny])
def agent_public_profile(request, agent_id):
    """Get public profile of an agent with their active properties."""
    try:
        agent = get_object_or_404(User, id=agent_id, groups__name='agent')
    except User.DoesNotExist:
        return Response(
            {'error': 'Agent not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get agent's profile and agent_profile
    profile = getattr(agent, 'profile', None)
    agent_profile = getattr(agent, 'agentprofile', None)
    
    # Serialize agent data
    agent_data = {
        'id': agent.id,
        'username': agent.username,
        'first_name': agent.first_name,
        'last_name': agent.last_name,
        'email': agent.email,
        'profile': {
            'name': profile.name if profile else None,
            'phone_number': profile.phone_number if profile else None,
            'address': profile.address if profile else None,
            'image': profile.image.url if profile and profile.image else None,
        } if profile else None,
        'agent_profile': {
            'agency_name': agent_profile.agency_name if agent_profile else None,
            'phone': agent_profile.phone if agent_profile else None,
            'verified': agent_profile.verified if agent_profile else False,
        } if agent_profile else None,
    }
    
    # Get agent's active (non-archived) properties
    properties = Property.objects.filter(
        owner=agent,
        archived_at__isnull=True,
        is_published=True
    ).order_by('-created_at')
    
    # Serialize properties
    properties_data = SerializerProperty(properties, many=True, context={'request': request}).data
    
    return Response({
        'agent': agent_data,
        'properties': properties_data
    })
