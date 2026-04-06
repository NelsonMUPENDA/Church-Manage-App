from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.decorators import throttle_classes
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .throttling import LoginRateThrottle, BurstRateThrottle

# Wrap token views with rate limiting
@throttle_classes([LoginRateThrottle])
class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """Token obtain endpoint with rate limiting (5 attempts per minute)."""
    pass


@throttle_classes([BurstRateThrottle])
class RateLimitedTokenRefreshView(TokenRefreshView):
    """Token refresh endpoint with rate limiting (20 per minute)."""
    pass

from .api import (
    AnnouncementViewSet,
    AnnouncementDeckViewSet,
    AuditLogEntryViewSet,
    ActivityDurationViewSet,
    AttendanceViewSet,
    ApprovalRequestViewSet,
    BaptismCandidateViewSet,
    BaptismEventViewSet,
    ChurchBiographyViewSet,
    ChurchConsistoryViewSet,
    ContactViewSet,
    DashboardSummaryView,
    DepartmentViewSet,
    DocumentViewSet,
    EvangelismActivityViewSet,
    EventViewSet,
    FamilyViewSet,
    FinancialCategoryViewSet,
    FinancialTransactionViewSet,
    HomeGroupViewSet,
    LogisticsItemViewSet,
    MarriageRecordViewSet,
    MeView,
    MemberViewSet,
    MinistryViewSet,
    NotificationViewSet,
    ReportViewSet,
    TrainingEventViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'families', FamilyViewSet, basename='families')
router.register(r'home-groups', HomeGroupViewSet, basename='home-groups')
router.register(r'departments', DepartmentViewSet, basename='departments')
router.register(r'ministries', MinistryViewSet, basename='ministries')
router.register(r'activity-durations', ActivityDurationViewSet, basename='activity-durations')
router.register(r'members', MemberViewSet, basename='members')
router.register(r'events', EventViewSet, basename='events')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'financial-categories', FinancialCategoryViewSet, basename='financial-categories')
router.register(r'financial-transactions', FinancialTransactionViewSet, basename='financial-transactions')
router.register(r'announcements', AnnouncementViewSet, basename='announcements')
router.register(r'announcement-decks', AnnouncementDeckViewSet, basename='announcement-decks')
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'logistics-items', LogisticsItemViewSet, basename='logistics-items')
router.register(r'baptism-events', BaptismEventViewSet, basename='baptism-events')
router.register(r'baptism-candidates', BaptismCandidateViewSet, basename='baptism-candidates')
router.register(r'evangelism-activities', EvangelismActivityViewSet, basename='evangelism-activities')
router.register(r'training-events', TrainingEventViewSet, basename='training-events')
router.register(r'marriages', MarriageRecordViewSet, basename='marriages')
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'audit-logs', AuditLogEntryViewSet, basename='audit-logs')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'approval-requests', ApprovalRequestViewSet, basename='approval-requests')
router.register(r'church-biography', ChurchBiographyViewSet, basename='church-biography')
router.register(r'church-consistory', ChurchConsistoryViewSet, basename='church-consistory')
router.register(r'contacts', ContactViewSet, basename='contacts')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/auth/token/', RateLimitedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', RateLimitedTokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
