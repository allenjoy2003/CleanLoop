from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import StaffMember, Slot, Booking, BookingItem
from .serializers import StaffMemberSerializer, SlotSerializer, BookingSerializer
from accounts.permissions import IsAdminUserRole, IsOwnerOrAdmin

class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.all().order_by('name')
    serializer_class = StaffMemberSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

class SlotViewSet(viewsets.ModelViewSet):
    serializer_class = SlotSerializer

    def get_queryset(self):
        zone_id = self.request.query_params.get('zone_id')
        date = self.request.query_params.get('date')
        qs = Slot.objects.filter(is_active=True)
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        if date:
            qs = qs.filter(date=date)
        return qs.order_by('date', 'start_time')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['booking_number', 'customer__phone', 'customer__name', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            status_param = self.request.query_params.get('status')
            date_param = self.request.query_params.get('date')
            qs = Booking.objects.all()
            if status_param:
                qs = qs.filter(status=status_param)
            if date_param:
                qs = qs.filter(pickup_date=date_param)
            return qs.order_by('-created_at')
        return Booking.objects.filter(customer=user).order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status in ['collected', 'cancelled']:
            return Response({"error": "Booking cannot be cancelled in its current state."}, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', 'Cancelled by customer')
        booking.status = 'cancelled'
        booking.cancellation_reason = reason
        booking.save()

        # Free slot count if attached
        if booking.slot and booking.slot.booked_count > 0:
            booking.slot.booked_count -= 1
            booking.slot.save()

        from impact.models import Notification
        Notification.objects.create(
            user=booking.customer,
            title_en="Booking Cancelled",
            title_ml="ബുക്കിംഗ് റദ്ദാക്കി",
            message_en=f"Your pickup #{booking.booking_number} was cancelled.",
            message_ml=f"നിങ്ങളുടെ ബുക്കിംഗ് #{booking.booking_number} റദ്ദാക്കി.",
            notification_type='booking_update'
        )
        return Response({"message": "Booking cancelled successfully.", "booking": BookingSerializer(booking).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def rate(self, request, pk=None):
        booking = self.get_object()
        if booking.customer != request.user:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        rating = request.data.get('rating')
        review = request.data.get('review', '')
        if not rating or not (1 <= int(rating) <= 5):
            return Response({"error": "Please provide a rating between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        booking.rating = int(rating)
        booking.review = review
        booking.save()
        return Response({"message": "Thank you for rating our service!"})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def admin_update_status(self, request, pk=None):
        """Admin updates status, assigns staff, or marks collection with weights & segregation."""
        booking = self.get_object()
        new_status = request.data.get('status')
        staff_id = request.data.get('staff_id')
        actual_kg = request.data.get('actual_quantity_kg')
        is_well_segregated = request.data.get('is_well_segregated')

        if new_status:
            booking.status = new_status
        if staff_id:
            try:
                booking.assigned_staff = StaffMember.objects.get(id=staff_id)
            except StaffMember.DoesNotExist:
                pass
        if actual_kg is not None:
            booking.actual_quantity_kg = float(actual_kg)
        if is_well_segregated is not None:
            booking.is_well_segregated = bool(is_well_segregated)

        # If marked collected, award Green Credits
        if new_status == 'collected' and booking.green_credits_awarded == 0:
            credits = 20 # standard pickup completion
            if booking.is_well_segregated:
                credits += 15 # well segregated bonus
            booking.green_credits_awarded = credits

            from rewards.models import GreenCreditLedger, UserRewardProfile
            profile, _ = UserRewardProfile.objects.get_or_create(user=booking.customer)
            profile.current_green_credits += credits
            profile.total_green_credits += credits
            profile.save()

            GreenCreditLedger.objects.create(
                user=booking.customer,
                points=credits,
                reason='pickup_completed' if not booking.is_well_segregated else 'well_segregated',
                description=f"Earned for pickup #{booking.booking_number} (Well segregated: {bool(booking.is_well_segregated)})"
            )

        booking.save()

        # Notify customer
        from impact.models import Notification
        status_msg = f"Your pickup #{booking.booking_number} status updated to: {booking.get_status_display()}."
        Notification.objects.create(
            user=booking.customer,
            title_en=f"Pickup Update: {booking.get_status_display()}",
            title_ml=f"പിക്കപ്പ് സ്റ്റാറ്റസ്: {booking.get_status_display()}",
            message_en=status_msg,
            message_ml=f"നിങ്ങളുടെ പിക്കപ്പ് #{booking.booking_number} സ്റ്റാറ്റസ് പുതുക്കി: {booking.get_status_display()}",
            notification_type='booking_update',
            link_url=f"/bookings/{booking.id}"
        )

        return Response(BookingSerializer(booking).data)
