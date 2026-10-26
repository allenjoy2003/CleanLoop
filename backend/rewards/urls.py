from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RewardViewSet

router = DefaultRouter()
router.register(r'', RewardViewSet, basename='rewards')

urlpatterns = [
    path('', include(router.urls)),
]
