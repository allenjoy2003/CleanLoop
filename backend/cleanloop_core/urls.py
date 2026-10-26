from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from cleanloop_core.admin_views import AdminDashboardOverviewView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Clean Loop API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/waste-info/', include('waste_info.urls')),
    path('api/collections/', include('waste_collections.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/scrap/', include('scrap.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/rewards/', include('rewards.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/ai/', include('ai_assistant.urls')),
    path('api/impact/', include('impact.urls')),

    # Custom React Admin Dashboard Endpoint
    path('api/admin/overview/', AdminDashboardOverviewView.as_view(), name='admin_overview'),

    # Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
