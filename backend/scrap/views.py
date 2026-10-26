from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import (
    ScrapCategory, ScrapRateHistory, ScrapRequest,
    ScrapRequestItem, Wallet, WalletTransaction, WithdrawalRequest
)
from .serializers import (
    ScrapCategorySerializer, ScrapRequestSerializer,
    WalletSerializer, WalletTransactionSerializer, WithdrawalRequestSerializer
)
from accounts.permissions import IsAdminUserRole, IsOwnerOrAdmin

class ScrapCategoryViewSet(viewsets.ModelViewSet):
    queryset = ScrapCategory.objects.filter(is_active=True).order_by('order')
    serializer_class = ScrapCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

    def perform_update(self, serializer):
        category = serializer.save()
        # Record history if rate changed
        ScrapRateHistory.objects.create(
            category=category,
            rate_per_kg=category.current_rate_per_kg,
            changed_by=self.request.user
        )

class ScrapRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ScrapRequestSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['request_number', 'customer__phone', 'customer__name', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return ScrapRequest.objects.all().order_by('-created_at')
        return ScrapRequest.objects.filter(customer=user).order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def assign_agent(self, request, pk=None):
        scrap_req = self.get_object()
        agent_id = request.data.get('agent_id')
        from waste_collections.models import StaffMember
        try:
            agent = StaffMember.objects.get(id=agent_id)
            scrap_req.assigned_agent = agent
            scrap_req.status = 'agent_assigned'
            scrap_req.save()

            from impact.models import Notification
            Notification.objects.create(
                user=scrap_req.customer,
                title_en="Scrap Agent Assigned",
                title_ml="ആക്രി ശേഖരണ ഏജന്റിനെ നിശ്ചയിച്ചു",
                message_en=f"Agent {agent.name} ({agent.phone}) has been assigned to pickup #{scrap_req.request_number}.",
                message_ml=f"ഏജന്റ് {agent.name} ({agent.phone}) നിങ്ങളുടെ പിക്കപ്പ് #{scrap_req.request_number} ഏറ്റെടുത്തു.",
                notification_type='scrap_update',
                link_url=f"/scrap-requests/{scrap_req.id}"
            )

            return Response(ScrapRequestSerializer(scrap_req).data)
        except StaffMember.DoesNotExist:
            return Response({"error": "Agent not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def weigh_and_pay(self, request, pk=None):
        """
        Admin or Agent verifies actual weights on doorstep pickup.
        Calculates exact payout, marks as 'weighed_and_paid',
        and credits the customer's in-app wallet balance.
        """
        scrap_req = self.get_object()
        items_payload = request.data.get('items', []) # [{'id': item_id, 'actual_weight_kg': 12.5}]

        total_actual_payout = 0.0
        total_kg_recycled = 0.0

        for item_data in items_payload:
            try:
                item = scrap_req.items.get(id=item_data['id'])
                actual_kg = float(item_data.get('actual_weight_kg', 0.0))
                item.actual_weight_kg = actual_kg
                # Payout = actual_weight * rate_per_kg_locked
                payout = round(actual_kg * float(item.rate_per_kg_locked), 2)
                item.payout_amount = payout
                item.save()
                total_actual_payout += payout
                total_kg_recycled += actual_kg
            except ScrapRequestItem.DoesNotExist:
                continue

        scrap_req.actual_total_payout = total_actual_payout
        scrap_req.status = 'weighed_and_paid'
        scrap_req.weighed_at = timezone.now()

        # Credit wallet if not already done
        if not scrap_req.payout_credited_to_wallet and total_actual_payout > 0:
            wallet, _ = Wallet.objects.get_or_create(user=scrap_req.customer)
            wallet.balance += round(total_actual_payout, 2)
            wallet.save()

            WalletTransaction.objects.create(
                wallet=wallet,
                txn_type='scrap_payout',
                amount=total_actual_payout,
                is_credit=True,
                description=f"Scrap Sale Payout for Request #{scrap_req.request_number}",
                reference_id=scrap_req.request_number
            )
            scrap_req.payout_credited_to_wallet = True

            # Award Green Credits for recycling
            reward_pts = int(total_kg_recycled * 2) # 2 pts per kg scrap
            if reward_pts > 0:
                from rewards.models import UserRewardProfile, GreenCreditLedger
                profile, _ = UserRewardProfile.objects.get_or_create(user=scrap_req.customer)
                profile.current_green_credits += reward_pts
                profile.total_green_credits += reward_pts
                profile.save()

                GreenCreditLedger.objects.create(
                    user=scrap_req.customer,
                    points=reward_pts,
                    reason='scrap_recycled',
                    description=f"Recycled {total_kg_recycled:.1f} kg scrap in #{scrap_req.request_number}"
                )

        scrap_req.save()

        # Notification
        from impact.models import Notification
        Notification.objects.create(
            user=scrap_req.customer,
            title_en="Scrap Payment Credited!",
            title_ml="ആക്രി തുക വാലറ്റിൽ എത്തി!",
            message_en=f"₹{total_actual_payout} has been credited to your Clean Loop wallet for #{scrap_req.request_number}.",
            message_ml=f"നിങ്ങളുടെ ക്ലീൻ ലൂപ്പ് വാലറ്റിലേക്ക് ₹{total_actual_payout} വിജയകരമായി നൽകി.",
            notification_type='scrap_update',
            link_url=f"/wallet"
        )

        return Response(ScrapRequestSerializer(scrap_req).data)

class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response(WalletSerializer(wallet).data)

class WithdrawalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return WithdrawalRequest.objects.all().order_by('-created_at')
        return WithdrawalRequest.objects.filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        wallet, _ = Wallet.objects.get_or_create(user=user)
        amount = float(request.data.get('amount', 0))

        if amount <= 0:
            return Response({"error": "Withdrawal amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
        if amount > float(wallet.balance):
            return Response({"error": f"Insufficient wallet balance. You have ₹{wallet.balance} available."}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct wallet balance immediately
        wallet.balance -= round(amount, 2)
        wallet.save()

        withdrawal = WithdrawalRequest.objects.create(
            user=user,
            amount=amount,
            upi_id=request.data.get('upi_id', ''),
            bank_account_number=request.data.get('bank_account_number', ''),
            bank_ifsc=request.data.get('bank_ifsc', ''),
            bank_account_name=request.data.get('bank_account_name', ''),
            status='pending'
        )

        WalletTransaction.objects.create(
            wallet=wallet,
            txn_type='withdrawal',
            amount=amount,
            is_credit=False,
            description=f"Withdrawal request #{withdrawal.id} via {withdrawal.upi_id or 'Bank'}",
            reference_id=str(withdrawal.id)
        )

        return Response(WithdrawalRequestSerializer(withdrawal).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUserRole])
    def approve_payout(self, request, pk=None):
        withdrawal = self.get_object()
        withdrawal.status = 'processed'
        withdrawal.processed_at = timezone.now()
        withdrawal.admin_notes = request.data.get('admin_notes', 'Payout processed in test/live mode.')
        withdrawal.save()

        from impact.models import Notification
        Notification.objects.create(
            user=withdrawal.user,
            title_en="Withdrawal Paid",
            title_ml="പണം അയച്ചു",
            message_en=f"Your withdrawal of ₹{withdrawal.amount} has been successfully sent to your account.",
            message_ml=f"നിങ്ങളുടെ ₹{withdrawal.amount} അക്കൗണ്ടിലേക്ക് നൽകി കഴിഞ്ഞു.",
            notification_type='scrap_update'
        )

        return Response(WithdrawalRequestSerializer(withdrawal).data)
