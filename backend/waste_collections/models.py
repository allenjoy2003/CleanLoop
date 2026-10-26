from django.db import models
from django.conf import settings
from accounts.models import Zone, Address
from waste_info.models import WasteCategory

class StaffMember(models.Model):
    ROLE_CHOICES = (
        ('driver', 'Collection Driver'),
        ('collector', 'Waste Collector (Haritha Karma Sena partner)'),
        ('scrap_agent', 'Scrap Verification Agent'),
    )
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='collector')
    vehicle_number = models.CharField(max_length=50, blank=True)
    vehicle_type = models.CharField(max_length=50, default="Electric Three-Wheeler")
    service_zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_role_display()}) - {self.phone}"

class Slot(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    capacity = models.PositiveIntegerField(default=15)
    booked_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('zone', 'date', 'start_time')
        ordering = ['date', 'start_time']

    @property
    def is_available(self):
        return self.is_active and (self.booked_count < self.capacity)

    @property
    def slot_label(self):
        return f"{self.start_time.strftime('%I:%M %p')} - {self.end_time.strftime('%I:%M %p')}"

    def __str__(self):
        return f"{self.zone.name_en} - {self.date} ({self.slot_label}) [{self.booked_count}/{self.capacity}]"

class Booking(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('staff_assigned', 'Staff Assigned'),
        ('on_the_way', 'On the Way'),
        ('collected', 'Collected'),
        ('missed', 'Missed'),
        ('cancelled', 'Cancelled'),
    )

    booking_number = models.CharField(max_length=20, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waste_bookings')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    slot = models.ForeignKey(Slot, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    pickup_date = models.DateField(db_index=True)
    preferred_time_window = models.CharField(max_length=100, blank=True)
    
    assigned_staff = models.ForeignKey(StaffMember, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_bookings')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='requested', db_index=True)

    estimated_quantity_kg = models.DecimalField(max_digits=6, decimal_places=2, default=5.0)
    actual_quantity_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    is_well_segregated = models.BooleanField(null=True, blank=True)
    green_credits_awarded = models.PositiveIntegerField(default=0)

    photo = models.ImageField(upload_to='bookings/photos/', null=True, blank=True)
    notes = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True) # 1-5
    review = models.TextField(blank=True)

    cancellation_reason = models.TextField(blank=True)
    fee_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00) # One-time fee if applicable
    is_paid = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.booking_number} ({self.status}) - {self.customer.phone}"

class BookingItem(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(WasteCategory, on_delete=models.CASCADE)
    approx_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=1.0)
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.category.name_en} (~{self.approx_weight_kg}kg)"
