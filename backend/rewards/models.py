from django.db import models
from django.conf import settings

class Badge(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name_en = models.CharField(max_length=100)
    name_ml = models.CharField(max_length=100)
    description_en = models.TextField()
    description_ml = models.TextField()
    icon = models.CharField(max_length=50, default="award")
    points_required = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=30, default="#1F5D3A")

    def __str__(self):
        return f"Badge: {self.name_en}"

class UserRewardProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reward_profile')
    total_green_credits = models.PositiveIntegerField(default=0)
    current_green_credits = models.PositiveIntegerField(default=0) # Available to redeem
    current_badge = models.ForeignKey(Badge, null=True, blank=True, on_delete=models.SET_NULL)
    consecutive_streak_weeks = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.phone}: {self.current_green_credits} credits"

class GreenCreditLedger(models.Model):
    REASON_CHOICES = (
        ('pickup_completed', 'Waste Pickup Completed'),
        ('well_segregated', 'Well Segregated Bonus'),
        ('scrap_recycled', 'Scrap Recycling Contribution'),
        ('complaint_verified', 'Verified Complaint Resolution'),
        ('streak_bonus', 'Weekly Streak Bonus'),
        ('redemption_wallet', 'Redeemed for Wallet Credit'),
        ('redemption_discount', 'Redeemed for Subscription Discount'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credit_logs')
    points = models.IntegerField() # Positive for earn, negative for redeem
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.phone}: {self.points} pts ({self.reason})"

class RewardRule(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name_en = models.CharField(max_length=100)
    name_ml = models.CharField(max_length=100)
    points_awarded = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Rule {self.name_en} (+{self.points_awarded})"
