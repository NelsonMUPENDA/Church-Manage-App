"""
Members API: Members, Families, HomeGroups, Departments, Ministries.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from django.db.models import Q
from django.utils import timezone

import io
import os
import re
import qrcode

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .helpers import _is_admin_user, _client_ip, _safe_payload
from ..models import Member, Family, HomeGroup, Department, Ministry, ActivityDuration, AuditLogEntry
from ..permissions import IsAdminOrSuperAdmin, IsAdminOrSuperAdminOrReadOnly, PublicReadAdminWrite
from ..serializers import (
    MemberSerializer, FamilySerializer, HomeGroupSerializer,
    DepartmentSerializer, MinistrySerializer, ActivityDurationSerializer
)


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.select_related('user').all().order_by('-id')
    serializer_class = MemberSerializer
    permission_classes = [IsAdminOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        q = (self.request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(
                Q(user__first_name__icontains=q)
                | Q(user__last_name__icontains=q)
                | Q(user__username__icontains=q)
                | Q(user__email__icontains=q)
                | Q(user__phone__icontains=q)
                | Q(member_number__icontains=q)
            )
        return qs

    @action(detail=True, methods=['get'], url_path='fiche')
    def fiche(self, request, pk=None):
        from ..api import FinancialTransactionViewSet  # Import for brand layout
        member = self.get_object()
        u = getattr(member, 'user', None)

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        w, h = A4

        def _s(v):
            return '' if v is None else str(v)

        def _wrap(text, max_chars=95):
            s = _s(text).strip()
            if not s:
                return ['—']
            out = []
            cur = ''
            for part in s.split(' '):
                if not cur:
                    cur = part
                    continue
                if len(cur) + 1 + len(part) <= max_chars:
                    cur = f"{cur} {part}"
                else:
                    out.append(cur)
                    cur = part
            if cur:
                out.append(cur)
            return out

        title = 'FICHE MEMBRE'
        member_no = member.member_number or f"ID {member.id}"
        full_name = ' '.join([
            _s(getattr(u, 'first_name', '')).strip(),
            _s(getattr(member, 'post_name', '')).strip(),
            _s(getattr(u, 'last_name', '')).strip(),
        ]).strip()

        # Use FinancialTransactionViewSet's brand layout method
        brand = FinancialTransactionViewSet()._pdf_brand_layout(
            c,
            doc_title=title,
            doc_subtitle="Identification — Document officiel",
            badge_text="MEMBRE",
            badge_rgb=(0.12, 0.31, 0.47),
        )

        margin = brand['margin']
        left = margin
        right = w - margin
        x = brand['x']
        y = brand['y_start']

        # Bloc en-tête: Photo + QR + infos principales
        photo_box = 26 * mm
        qr_box = 26 * mm
        header_h = max(photo_box, qr_box)
        header_y_top = y
        header_y_bottom = header_y_top - header_h

        # Photo membre
        try:
            photo_path = getattr(getattr(u, 'photo', None), 'path', None)
            if photo_path and os.path.exists(photo_path):
                c.setFillColorRGB(0.98, 0.98, 0.99)
                c.roundRect(left, header_y_bottom, photo_box, photo_box, 8, fill=1, stroke=0)
                c.drawImage(
                    ImageReader(photo_path),
                    left,
                    header_y_bottom,
                    photo_box,
                    photo_box,
                    preserveAspectRatio=True,
                    mask='auto',
                )
            else:
                c.setFillColorRGB(0.98, 0.98, 0.99)
                c.roundRect(left, header_y_bottom, photo_box, photo_box, 8, fill=1, stroke=0)
                c.setFillColorRGB(0.35, 0.35, 0.35)
                c.setFont('Helvetica-Bold', 10)
                initials = ''.join([_s(getattr(u, 'first_name', '')).strip()[:1], _s(getattr(u, 'last_name', '')).strip()[:1]]).upper()
                c.drawCentredString(left + photo_box / 2, header_y_bottom + photo_box / 2 - 4, initials or '—')
        except Exception:
            pass

        # QR code membre
        try:
            payload = f"CPD|{member_no}"
            qr_img = qrcode.make(payload)
            try:
                qr_img = qr_img.convert('RGB')
            except Exception:
                pass
            qx = right - qr_box
            c.setFillColorRGB(1, 1, 1)
            c.roundRect(qx, header_y_bottom, qr_box, qr_box, 8, fill=1, stroke=0)
            c.drawImage(
                ImageReader(qr_img),
                qx,
                header_y_bottom,
                qr_box,
                qr_box,
                preserveAspectRatio=True,
                mask='auto',
            )
        except Exception:
            pass

        # Identité (texte)
        text_x = left + photo_box + 8 * mm
        c.setFillColorRGB(0.12, 0.31, 0.47)
        c.setFont('Helvetica-Bold', 14)
        c.drawString(text_x, header_y_top - 3 * mm, full_name or '—')
        c.setFillColorRGB(0.20, 0.24, 0.30)
        c.setFont('Helvetica', 9)
        c.drawString(text_x, header_y_top - 9 * mm, f"N° {member_no}")
        c.drawString(text_x, header_y_top - 14 * mm, f"Téléphone: {_s(getattr(u, 'phone', None) or '—')}")
        c.drawString(text_x, header_y_top - 19 * mm, f"Email: {_s(getattr(u, 'email', None) or '—')}")

        c.setFillColorRGB(0, 0, 0)
        y = header_y_bottom - 8 * mm

        def section(label):
            nonlocal y
            y -= 6 * mm
            c.setFont('Helvetica-Bold', 11)
            c.setFillColorRGB(0.12, 0.31, 0.47)
            c.drawString(left, y, label)
            c.setFillColorRGB(0, 0, 0)
            y -= 4 * mm

        def kv(label, value):
            nonlocal y
            if y < 22 * mm:
                c.showPage()
                brand2 = FinancialTransactionViewSet()._pdf_brand_layout(
                    c,
                    doc_title=title,
                    doc_subtitle="Identification — Document officiel",
                    badge_text="MEMBRE",
                    badge_rgb=(0.12, 0.31, 0.47),
                )
                y = brand2['y_start']
            c.setFont('Helvetica-Bold', 9)
            c.drawString(left, y, f"{label} :")
            c.setFont('Helvetica', 9)
            lines = _wrap(value, max_chars=95)
            first_x = left + 40 * mm
            for i, line in enumerate(lines):
                if y < 22 * mm:
                    c.showPage()
                    brand3 = FinancialTransactionViewSet()._pdf_brand_layout(
                        c,
                        doc_title=title,
                        doc_subtitle="Identification — Document officiel",
                        badge_text="MEMBRE",
                        badge_rgb=(0.12, 0.31, 0.47),
                    )
                    y = brand3['y_start']
                    c.setFont('Helvetica', 9)
                c.drawString(first_x, y, line if i > 0 else line)
                if i < len(lines) - 1:
                    y -= 4 * mm
            y -= 5 * mm

        section('IDENTITÉ')
        kv('Nom complet', full_name or '—')
        kv('Sexe', member.gender or '—')
        kv('Date de naissance', member.birth_date.strftime('%d/%m/%Y') if getattr(member, 'birth_date', None) else '—')
        kv('Lieu de naissance', member.place_of_birth or '—')
        kv('Nationalité', member.nationality or '—')
        kv('État civil', member.marital_status or '—')

        section('CONTACT')
        kv('Téléphone', getattr(u, 'phone', None) or '—')
        kv('Email', getattr(u, 'email', None) or '—')

        section('PROFESSION')
        kv('Profession', member.occupation or '—')
        kv('Fonction publique', getattr(member, 'public_function', None) or '—')
        kv("Poste à l'église", getattr(member, 'church_position', None) or '—')
        kv("Niveau d'étude", member.education_level or '—')

        section('ADRESSE')
        kv('Province', member.province or '—')
        kv('Ville', member.city or '—')
        kv('Commune', member.commune or '—')
        kv('Quartier', member.quarter or '—')
        kv('Avenue', member.avenue or '—')
        kv('N° maison', member.house_number or '—')

        section('INFORMATIONS ÉGLISE')
        kv('Famille', _s(getattr(getattr(member, 'family', None), 'name', None)) or '—')
        kv('Groupe', _s(getattr(getattr(member, 'home_group', None), 'name', None)) or '—')
        kv('Département', _s(getattr(getattr(member, 'department', None), 'name', None)) or '—')
        kv('Ministère', _s(getattr(getattr(member, 'ministry', None), 'name', None)) or '—')
        kv('Date de baptême', member.baptism_date.strftime('%d/%m/%Y') if getattr(member, 'baptism_date', None) else '—')

        section('STATUT')
        kv('Actif', 'Oui' if member.is_active else 'Non')
        kv('Cause inactivité', getattr(member, 'inactive_reason', None) or '—')

        section('URGENCE')
        kv('Nom', member.emergency_contact_name or '—')
        kv('Téléphone', member.emergency_contact_phone or '—')
        kv('Lien', member.emergency_contact_relation or '—')

        created_at = getattr(member, 'created_at', None)
        if created_at:
            try:
                created_at = timezone.localtime(created_at).strftime('%d/%m/%Y %H:%M')
            except Exception:
                created_at = None
        c.setFont('Helvetica', 8)
        c.setFillColorRGB(0.35, 0.35, 0.35)
        c.drawRightString(right, 12 * mm, f"Créé le: {created_at or '—'}")

        c.showPage()
        c.save()
        pdf = buf.getvalue()
        buf.close()

        safe_no = re.sub(r'[^A-Za-z0-9_-]+', '_', member_no)
        filename = f"fiche_membre_{safe_no}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        from django.http import HttpResponse
        resp = HttpResponse(pdf, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp


class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.all().order_by('-id')
    serializer_class = FamilySerializer
    permission_classes = [IsAdminOrSuperAdmin]


class HomeGroupViewSet(viewsets.ModelViewSet):
    queryset = HomeGroup.objects.all().order_by('-id')
    serializer_class = HomeGroupSerializer
    permission_classes = [IsAdminOrSuperAdmin]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('-id')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrSuperAdmin]


class MinistryViewSet(viewsets.ModelViewSet):
    queryset = Ministry.objects.all().order_by('-id')
    serializer_class = MinistrySerializer
    permission_classes = [IsAdminOrSuperAdmin]


class ActivityDurationViewSet(viewsets.ModelViewSet):
    queryset = ActivityDuration.objects.all().order_by('sort_order', 'label', 'id')
    serializer_class = ActivityDurationSerializer
    permission_classes = [PublicReadAdminWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()
        if is_active in {'1', 'true', 'yes'}:
            qs = qs.filter(is_active=True)
        elif is_active in {'0', 'false', 'no'}:
            qs = qs.filter(is_active=False)
        return qs
