from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', views.UserManagementViewSet, basename='user-management')
router.register(r'profiles', views.UserProfileViewSet, basename='user-profile')
router.register(r'agent-profiles', views.AgentProfileViewSet, basename='agent-profile')

app_name = 'accounts'

auth_patterns = [
    path('auth/token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.auth_logout, name='auth_logout'),
    path('auth/register/', views.register, name='register'),
    path('auth/signup/', views.signup, name='signup'),
    path('auth/routes/', views.get_user_routes, name='get_user_routes'),
    path('auth/<str:username>/activate/', views.activate, name='activate'),
    path('firebase-login/', views.firebase_login, name='firebase_login'),
]

profile_patterns = [
    path('me/', views.user_profile, name='me'),
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/update/', views.update_user_profile, name='update_user_profile'),
]

urlpatterns = [
    *auth_patterns,
    *profile_patterns,
    path('', include(router.urls)),
]