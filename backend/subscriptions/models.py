from django.db import models
from django.conf import settings
from accounts.models import Address
from waste_info.models import WasteCategory
from waste_collections.models import Booking

class Plan(models.Model):
    PLAN_TYPES = (
        ('daily', 'Daily Collection'),
        ('monthly', 'Monthly Tier'),
        ('yearly', 'Yearly Saver (Discounted)'),
    )
    name_en = models.CharField(max_length=150)
    name_ml = models.CharField(max_length=150)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='monthly')
    price_inr = models.DecimalField(max_digits=8, decimal_places=2) # e.g. 199.00 / month
    original_price_inr = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    waste_categories = models.ManyToManyField(WasteCategory, related_name='plans')
    pickups_per_week = models.PositiveIntegerField(default=3)
    description_en = models.TextField()
    description_ml = models.TextField()
    features_en = models.JSONField(default=list) # List of feature strings
    features_ml = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name_en} (₹{self.price_inr} - {self.plan_type})"

class Subscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )
    subscription_code = models.CharField(max_length=30, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    address = models.ForeignKey(Address, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateField()
    end_date = models.DateField()
    auto_renew = models.BooleanField(default=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    preferred_time_window = models.CharField(max_length=50, default="08:00 AM - 11:00 AM")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Sub #{self.subscription_code} - {self.user.phone} ({self.status})"

class ScheduledPickup(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='scheduled_pickups')
    scheduled_date = models.DateField(db_index=True)
    booking = models.OneToOneField(Booking, null=True, blank=True, on_delete=models.SET_NULL, related_name='generated_from_schedule')
    status = models.CharField(max_length=20, default='scheduled') # scheduled, generated, skipped

    class Meta:
        unique_together = ('subscription', 'scheduled_date')
        ordering = ['scheduled_date']

    def __str__(self):
        return f"Scheduled {self.subscription.subscription_code} on {self.scheduled_date}"
