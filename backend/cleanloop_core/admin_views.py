from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count
from accounts.models import User, Zone
from accounts.permissions import IsAdminUserRole
from waste_collections.models import Booking, StaffMember
from subscriptions.models import Subscription
from scrap.models import ScrapRequest, WithdrawalRequest
from complaints.models import Complaint
from payments.models import Payment

class AdminDashboardOverviewView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        today = timezone.now().date()

        todays_pickups = Booking.objects.filter(pickup_date=today)
        pending_scrap = ScrapRequest.objects.filter(status__in=['requested', 'confirmed', 'agent_assigned']).count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        new_complaints = Complaint.objects.filter(status__in=['submitted', 'under_review']).count()
        pending_withdrawals = WithdrawalRequest.objects.filter(status='pending').count()

        total_revenue = Payment.objects.filter(status='successful').aggregate(Sum('amount_inr'))['amount_inr__sum'] or 0.0

        # Booking status distribution
        status_counts = Booking.objects.values('status').annotate(count=Count('status'))

        # Today's pickup locations for Admin Map View
        map_pickups = []
        for b in Booking.objects.filter(pickup_date=today).select_related('address', 'customer', 'assigned_staff')[:50]:
            if b.address and b.address.latitude and b.address.longitude:
                map_pickups.append({
                    "id": b.id,
                    "booking_number": b.booking_number,
                    "customer_name": b.customer.name or b.customer.phone,
                    "customer_phone": b.customer.phone,
                    "address": b.address.full_address,
                    "latitude": float(b.address.latitude),
                    "longitude": float(b.address.longitude),
                    "status": b.status,
                    "assigned_staff": b.assigned_staff.name if b.assigned_staff else "Unassigned"
                })

        return Response({
            "metrics": {
                "todays_pickups_count": todays_pickups.count(),
                "pending_scrap_count": pending_scrap,
                "active_subscriptions_count": active_subscriptions,
                "new_complaints_count": new_complaints,
                "pending_withdrawals_count": pending_withdrawals,
                "total_revenue_inr": float(total_revenue),
                "total_users_count": User.objects.count()
            },
            "status_distribution": list(status_counts),
            "today_map_pickups": map_pickups
        })
