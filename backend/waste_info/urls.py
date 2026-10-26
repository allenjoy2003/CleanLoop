from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WasteCategoryViewSet, FactViewSet, TipViewSet,
    RuleAndFineViewSet, FAQViewSet, TodayTipView
)

router = DefaultRouter()
router.register(r'categories', WasteCategoryViewSet, basename='waste-category')
router.register(r'facts', FactViewSet, basename='fact')
router.register(r'tips', TipViewSet, basename='tip')
router.register(r'rules', RuleAndFineViewSet, basename='rule')
router.register(r'faqs', FAQViewSet, basename='faq')

urlpatterns = [
    path('today-tip/', TodayTipView.as_view(), name='today_tip'),
    path('', include(router.urls)),
]
