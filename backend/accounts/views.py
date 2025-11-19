from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.http import JsonResponse
import json
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.db import transaction
from .permissions import IsAdmin, IsAgent
from datetime import timedelta
from .models import Profile
from properties.models import AgentProfile, Property
from .serializers import UserSerializer, UserProfileSerializer, AgentProfileSerializer
from .forms import SignupForm, ActivationForm
from .roles import get_user_role, is_agent


class UserManagementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    # Only superusers (admin) should manage users
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        queryset = User.objects.all().select_related('profile')
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role == 'agent':
            queryset = queryset.filter(groups__name='agent')
        elif role == 'user':
            queryset = queryset.exclude(groups__name='agent').exclude(is_superuser=True)
        elif role == 'admin':
            queryset = queryset.filter(is_superuser=True)
        
        # Search by username or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['post'])
    def toggle_agent_status(self, request, pk=None):
        """Toggle agent status for a user"""
        user = self.get_object()
        agent_group = Group.objects.get(name='agent')
        
        if user.groups.filter(name='agent').exists():
            user.groups.remove(agent_group)
            # Deactivate agent profile if exists
            try:
                agent_profile = user.agentprofile
                agent_profile.subscription_active = False
                agent_profile.save()
            except:
                pass
            message = f"{user.username} is no longer an agent"
        else:
            user.groups.add(agent_group)
            # Create agent profile if doesn't exist
            AgentProfile.objects.get_or_create(user=user, profile=user.profile)
            message = f"{user.username} is now an agent"
        
        return Response({'message': message})
    
    @action(detail=True, methods=['post'])
    def toggle_active_status(self, request, pk=None):
        """Toggle active status for a user"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        status_text = "activated" if user.is_active else "deactivated"
        return Response({'message': f"{user.username} has been {status_text}"})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'agents': User.objects.filter(groups__name='agent').count(),
            'admins': User.objects.filter(is_superuser=True).count(),
            'users_with_profiles': User.objects.filter(profile__isnull=False).count(),
            'recent_signups': User.objects.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
        }
        # Monthly signup stats (last 6 months approximate)
        monthly_stats = []
        for i in range(6):
            month_start = timezone.now() - timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            count = User.objects.filter(
                date_joined__gte=month_start,
                date_joined__lt=month_end
            ).count()
            monthly_stats.append({
                'month': month_start.strftime('%b'),
                'count': count
            })

        stats['monthly_signups'] = monthly_stats

        return Response(stats)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return Profile.objects.all()
        else:
            return Profile.objects.filter(user=self.request.user)
    
    def get_object(self):
        if self.request.user.is_superuser:
            return super().get_object()
        else:
            return self.request.user.profile
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()

class AgentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = AgentProfileSerializer
    # Only authenticated agents or admins can access agent profile endpoints
    permission_classes = [IsAuthenticated, IsAgent]
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return AgentProfile.objects.all()
        else:
            return AgentProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        if self.request.user.is_superuser:
            return super().get_object()
        else:
            return self.request.user.agentprofile
    
    @action(detail=True, methods=['post'])
    def verify_agent(self, request, pk=None):
        """Verify an agent (admin only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        agent_profile = self.get_object()
        agent_profile.verified = True
        agent_profile.save()
        
        return Response({'message': f"Agent {agent_profile.user.username} has been verified"})
    
    @action(detail=True, methods=['post'])
    def activate_subscription(self, request, pk=None):
        """Activate agent subscription (admin only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        agent_profile = self.get_object()
        agent_profile.subscription_active = True
        agent_profile.subscription_expires = timezone.now() + timedelta(days=30)
        agent_profile.save()
        
        return Response({'message': f"Subscription activated for {agent_profile.user.username}"})


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
import logging

logger = logging.getLogger(__name__)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        logger.info('MyTokenObtainPairSerializer.get_token called for user=%s id=%s', user.username, user.id)
        token = super().get_token(user)
        token['username'] = user.username
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """Allow clients to POST either {'username','password'} or {'email','password'}.

        If 'email' is provided, we try to resolve the username and proceed with the standard
        token serializer flow. This keeps frontend callers that send 'email' working.
        """
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        logger.info('TokenObtain POST: incoming data email=%s username=%s', data.get('email'), data.get('username'))

        if 'email' in data and 'username' not in data:
            from django.contrib.auth import get_user_model
            UserModel = get_user_model()
            try:
                u = UserModel.objects.get(email__iexact=data.get('email'))
                data['username'] = u.get_username()
                # Log resolved username for debugging login/token issues
                try:
                    logger.info('TokenObtain: resolved email=%s to username=%s id=%s', data.get('email'), data['username'], u.id)
                except Exception:
                    pass
            except UserModel.DoesNotExist:
                # leave username absent so the serializer will return the usual error
                pass
        else:
            # Log when username is provided directly
            try:
                if 'username' in data:
                    logger.info('TokenObtain: login with username=%s', data.get('username'))
            except Exception:
                pass

        logger.info('TokenObtain: about to validate serializer with data username=%s', data.get('username'))
        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            logger.error('TokenObtain: serializer validation failed: %s', str(e))
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Log which user's token is being issued
        try:
            if hasattr(serializer, 'user'):
                logger.info('TokenObtain: issuing token for user=%s id=%s', serializer.user.username, serializer.user.id)
        except Exception:
            pass

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_user_routes(request):
    routes = [
        '/api/token/',
        '/api/token/refresh/',
    ]
    return Response(routes)


from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated logout (browser might have expired token)
def auth_logout(request):
    """Logout endpoint - blacklist refresh token"""
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            # If no refresh token provided, still return 205 (logout is idempotent)
            return Response(status=status.HTTP_205_RESET_CONTENT)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as e:
            logger.warning('Logout: could not blacklist token: %s', str(e))
            # Still return 205 even if blacklist fails (token will expire naturally)
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        logger.error('Logout failed: %s', str(e))
        # Return 205 anyway since we cleared tokens on the frontend
        return Response(status=status.HTTP_205_RESET_CONTENT)


@api_view(['POST'])
@permission_classes([AllowAny])
def firebase_login(request):
    """
    Firebase authentication endpoint.
    Receives Firebase ID token and exchanges it for Django JWT tokens.
    Creates/updates user in database based on Firebase user data.
    """
    try:
        firebase_token = request.data.get('firebase_token')
        firebase_uid = request.data.get('firebase_uid')
        email = request.data.get('email')
        display_name = request.data.get('display_name')

        if not firebase_token or not firebase_uid:
            return Response(
                {'error': 'firebase_token and firebase_uid are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify Firebase token
        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth

            decoded_token = firebase_auth.verify_id_token(firebase_token)
            
            # Verify that the token's uid matches the provided uid
            if decoded_token.get('uid') != firebase_uid:
                return Response(
                    {'error': 'Firebase token UID mismatch'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        except firebase_admin.exceptions.FirebaseError as e:
            logger.error(f'Firebase token verification failed: {str(e)}')
            return Response(
                {'error': 'Invalid Firebase token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f'Firebase verification error: {str(e)}')
            return Response(
                {'error': 'Firebase verification failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Create or get user
        try:
            with transaction.atomic():
                # Use email as username if available, otherwise use firebase_uid
                username = email.split('@')[0] if email else f'firebase_{firebase_uid[:10]}'
                
                # Ensure username is unique
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f'{base_username}_{counter}'
                    counter += 1

                # Get or create user
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': username,
                        'first_name': display_name or '',
                        'is_active': True,
                    }
                )

                # Update user info if they already existed
                if not created:
                    if display_name and not user.first_name:
                        user.first_name = display_name
                        user.save()

                # Ensure user has a profile
                profile, _ = Profile.objects.get_or_create(user=user)
                if display_name and not profile.name:
                    profile.name = display_name
                    profile.firebase_uid = firebase_uid
                    profile.save()
                elif not profile.firebase_uid:
                    profile.firebase_uid = firebase_uid
                    profile.save()

        except Exception as e:
            logger.error(f'User creation/update failed: {str(e)}')
            return Response(
                {'error': 'Failed to create/update user'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Generate JWT tokens
        try:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f'Token generation failed: {str(e)}')
            return Response(
                {'error': 'Failed to generate tokens'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        logger.error(f'Firebase login endpoint error: {str(e)}')
        return Response(
            {'error': 'Authentication failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    # Minimal registration implementation (replaces missing RegisterSerializer)
    data = request.data or {}
    username = data.get('username')
    # Support both 'password' and Django-style 'password1'/'password2' fields from frontend
    password = data.get('password') or data.get('password1')
    email = data.get('email')
    is_agent = bool(data.get('is_agent'))

    if not username or not password:
        return Response({'error': 'username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # If password1/password2 provided, ensure they match
    if data.get('password1') and data.get('password2') and data.get('password1') != data.get('password2'):
        return Response({'error': 'passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    # Auto-activate users immediately so they can sign in; activation email is still sent for verification
    user.is_active = True
    user.save()

    # If requested, add agent group and create AgentProfile
    if is_agent:
        agent_group, _ = Group.objects.get_or_create(name='agent')
        user.groups.add(agent_group)
        # create AgentProfile if not exists
        try:
            AgentProfile.objects.get_or_create(user=user, profile=user.profile)
        except Exception:
            pass

    # Profile will be created via signal; send activation email with templated content
    try:
        profile = user.profile
        if email:
            from django.template.loader import render_to_string
            frontend = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            activation_link = f"{frontend}/activate?username={username}&code={profile.code}"
            subject = 'Activate Your SmartDalali Account'
            text_body = render_to_string('emails/activation_email.txt', {
                'username': username,
                'activation_link': activation_link,
            })
            html_body = render_to_string('emails/activation_email.html', {
                'username': username,
                'activation_link': activation_link,
            })
            send_mail(
                subject,
                text_body,
                settings.EMAIL_HOST_USER,
                [email],
                html_message=html_body,
                fail_silently=True,
            )
    except Exception:
        pass

    return Response({'message': 'User created successfully. Please check your email to activate the account.'}, status=status.HTTP_201_CREATED)


def _coerce_to_dict(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return {}
    return {}


def _serialize_current_user(user):
    profile = getattr(user, 'profile', None)
    profile_data = None
    if profile:
        profile_data = {
            'name': profile.name,
            'phone_number': profile.phone_number,
            'address': profile.address,
            'image': profile.image.url if profile.image else None,
        }

    role = get_user_role(user)
    is_agent_flag = is_agent(user)
    subscription_info = {
        'is_agent': is_agent_flag,
        'subscription_active': False,
        'subscription_expires': None,
        'is_active': False,
        'trial_end_date': None,
    }
    agent_profile_data = None
    agent_profile = AgentProfile.objects.filter(user=user).first() if is_agent_flag else None
    if agent_profile:
        subscription_info['subscription_active'] = bool(agent_profile.subscription_active)
        subscription_info['subscription_expires'] = agent_profile.subscription_expires
        subscription_info['is_active'] = bool(agent_profile.subscription_active)
        subscription_info['trial_end_date'] = (
            agent_profile.subscription_expires.isoformat() if agent_profile.subscription_expires else None
        )
        agent_profile_data = {
            'id': agent_profile.id,
            'agency_name': agent_profile.agency_name or None,
            'phone': agent_profile.phone or None,
            'verified': bool(agent_profile.verified),
            'subscription_active': bool(agent_profile.subscription_active),
            'subscription_expires': agent_profile.subscription_expires.isoformat() if agent_profile.subscription_expires else None,
        }

    user_summary = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }

    response = {
        **user_summary,
        'role': role,
        'isAuthenticated': True,
        'is_superuser': user.is_superuser,
        'is_agent': is_agent_flag,
        'groups': list(user.groups.values_list('name', flat=True)),
        'profile': profile_data,
        'subscription': subscription_info,
        'agent_profile': agent_profile_data,
        'user': user_summary,
    }
    return response


def _update_profile_payload(user, data, files):
    user_payload = _coerce_to_dict(data.get('user'))
    profile_payload = _coerce_to_dict(data.get('profile'))
    agent_payload = _coerce_to_dict(data.get('agent_profile'))

    changed = False
    if user_payload:
        for field in ('first_name', 'last_name', 'email'):
            value = user_payload.get(field)
            if value is not None and getattr(user, field) != value:
                setattr(user, field, value)
                changed = True
    else:
        for field in ('first_name', 'last_name', 'email'):
            value = data.get(field)
            if value is not None and getattr(user, field) != value:
                setattr(user, field, value)
                changed = True
    if changed:
        user.save()

    profile = getattr(user, 'profile', None)
    if not profile:
        profile = Profile.objects.create(user=user)

    profile_changed = False
    profile_name = None
    if profile_payload:
        profile_name = profile_payload.get('name')
        phone_number = profile_payload.get('phone_number')
        address = profile_payload.get('address')
    else:
        profile_name = data.get('profile_name') or data.get('name')
        phone_number = data.get('phone_number')
        address = data.get('address')

    if profile_name is not None and profile.name != profile_name:
        profile.name = profile_name
        profile_changed = True
    if phone_number is not None and profile.phone_number != phone_number:
        profile.phone_number = phone_number
        profile_changed = True
    if address is not None and profile.address != address:
        profile.address = address
        profile_changed = True

    image_file = (
        files.get('profile.image')
        or files.get('profile_image')
        or files.get('image')
    )
    if image_file is not None:
        profile.image = image_file
        profile_changed = True

    if profile_changed:
        profile.save()

    if is_agent(user):
        agent_profile = AgentProfile.objects.filter(user=user).first()
        if not agent_profile:
            agent_profile = AgentProfile.objects.create(user=user, profile=user.profile)

        agent_changed = False
        if agent_payload:
            agency_name = agent_payload.get('agency_name')
            phone = agent_payload.get('phone')
        else:
            agency_name = data.get('agency_name')
            phone = data.get('agency_phone') or data.get('phone')

        if agency_name is not None and agent_profile.agency_name != agency_name:
            agent_profile.agency_name = agency_name
            agent_changed = True
        if phone is not None and agent_profile.phone != phone:
            agent_profile.phone = phone
            agent_changed = True

        if agent_changed:
            agent_profile.save()


def _update_current_user_profile(request):
    try:
        with transaction.atomic():
            _update_profile_payload(request.user, request.data, request.FILES)
    except ValidationError as ve:
        return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(_serialize_current_user(request.user))


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Retrieve or update the authenticated user's profile in a single endpoint."""
    if request.method == 'GET':
        try:
            return Response(_serialize_current_user(request.user))
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    return _update_current_user_profile(request)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Legacy endpoint that now delegates to the consolidated /accounts/me/ handler."""
    return _update_current_user_profile(request)


def signup(request):
    """Register a new user. Creates an inactive user and sends activation code via email."""
    if request.method == 'POST':
        form = SignupForm(request.POST, request.FILES)
        if form.is_valid():
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']

            user = form.save(commit=False)
            user.is_active = False
            user.save()  # The signal should create the Profile here

            # If the registrant asked to be an agent, add them to the agent group
            try:
                if form.cleaned_data.get('is_agent'):
                    agent_group, _ = Group.objects.get_or_create(name='agent')
                    user.groups.add(agent_group)
            except Exception:
                # Non-fatal: don't block signup if group logic fails
                pass

            profile = user.profile

            # Send an activation email
            send_mail(
                "Activate Your Account",
                f"Welcome {username}\nUse this code {profile.code} to activate your account.",
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return redirect(f'/accounts/{username}/activate')

    else:
        form = SignupForm()
    return render(request, 'registration/register.html', {'form': form})


def activate(request, username):
    """Activate a user when they submit the activation code."""
    user = get_object_or_404(User, username=username)
    profile = user.profile

    # Support both HTML form POST (web) and JSON POST (API)
    if request.method == 'POST':
        # If JSON, expect {'code': 'XXXX'} and return JSON response
        if (request.content_type and 'application/json' in request.content_type) or request.headers.get('Accept', '').startswith('application/json'):
            try:
                payload = json.loads(request.body.decode('utf-8'))
            except Exception:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
            code = payload.get('code')
            if code and code == profile.code:
                profile.code = ''
                profile.save()
                user.is_active = True
                user.save()
                return JsonResponse({'message': 'Account activated'})
            return JsonResponse({'error': 'Invalid activation code'}, status=400)

        # Fallback to HTML form handling
        form = ActivationForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            if code == profile.code:
                profile.code = ''
                profile.save()

                user.is_active = True
                user.save()

                return redirect('/accounts/login')
    else:
        form = ActivationForm()

    return render(request, 'registration/activate.html', {'form': form})


@login_required
def Profile(request):
    """Render the logged-in user's profile and their properties."""
    user_pk = request.user.pk
    profile = User.objects.get(pk=user_pk)
    properties = Property.objects.filter(owner=user_pk)
    return render(request, 'account/profile.html',
                  {'profile': profile, 'propertys': properties, 'request': request})

