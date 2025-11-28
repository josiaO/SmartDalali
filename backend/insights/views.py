from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import DailyMetric
from .serializers import DailyMetricSerializer

class DashboardInsightsAPIView(APIView):
    def get(self, request):
        metrics = DailyMetric.objects.order_by("date")[:30]  # last 30 days
        serializer = DailyMetricSerializer(metrics, many=True)

        insights = {
            "kpis": {
                "total_views": sum(m.views for m in metrics),
                "total_leads": sum(m.leads for m in metrics),
                "total_conversions": sum(m.conversions for m in metrics),
            },
            "chart_data": serializer.data,
            "ai_insights": [
                "Listing views increased by 12% this week.",
                "Lead quality is trending upward.",
                "Peak activity occurs between 5–8PM.",
            ],
        }

        return Response(insights, status=status.HTTP_200_OK)
