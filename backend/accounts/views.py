from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta

from .models import User, Address, Zone, OTPAttempt
from .serializers import (
    RequestOTPSerializer, VerifyOTPSerializer,
    UserProfileSerializer, AddressSerializer, ZoneSerializer
)
from .twilio_service import TwilioService
from .permissions import IsOwnerOrAdmin, IsAdminUserRole

class RequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        ip = request.META.get('REMOTE_ADDR')

        # Rate limiting: max 5 requests per phone per 10 minutes
        ten_mins_ago = timezone.now() - timedelta(minutes=10)
        recent_count = OTPAttempt.objects.filter(phone=phone, created_at__gte=ten_mins_ago).count()
        if recent_count >= 5:
            return Response({
                "error": "Too many OTP requests for this phone number. Please wait a few minutes before trying again."
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Send via Twilio Service
        result = TwilioService.send_verification_otp(phone)
        if not result.get("success"):
            return Response({"error": result.get("message")}, status=status.HTTP_400_BAD_REQUEST)

        OTPAttempt.objects.create(
            phone=phone,
            ip_address=ip,
            code="DEV123" if getattr(result, 'dev_otp', None) else ""
        )

        return Response({
            "message": result.get("message"),
            "phone": phone,
            "dev_otp": result.get("dev_otp", None) # provided in dev mode for seamless local testing
        }, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        otp = serializer.validated_data['otp']
        name = serializer.validated_data.get('name', '')
        email = serializer.validated_data.get('email', None)
        preferred_language = serializer.validated_data.get('preferred_language', 'en')

        # Check OTP via Twilio Service
        result = TwilioService.check_verification_otp(phone, otp)
        if not result.get("success"):
            return Response({"error": result.get("message")}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create user
        user, created = User.objects.get_or_create(phone=phone)
        if created:
            user.name = name
            user.email = email
            user.preferred_language = preferred_language
            user.save()

            # Initialize wallet and rewards
            from scrap.models import Wallet
            from rewards.models import UserRewardProfile, Badge
            Wallet.objects.get_or_create(user=user)
            starter_badge = Badge.objects.filter(slug='seedling').first()
            UserRewardProfile.objects.get_or_create(user=user, defaults={'current_badge': starter_badge})
        else:
            # Update name/email if provided and not previously set
            updated = False
            if name and not user.name:
                user.name = name
                updated = True
            if email and not user.email:
                user.email = email
                updated = True
            if preferred_language:
                user.preferred_language = preferred_language
                updated = True
            if updated:
                user.save()

        # Generate SimpleJWT Tokens
        refresh = RefreshToken.for_user(user)
        refresh['phone'] = user.phone
        refresh['role'] = user.role
        refresh['name'] = user.name

        user_data = UserProfileSerializer(user, context={'request': request}).data

        return Response({
            "message": "Authentication successful.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_data,
            "is_new_user": created
        }, status=status.HTTP_200_OK)

class SignOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required to sign out."}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully signed out. Token blacklisted."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to blacklist token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()

class ZoneViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Zone.objects.filter(is_active=True)
    serializer_class = ZoneSerializer
    permission_classes = [AllowAny]
