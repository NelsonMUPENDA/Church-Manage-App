"""
Core API: User management, Auth, Dashboard.
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from django.db.models import Q

from .helpers import _is_admin_user, _client_ip, _safe_payload
from ..models import User
from ..permissions import IsAdminOrSuperAdmin
from ..serializers import UserSerializer, MeUpdateSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def post(self, request):
        serializer = MeUpdateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from ..models import Member, Event, FinancialTransaction, LogisticsItem

        user = request.user
        role = getattr(user, 'role', None)
        is_privileged = _is_admin_user(user)

        summary = {
            'members': {'total': 0, 'active': 0, 'new_this_month': 0},
            'events': {'total': 0, 'upcoming': 0, 'today': 0},
            'finances': {'pending_approvals': 0},
            'logistics': {'total_items': 0, 'low_stock': 0},
        }

        if is_privileged or role in ['secretary', 'protocol_head']:
            m_qs = Member.objects.all()
            summary['members'] = {
                'total': m_qs.count(),
                'active': m_qs.filter(is_active=True).count(),
                'new_this_month': m_qs.filter(created_at__month=__import__('datetime').datetime.now().month).count(),
            }

        if is_privileged or role in ['secretary', 'protocol_head']:
            from django.utils import timezone
            today = timezone.localdate()
            e_qs = Event.objects.all()
            summary['events'] = {
                'total': e_qs.count(),
                'upcoming': e_qs.filter(date__gt=today).count(),
                'today': e_qs.filter(date=today).count(),
            }

        if is_privileged or role in ['treasurer', 'financial_head']:
            summary['finances']['pending_approvals'] = 0  # Placeholder

        if is_privileged or role == 'logistics_head':
            l_qs = LogisticsItem.objects.all()
            summary['logistics'] = {
                'total_items': l_qs.count(),
                'low_stock': l_qs.filter(quantity__lte=5).count(),
            }

        return Response(summary)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    @action(detail=True, methods=['post'], url_path='block')
    def block(self, request, pk=None):
        user = self.get_object()
        if user.is_active is False:
            return Response(UserSerializer(user).data)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='unblock')
    def unblock(self, request, pk=None):
        user = self.get_object()
        if user.is_active is True:
            return Response(UserSerializer(user).data)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response(UserSerializer(user).data)
