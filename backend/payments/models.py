from django.db import models
from django.conf import settings
from subscriptions.models import Subscription
from waste_collections.models import Booking

class Payment(models.Model):
    STATUS_CHOICES = (
        ('created', 'Order Created'),
        ('successful', 'Payment Successful'),
        ('failed', 'Payment Failed'),
        ('refunded', 'Refunded'),
    )
    PURPOSE_CHOICES = (
        ('subscription', 'Subscription Fee'),
        ('booking_fee', 'One-Time Pickup Fee'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default='subscription')
    subscription = models.ForeignKey(Subscription, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')
    booking = models.ForeignKey(Booking, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments')

    amount_inr = models.DecimalField(max_digits=10, decimal_places=2)
    wallet_amount_used = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    razorpay_amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    razorpay_order_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='created', db_index=True)
    error_message = models.TextField(blank=True)
    invoice_number = models.CharField(max_length=50, unique=True, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} (₹{self.amount_inr}) - {self.user.phone} [{self.status}]"
