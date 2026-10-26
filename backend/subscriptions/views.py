import uuid
from datetime import timedelta, date
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import Plan, Subscription, ScheduledPickup
from .serializers import PlanSerializer, SubscriptionSerializer, ScheduledPickupSerializer
from accounts.permissions import IsAdminUserRole, IsOwnerOrAdmin

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return Subscription.objects.all().order_by('-created_at')
        return Subscription.objects.filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        plan_id = request.data.get('plan')
        address_id = request.data.get('address')
        time_window = request.data.get('preferred_time_window', '08:00 AM - 11:00 AM')

        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({"error": "Selected plan is invalid or inactive."}, status=status.HTTP_400_BAD_REQUEST)

        start_date = timezone.now().date()
        if plan.plan_type == 'daily':
            end_date = start_date + timedelta(days=30)
        elif plan.plan_type == 'yearly':
            end_date = start_date + timedelta(days=365)
        else: # monthly
            end_date = start_date + timedelta(days=30)

        sub_code = f"SUB-{uuid.uuid4().hex[:8].upper()}"
        sub = Subscription.objects.create(
            subscription_code=sub_code,
            user=user,
            plan=plan,
            address_id=address_id,
            status='active',
            start_date=start_date,
            end_date=end_date,
            preferred_time_window=time_window
        )

        # Generate scheduled pickups for the next 14 days
        curr = start_date
        interval = 1 if plan.plan_type == 'daily' else (2 if plan.pickups_per_week >= 3 else 3)
        while curr <= min(end_date, start_date + timedelta(days=14)):
            ScheduledPickup.objects.create(
                subscription=sub,
                scheduled_date=curr,
                status='scheduled'
            )
            curr += timedelta(days=interval)

        from impact.models import Notification
        Notification.objects.create(
            user=user,
            title_en="Subscription Activated",
            title_ml="സബ്സ്ക്രിപ്ഷൻ ആരംഭിച്ചു",
            message_en=f"Your {plan.name_en} subscription #{sub.subscription_code} is now active.",
            message_ml=f"നിങ്ങളുടെ {plan.name_ml} സബ്സ്ക്രിപ്ഷൻ സജീവമായി.",
            notification_type='booking_update'
        )

        return Response(SubscriptionSerializer(sub).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'paused'
        sub.paused_at = timezone.now()
        sub.save()
        return Response({"message": "Subscription paused successfully.", "subscription": SubscriptionSerializer(sub).data})

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'active'
        sub.paused_at = None
        sub.save()
        return Response({"message": "Subscription resumed successfully.", "subscription": SubscriptionSerializer(sub).data})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'cancelled'
        sub.save()
        return Response({"message": "Subscription cancelled.", "subscription": SubscriptionSerializer(sub).data})
