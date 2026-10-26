from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, PublicStatsView, PersonalImpactView

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('stats/public/', PublicStatsView.as_view(), name='public_stats'),
    path('personal-impact/', PersonalImpactView.as_view(), name='personal_impact'),
    path('', include(router.urls)),
]
