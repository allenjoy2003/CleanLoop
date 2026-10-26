from django.db import models
from django.conf import settings
from accounts.models import Zone

class Complaint(models.Model):
    CATEGORY_CHOICES = (
        ('illegal_dumping', 'Illegal Dumping / Blackspot'),
        ('missed_collection', 'Missed Waste Collection'),
        ('overflowing_bin', 'Overflowing Public / Community Bin'),
        ('burning_waste', 'Burning of Waste or Plastic'),
        ('waterbody_dumping', 'Waste Dumping into Canal / Backwaters'),
        ('other', 'Other Grievance'),
    )
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('action_taken', 'Action Taken'),
        ('resolved', 'Resolved'),
    )

    ticket_number = models.CharField(max_length=20, unique=True, db_index=True)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints')
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='illegal_dumping')
    description = models.TextField()

    location_address = models.TextField()
    zone = models.ForeignKey(Zone, null=True, blank=True, on_delete=models.SET_NULL, related_name='complaints')
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='submitted', db_index=True)
    admin_response = models.TextField(blank=True)
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    credits_awarded = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Ticket #{self.ticket_number} ({self.status}) - {self.category}"

class ComplaintMedia(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='media_files')
    image = models.ImageField(upload_to='complaints/media/')
    caption = models.CharField(max_length=200, blank=True)
    is_resolution_proof = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Media for {self.complaint.ticket_number}"
