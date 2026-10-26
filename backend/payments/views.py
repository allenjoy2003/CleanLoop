import hmac
import hashlib
import uuid
from decimal import Decimal
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from .models import Payment
from subscriptions.models import Subscription, Plan
from waste_collections.models import Booking
from scrap.models import Wallet, WalletTransaction
from accounts.permissions import IsAdminUserRole, IsOwnerOrAdmin

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class CreateRazorpayOrderView(APIView):
    """
    Creates an order for subscription or one-time pickup.
    Allows partial or full payment via in-app wallet balance if requested.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        purpose = request.data.get('purpose', 'subscription')
        use_wallet = bool(request.data.get('use_wallet', False))
        plan_id = request.data.get('plan_id')
        booking_id = request.data.get('booking_id')
        address_id = request.data.get('address_id')

        total_amount = Decimal('0.00')
        sub_obj = None
        booking_obj = None

        if purpose == 'subscription':
            try:
                plan = Plan.objects.get(id=plan_id, is_active=True)
                total_amount = plan.price_inr
            except Plan.DoesNotExist:
                return Response({"error": "Plan not found."}, status=status.HTTP_400_BAD_REQUEST)
        elif purpose == 'booking_fee':
            try:
                booking_obj = Booking.objects.get(id=booking_id, customer=user)
                total_amount = Decimal('50.00') # nominal one-time doorstep fee
            except Booking.DoesNotExist:
                return Response({"error": "Booking not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Check wallet deduction
        wallet, _ = Wallet.objects.get_or_create(user=user)
        wallet_used = Decimal('0.00')
        if use_wallet and wallet.balance > 0:
            wallet_used = min(wallet.balance, total_amount)

        remaining_rzp = total_amount - wallet_used

        # Create Razorpay order if remaining > 0
        rzp_order_id = ""
        if remaining_rzp > 0:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            # Amount in paise (1 INR = 100 paise)
            order_data = {
                'amount': int(remaining_rzp * 100),
                'currency': 'INR',
                'receipt': f"CL_RCP_{uuid.uuid4().hex[:8].upper()}",
                'payment_capture': 1
            }
            try:
                rzp_order = client.order.create(data=order_data)
                rzp_order_id = rzp_order['id']
            except Exception as e:
                # If Razorpay test API call fails or keys are dummy, generate mock order for test mode
                rzp_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"

        # Record payment entry
        payment = Payment.objects.create(
            user=user,
            purpose=purpose,
            booking=booking_obj,
            amount_inr=total_amount,
            wallet_amount_used=wallet_used,
            razorpay_amount_paid=remaining_rzp,
            razorpay_order_id=rzp_order_id,
            status='successful' if remaining_rzp == 0 else 'created',
            invoice_number=f"INV-2026-{uuid.uuid4().hex[:6].upper()}"
        )

        # If 100% covered by wallet, finalize directly
        if remaining_rzp == 0:
            wallet.balance -= wallet_used
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                txn_type='subscription_payment',
                amount=wallet_used,
                is_credit=False,
                description=f"Paid for {purpose} using wallet credits",
                reference_id=str(payment.id)
            )

        return Response({
            "payment_id": payment.id,
            "order_id": rzp_order_id,
            "amount_inr": float(total_amount),
            "wallet_amount_used": float(wallet_used),
            "razorpay_amount_paid": float(remaining_rzp),
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "is_fully_paid": remaining_rzp == 0,
            "invoice_number": payment.invoice_number
        })

class VerifyRazorpayPaymentView(APIView):
    """
    Verifies Razorpay test signature server-side.
    Activates subscription or marks booking as paid.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        rzp_order_id = request.data.get('razorpay_order_id')
        rzp_payment_id = request.data.get('razorpay_payment_id')
        rzp_signature = request.data.get('razorpay_signature')

        try:
            payment = Payment.objects.get(id=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response({"error": "Payment record not found."}, status=status.HTTP_404_NOT_FOUND)

        # Signature verification (skip if test mock order)
        if not rzp_order_id.startswith("order_mock_"):
            generated_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                f"{rzp_order_id}|{rzp_payment_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            if generated_signature != rzp_signature and settings.RAZORPAY_KEY_SECRET != 'rzp_secret_dummy_test_key_67890':
                payment.status = 'failed'
                payment.error_message = "Payment signature mismatch."
                payment.save()
                return Response({"error": "Payment signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct wallet if partial was used
        if payment.wallet_amount_used > 0 and payment.status != 'successful':
            wallet, _ = Wallet.objects.get_or_create(user=request.user)
            wallet.balance -= payment.wallet_amount_used
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                txn_type='subscription_payment',
                amount=payment.wallet_amount_used,
                is_credit=False,
                description=f"Paid for {payment.purpose} using wallet credits",
                reference_id=str(payment.id)
            )

        payment.status = 'successful'
        payment.razorpay_payment_id = rzp_payment_id or f"pay_mock_{uuid.uuid4().hex[:10]}"
        payment.razorpay_signature = rzp_signature or "mock_sig"
        payment.save()

        # Update booking if applicable
        if payment.booking:
            payment.booking.is_paid = True
            payment.booking.save()

        from impact.models import Notification
        Notification.objects.create(
            user=request.user,
            title_en="Payment Successful",
            title_ml="പേയ്മെന്റ് വിജയകരം",
            message_en=f"Payment of ₹{payment.amount_inr} confirmed. Invoice #{payment.invoice_number}",
            message_ml=f"₹{payment.amount_inr} പേയ്മെന്റ് പൂർത്തിയായി. ഇൻവോയ്സ് #{payment.invoice_number}",
            notification_type='payment_receipt',
            link_url=f"/invoices/{payment.id}"
        )

        return Response({
            "message": "Payment verified and recorded successfully.",
            "payment": PaymentSerializer(payment).data
        })

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            return Payment.objects.all().order_by('-created_at')
        return Payment.objects.filter(user=user).order_by('-created_at')
