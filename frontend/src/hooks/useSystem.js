import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib';

// ==================== AUDIT LOGS HOOKS ====================

/**
 * Hook to get audit logs
 */
export function useAuditLogs(params = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => api.auditLogs.list(params).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== NOTIFICATIONS HOOKS ====================

/**
 * Hook to get notifications
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => api.notifications.list().then(res => res.data),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.notifications.markAsRead(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.notifications.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// ==================== APPROVAL REQUESTS HOOKS ====================

/**
 * Hook to get approval requests
 */
export function useApprovalRequests(params = {}) {
  return useQuery({
    queryKey: queryKeys.approvalRequests.list?.(params) || ['approvalRequests', params],
    queryFn: () => api.approvalRequests.list(params).then(res => res.data),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to get a single approval request
 */
export function useApprovalRequest(id) {
  return useQuery({
    queryKey: queryKeys.approvalRequests.detail?.(id) || ['approvalRequests', id],
    queryFn: () => api.approvalRequests.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 30 * 1000,
    // Poll every 5 seconds for pending requests
    refetchInterval: (data) => data?.status === 'pending' ? 5000 : false,
  });
}

/**
 * Hook to approve a request
 */
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.approvalRequests.approve(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests.pending });
    },
  });
}

/**
 * Hook to reject a request
 */
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => api.approvalRequests.reject(id, reason).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRequests.pending });
    },
  });
}

// ==================== REPORTS HOOKS ====================

/**
 * Hook to get compiled report
 */
export function useCompiledReport(params = {}) {
  return useQuery({
    queryKey: queryKeys.reports.summary(params),
    queryFn: () => api.reports.getCompiled(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}
