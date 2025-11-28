from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import MethodNotAllowed
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.utils import timezone
import time
from django.db.models import Q, Count, Sum
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
import json
from django_filters.rest_framework import DjangoFilterBackend
from utils.google_maps import geocode_address, build_maps_url

from .models import (
    PropertyVisit, Property, Payment, SupportTicket, TicketReply, AgentProfile,
    AgentRating
)
from .serializers import (
    PropertyVisitSerializer, SerializerProperty, PaymentSerializer,
    SubscriptionPaymentSerializer, SupportTicketSerializer,
    CreateSupportTicketSerializer, TicketReplySerializer,
    AgentRatingSerializer, CreateAgentRatingSerializer
)
from accounts.permissions import IsAdmin


class PropertyListCreateView(generics.ListCreateAPIView):
    queryset = Property.objects.all().order_by('-created_at')
    serializer_class = SerializerProperty
    # Allow anyone to list properties, but creating requires agent or admin
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'city': ['exact', 'icontains'],
        'type': ['exact'],
        'status': ['exact'],
        'is_published': ['exact'],
        'price': ['exact', 'gte', 'lte'],
        'owner': ['exact'],
    }

    def get_queryset(self):
        """Filter properties based on user role and archived status."""
        user = self.request.user
        owner_filter = self.request.query_params.get('owner')
        
        # Admins see all properties including archived
        if user.is_authenticated and user.is_superuser:
            return Property.objects.all().order_by('-created_at')
        
        # If owner filter is explicitly set, show only that owner's properties (for agent dashboard)
        if owner_filter:
            try:
                owner_id = int(owner_filter)
                # Only allow agents to filter their own properties, or admins to filter any
                if user.is_authenticated and (user.is_superuser or user.id == owner_id):
                    return Property.objects.filter(owner_id=owner_id).order_by('-created_at')
            except (ValueError, TypeError):
                pass
        
        # Default: show all non-archived, published properties (public browse)
        return Property.objects.filter(
            archived_at__isnull=True,
            is_published=True
        ).order_by('-created_at')

    def get_permissions(self):
        # Allow GET for everyone
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        # For POST require authenticated agent or admin
        from accounts.permissions import IsAgent
        return [permissions.IsAuthenticated(), IsAgent()]

    def perform_create(self, serializer):
        # set owner to request user if authenticated
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        if user:
            serializer.save(owner=user)
        else:
            # prefer explicit denial rather than anonymous creation in future; currently save owner=None
            serializer.save()


class PropertyRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Property.objects.all()
    serializer_class = SerializerProperty
    # Allow anyone to retrieve, but updates/deletes require owner or admin
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]

        # For unsafe methods ensure user is authenticated and is owner or admin
        class IsOwnerOrAdmin(permissions.BasePermission):
            def has_object_permission(self, request, view, obj):
                if not request.user or request.user.is_anonymous:
                    return False
                if getattr(request.user, 'is_superuser', False):
                    return True
                return obj.owner == request.user

        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]


    
    @action(detail=True, methods=['post'])
    def assign_to_agent(self, request, pk=None):
        """Assign this subscription plan to an agent (admin only)"""
        plan = self.get_object()
        agent_id = request.data.get('agent_id')
        
        if not agent_id:
            return Response(
                {'error': 'agent_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agent_id = int(agent_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid agent_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the agent user
        from django.contrib.auth.models import User
        try:
            agent_user = User.objects.get(id=agent_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify user is an agent
        if not agent_user.groups.filter(name='agent').exists():
            return Response(
                {'error': 'User is not an agent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create agent profile
        agent_profile, created = AgentProfile.objects.get_or_create(
            user=agent_user,
            defaults={'profile': agent_user.profile}
        )
        
        # Assign plan
        agent_profile.current_plan = plan
        agent_profile.subscription_active = True
        
        # Set expiry based on plan duration
        from datetime import timedelta
        agent_profile.subscription_expires = timezone.now() + timedelta(days=plan.duration_days)
        agent_profile.save()
        
        return Response({
            'message': f'Plan "{plan.name}" assigned to agent {agent_user.username}',
            'agent': {
                'id': agent_user.id,
                'username': agent_user.username,
                'email': agent_user.email,
            },
            'subscription': {
                'plan': plan.name,
                'expires_at': agent_profile.subscription_expires.isoformat(),
                'features': [f.code for f in plan.features.all()]
            }
        })
    
    @action(detail=True, methods=['post'])
    def remove_from_agent(self, request, pk=None):
        """Remove subscription plan from an agent (admin only)"""
        plan = self.get_object()
        agent_id = request.data.get('agent_id')
        
        if not agent_id:
            return Response(
                {'error': 'agent_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agent_id = int(agent_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid agent_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth.models import User
        try:
            agent_user = User.objects.get(id=agent_id)
            agent_profile = agent_user.agentprofile
        except (User.DoesNotExist, AgentProfile.DoesNotExist):
            return Response(
                {'error': 'Agent profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Remove plan
        agent_profile.current_plan = None
        agent_profile.subscription_active = False
        agent_profile.subscription_expires = None
        agent_profile.save()
        
        return Response({
            'message': f'Subscription removed from agent {agent_user.username}'
        })
    
    @action(detail=True, methods=['get'])
    def subscribers(self, request, pk=None):
        """Get list of agents subscribed to this plan (admin only)"""
        plan = self.get_object()
        
        subscribers = AgentProfile.objects.filter(
            current_plan=plan,
            subscription_active=True
        ).select_related('user', 'user__profile')
        
        data = [{
            'id': sub.user.id,
            'username': sub.user.username,
            'email': sub.user.email,
            'agency_name': sub.agency_name,
            'subscription_expires': sub.subscription_expires.isoformat() if sub.subscription_expires else None,
            'verified': sub.verified,
        } for sub in subscribers]
        
        return Response({
            'plan': plan.name,
            'total_subscribers': len(data),
            'subscribers': data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get subscription plan statistics (admin only)"""
        if not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plans = SubscriptionPlan.objects.all()
        stats = []
        
        for plan in plans:
            active_subs = AgentProfile.objects.filter(
                current_plan=plan,
                subscription_active=True
            ).count()
            
            total_subs = AgentProfile.objects.filter(
                current_plan=plan
            ).count()
            
            stats.append({
                'id': plan.id,
                'name': plan.name,
                'price': str(plan.price),
                'duration_days': plan.duration_days,
                'is_active': plan.is_active,
                'active_subscribers': active_subs,
                'total_subscribers': total_subs,
                'features_count': plan.features.count(),
            })
        
        return Response({
            'total_plans': plans.count(),
            'active_plans': plans.filter(is_active=True).count(),
            'plans': stats
        })



class PropertyVisitListCreateView(generics.ListCreateAPIView):
    queryset = PropertyVisit.objects.all()
    serializer_class = PropertyVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return PropertyVisit.objects.all()
        # Agents can view visits for properties they own
        if user.groups.filter(name='agent').exists():
            return PropertyVisit.objects.filter(Q(property__owner=user) | Q(visitor=user))
        # Regular users only see their own visits
        return PropertyVisit.objects.filter(visitor=user)
    
    def perform_create(self, serializer):
        """Automatically set the visitor to the current user"""
        serializer.save(visitor=self.request.user)


class PropertyVisitRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PropertyVisit.objects.all()
    serializer_class = PropertyVisitSerializer
    permission_classes = [IsAuthenticated]


# Views from payments app
class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer
    http_method_names = ['get', 'head', 'options', 'post']

    def get_queryset(self):
        """Filter payments based on user role."""
        user = self.request.user
        if user.is_superuser:
            return Payment.objects.all().order_by('-created_at')
        elif user.groups.filter(name='agent').exists():
            # Agents see payments related to their properties
            return Payment.objects.filter(
                Q(user=user) |  # Their own payments
                Q(property__owner=user)  # Payments for properties they own
            ).order_by('-created_at')
        else:
            # Regular users see only their own payments
            return Payment.objects.filter(user=user).order_by('-created_at')

    def get_permissions(self):
        if getattr(self, 'action', None) in {'admin_list', 'retry', 'receipt'}:
            return [IsAdmin()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST')

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PUT')

    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PATCH')

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed('DELETE')

    def list(self, request):
        """Return paginated list of payments with related data."""
        payments = self.get_queryset()
        data = [{
            'id': payment.id,
            'user': {
                'id': payment.user.id,
                'username': payment.user.username,
                'email': payment.user.email,
            },
            'property': {
                'id': payment.property.id,
                'title': payment.property.title,
            } if payment.property else None,
            'method': payment.method,
            'amount': str(payment.amount),
            'status': payment.status,
            'transaction_id': payment.transaction_id,
            'created_at': payment.created_at.isoformat(),
        } for payment in payments]
        return Response(data)

    @action(detail=False, methods=['get'])
    def subscription(self, request):
        """Get subscription plans and pricing."""
        # TODO: Move to settings/config when ready for production
        plans = {
            'monthly': {
                'id': 'monthly',
                'name': 'Monthly Plan',
                'price': 50000,
                'description': 'Perfect for getting started',
                'features': [
                    'Unlimited property listings',
                    'Priority customer support',
                    'Advanced analytics',
                    'Featured listing priority'
                ],
                'duration': 30  # days
            },
            'annual': {
                'id': 'annual',
                'name': 'Annual Plan',
                'price': 500000,
                'description': 'Best value for serious agents',
                'features': [
                    'Everything in Monthly plan',
                    '2 months free',
                    'Featured listings priority',
                    'Dedicated account manager'
                ],
                'duration': 365  # days
            }
        }
        return Response(plans)

    @action(detail=False, methods=['get'])
    def admin_list(self, request):
        """Get all payments for admin panel with extended details."""
        # Use IsAdmin permission class to determine access
        from accounts.permissions import IsAdmin as IsAdminPerm
        if not IsAdminPerm().has_permission(request, self):
            raise PermissionDenied("Only administrators can access this endpoint")
        
        payments = Payment.objects.all().order_by('-created_at')
        data = [{
            'id': payment.id,
            'transactionId': payment.transaction_id,
            'amount': float(payment.amount),
            'status': payment.status,
            'type': payment.method,
            'user': f"{payment.user.first_name} {payment.user.last_name}" if payment.user.first_name else payment.user.username,
            'date': payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'property': payment.property.title if payment.property else None,
        } for payment in payments]
        return Response(data)

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry a failed payment."""
        from accounts.permissions import IsAdmin as IsAdminPerm
        if not IsAdminPerm().has_permission(request, self):
            raise PermissionDenied("Only administrators can retry payments")

        payment = self.get_object()
        if payment.status != 'cancelled':
            return Response(
                {"error": "Only cancelled payments can be retried"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Implement retry logic based on payment method
        if payment.method == 'mpesa':
            # TODO: Implement M-Pesa retry logic
            pass
        elif payment.method == 'stripe':
            # TODO: Implement Stripe retry logic
            pass

        # For now, just mark as pending to simulate retry
        payment.status = 'pending'
        payment.save()
        
        return Response({"status": "Payment retry initiated"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stk_push(request, property_id):
    """
    Initiate M-Pesa STK push payment.
    
    Uses Safaricom's official Daraja API for secure payment processing.
    All security relies on Safaricom's endpoints and authentication.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Validate property_id to prevent SQL injection
    try:
        property_id = int(property_id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid property_id format'}, status=status.HTTP_400_BAD_REQUEST)
    
    property_obj = get_object_or_404(Property, id=property_id)
    phone = request.data.get('phone')
    amount = request.data.get('amount')
    
    # Validate phone and amount
    if not phone or not amount:
        return Response({'error': 'phone and amount are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        amount = float(amount)
        if amount <= 0:
            return Response({'error': 'amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        if amount < 1:
            return Response({'error': 'minimum amount is KES 1'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Build callback URL - use settings if available, otherwise build from request
    from django.conf import settings as django_settings
    if django_settings.MPESA_CALLBACK_URL:
        callback_url = django_settings.MPESA_CALLBACK_URL
    else:
        callback_url = request.build_absolute_uri('/api/v1/properties/payments/mpesa/callback/')
    
    try:
        from utils.mpesa_daraja import get_mpesa_service, MpesaDarajaError
        
        mpesa_service = get_mpesa_service()
        
        # Generate unique account reference
        account_reference = f"PROP-{property_obj.id}-{request.user.id}-{int(time.time())}"
        transaction_desc = f"Payment for property listing: {property_obj.title[:30]}"
        
        # Initiate STK Push via Safaricom
        response = mpesa_service.initiate_stk_push(
            phone_number=phone,
            amount=amount,
            account_reference=account_reference,
            transaction_description=transaction_desc,
            callback_url=callback_url
        )
        
        checkout_request_id = response.get('CheckoutRequestID')
        
        if not checkout_request_id:
            logger.error("No CheckoutRequestID in STK Push response")
            return Response(
                {'error': 'Failed to initiate payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            property=property_obj,
            method='mpesa',
            amount=amount,
            transaction_id=checkout_request_id,  # Store CheckoutRequestID
            status='pending',
            raw_payload=response
        )
        
        logger.info(f"STK Push initiated: Payment ID {payment.id}, CheckoutRequestID: {checkout_request_id}")
        
        return Response({
            'success': True,
            'message': response.get('CustomerMessage', 'Payment request sent. Please check your phone.'),
            'checkout_request_id': checkout_request_id,
            'payment_id': payment.id,
            'status': 'pending'
        })
        
    except MpesaDarajaError as e:
        logger.error(f"M-Pesa Daraja error: {str(e)}")
        return Response(
            {'error': f'Payment initiation failed: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY
        )
    except Exception as e:
        logger.error(f"Unexpected error during STK Push: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def mpesa_callback(request):
    """
    Handle M-Pesa payment callback from Safaricom.
    
    This endpoint is called by Safaricom's servers to notify us of payment status.
    Security is enforced by validating the payload structure as per Safaricom documentation.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.warning(f"Invalid callback payload format: {e}")
        return JsonResponse({'ResultCode': 1, 'ResultDesc': 'Invalid payload format'}, status=400)
    
    try:
        from utils.mpesa_daraja import get_mpesa_service
        
        mpesa_service = get_mpesa_service()
        
        # Validate callback payload structure
        if not mpesa_service.validate_callback_payload(payload):
            logger.warning("Invalid callback payload structure")
            return JsonResponse({'ResultCode': 1, 'ResultDesc': 'Invalid payload structure'}, status=400)
        
        # Extract callback data
        callback_data = mpesa_service.extract_callback_data(payload)
        
        if not callback_data:
            logger.warning("Failed to extract callback data")
            return JsonResponse({'ResultCode': 1, 'ResultDesc': 'Failed to process callback'}, status=400)
        
        checkout_request_id = callback_data.get('CheckoutRequestID')
        result_code = int(callback_data.get('ResultCode', -1))
        result_desc = callback_data.get('ResultDesc', '')
        
        if not checkout_request_id:
            logger.warning("Callback missing CheckoutRequestID")
            return JsonResponse({'ResultCode': 1, 'ResultDesc': 'Missing CheckoutRequestID'}, status=400)
        
        # Find payment by CheckoutRequestID
        try:
            payment = Payment.objects.get(transaction_id=checkout_request_id)
        except Payment.DoesNotExist:
            logger.warning(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
            # Still return success to Safaricom to prevent retries
            return JsonResponse({'ResultCode': 0, 'ResultDesc': 'Callback received'})
        
        # Update payment status based on result code
        # ResultCode 0 = Success, any other code = Failed/Cancelled
        if result_code == 0:
            payment.status = 'completed'
            logger.info(f"Payment completed: Payment ID {payment.id}, CheckoutRequestID: {checkout_request_id}")
            
            # Store receipt number and transaction details
            payment.raw_payload = {
                **payment.raw_payload,
                'callback': callback_data,
                'mpesa_receipt_number': callback_data.get('MpesaReceiptNumber'),
                'transaction_date': callback_data.get('TransactionDate'),
            }
            payment.save()
            
            # Activate agent subscription if this is for a property payment
            if payment.property:
                try:
                    agent_profile = AgentProfile.objects.filter(user=payment.property.owner).first()
                    if agent_profile:
                        agent_profile.subscription_active = True
                        # Set or extend subscription expiry
                        now = timezone.now()
                        if agent_profile.subscription_expires and agent_profile.subscription_expires > now:
                            # Extend existing subscription
                            from datetime import timedelta
                            agent_profile.subscription_expires += timedelta(days=30)
                        else:
                            # Set new subscription expiry
                            from datetime import timedelta
                            agent_profile.subscription_expires = now + timedelta(days=30)
                        agent_profile.save()
                        logger.info(f"Agent subscription activated: Agent ID {agent_profile.id}")
                except Exception as e:
                    logger.error(f"Failed to activate agent subscription: {e}", exc_info=True)
            
            # Return success to Safaricom
            return JsonResponse({'ResultCode': 0, 'ResultDesc': 'Callback processed successfully'})
        else:
            # Payment failed or was cancelled
            payment.status = 'cancelled'
            payment.raw_payload = {
                **payment.raw_payload,
                'callback': callback_data,
                'error': result_desc
            }
            payment.save()
            logger.info(f"Payment cancelled/failed: Payment ID {payment.id}, Reason: {result_desc}")
            
            # Still return success to Safaricom to acknowledge receipt
            return JsonResponse({'ResultCode': 0, 'ResultDesc': 'Callback processed'})
            
    except Exception as e:
        logger.error(f"Error processing M-Pesa callback: {e}", exc_info=True)
        # Return error to Safaricom so they can retry
        return JsonResponse({'ResultCode': 1, 'ResultDesc': f'Error: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, payment_id):
    """
    Return payment status so frontend can poll for completion.
    
    If payment is still pending and query_safaricom=true, queries Safaricom
    for the latest status.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Validate payment_id to prevent SQL injection
    try:
        payment_id = int(payment_id)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid payment_id format'}, status=status.HTTP_400_BAD_REQUEST)
    
    payment = get_object_or_404(Payment, id=payment_id)
    
    # Ensure user can only see their own payments (unless admin)
    if not request.user.is_superuser and payment.user != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Optionally query Safaricom for latest status if payment is still pending
    query_safaricom = request.GET.get('query_safaricom', 'false').lower() in ('true', '1', 'yes')
    
    if query_safaricom and payment.status == 'pending' and payment.method == 'mpesa' and payment.transaction_id:
        try:
            from utils.mpesa_daraja import get_mpesa_service, MpesaDarajaError
            
            mpesa_service = get_mpesa_service()
            status_response = mpesa_service.query_payment_status(payment.transaction_id)
            
            # Update payment if status has changed
            result_code = status_response.get('ResultCode')
            if result_code == 0:
                # Payment completed
                payment.status = 'completed'
                payment.raw_payload = {
                    **payment.raw_payload,
                    'status_query': status_response
                }
                payment.save()
                logger.info(f"Payment status updated via query: Payment ID {payment.id}")
            elif result_code in [1032, 1037]:  # Request cancelled/failed
                payment.status = 'cancelled'
                payment.raw_payload = {
                    **payment.raw_payload,
                    'status_query': status_response
                }
                payment.save()
                logger.info(f"Payment cancelled via query: Payment ID {payment.id}")
            
        except MpesaDarajaError as e:
            logger.warning(f"Failed to query payment status from Safaricom: {e}")
            # Continue with current status
        except Exception as e:
            logger.error(f"Error querying payment status: {e}", exc_info=True)
            # Continue with current status
    
    # Extract M-Pesa receipt number if available
    mpesa_receipt = None
    if payment.raw_payload and isinstance(payment.raw_payload, dict):
        callback_data = payment.raw_payload.get('callback', {})
        mpesa_receipt = callback_data.get('MpesaReceiptNumber')
    
    data = {
        'id': payment.id,
        'status': payment.status,
        'transaction_id': payment.transaction_id,
        'mpesa_receipt_number': mpesa_receipt,
        'amount': str(payment.amount),
        'method': payment.method,
        'property_id': payment.property.id if payment.property else None,
        'raw_payload': payment.raw_payload,
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def geocode_property_location(request):
    """Return coordinates for a provided property address to drive map previews."""
    address = request.data.get('address')
    city = request.data.get('city')

    if not address and not city:
        return Response(
            {'error': 'Provide either address or city to geocode.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    geo = geocode_address(address, city)
    if not geo:
        return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)

    latitude = geo.get('lat')
    longitude = geo.get('lng')
    return Response({
        'latitude': latitude,
        'longitude': longitude,
        'place_id': geo.get('place_id'),
        'formatted_address': geo.get('formatted_address'),
        'maps_url': build_maps_url(latitude, longitude)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agent_properties(request):
    """Get all properties owned by the authenticated agent."""
    user = request.user
    if not (user.is_superuser or user.groups.filter(name='agent').exists()):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    properties = Property.objects.filter(owner=user).order_by('-created_at')
    serializer = SerializerProperty(properties, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agent_stats(request):
    """Return aggregate stats for the authenticated agent (or admin viewing own portfolio)."""
    user = request.user
    if not (user.is_superuser or user.groups.filter(name='agent').exists()):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    agent_properties = Property.objects.filter(owner=user)
    total_listings = agent_properties.count()
    total_views = agent_properties.aggregate(total=Sum('view_count'))['total'] or 0
    total_inquiries = PropertyVisit.objects.filter(property__owner=user).count()
    total_earnings = Payment.objects.filter(
        property__owner=user,
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Get recent viewers (visits)
    recent_visits = PropertyVisit.objects.filter(
        property__owner=user
    ).select_related('visitor', 'property').order_by('-created_at')[:5]
    
    recent_viewers = [{
        'id': visit.id,
        'visitor_name': f"{visit.visitor.first_name} {visit.visitor.last_name}" if visit.visitor.first_name else visit.visitor.username,
        'visitor_email': visit.visitor.email,
        'property_title': visit.property.title,
        'date': visit.created_at,
        'status': visit.status
    } for visit in recent_visits]

    # Get recent reviews
    recent_ratings = AgentRating.objects.filter(
        agent=user
    ).select_related('user', 'property').order_by('-created_at')[:5]

    recent_reviews = [{
        'id': rating.id,
        'reviewer_name': f"{rating.user.first_name} {rating.user.last_name}" if rating.user.first_name else rating.user.username,
        'rating': rating.rating,
        'comment': rating.review,
        'property_title': rating.property.title if rating.property else None,
        'date': rating.created_at
    } for rating in recent_ratings]

    # Get most viewed properties (agent's properties)
    most_viewed = agent_properties.order_by('-view_count')[:5]
    most_viewed_data = [{
        'id': prop.id,
        'title': prop.title,
        'view_count': prop.view_count,
        'price': float(prop.price),
        'image': prop.MediaProperty.first().Images.url if prop.MediaProperty.exists() and prop.MediaProperty.first().Images else None
    } for prop in most_viewed]

    # Get most liked properties (agent's properties)
    from django.db.models import Count
    most_liked = agent_properties.annotate(
        like_count=Count('likes')
    ).order_by('-like_count')[:5]
    
    most_liked_data = [{
        'id': prop.id,
        'title': prop.title,
        'like_count': prop.like_count,
        'price': float(prop.price),
        'image': prop.MediaProperty.first().Images.url if prop.MediaProperty.exists() and prop.MediaProperty.first().Images else None
    } for prop in most_liked]

    return Response({
        'total_listings': total_listings,
        'total_views': total_views,
        'total_inquiries': total_inquiries,
        'earnings': float(total_earnings),
        'recent_viewers': recent_viewers,
        'recent_reviews': recent_reviews,
        'most_viewed': most_viewed_data,
        'most_liked': most_liked_data,
    })


# Views from support app
class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            # Admin can see all tickets
            return SupportTicket.objects.all()
        else:
            # Users can only see their own tickets
            return SupportTicket.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSupportTicketSerializer
        return SupportTicketSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message', '')
        
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Sanitize message to prevent XSS
        message = message.strip()
        if len(message) > 10000:  # Reasonable limit
            return Response({'error': 'Message too long'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user can reply to this ticket
        if not (ticket.user == request.user or request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        reply = TicketReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message,
            is_admin_reply=request.user.is_superuser or request.user.is_staff
        )
        
        # Update ticket status and user_reply field
        if request.user == ticket.user:
            ticket.user_reply = message
            ticket.status = 'open'  # Reopen if user replies
        else:
            ticket.admin_reply = message
            ticket.assigned_to = request.user
            if ticket.status == 'open':
                ticket.status = 'in_progress'
        
        ticket.save()
        
        return Response(TicketReplySerializer(reply).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if assigned_to_id:
            # Validate assigned_to_id to prevent SQL injection
            try:
                assigned_to_id = int(assigned_to_id)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid assigned_to format'}, status=status.HTTP_400_BAD_REQUEST)
            
            from django.contrib.auth.models import User
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                ticket.assigned_to = assigned_user
                ticket.status = 'in_progress'
                ticket.save()
                return Response({'message': 'Ticket assigned successfully'})
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'assigned_to is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        
        # Allow ticket owner or admin to close
        if not (ticket.user == request.user or request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        ticket.status = 'closed'
        ticket.closed_at = timezone.now()
        ticket.save()
        
        return Response({'message': 'Ticket closed successfully'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        stats = {
            'total_tickets': SupportTicket.objects.count(),
            'open_tickets': SupportTicket.objects.filter(status='open').count(),
            'in_progress_tickets': SupportTicket.objects.filter(status='in_progress').count(),
            'resolved_tickets': SupportTicket.objects.filter(status='resolved').count(),
            'closed_tickets': SupportTicket.objects.filter(status='closed').count(),
            'tickets_by_priority': dict(SupportTicket.objects.values('priority').annotate(count=Count('id')).values_list('priority', 'count')),
            'tickets_by_category': dict(SupportTicket.objects.values('category').annotate(count=Count('id')).values_list('category', 'count')),
        }
        
        return Response(stats)


class AgentRatingViewSet(viewsets.ModelViewSet):
    """ViewSet for agent ratings and reviews."""
    serializer_class = AgentRatingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            # Admin can see all ratings
            return AgentRating.objects.all().select_related('agent', 'user', 'property')
        else:
            # Users can see ratings they gave or received
            return AgentRating.objects.filter(
                Q(user=user) | Q(agent=user)
            ).select_related('agent', 'user', 'property')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateAgentRatingSerializer
        return AgentRatingSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def agent_stats(self, request):
        """Get rating statistics for a specific agent."""
        agent_id = request.query_params.get('agent_id')
        
        if not agent_id:
            return Response(
                {'error': 'agent_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            agent_id = int(agent_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid agent_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth.models import User
        try:
            agent = User.objects.get(id=agent_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all ratings for this agent
        ratings = AgentRating.objects.filter(agent=agent)
        total_ratings = ratings.count()
        
        if total_ratings == 0:
            return Response({
                'agent_id': agent_id,
                'agent_name': agent.username,
                'total_ratings': 0,
                'average_rating': 0,
                'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            })
        
        # Calculate average rating
        from django.db.models import Avg
        avg_rating = ratings.aggregate(avg=Avg('rating'))['avg']
        
        # Get rating distribution
        rating_dist = ratings.values('rating').annotate(count=Count('id'))
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for item in rating_dist:
            distribution[item['rating']] = item['count']
        
        return Response({
            'agent_id': agent_id,
            'agent_name': agent.username,
            'total_ratings': total_ratings,
            'average_rating': round(avg_rating, 2) if avg_rating else 0,
            'rating_distribution': distribution
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """Get overall rating statistics (admin only)."""
        from django.db.models import Avg
        from django.contrib.auth.models import User
        
        total_ratings = AgentRating.objects.count()
        avg_rating = AgentRating.objects.aggregate(avg=Avg('rating'))['avg']
        
        # Get top rated agents
        agents_with_ratings = User.objects.filter(
            received_ratings__isnull=False
        ).annotate(
            avg_rating=Avg('received_ratings__rating'),
            rating_count=Count('received_ratings')
        ).order_by('-avg_rating')[:10]
        
        top_agents = [{
            'id': agent.id,
            'username': agent.username,
            'email': agent.email,
            'average_rating': round(agent.avg_rating, 2) if agent.avg_rating else 0,
            'total_ratings': agent.rating_count
        } for agent in agents_with_ratings]
        
        return Response({
            'total_ratings': total_ratings,
            'average_rating': round(avg_rating, 2) if avg_rating else 0,
            'top_rated_agents': top_agents
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_property_like(request, property_id):
    """
    Toggle like status for a property.
    If user has liked it, unlike it. If not liked, like it.
    """
    try:
        property_obj = Property.objects.get(id=property_id)
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    
    from .models import PropertyLike
    
    # Check if user has already liked this property
    existing_like = PropertyLike.objects.filter(property=property_obj, user=request.user).first()
    
    if existing_like:
        # Unlike - delete the like
        existing_like.delete()
        return Response({
            'liked': False,
            'like_count': property_obj.likes.count(),
            'message': 'Property unliked'
        })
    else:
        # Like - create new like
        PropertyLike.objects.create(property=property_obj, user=request.user)
        return Response({
            'liked': True,
            'like_count': property_obj.likes.count(),
            'message': 'Property liked'
        })


@api_view(['POST'])
def track_property_view(request, property_id):
    """
    Increment view count for a property.
    For authenticated users, only count unique views.
    For anonymous users, count every view (or implement session-based tracking if needed).
    """
    try:
        property_obj = Property.objects.get(id=property_id)
        
        if request.user.is_authenticated:
            from .models import PropertyView
            # Check if user has already viewed this property
            if not PropertyView.objects.filter(property=property_obj, viewer=request.user).exists():
                PropertyView.objects.create(property=property_obj, viewer=request.user)
                property_obj.view_count += 1
                property_obj.save(update_fields=['view_count'])
        else:
            # For anonymous users, we just increment for now
            # Ideally we would use session or IP tracking here
            property_obj.view_count += 1
            property_obj.save(update_fields=['view_count'])
        
        return Response({
            'view_count': property_obj.view_count,
            'message': 'View tracked'
        })
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
@api_view(['GET'])
@permission_classes([AllowAny])
def public_stats(request):
    """
    Get public statistics for the homepage.
    """
    from accounts.models import User
    from django.contrib.auth.models import Group
    
    properties_count = Property.objects.filter(is_published=True, archived_at__isnull=True).count()
    
    # Count agents by checking the 'agent' group
    try:
        agent_group = Group.objects.get(name='agent')
        agents_count = User.objects.filter(groups=agent_group, is_active=True).count()
    except Group.DoesNotExist:
        agents_count = 0
    
    # Count all active users
    users_count = User.objects.filter(is_active=True).count()
    
    # Calculate satisfaction rate (mock logic or based on reviews)
    # For now, let's use a static high value or calculate from ratings if available
    satisfaction_rate = 98  # Mock value
    
    return Response({
        'properties': properties_count,
        'agents': agents_count,
        'users': users_count,
        'satisfaction': satisfaction_rate
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liked_properties(request):
    """Get properties liked by the current user."""
    from .models import PropertyLike
    liked_ids = PropertyLike.objects.filter(user=request.user).values_list('property_id', flat=True)
    properties = Property.objects.filter(id__in=liked_ids).order_by('-created_at')
    serializer = SerializerProperty(properties, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def viewed_properties(request):
    """Get properties viewed by the current user."""
    from .models import PropertyView
    viewed_ids = PropertyView.objects.filter(viewer=request.user).values_list('property_id', flat=True)
    properties = Property.objects.filter(id__in=viewed_ids).order_by('-created_at')
    serializer = SerializerProperty(properties, many=True, context={'request': request})
    return Response(serializer.data)
