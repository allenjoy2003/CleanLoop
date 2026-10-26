import uuid
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import Complaint, ComplaintMedia
from accounts.serializers import ZoneSerializer
from accounts.permissions import IsAdminUserRole, IsOwnerOrAdmin

class ComplaintMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMedia
        fields = '__all__'

class ComplaintSerializer(serializers.ModelSerializer):
    media_files = ComplaintMediaSerializer(many=True, read_only=True)
    zone_details = ZoneSerializer(source='zone', read_only=True)
    reporter_phone = serializers.CharField(source='reporter.phone', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'ticket_number', 'reporter', 'reporter_phone', 'category',
            'description', 'location_address', 'zone', 'zone_details',
            'latitude', 'longitude', 'status', 'admin_response',
            'resolution_notes', 'resolved_at', 'credits_awarded',
            'media_files', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ticket_number', 'reporter', 'status', 'admin_response',
            'resolution_notes', 'resolved_at', 'credits_awarded', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        ticket_number = f"CL-GRV-{uuid.uuid4().hex[:6].upper()}"
        complaint = Complaint.objects.create(
            reporter=user,
            ticket_number=ticket_number,
            **validated_data
        )

        # Handle uploaded images
        images = self.context['request'].FILES.getlist('images')
        for img in images:
            ComplaintMedia.objects.create(complaint=complaint, image=img)

        from impact.models import Notification
        Notification.objects.create(
            user=user,
            title_en="Grievance Registered",
            title_ml="പരാതി രജിസ്റ്റർ ചെയ്തു",
            message_en=f"Ticket #{complaint.ticket_number} for {complaint.get_category_display()} is under review.",
            message_ml=f"പരാതി #{complaint.ticket_number} സ്വീകരിച്ചു. ഉടൻ നടപടി സ്വീകരിക്കും.",
            notification_type='complaint_update',
            link_url=f"/complaints/{complaint.id}"
        )

        return complaint

class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return Complaint.objects.all().order_by('-created_at')
        return Complaint.objects.filter(reporter=user).order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def resolve_ticket(self, request, pk=None):
        complaint = self.get_object()
        resolution_notes = request.data.get('resolution_notes', 'Action taken and resolved by municipal team.')
        admin_response = request.data.get('admin_response', 'The reported issue has been verified and cleared.')
        award_credits = bool(request.data.get('award_credits', True))

        complaint.status = 'resolved'
        complaint.resolution_notes = resolution_notes
        complaint.admin_response = admin_response
        complaint.resolved_at = timezone.now()

        # Award green credits for verified reporting
        if award_credits and not complaint.credits_awarded:
            credits = 25
            complaint.credits_awarded = True
            from rewards.models import UserRewardProfile, GreenCreditLedger
            profile, _ = UserRewardProfile.objects.get_or_create(user=complaint.reporter)
            profile.current_green_credits += credits
            profile.total_green_credits += credits
            profile.save()

            GreenCreditLedger.objects.create(
                user=complaint.reporter,
                points=credits,
                reason='complaint_verified',
                description=f"Verified Civic Reporting: Ticket #{complaint.ticket_number}"
            )

        complaint.save()

        from impact.models import Notification
        Notification.objects.create(
            user=complaint.reporter,
            title_en="Grievance Resolved! +25 Green Credits",
            title_ml="പരാതി പരിഹരിച്ചു! +25 ഗ്രീൻ ക്രെഡിറ്റുകൾ",
            message_en=f"Your ticket #{complaint.ticket_number} has been resolved by authorities.",
            message_ml=f"നിങ്ങളുടെ പരാതി #{complaint.ticket_number} പരിഹരിച്ചു. നന്ദി!",
            notification_type='complaint_update',
            link_url=f"/complaints/{complaint.id}"
        )

        return Response(ComplaintSerializer(complaint).data)
