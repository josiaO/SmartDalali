from django.contrib import admin
from .models import DailyMetric


@admin.register(DailyMetric)
class DailyMetricAdmin(admin.ModelAdmin):
    list_display = ("date", "views", "leads", "conversions", "conversion_rate")
    list_filter = ("date",)
    search_fields = ("date",)
    ordering = ("-date",)
    date_hierarchy = "date"

    def conversion_rate(self, obj):
        if obj.leads > 0:
            return f"{(obj.conversions / obj.leads) * 100:.1f}%"
        return "0%"
    conversion_rate.short_description = "Conversion Rate"
