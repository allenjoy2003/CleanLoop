from django.db import models
from django.conf import settings
from accounts.models import Address
from waste_collections.models import StaffMember

class ScrapCategory(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name_en = models.CharField(max_length=100)
    name_ml = models.CharField(max_length=100)
    current_rate_per_kg = models.DecimalField(max_digits=8, decimal_places=2) # e.g. 14.00
    icon = models.CharField(max_length=50, default="recycle")
    description_en = models.TextField(blank=True)
    description_ml = models.TextField(blank=True)
    min_weight_kg = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name_en']

    def __str__(self):
        return f"{self.name_en} / {self.name_ml} - ₹{self.current_rate_per_kg}/kg"

class ScrapRateHistory(models.Model):
    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE, related_name='rate_history')
    rate_per_kg = models.DecimalField(max_digits=8, decimal_places=2)
    effective_from = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-effective_from']

    def __str__(self):
        return f"{self.category.name_en}: ₹{self.rate_per_kg} on {self.effective_from}"

class ScrapRequest(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('agent_assigned', 'Agent Assigned'),
        ('weighed_and_paid', 'Weighed & Paid'),
        ('cancelled', 'Cancelled'),
    )

    request_number = models.CharField(max_length=20, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='scrap_requests')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    pickup_date = models.DateField(db_index=True)
    preferred_time_window = models.CharField(max_length=100, default="10:00 AM - 01:00 PM")
    assigned_agent = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_scrap_requests')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='requested', db_index=True)
    estimated_total_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    actual_total_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    photo = models.ImageField(upload_to='scrap/photos/', null=True, blank=True)
    notes = models.TextField(blank=True)
    weighed_at = models.DateTimeField(null=True, blank=True)
    payout_credited_to_wallet = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Scrap #{self.request_number} ({self.status}) - ₹{self.actual_total_payout or self.estimated_total_payout}"

class ScrapRequestItem(models.Model):
    scrap_request = models.ForeignKey(ScrapRequest, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE)
    estimated_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=5.0)
    actual_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    rate_per_kg_locked = models.DecimalField(max_digits=8, decimal_places=2) # Locked rate so historical card changes don't affect
    payout_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def calculate_payout(self):
        weight = self.actual_weight_kg if self.actual_weight_kg is not None else self.estimated_weight_kg
        return round(float(weight) * float(self.rate_per_kg_locked), 2)

    def __str__(self):
        return f"{self.category.name_en} - {self.actual_weight_kg or self.estimated_weight_kg}kg @ ₹{self.rate_per_kg_locked}"

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet ({self.user.phone}): ₹{self.balance}"

class WalletTransaction(models.Model):
    TXN_TYPES = (
        ('scrap_payout', 'Scrap Sale Payout'),
        ('reward_redemption', 'Reward Points Redeemed'),
        ('subscription_payment', 'Subscription Fee Paid'),
        ('withdrawal', 'Bank/UPI Withdrawal'),
        ('refund', 'Refund'),
    )
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    txn_type = models.CharField(max_length=30, choices=TXN_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_credit = models.BooleanField(default=True)
    description = models.CharField(max_length=255)
    reference_id = models.CharField(max_length=100, blank=True) # ID of scrap request, payment, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        prefix = "+" if self.is_credit else "-"
        return f"{self.wallet.user.phone}: {prefix}₹{self.amount} ({self.txn_type})"

class WithdrawalRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('processed', 'Paid / Transferred'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    upi_id = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_ifsc = models.CharField(max_length=20, blank=True)
    bank_account_name = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Withdrawal ₹{self.amount} - {self.user.phone} [{self.status}]"
