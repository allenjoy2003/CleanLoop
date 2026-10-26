from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreateRazorpayOrderView, VerifyRazorpayPaymentView, PaymentViewSet

router = DefaultRouter()
router.register(r'history', PaymentViewSet, basename='payment-history')

urlpatterns = [
    path('order/create/', CreateRazorpayOrderView.as_view(), name='create_order'),
    path('order/verify/', VerifyRazorpayPaymentView.as_view(), name='verify_payment'),
    path('', include(router.urls)),
]
