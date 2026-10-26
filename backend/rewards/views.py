from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import serializers

from .models import Badge, UserRewardProfile, GreenCreditLedger, RewardRule
from scrap.models import Wallet, WalletTransaction
from accounts.permissions import IsAdminUserRole

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'

class GreenCreditLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GreenCreditLedger
        fields = '__all__'

class UserRewardProfileSerializer(serializers.ModelSerializer):
    current_badge_details = BadgeSerializer(source='current_badge', read_only=True)
    logs = GreenCreditLedgerSerializer(source='user.credit_logs', many=True, read_only=True)

    class Meta:
        model = UserRewardProfile
        fields = [
            'id', 'user', 'total_green_credits', 'current_green_credits',
            'current_badge', 'current_badge_details', 'consecutive_streak_weeks',
            'updated_at', 'logs'
        ]

class RewardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_rewards(self, request):
        profile, _ = UserRewardProfile.objects.get_or_create(user=request.user)
        # Update badge if eligible
        badges = Badge.objects.filter(points_required__lte=profile.total_green_credits).order_by('-points_required')
        if badges.exists():
            profile.current_badge = badges.first()
            profile.save()

        logs = GreenCreditLedger.objects.filter(user=request.user)[:20]
        all_badges = Badge.objects.all().order_by('points_required')

        return Response({
            "current_green_credits": profile.current_green_credits,
            "total_green_credits": profile.total_green_credits,
            "current_badge": BadgeSerializer(profile.current_badge).data if profile.current_badge else None,
            "streak_weeks": profile.consecutive_streak_weeks,
            "all_badges": BadgeSerializer(all_badges, many=True).data,
            "recent_activity": GreenCreditLedgerSerializer(logs, many=True).data
        })

    @action(detail=False, methods=['post'])
    def redeem_to_wallet(self, request):
        """
        Redeems 100 green credits for ₹25 in wallet.
        """
        user = request.user
        profile, _ = UserRewardProfile.objects.get_or_create(user=user)
        credits_to_redeem = int(request.data.get('credits', 100))

        if credits_to_redeem <= 0:
            return Response({"error": "Invalid credits amount."}, status=status.HTTP_400_BAD_REQUEST)
        if profile.current_green_credits < credits_to_redeem:
            return Response({"error": f"Insufficient credits. You have {profile.current_green_credits} credits."}, status=status.HTTP_400_BAD_REQUEST)

        # Conversion rate: 100 credits = ₹25.00
        cash_value = round((credits_to_redeem / 100.0) * 25.0, 2)
        if cash_value <= 0:
            return Response({"error": "Minimum 100 credits required for wallet redemption."}, status=status.HTTP_400_BAD_REQUEST)

        profile.current_green_credits -= credits_to_redeem
        profile.save()

        GreenCreditLedger.objects.create(
            user=user,
            points=-credits_to_redeem,
            reason='redemption_wallet',
            description=f"Redeemed {credits_to_redeem} Green Credits for ₹{cash_value} wallet credit"
        )

        wallet, _ = Wallet.objects.get_or_create(user=user)
        wallet.balance += round(cash_value, 2)
        wallet.save()

        WalletTransaction.objects.create(
            wallet=wallet,
            txn_type='reward_redemption',
            amount=cash_value,
            is_credit=True,
            description=f"Redeemed {credits_to_redeem} Green Credits"
        )

        return Response({
            "message": f"Successfully redeemed {credits_to_redeem} credits for ₹{cash_value}!",
            "wallet_balance": float(wallet.balance),
            "remaining_credits": profile.current_green_credits
        })
