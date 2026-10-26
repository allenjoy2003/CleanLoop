from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WasteCategory, DisposalGuide, Fact, Tip, RuleAndFine, FAQ
from .serializers import (
    WasteCategorySerializer, DisposalGuideSerializer,
    FactSerializer, TipSerializer, RuleAndFineSerializer, FAQSerializer
)
from accounts.permissions import IsAdminUserRole

class WasteCategoryViewSet(viewsets.ModelViewSet):
    queryset = WasteCategory.objects.all().order_by('order')
    serializer_class = WasteCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class FactViewSet(viewsets.ModelViewSet):
    queryset = Fact.objects.filter(is_active=True).order_by('order')
    serializer_class = FactSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['fact_en', 'fact_ml', 'tag', 'source_en']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class TipViewSet(viewsets.ModelViewSet):
    queryset = Tip.objects.filter(is_active=True).order_by('-is_today_tip', 'order')
    serializer_class = TipSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title_en', 'title_ml', 'content_en', 'content_ml', 'category']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class RuleAndFineViewSet(viewsets.ModelViewSet):
    queryset = RuleAndFine.objects.filter(is_active=True).order_by('category')
    serializer_class = RuleAndFineSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['rule_en', 'rule_ml', 'penalty_en', 'penalty_ml', 'category']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all().order_by('order')
    serializer_class = FAQSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserRole()]

class TodayTipView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today_tip = Tip.objects.filter(is_today_tip=True, is_active=True).first()
        if not today_tip:
            today_tip = Tip.objects.filter(is_active=True).first()
        if today_tip:
            return Response(TipSerializer(today_tip).data)
        return Response({})
