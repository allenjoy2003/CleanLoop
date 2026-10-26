from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('booking_update', 'Booking Status Update'),
        ('scrap_update', 'Scrap Pickup Update'),
        ('payment_receipt', 'Payment & Invoice'),
        ('reward_credited', 'Green Credits Earned'),
        ('complaint_update', 'Complaint Status Update'),
        ('general_broadcast', 'General Announcement'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title_en = models.CharField(max_length=200)
    title_ml = models.CharField(max_length=200)
    message_en = models.TextField()
    message_ml = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='booking_update')
    link_url = models.CharField(max_length=200, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.phone}: {self.title_en} (Read: {self.is_read})"

class ImpactMetricConfig(models.Model):
    name = models.CharField(max_length=100)
    co2_kg_per_kg_recycled = models.DecimalField(max_digits=6, decimal_places=3, default=1.85) # kg CO2 saved per kg waste recycled
    trees_equivalent_ratio = models.DecimalField(max_digits=6, decimal_places=4, default=0.045) # Trees saved per kg CO2 avoided
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Impact Metrics ({self.co2_kg_per_kg_recycled} kg CO2/kg)"
