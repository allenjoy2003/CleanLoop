from rest_framework import serializers
from .models import (
    ScrapCategory, ScrapRateHistory, ScrapRequest,
    ScrapRequestItem, Wallet, WalletTransaction, WithdrawalRequest
)
from waste_collections.serializers import StaffMemberSerializer
from accounts.serializers import AddressSerializer

class ScrapCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapCategory
        fields = '__all__'

class ScrapRequestItemSerializer(serializers.ModelSerializer):
    category_details = ScrapCategorySerializer(source='category', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ScrapCategory.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = ScrapRequestItem
        fields = [
            'id', 'category', 'category_id', 'category_details',
            'estimated_weight_kg', 'actual_weight_kg',
            'rate_per_kg_locked', 'payout_amount'
        ]
        read_only_fields = ['id', 'category', 'rate_per_kg_locked', 'payout_amount']

class ScrapRequestSerializer(serializers.ModelSerializer):
    items = ScrapRequestItemSerializer(many=True, required=False)
    address_details = AddressSerializer(source='address', read_only=True)
    assigned_agent_details = StaffMemberSerializer(source='assigned_agent', read_only=True)

    class Meta:
        model = ScrapRequest
        fields = [
            'id', 'request_number', 'customer', 'address', 'address_details',
            'pickup_date', 'preferred_time_window', 'assigned_agent',
            'assigned_agent_details', 'status', 'estimated_total_payout',
            'actual_total_payout', 'photo', 'notes', 'weighed_at',
            'payout_credited_to_wallet', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'request_number', 'customer', 'estimated_total_payout',
            'actual_total_payout', 'payout_credited_to_wallet', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        import uuid
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        req_number = f"CL-SC-{uuid.uuid4().hex[:6].upper()}"

        scrap_req = ScrapRequest.objects.create(
            customer=user,
            request_number=req_number,
            **validated_data
        )

        total_est = 0.0
        for item_data in items_data:
            cat = item_data['category']
            est_weight = item_data.get('estimated_weight_kg', 1.0)
            rate = cat.current_rate_per_kg
            est_payout = round(float(est_weight) * float(rate), 2)
            total_est += est_payout

            ScrapRequestItem.objects.create(
                scrap_request=scrap_req,
                category=cat,
                estimated_weight_kg=est_weight,
                rate_per_kg_locked=rate,
                payout_amount=est_payout
            )

        scrap_req.estimated_total_payout = total_est
        scrap_req.save()

        from impact.models import Notification
        Notification.objects.create(
            user=user,
            title_en="Scrap Pickup Requested",
            title_ml="ആക്രി ശേഖരണ ബുക്കിംഗ് വിജയകരം",
            message_en=f"Your scrap pickup #{scrap_req.request_number} has been scheduled for {scrap_req.pickup_date}.",
            message_ml=f"നിങ്ങളുടെ ആക്രി പിക്കപ്പ് #{scrap_req.request_number} രജിസ്റ്റർ ചെയ്തു.",
            notification_type='scrap_update',
            link_url=f"/scrap-requests/{scrap_req.id}"
        )

        return scrap_req

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'

class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'user', 'balance', 'updated_at', 'transactions']
        read_only_fields = ['id', 'user', 'balance', 'updated_at']

class WithdrawalRequestSerializer(serializers.ModelSerializer):
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user', 'user_phone', 'user_name', 'amount',
            'upi_id', 'bank_account_number', 'bank_ifsc', 'bank_account_name',
            'status', 'admin_notes', 'processed_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'admin_notes', 'processed_at', 'created_at']
