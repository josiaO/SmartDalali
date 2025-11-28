from django.db import models

class DailyMetric(models.Model):
    date = models.DateField()
    views = models.PositiveIntegerField(default=0)
    leads = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"Metrics for {self.date}"
