from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, phone, **extra_fields):
        if not phone:
            raise ValueError('The phone number must be set')
        phone = str(phone).strip()
        user = self.model(phone=phone, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        user = self.create_user(phone, **extra_fields)
        if password:
            user.set_password(password)
            user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('admin', 'Admin'),
    )
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('ml', 'Malayalam (മലയാളം)'),
    )

    phone = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    notify_sms = models.BooleanField(default=True)
    notify_email = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.phone} ({self.name or 'User'}) - {self.role}"

class Zone(models.Model):
    name_en = models.CharField(max_length=100)
    name_ml = models.CharField(max_length=100)
    ward_numbers = models.CharField(max_length=100, blank=True)
    polygon_geojson = models.JSONField(blank=True, null=True)
    center_lat = models.DecimalField(max_digits=10, decimal_places=7, default=9.9312)
    center_lng = models.DecimalField(max_digits=10, decimal_places=7, default=76.2673)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name_en} / {self.name_ml}"

class Address(models.Model):
    LABEL_CHOICES = (
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    )
    user = models.ForeignKey(User, related_name='addresses', on_delete=models.CASCADE)
    label = models.CharField(max_length=20, choices=LABEL_CHOICES, default='home')
    full_address = models.TextField()
    ward = models.CharField(max_length=100, blank=True)
    landmark = models.CharField(max_length=150, blank=True)
    zone = models.ForeignKey(Zone, null=True, blank=True, on_delete=models.SET_NULL, related_name='addresses')
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.phone} - {self.label}: {self.full_address[:30]}"

class OTPAttempt(models.Model):
    phone = models.CharField(max_length=20, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    code = models.CharField(max_length=10, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    attempts_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
