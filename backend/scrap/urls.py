from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ScrapCategoryViewSet, ScrapRequestViewSet,
    WalletViewSet, WithdrawalRequestViewSet
)

router = DefaultRouter()
router.register(r'categories', ScrapCategoryViewSet, basename='scrap-category')
router.register(r'requests', ScrapRequestViewSet, basename='scrap-request')
router.register(r'wallet', WalletViewSet, basename='wallet')
router.register(r'withdrawals', WithdrawalRequestViewSet, basename='withdrawal')

urlpatterns = [
    path('', include(router.urls)),
]
