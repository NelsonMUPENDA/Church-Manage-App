"""
API package for church_management.

This package provides a modular structure for the API, split by domain:
- core: Authentication, users, dashboard
- members: Members, families, home groups, departments, ministries
- events: Events, attendance, ceremonies (baptism, marriage, evangelism, training)
- finance: Financial categories and transactions
- content: Announcements, documents, church biography/consistory
- logistics: Logistics items and inventory
- system: Audit logs, notifications, approvals, reports
"""

# Core
from .core import MeView, DashboardSummaryView, UserViewSet

# Members
from .members import (
    MemberViewSet, FamilyViewSet, HomeGroupViewSet,
    DepartmentViewSet, MinistryViewSet, ActivityDurationViewSet
)

# Events
from .events import (
    EventViewSet, AttendanceViewSet,
    BaptismEventViewSet, BaptismCandidateViewSet,
    MarriageRecordViewSet, EvangelismActivityViewSet, TrainingEventViewSet
)

# Finance
from .finance import FinancialCategoryViewSet, FinancialTransactionViewSet

# Content
from .content import (
    AnnouncementViewSet, AnnouncementDeckViewSet,
    DocumentViewSet, ChurchBiographyViewSet, ChurchConsistoryViewSet,
    ContactViewSet
)

# Logistics
from .logistics import LogisticsItemViewSet

# System
from .system import AuditLogEntryViewSet, NotificationViewSet, ApprovalRequestViewSet, ReportViewSet


__all__ = [
    # Core
    'MeView',
    'DashboardSummaryView',
    'UserViewSet',
    # Members
    'MemberViewSet',
    'FamilyViewSet',
    'HomeGroupViewSet',
    'DepartmentViewSet',
    'MinistryViewSet',
    'ActivityDurationViewSet',
    # Events
    'EventViewSet',
    'AttendanceViewSet',
    'BaptismEventViewSet',
    'BaptismCandidateViewSet',
    'MarriageRecordViewSet',
    'EvangelismActivityViewSet',
    'TrainingEventViewSet',
    # Finance
    'FinancialCategoryViewSet',
    'FinancialTransactionViewSet',
    # Content
    'AnnouncementViewSet',
    'AnnouncementDeckViewSet',
    'DocumentViewSet',
    'ChurchBiographyViewSet',
    'ChurchConsistoryViewSet',
    'ContactViewSet',
    # Logistics
    'LogisticsItemViewSet',
    # System
    'AuditLogEntryViewSet',
    'NotificationViewSet',
    'ApprovalRequestViewSet',
    'ReportViewSet',
]
