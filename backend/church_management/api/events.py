"""
Events API: Events, Attendance, Ceremonies (Baptism, Marriage, Evangelism, Training).
"""
import datetime
import io
import os
import re
import secrets

from django.db import transaction
from django.db.models import Q, Sum, Count
from django.http import HttpResponse, FileResponse
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .helpers import (
    _is_admin_user, _client_ip, _safe_payload,
    _ensure_event_share_slug, _create_approval_request, _notify_admins
)
from ..models import (
    Event, EventComment, EventAttendanceAggregate, EventVisitorAggregate, EventLogisticsConsumption,
    BaptismEvent, BaptismCandidate, MarriageRecord, EvangelismActivity, TrainingEvent,
    Attendance, Member, LogisticsItem, AuditLogEntry
)
from ..permissions import (
    IsAdminOrSuperAdmin, IsAdminOrSuperAdminOrReadOnly,
    IsSecretaryOrAdmin, IsEvangelismHeadOrAdmin
)
from ..serializers import (
    EventSerializer, EventCommentSerializer,
    EventAttendanceAggregateSerializer, EventVisitorAggregateSerializer,
    BaptismEventSerializer, BaptismCandidateSerializer, MarriageRecordSerializer,
    EvangelismActivitySerializer, TrainingEventSerializer,
    AttendanceSerializer
)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date', '-time')
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrSuperAdminOrReadOnly]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        qs = super().get_queryset()
        qp = getattr(self.request, 'query_params', None) or {}

        date_str = (qp.get('date') or '').strip()
        time_str = (qp.get('time') or '').strip()
        event_type = (qp.get('event_type') or '').strip()
        department = (qp.get('department') or '').strip()

        if date_str:
            try:
                qs = qs.filter(date=date_str)
            except Exception:
                pass

        if event_type:
            qs = qs.filter(event_type=event_type)

        if department:
            qs = qs.filter(department_id=department)

        if time_str:
            try:
                parts = time_str[:5].split(':')
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                target = datetime.time(hour=h, minute=m)
                window_minutes = int((qp.get('window_minutes') or 90))

                base_dt = datetime.datetime.combine(datetime.date(2000, 1, 1), target)
                low = (base_dt - datetime.timedelta(minutes=window_minutes)).time()
                high = (base_dt + datetime.timedelta(minutes=window_minutes)).time()
                if low <= high:
                    qs = qs.filter(time__range=(low, high))
                else:
                    qs = qs.filter(Q(time__gte=low) | Q(time__lte=high))
            except Exception:
                pass

        return qs

    def get_permissions(self):
        if getattr(self, 'action', None) in {'public', 'public_comment'}:
            return [AllowAny()]
        if getattr(self, 'action', None) in {
            'attendance_aggregate', 'visitor_aggregate', 'logistics_consumption',
            'department_members', 'department_checkin', 'activity_report',
            'activity_report_pdf', 'attendance_report', 'validate_closure',
            'set_alert', 'clear_alert',
        }:
            act = getattr(self, 'action', None)
            if act in {'attendance_aggregate', 'visitor_aggregate', 'department_members', 'department_checkin', 'attendance_report'}:
                return [IsSecretaryOrAdmin()]
            return [IsAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='validate-closure')
    def validate_closure(self, request, pk=None):
        event = self.get_object()
        event.closure_validated_at = timezone.now()
        event.save(update_fields=['closure_validated_at'])
        return Response(EventSerializer(event, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='set-alert')
    def set_alert(self, request, pk=None):
        event = self.get_object()
        message = request.data.get('message')
        event.is_alert = True
        event.alert_message = (str(message).strip() if message is not None else None) or event.alert_message
        event.save(update_fields=['is_alert', 'alert_message'])
        return Response(EventSerializer(event, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='clear-alert')
    def clear_alert(self, request, pk=None):
        event = self.get_object()
        event.is_alert = False
        event.alert_message = None
        event.save(update_fields=['is_alert', 'alert_message'])
        return Response(EventSerializer(event, context={'request': request}).data)

    def _ensure_share_slug(self, event):
        if getattr(event, 'share_slug', None):
            return event.share_slug
        for _ in range(6):
            slug = secrets.token_urlsafe(18)
            if not Event.objects.filter(share_slug=slug).exists():
                event.share_slug = slug
                event.save(update_fields=['share_slug'])
                return slug
        slug = secrets.token_urlsafe(24)
        event.share_slug = slug
        event.save(update_fields=['share_slug'])
        return slug

    def perform_create(self, serializer):
        event = serializer.save()
        self._ensure_share_slug(event)
        if getattr(event, 'is_published', False) and not getattr(event, 'published_at', None):
            event.published_at = timezone.now()
            event.save(update_fields=['published_at'])

    def perform_update(self, serializer):
        event = serializer.save()
        self._ensure_share_slug(event)
        if getattr(event, 'is_published', False) and not getattr(event, 'published_at', None):
            event.published_at = timezone.now()
            event.save(update_fields=['published_at'])

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        event = self.get_object()
        self._ensure_share_slug(event)
        event.is_published = True
        if not event.published_at:
            event.published_at = timezone.now()
        event.save(update_fields=['is_published', 'published_at', 'share_slug'])
        return Response(EventSerializer(event).data)

    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, pk=None):
        event = self.get_object()
        event.is_published = False
        event.save(update_fields=['is_published'])
        return Response(EventSerializer(event).data)

    @action(detail=True, methods=['get', 'post'], url_path='attendance-aggregate')
    def attendance_aggregate(self, request, pk=None):
        event = self.get_object()
        agg, _ = EventAttendanceAggregate.objects.get_or_create(event=event)

        if request.method == 'GET':
            return Response(EventAttendanceAggregateSerializer(agg).data)

        if not _is_admin_user(request.user):
            ar = _create_approval_request(
                request, model='EventAttendanceAggregate', action='update',
                payload=_safe_payload(request.data),
                target_object_id=getattr(event, 'id', None),
                object_repr=getattr(event, 'title', None) or str(getattr(event, 'id', '') or ''),
            )
            return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

        serializer = EventAttendanceAggregateSerializer(agg, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(EventAttendanceAggregateSerializer(agg).data)

    @action(detail=True, methods=['get', 'post'], url_path='visitor-aggregate')
    def visitor_aggregate(self, request, pk=None):
        event = self.get_object()
        agg, _ = EventVisitorAggregate.objects.get_or_create(event=event)

        if request.method == 'GET':
            return Response(EventVisitorAggregateSerializer(agg).data)

        if not _is_admin_user(request.user):
            ar = _create_approval_request(
                request, model='EventVisitorAggregate', action='update',
                payload=_safe_payload(request.data),
                target_object_id=getattr(event, 'id', None),
                object_repr=getattr(event, 'title', None) or str(getattr(event, 'id', '') or ''),
            )
            return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

        serializer = EventVisitorAggregateSerializer(agg, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(EventVisitorAggregateSerializer(agg).data)

    @action(detail=True, methods=['get', 'post'], url_path='logistics-consumption')
    def logistics_consumption(self, request, pk=None):
        event = self.get_object()

        if request.method == 'GET':
            qs = EventLogisticsConsumption.objects.select_related('item').filter(event=event).order_by('item__name', 'id')
            out = []
            for row in qs:
                item = getattr(row, 'item', None)
                out.append({
                    'id': row.id,
                    'item': row.item_id,
                    'item_name': getattr(item, 'name', None) if item else None,
                    'item_unit': getattr(item, 'unit', None) if item else None,
                    'quantity_used': row.quantity_used,
                })
            return Response({'items': out})

        if not _is_admin_user(request.user):
            ar = _create_approval_request(
                request, model='EventLogisticsConsumption', action='update',
                payload=_safe_payload(request.data),
                target_object_id=getattr(event, 'id', None),
                object_repr=getattr(event, 'title', None) or str(getattr(event, 'id', '') or ''),
            )
            return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

        payload_items = request.data.get('items')
        if not isinstance(payload_items, list):
            return Response({'detail': 'items doit être une liste.'}, status=400)

        updated = []
        with transaction.atomic():
            for it in payload_items:
                item_id = it.get('item') or it.get('item_id')
                qty = it.get('quantity_used')
                if not item_id:
                    continue
                try:
                    qty_int = int(qty or 0)
                except Exception:
                    return Response({'detail': 'quantity_used invalide.'}, status=400)
                if qty_int < 0:
                    return Response({'detail': 'quantity_used invalide.'}, status=400)

                li = LogisticsItem.objects.filter(id=item_id).first()
                if not li:
                    return Response({'detail': f"Matériel introuvable: {item_id}"}, status=404)
                if qty_int > int(getattr(li, 'quantity', 0) or 0):
                    return Response({'detail': f"Quantité supérieure au stock pour: {getattr(li, 'name', 'matériel')}"}, status=400)

                obj, _ = EventLogisticsConsumption.objects.update_or_create(
                    event=event,
                    item=li,
                    defaults={'quantity_used': qty_int, 'updated_by': request.user},
                )
                updated.append(obj)

        qs = EventLogisticsConsumption.objects.select_related('item').filter(event=event).order_by('item__name', 'id')
        out = []
        for row in qs:
            item = getattr(row, 'item', None)
            out.append({
                'id': row.id,
                'item': row.item_id,
                'item_name': getattr(item, 'name', None) if item else None,
                'item_unit': getattr(item, 'unit', None) if item else None,
                'quantity_used': row.quantity_used,
            })
        return Response({'items': out})

    @action(detail=True, methods=['get'], url_path='department-members')
    def department_members(self, request, pk=None):
        event = self.get_object()
        dept = getattr(event, 'department', None)
        if not dept:
            return Response({'detail': 'Département non défini pour cet événement.'}, status=400)

        qs = Member.objects.select_related('user').filter(department=dept, is_active=True).order_by('user__last_name', 'user__first_name', 'id')
        out = []
        for m in qs:
            u = getattr(m, 'user', None)
            out.append({
                'id': m.id,
                'member_number': getattr(m, 'member_number', None),
                'first_name': getattr(u, 'first_name', None) if u else None,
                'last_name': getattr(u, 'last_name', None) if u else None,
                'username': getattr(u, 'username', None) if u else None,
            })
        return Response({'department_id': dept.id, 'department_name': dept.name, 'members': out})

    @action(detail=True, methods=['post'], url_path='department-checkin')
    def department_checkin(self, request, pk=None):
        event = self.get_object()
        dept = getattr(event, 'department', None)
        if not dept:
            return Response({'detail': 'Département non défini pour cet événement.'}, status=400)

        member_id = request.data.get('member_id')
        if not member_id:
            return Response({'detail': 'member_id requis'}, status=400)

        if not _is_admin_user(request.user):
            ar = _create_approval_request(
                request, model='DepartmentCheckin', action='update',
                payload=_safe_payload(request.data),
                target_object_id=getattr(event, 'id', None),
                object_repr=getattr(event, 'title', None) or str(getattr(event, 'id', '') or ''),
            )
            return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

        attended = request.data.get('attended', True)
        if isinstance(attended, str):
            attended = attended.strip().lower() not in {'0', 'false', 'no'}
        attended = bool(attended)

        member = Member.objects.select_related('user').filter(id=member_id, department=dept).first()
        if not member:
            return Response({'detail': 'Membre introuvable ou non appartenant au département.'}, status=404)

        att, _ = Attendance.objects.update_or_create(
            event=event,
            member=member,
            defaults={'attended': attended, 'checked_in_at': timezone.now() if attended else None},
        )
        return Response(AttendanceSerializer(att).data)

    @action(detail=False, methods=['get'], url_path=r'public/(?P<slug>[^/.]+)')
    def public(self, request, slug=None):
        event = Event.objects.filter(share_slug=slug, is_published=True).order_by('-date', '-time').first()
        if not event:
            return Response({'detail': 'événement introuvable'}, status=404)

        data = EventSerializer(event).data
        comments = EventComment.objects.filter(event=event).order_by('-created_at')[:20]
        data['comments'] = EventCommentSerializer(comments, many=True).data
        return Response(data)

    @action(detail=False, methods=['post'], url_path=r'public/(?P<slug>[^/.]+)/comment')
    def public_comment(self, request, slug=None):
        event = Event.objects.filter(share_slug=slug, is_published=True).order_by('-date', '-time').first()
        if not event:
            return Response({'detail': 'événement introuvable'}, status=404)

        serializer = EventCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        author = serializer.validated_data.get('author_name') or 'Anonyme'
        serializer.save(event=event, author_name=author)
        return Response(serializer.data, status=201)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-id')
    serializer_class = AttendanceSerializer
    permission_classes = [IsSecretaryOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        event_id = (self.request.query_params.get('event') or '').strip()
        if event_id:
            try:
                qs = qs.filter(event_id=int(event_id))
            except (TypeError, ValueError):
                return qs.none()

        attended = (self.request.query_params.get('attended') or '').strip().lower()
        if attended in {'1', 'true', 'yes'}:
            qs = qs.filter(attended=True)
        elif attended in {'0', 'false', 'no'}:
            qs = qs.filter(attended=False)

        return qs


class BaptismEventViewSet(viewsets.ModelViewSet):
    queryset = BaptismEvent.objects.select_related('event').all().order_by('-event__date', '-event__time', '-id')
    serializer_class = BaptismEventSerializer
    permission_classes = [IsSecretaryOrAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def perform_create(self, serializer):
        request = getattr(self, 'request', None)
        user = getattr(request, 'user', None) if request else None

        event = None
        try:
            event_id = request.data.get('event_id') if request else None
        except Exception:
            event_id = None

        if event_id:
            event = Event.objects.filter(id=event_id).first()

        if not event:
            title = (request.data.get('title') or 'Baptême').strip() if request else 'Baptême'
            date = request.data.get('date') if request else None
            time = request.data.get('time') if request else None
            location = request.data.get('location') if request else None
            moderator = (request.data.get('moderator') or '').strip() if request else ''

            event = Event.objects.create(
                title=title,
                date=date,
                time=time,
                location=location,
                moderator=moderator or None,
                event_type='baptism',
                duration_type='daily',
                is_published=True,
                published_at=timezone.now(),
            )
            _ensure_event_share_slug(event)
        else:
            try:
                moderator = (request.data.get('moderator') or '').strip() if request else ''
            except Exception:
                moderator = ''
            if moderator:
                event.moderator = moderator
                event.save(update_fields=['moderator'])

        obj = serializer.save(event=event, created_by=user if (user and user.is_authenticated) else None)
        AuditLogEntry.objects.create(
            actor=user if (user and user.is_authenticated) else None,
            action='create',
            model='BaptismEvent',
            object_id=str(obj.pk),
            object_repr=getattr(event, 'title', None) or str(obj.pk),
            ip_address=_client_ip(request) if request else None,
            payload=_safe_payload(getattr(request, 'data', None)) if request else None,
        )


class BaptismCandidateViewSet(viewsets.ModelViewSet):
    queryset = BaptismCandidate.objects.select_related('baptism_event', 'baptism_event__event').all().order_by('-id')
    serializer_class = BaptismCandidateSerializer
    permission_classes = [IsSecretaryOrAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        qs = super().get_queryset()
        baptism_event = (self.request.query_params.get('baptism_event') or '').strip()
        if baptism_event:
            qs = qs.filter(baptism_event_id=baptism_event)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save()
        AuditLogEntry.objects.create(
            actor=self.request.user,
            action='create',
            model='BaptismCandidate',
            object_id=str(obj.pk),
            object_repr=(f"{obj.name} {obj.post_name}").strip() or str(obj.pk),
            ip_address=_client_ip(self.request),
            payload=_safe_payload(self.request.data),
        )


class EvangelismActivityViewSet(viewsets.ModelViewSet):
    queryset = EvangelismActivity.objects.all().order_by('-date', '-time', '-id')
    serializer_class = EvangelismActivitySerializer
    permission_classes = [IsEvangelismHeadOrAdmin]

    def create(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().create(request, *args, **kwargs)
        ar = _create_approval_request(request, model='EvangelismActivity', action='create', payload=_safe_payload(request.data))
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def update(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().update(request, *args, **kwargs)
        obj = self.get_object()
        ar = _create_approval_request(
            request, model='EvangelismActivity', action='update',
            payload=_safe_payload(request.data),
            target_object_id=getattr(obj, 'id', None),
            object_repr=getattr(obj, 'title', None) or str(getattr(obj, 'id', '') or ''),
        )
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().destroy(request, *args, **kwargs)
        obj = self.get_object()
        ar = _create_approval_request(
            request, model='EvangelismActivity', action='delete',
            payload=None,
            target_object_id=getattr(obj, 'id', None),
            object_repr=getattr(obj, 'title', None) or str(getattr(obj, 'id', '') or ''),
        )
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def perform_create(self, serializer):
        request = getattr(self, 'request', None)
        user = getattr(request, 'user', None) if request else None
        title = (request.data.get('title') or 'Évangélisation').strip() if request else 'Évangélisation'
        date = request.data.get('date') if request else None
        time = request.data.get('time') if request else None
        location = request.data.get('location') if request else None
        moderator = (request.data.get('moderator') or '').strip() if request else ''

        ev = Event.objects.create(
            title=title[:200],
            date=date,
            time=time,
            location=location,
            moderator=moderator or None,
            event_type='evangelism',
            duration_type='daily',
            is_published=True,
            published_at=timezone.now(),
        )
        _ensure_event_share_slug(ev)

        obj = serializer.save(created_by=user if (user and user.is_authenticated) else None, published_event=ev)
        AuditLogEntry.objects.create(
            actor=self.request.user,
            action='create',
            model='EvangelismActivity',
            object_id=str(obj.pk),
            object_repr=getattr(obj, 'title', None) or str(obj.pk),
            ip_address=_client_ip(self.request),
            payload=_safe_payload(self.request.data),
        )


class TrainingEventViewSet(viewsets.ModelViewSet):
    queryset = TrainingEvent.objects.all().order_by('-date', '-time', '-id')
    serializer_class = TrainingEventSerializer
    permission_classes = [IsEvangelismHeadOrAdmin]

    def create(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().create(request, *args, **kwargs)
        ar = _create_approval_request(request, model='TrainingEvent', action='create', payload=_safe_payload(request.data))
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def update(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().update(request, *args, **kwargs)
        obj = self.get_object()
        ar = _create_approval_request(
            request, model='TrainingEvent', action='update',
            payload=_safe_payload(request.data),
            target_object_id=getattr(obj, 'id', None),
            object_repr=getattr(obj, 'title', None) or str(getattr(obj, 'id', '') or ''),
        )
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().destroy(request, *args, **kwargs)
        obj = self.get_object()
        ar = _create_approval_request(
            request, model='TrainingEvent', action='delete',
            payload=None,
            target_object_id=getattr(obj, 'id', None),
            object_repr=getattr(obj, 'title', None) or str(getattr(obj, 'id', '') or ''),
        )
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def perform_create(self, serializer):
        request = getattr(self, 'request', None)
        user = getattr(request, 'user', None) if request else None
        title = (request.data.get('title') or 'Affermissement').strip() if request else 'Affermissement'
        date = request.data.get('date') if request else None
        time = request.data.get('time') if request else None
        location = request.data.get('location') if request else None

        ev = Event.objects.create(
            title=title[:200],
            date=date,
            time=time,
            location=location,
            event_type='training',
            duration_type='daily',
            is_published=True,
            published_at=timezone.now(),
        )
        _ensure_event_share_slug(ev)

        obj = serializer.save(created_by=user if (user and user.is_authenticated) else None, published_event=ev)
        AuditLogEntry.objects.create(
            actor=self.request.user,
            action='create',
            model='TrainingEvent',
            object_id=str(obj.pk),
            object_repr=getattr(obj, 'title', None) or str(obj.pk),
            ip_address=_client_ip(self.request),
            payload=_safe_payload(self.request.data),
        )


class MarriageRecordViewSet(viewsets.ModelViewSet):
    queryset = MarriageRecord.objects.select_related('groom', 'groom__user', 'bride', 'bride__user', 'published_event').all().order_by('-planned_date', '-planned_time', '-id')
    serializer_class = MarriageRecordSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        qs = super().get_queryset()
        u = getattr(self.request, 'user', None)
        if not u or not getattr(u, 'is_authenticated', False):
            return qs.none()

        role = getattr(u, 'role', None)
        is_privileged = bool(
            getattr(u, 'is_superuser', False)
            or getattr(u, 'is_staff', False)
            or role in {'super_admin', 'admin', 'secretary'}
        )
        if is_privileged:
            return qs
        return qs.filter(created_by=u)

    def get_permissions(self):
        action = getattr(self, 'action', None)
        if action in {'list', 'retrieve', 'create'}:
            return [IsAuthenticated()]
        return [IsSecretaryOrAdmin()]
