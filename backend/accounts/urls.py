from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RequestOTPView, VerifyOTPView, SignOutView,
    UserProfileView, AddressViewSet, ZoneViewSet
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'zones', ZoneViewSet, basename='zone')

urlpatterns = [
    path('auth/otp/request/', RequestOTPView.as_view(), name='otp_request'),
    path('auth/otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),
    path('auth/signout/', SignOutView.as_view(), name='signout'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('', include(router.urls)),
]
