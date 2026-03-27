"""
System API: Audit logs, Notifications, Approval requests, Reports.
"""
import datetime
import io

from django.db import transaction
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from .helpers import (
    _is_admin_user, _client_ip, _safe_payload, _notify_user,
    _apply_approval_request, _create_report_certificate
)
from ..models import (
    AuditLogEntry, Notification, ApprovalRequest,
    ReportCertificate, Event, Member, FinancialTransaction, LogisticsItem,
    BaptismEvent, EvangelismActivity, TrainingEvent, BaptismCandidate
)
from ..permissions import IsAdminOrSuperAdmin
from ..serializers import (
    AuditLogEntrySerializer, NotificationSerializer,
    ApprovalRequestSerializer
)


class AuditLogEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLogEntry.objects.select_related('actor').all().order_by('-id')
    serializer_class = AuditLogEntrySerializer
    permission_classes = [IsAdminOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        model = (self.request.query_params.get('model') or '').strip()
        action = (self.request.query_params.get('action') or '').strip()
        q = (self.request.query_params.get('q') or '').strip()
        if model:
            qs = qs.filter(model__iexact=model)
        if action:
            qs = qs.filter(action__iexact=action)
        if q:
            qs = qs.filter(Q(object_id__icontains=q) | Q(object_repr__icontains=q) | Q(actor__username__icontains=q))
        return qs


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-id')
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Notification.objects.all().order_by('-id')
        return Notification.objects.filter(recipient=self.request.user).order_by('-id')


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.select_related('requested_by', 'decided_by').all().order_by('-created_at', '-id')
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        u = getattr(self.request, 'user', None)
        if not u or not getattr(u, 'is_authenticated', False):
            return qs.none()
        if _is_admin_user(u):
            status = (self.request.query_params.get('status') or '').strip().lower()
            if status in {'pending', 'approved', 'rejected'}:
                qs = qs.filter(status=status)
            return qs
        return qs.filter(requested_by=u)

    def create(self, request, *args, **kwargs):
        raise PermissionDenied('Création manuelle non autorisée.')

    @action(detail=True, methods=['post'], url_path='approve', permission_classes=[IsAdminOrSuperAdmin])
    def approve(self, request, pk=None):
        ar = self.get_object()
        if ar.status != 'pending':
            return Response({'detail': 'Déjà traité.'}, status=400)

        with transaction.atomic():
            _apply_approval_request(ar, request)
            ar.status = 'approved'
            ar.decided_by = request.user
            ar.decided_at = timezone.now()
            ar.rejection_reason = None
            ar.save(update_fields=['status', 'decided_by', 'decided_at', 'rejection_reason', 'updated_at'])

        _notify_user(ar.requested_by, 'Action approuvée', f"Votre action ({ar.model}) a été approuvée.")
        return Response(ApprovalRequestSerializer(ar).data)

    @action(detail=True, methods=['post'], url_path='reject', permission_classes=[IsAdminOrSuperAdmin])
    def reject(self, request, pk=None):
        ar = self.get_object()
        if ar.status != 'pending':
            return Response({'detail': 'Déjà traité.'}, status=400)

        reason = request.data.get('reason')
        ar.status = 'rejected'
        ar.decided_by = request.user
        ar.decided_at = timezone.now()
        ar.rejection_reason = (str(reason).strip() if reason is not None else None) or None
        ar.save(update_fields=['status', 'decided_by', 'decided_at', 'rejection_reason', 'updated_at'])

        msg = f"Votre action ({ar.model}) a été refusée."
        if ar.rejection_reason:
            msg = f"{msg} Motif: {ar.rejection_reason}".strip()
        _notify_user(ar.requested_by, 'Action refusée', msg)
        return Response(ApprovalRequestSerializer(ar).data)


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminOrSuperAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_permissions(self):
        if getattr(self, 'action', None) in {'verify'}:
            return [AllowAny()]
        return super().get_permissions()

    def list(self, request):
        return Response({
            'available_periods': ['daily', 'weekly', 'monthly', 'annual'],
            'available_sections': ['programmes', 'pointage', 'members', 'finances', 'diaconat', 'evangelisation'],
            'default_sections': ['programmes', 'pointage', 'members', 'finances', 'diaconat', 'evangelisation'],
            'endpoints': {
                'compiled': '/api/reports/compiled/',
                'compiled_pdf': '/api/reports/compiled-pdf/',
                'verify': '/api/reports/verify/?code=...',
            },
        })

    @action(detail=False, methods=['get'], url_path='verify')
    def verify(self, request):
        code = (request.query_params.get('code') or '').strip()
        if not code:
            return Response({'valid': False, 'detail': 'code requis'}, status=400)

        cert = ReportCertificate.objects.filter(code=code).first()
        if not cert:
            return Response({'valid': False, 'detail': 'certificat introuvable'}, status=404)

        return Response({
            'valid': True,
            'code': cert.code,
            'report_type': cert.report_type,
            'payload': cert.payload,
            'pdf_sha256': cert.pdf_sha256,
            'created_at': cert.created_at.isoformat() if getattr(cert, 'created_at', None) else None,
        })

    def _parse_sections(self, request):
        raw = []
        try:
            raw = list(request.query_params.getlist('sections') or [])
        except Exception:
            raw = []

        if not raw:
            s = (request.query_params.get('sections') or '').strip()
            if s:
                raw = [s]

        parts = []
        for item in raw:
            if not item:
                continue
            if isinstance(item, str) and ',' in item:
                parts.extend([x.strip() for x in item.split(',') if x.strip()])
            else:
                parts.append(str(item).strip())

        allowed = {'programmes', 'members', 'finances', 'logistics', 'diaconat', 'pointage', 'evangelisation'}
        out = []
        for p in parts:
            key = p.lower()
            if key in allowed and key not in out:
                out.append(key)
        return out

    def _infer_range(self, period, start, end):
        today = timezone.localdate()

        def parse_date(s):
            if not s:
                return None
            try:
                return datetime.date.fromisoformat(str(s)[:10])
            except Exception:
                return None

        start_d = parse_date(start)
        end_d = parse_date(end)

        if start_d and not end_d:
            end_d = start_d
        if end_d and not start_d:
            start_d = end_d

        if start_d and end_d:
            return start_d, end_d

        p = (period or 'daily').lower()
        if p in {'yearly', 'annual', 'annually'}:
            start_d = datetime.date(today.year, 1, 1)
            end_d = datetime.date(today.year, 12, 31)
        elif p == 'monthly':
            start_d = today.replace(day=1)
            next_month = (start_d + datetime.timedelta(days=32)).replace(day=1)
            end_d = next_month - datetime.timedelta(days=1)
        elif p == 'weekly':
            start_d = today - datetime.timedelta(days=today.weekday())
            end_d = start_d + datetime.timedelta(days=6)
        else:
            start_d = today
            end_d = today

        return start_d, end_d

    def _period_trunc(self, period):
        p = (period or 'daily').lower()
        if p == 'weekly':
            return TruncWeek
        if p == 'monthly':
            return TruncMonth
        if p in {'yearly', 'annual', 'annually'}:
            return TruncYear
        return TruncDay

    def _programmes_section(self, start_d, end_d):
        qs = Event.objects.filter(date__range=[start_d, end_d]).order_by('date', 'time', 'id')

        by_type = list(
            qs.values('event_type')
            .annotate(count=Count('id'))
            .order_by('-count', 'event_type')
        )

        items = []
        for ev in qs[:250]:
            items.append({
                'id': ev.id,
                'title': ev.title,
                'date': ev.date.isoformat() if getattr(ev, 'date', None) else None,
                'time': ev.time.strftime('%H:%M') if getattr(ev, 'time', None) else None,
                'event_type': ev.event_type,
                'duration_type': ev.duration_type,
                'department_name': ev.department.name if getattr(ev, 'department', None) else None,
                'is_published': bool(getattr(ev, 'is_published', False)),
            })

        return {
            'count': qs.count(),
            'published_count': qs.filter(is_published=True).count(),
            'department_events_count': qs.filter(department__isnull=False).count(),
            'by_type': by_type,
            'events': items,
        }

    def _members_section(self, start_d, end_d):
        qs = Member.objects.select_related('user', 'department', 'ministry').all()
        new_qs = qs.filter(created_at__date__range=[start_d, end_d]).order_by('-created_at', '-id')

        by_gender = list(
            qs.values('gender')
            .annotate(count=Count('id'))
            .order_by('-count', 'gender')
        )

        by_department = list(
            qs.values('department__name')
            .annotate(count=Count('id'))
            .order_by('-count', 'department__name')
        )

        recent = []
        for m in new_qs[:30]:
            u = getattr(m, 'user', None)
            recent.append({
                'id': m.id,
                'member_number': m.member_number,
                'full_name': (u.get_full_name() if u else '').strip() or (u.username if u else ''),
                'phone': getattr(u, 'phone', None) if u else None,
                'gender': m.gender,
                'department_name': m.department.name if getattr(m, 'department', None) else None,
                'ministry_name': m.ministry.name if getattr(m, 'ministry', None) else None,
                'created_at': m.created_at.isoformat() if getattr(m, 'created_at', None) else None,
            })

        return {
            'total': qs.count(),
            'active': qs.filter(is_active=True).count(),
            'inactive': qs.filter(is_active=False).count(),
            'new_count': new_qs.count(),
            'by_gender': by_gender,
            'by_department': by_department,
            'recent_new_members': recent,
        }

    def _finances_section(self, start_d, end_d):
        qs = FinancialTransaction.objects.filter(date__range=[start_d, end_d]).order_by('date', 'id')

        rows = list(
            qs.values('currency', 'direction')
            .annotate(total=Sum('amount'))
            .order_by('currency', 'direction')
        )
        totals = {}
        for r in rows:
            cur = r['currency'] or 'CDF'
            totals.setdefault(cur, {'in': 0.0, 'out': 0.0, 'net': 0.0})
            direction = r['direction']
            totals[cur][direction] = float(r['total'] or 0)
        for cur, agg in totals.items():
            agg['net'] = float(agg.get('in', 0) or 0) - float(agg.get('out', 0) or 0)

        by_type_rows = list(
            qs.values('currency', 'transaction_type', 'direction')
            .annotate(total=Sum('amount'))
            .order_by('currency', 'transaction_type', 'direction')
        )
        by_type = {}
        for r in by_type_rows:
            cur = r['currency'] or 'CDF'
            tx_type = r['transaction_type'] or '—'
            direction = r['direction']
            by_type.setdefault(cur, {})
            by_type[cur].setdefault(tx_type, {'in': 0.0, 'out': 0.0, 'net': 0.0})
            by_type[cur][tx_type][direction] = float(r['total'] or 0)
        for cur, mp in by_type.items():
            for tx_type, agg in mp.items():
                agg['net'] = float(agg.get('in', 0) or 0) - float(agg.get('out', 0) or 0)

        breakdown_rows = list(
            qs.values('currency', 'transaction_type', 'description', 'direction')
            .annotate(total=Sum('amount'))
            .order_by('currency', 'transaction_type', 'direction', 'description')
        )
        breakdown = []
        for r in breakdown_rows[:400]:
            breakdown.append({
                'currency': r['currency'] or 'CDF',
                'transaction_type': r['transaction_type'] or '—',
                'description': (r.get('description') or '').strip() or '—',
                'direction': r['direction'] or 'in',
                'total': float(r['total'] or 0),
            })

        activity_qs = qs.filter(event__isnull=False)
        non_activity_qs = qs.filter(event__isnull=True)

        def dir_totals(tx_qs):
            res = list(tx_qs.values('currency', 'direction').annotate(total=Sum('amount')).order_by('currency', 'direction'))
            out = {}
            for r in res:
                cur = r['currency'] or 'CDF'
                out.setdefault(cur, {'in': 0.0, 'out': 0.0, 'net': 0.0})
                out[cur][r['direction']] = float(r['total'] or 0)
            for cur, agg in out.items():
                agg['net'] = float(agg.get('in', 0) or 0) - float(agg.get('out', 0) or 0)
            return out

        return {
            'transaction_count': qs.count(),
            'totals': totals,
            'by_type': by_type,
            'breakdown': breakdown,
            'activity_related': {
                'transaction_count': activity_qs.count(),
                'totals': dir_totals(activity_qs),
            },
            'non_activity_related': {
                'transaction_count': non_activity_qs.count(),
                'totals': dir_totals(non_activity_qs),
            },
        }

    def _diaconat_section(self, start_d, end_d):
        qs = LogisticsItem.objects.all().order_by('-updated_at', '-id')
        in_range = qs.filter(Q(acquired_date__range=[start_d, end_d]) | Q(created_at__date__range=[start_d, end_d]))

        by_category = list(
            qs.values('category')
            .annotate(items=Count('id'), quantity=Sum('quantity'))
            .order_by('-items', 'category')
        )
        by_condition = list(
            qs.values('condition')
            .annotate(items=Count('id'), quantity=Sum('quantity'))
            .order_by('-items', 'condition')
        )

        purchase_total = qs.aggregate(total=Sum('purchase_price'))
        purchase_in_range = in_range.aggregate(total=Sum('purchase_price'))

        return {
            'items_count': qs.count(),
            'active_items_count': qs.filter(is_active=True).count(),
            'quantity_total': float(qs.aggregate(q=Sum('quantity')).get('q') or 0),
            'by_category': by_category,
            'by_condition': by_condition,
            'purchase_total': float(purchase_total.get('total') or 0),
            'purchase_total_in_period': float(purchase_in_range.get('total') or 0),
            'created_or_acquired_in_period_count': in_range.count(),
        }

    def _evangelisation_section(self, start_d, end_d):
        bap_qs = BaptismEvent.objects.select_related('event').filter(event__date__range=[start_d, end_d])
        ev_qs = EvangelismActivity.objects.filter(date__range=[start_d, end_d])
        tr_qs = TrainingEvent.objects.filter(date__range=[start_d, end_d])
        cand_qs = BaptismCandidate.objects.filter(baptism_event__event__date__range=[start_d, end_d])

        return {
            'baptisms_count': bap_qs.count(),
            'candidates_count': cand_qs.count(),
            'evangelism_activities_count': ev_qs.count(),
            'training_events_count': tr_qs.count(),
        }

    @action(detail=False, methods=['get'], url_path='compiled')
    def compiled(self, request):
        period = request.query_params.get('period', 'daily')
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        sections = self._parse_sections(request)

        start_d, end_d = self._infer_range(period, start, end)

        data = {
            'period': period,
            'start': start_d.isoformat(),
            'end': end_d.isoformat(),
            'sections': sections,
        }

        if 'programmes' in sections:
            data['programmes'] = self._programmes_section(start_d, end_d)
        if 'members' in sections:
            data['members'] = self._members_section(start_d, end_d)
        if 'finances' in sections:
            data['finances'] = self._finances_section(start_d, end_d)
        if 'diaconat' in sections or 'logistics' in sections:
            data['diaconat'] = self._diaconat_section(start_d, end_d)
        if 'evangelisation' in sections:
            data['evangelisation'] = self._evangelisation_section(start_d, end_d)

        return Response(data)
