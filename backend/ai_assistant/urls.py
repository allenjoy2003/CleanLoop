from django.urls import path
from .views import (
    ChatAssistantView, WastePhotoIdentificationView,
    SmartScrapEstimatorView, RulesAssistantQAView
)

urlpatterns = [
    path('chat/', ChatAssistantView.as_view(), name='ai_chat'),
    path('identify-waste/', WastePhotoIdentificationView.as_view(), name='identify_waste'),
    path('estimate-scrap/', SmartScrapEstimatorView.as_view(), name='estimate_scrap'),
    path('rules-qa/', RulesAssistantQAView.as_view(), name='rules_qa'),
]
