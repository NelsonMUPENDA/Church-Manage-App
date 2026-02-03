from django.contrib import admin
from .models import User, Member, Family, HomeGroup, Department, Ministry, ActivityDuration, Event, Attendance, FinancialCategory, FinancialTransaction, Announcement, AnnouncementDeck, AnnouncementDeckItem, Document, Notification, AuditLogEntry

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'phone', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['username', 'email', 'phone']

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['member_number', 'user', 'birth_date', 'gender', 'nationality', 'is_active', 'created_at']
    list_filter = ['gender', 'nationality', 'is_active', 'created_at']
    search_fields = ['member_number', 'user__username', 'user__email', 'user__phone']

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'created_at']
    search_fields = ['name', 'phone']

@admin.register(HomeGroup)
class HomeGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'leader', 'meeting_day', 'meeting_time', 'created_at']
    list_filter = ['meeting_day', 'created_at']
    search_fields = ['name', 'leader__user__username']

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'head', 'created_at']
    search_fields = ['name', 'head__user__username']

@admin.register(Ministry)
class MinistryAdmin(admin.ModelAdmin):
    list_display = ['name', 'leader', 'created_at']
    search_fields = ['name', 'leader__user__username']


@admin.register(ActivityDuration)
class ActivityDurationAdmin(admin.ModelAdmin):
    list_display = ['code', 'label', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'label']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'date', 'time', 'location', 'responsible', 'created_at']
    list_filter = ['event_type', 'date', 'created_at']
    search_fields = ['title', 'location', 'responsible__user__username']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['event', 'member', 'attended', 'checked_in_at', 'created_at']
    list_filter = ['attended', 'created_at']
    search_fields = ['event__title', 'member__user__username']

@admin.register(FinancialCategory)
class FinancialCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(FinancialTransaction)
class FinancialTransactionAdmin(admin.ModelAdmin):
    list_display = ['amount', 'transaction_type', 'category', 'member', 'date', 'created_at']
    list_filter = ['transaction_type', 'date', 'created_at']
    search_fields = ['category__name', 'member__user__username']

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'published_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'published_date', 'created_at']
    search_fields = ['title', 'author__username']


@admin.register(AnnouncementDeck)
class AnnouncementDeckAdmin(admin.ModelAdmin):
    list_display = ['title', 'event', 'generated_at', 'created_by', 'created_at']
    list_filter = ['generated_at', 'created_at']
    search_fields = ['title', 'event__title', 'created_by__username']


@admin.register(AnnouncementDeckItem)
class AnnouncementDeckItemAdmin(admin.ModelAdmin):
    list_display = ['deck', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['deck__title', 'text']

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'uploaded_by', 'uploaded_at', 'created_at']
    list_filter = ['document_type', 'uploaded_at', 'created_at']
    search_fields = ['title', 'uploaded_by__username']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipient', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['title', 'recipient__username']


@admin.register(AuditLogEntry)
class AuditLogEntryAdmin(admin.ModelAdmin):
    list_display = ['action', 'model', 'object_id', 'object_repr', 'actor', 'ip_address', 'created_at']
    list_filter = ['action', 'model', 'created_at']
    search_fields = ['object_id', 'object_repr', 'actor__username', 'model']
