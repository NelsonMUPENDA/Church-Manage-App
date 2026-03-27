"""
Logistics API: Logistics items and inventory management.
"""
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from django.db.models import Q

from .helpers import _is_admin_user, _client_ip, _safe_payload, _create_approval_request
from ..models import LogisticsItem, AuditLogEntry
from ..permissions import IsLogisticsHeadOrAdmin, IsAdminOrSuperAdmin
from ..serializers import LogisticsItemSerializer


class LogisticsItemViewSet(viewsets.ModelViewSet):
    queryset = LogisticsItem.objects.all().order_by('-updated_at', '-id')
    serializer_class = LogisticsItemSerializer
    permission_classes = [IsLogisticsHeadOrAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_permissions(self):
        if getattr(self, 'action', None) == 'destroy':
            return [IsAdminOrSuperAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        q = (self.request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(asset_tag__icontains=q)
                | Q(category__icontains=q)
            )
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()
        if is_active in {'1', 'true', 'yes'}:
            qs = qs.filter(is_active=True)
        elif is_active in {'0', 'false', 'no'}:
            qs = qs.filter(is_active=False)
        else:
            qs = qs.filter(is_active=True)
        return qs

    def create(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().create(request, *args, **kwargs)
        ar = _create_approval_request(request, model='LogisticsItem', action='create', payload=_safe_payload(request.data))
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def update(self, request, *args, **kwargs):
        if _is_admin_user(request.user):
            return super().update(request, *args, **kwargs)
        obj = self.get_object()
        ar = _create_approval_request(
            request, model='LogisticsItem', action='update',
            payload=_safe_payload(request.data),
            target_object_id=getattr(obj, 'id', None),
            object_repr=getattr(obj, 'name', None) or str(getattr(obj, 'id', '') or ''),
        )
        return Response({'detail': 'Action soumise à approbation.', 'approval_request_id': ar.id}, status=202)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_active = False
        obj.save()
        AuditLogEntry.objects.create(
            actor=request.user,
            action='delete',
            model='LogisticsItem',
            object_id=str(obj.pk),
            object_repr=getattr(obj, 'name', None) or str(obj.pk),
            ip_address=_client_ip(request),
            payload=None,
        )
        return Response(status=204)

    def perform_create(self, serializer):
        obj = serializer.save()
        AuditLogEntry.objects.create(
            actor=self.request.user,
            action='create',
            model='LogisticsItem',
            object_id=str(obj.pk),
            object_repr=getattr(obj, 'name', None) or str(obj.pk),
            ip_address=_client_ip(self.request),
            payload=_safe_payload(self.request.data),
        )

    def perform_update(self, serializer):
        obj = serializer.save()
        AuditLogEntry.objects.create(
            actor=self.request.user,
            action='update',
            model='LogisticsItem',
            object_id=str(obj.pk),
            object_repr=getattr(obj, 'name', None) or str(obj.pk),
            ip_address=_client_ip(self.request),
            payload=_safe_payload(self.request.data),
        )
