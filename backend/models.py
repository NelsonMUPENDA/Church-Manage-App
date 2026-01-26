from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Administrator'),
        ('department_head', 'Department Head'),
        ('treasurer', 'Treasurer'),
        ('secretary', 'Secretary'),
        ('member', 'Member'),
        ('visitor', 'Visitor'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='visitor')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Member(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    SPIRITUAL_STATUS_CHOICES = [
        ('new believer', 'New Believer'),
        ('growing', 'Growing'),
        ('mature', 'Mature'),
        ('leader', 'Leader'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    birth_date = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    spiritual_status = models.CharField(max_length=20, choices=SPIRITUAL_STATUS_CHOICES, blank=True, null=True)
    baptism_date = models.DateField(blank=True, null=True)
    engagement_date = models.DateField(blank=True, null=True)
    family = models.ForeignKey('Family', on_delete=models.SET_NULL, blank=True, null=True, related_name='members')
    home_group = models.ForeignKey('HomeGroup', on_delete=models.SET_NULL, blank=True, null=True, related_name='members')
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, blank=True, null=True, related_name='members')
    ministry = models.ForeignKey('Ministry', on_delete=models.SET_NULL, blank=True, null=True, related_name='members')
    is_active = models.BooleanField(default=True)
    archived_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Family(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class HomeGroup(models.Model):
    name = models.CharField(max_length=100)
    leader = models.ForeignKey(Member, on_delete=models.SET_NULL, blank=True, null=True, related_name='led_groups')
    meeting_day = models.CharField(max_length=20, blank=True, null=True)
    meeting_time = models.TimeField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    head = models.ForeignKey(Member, on_delete=models.SET_NULL, blank=True, null=True, related_name='headed_departments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Ministry(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    leader = models.ForeignKey(Member, on_delete=models.SET_NULL, blank=True, null=True, related_name='led_ministries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Event(models.Model):
    EVENT_TYPE_CHOICES = [
        ('service', 'Service'),
        ('meeting', 'Meeting'),
        ('special', 'Special Event'),
        ('conference', 'Conference'),
        ('workshop', 'Workshop'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default='service')
    date = models.DateField()
    time = models.TimeField()
    location = models.TextField(blank=True, null=True)
    responsible = models.ForeignKey(Member, on_delete=models.SET_NULL, blank=True, null=True, related_name='responsible_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Attendance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendances')
    attended = models.BooleanField(default=False)
    qr_code = models.CharField(max_length=100, blank=True, null=True)
    checked_in_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class FinancialCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class FinancialTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('offering', 'Offering'),
        ('tithe', 'Tithe'),
        ('special_donation', 'Special Donation'),
        ('project_fund', 'Project Fund'),
    ]
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default='offering')
    category = models.ForeignKey(FinancialCategory, on_delete=models.SET_NULL, blank=True, null=True, related_name='transactions')
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, blank=True, null=True, related_name='transactions')
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    published_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('sermon', 'Sermon'),
        ('official', 'Official Document'),
        ('report', 'Report'),
        ('other', 'Other'),
    ]
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default='other')
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Notification(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
