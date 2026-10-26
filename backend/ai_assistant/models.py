from django.db import models
from django.conf import settings

class AIRequestLog(models.Model):
    FEATURE_CHOICES = (
        ('assistant_chat', 'Waste Assistant Chat'),
        ('waste_identification', 'Photo Waste Identification'),
        ('scrap_estimator', 'Smart Scrap Price Estimator'),
        ('rules_qa', 'Rules and Fines Assistant'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='ai_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    feature = models.CharField(max_length=40, choices=FEATURE_CHOICES)
    model_name = models.CharField(max_length=50)
    prompt_tokens = models.PositiveIntegerField(default=0)
    response_tokens = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.feature} ({self.model_name}) - Success: {self.success}"
