from django.urls import path
from .views import DashboardInsightsAPIView

urlpatterns = [
    path("dashboard/", DashboardInsightsAPIView.as_view(), name="dashboard-insights"),
]
