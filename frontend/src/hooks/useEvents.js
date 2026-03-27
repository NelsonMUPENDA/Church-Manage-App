import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib';

// ==================== EVENTS HOOKS ====================

/**
 * Hook to get events list with filtering
 */
export function useEvents(params = {}) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => api.events.list(params).then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes - events change frequently
  });
}

/**
 * Hook to get a single event
 */
export function useEvent(id) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => api.events.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get a public event by slug
 */
export function usePublicEvent(slug) {
  return useQuery({
    queryKey: queryKeys.events.public(slug),
    queryFn: () => api.events.getPublic(slug).then(res => res.data),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry on 404
  });
}

/**
 * Hook to create an event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.events.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.dashboard });
    },
  });
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.events.update(id, data).then(res => res.data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

/**
 * Hook to publish/unpublish an event
 */
export function useToggleEventPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, publish }) => {
      if (publish) {
        return api.events.publish(id).then(res => res.data);
      }
      return api.events.unpublish(id).then(res => res.data);
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

/**
 * Hook to manage event alerts
 */
export function useEventAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message, clear }) => {
      if (clear) {
        return api.events.clearAlert(id).then(res => res.data);
      }
      return api.events.setAlert(id, message).then(res => res.data);
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
    },
  });
}

/**
 * Hook to validate event closure
 */
export function useValidateEventClosure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.events.validateClosure(id).then(res => res.data),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
    },
  });
}

/**
 * Hook to get event attendance aggregate
 */
export function useEventAttendanceAggregate(eventId) {
  return useQuery({
    queryKey: ['events', eventId, 'attendanceAggregate'],
    queryFn: () => api.events.getAttendanceAggregate(eventId).then(res => res.data),
    enabled: !!eventId,
  });
}

/**
 * Hook to update event attendance aggregate
 */
export function useUpdateEventAttendanceAggregate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => 
      api.events.updateAttendanceAggregate(eventId, data).then(res => res.data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['events', eventId, 'attendanceAggregate'] 
      });
    },
  });
}

/**
 * Hook to get event visitor aggregate
 */
export function useEventVisitorAggregate(eventId) {
  return useQuery({
    queryKey: ['events', eventId, 'visitorAggregate'],
    queryFn: () => api.events.getVisitorAggregate(eventId).then(res => res.data),
    enabled: !!eventId,
  });
}

/**
 * Hook to update event visitor aggregate
 */
export function useUpdateEventVisitorAggregate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => 
      api.events.updateVisitorAggregate(eventId, data).then(res => res.data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['events', eventId, 'visitorAggregate'] 
      });
    },
  });
}

/**
 * Hook to get event logistics consumption
 */
export function useEventLogisticsConsumption(eventId) {
  return useQuery({
    queryKey: ['events', eventId, 'logisticsConsumption'],
    queryFn: () => api.events.getLogisticsConsumption(eventId).then(res => res.data),
    enabled: !!eventId,
  });
}

/**
 * Hook to update event logistics consumption
 */
export function useUpdateEventLogisticsConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => 
      api.events.updateLogisticsConsumption(eventId, data).then(res => res.data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['events', eventId, 'logisticsConsumption'] 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.logistics.all });
    },
  });
}

/**
 * Hook to get department members for an event
 */
export function useEventDepartmentMembers(eventId) {
  return useQuery({
    queryKey: ['events', eventId, 'departmentMembers'],
    queryFn: () => api.events.getDepartmentMembers(eventId).then(res => res.data),
    enabled: !!eventId,
  });
}

/**
 * Hook for department check-in
 */
export function useDepartmentCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => 
      api.events.departmentCheckin(eventId, data).then(res => res.data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['events', eventId, 'departmentMembers'] 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byEvent(eventId) });
    },
  });
}

// ==================== ATTENDANCE HOOKS ====================

/**
 * Hook to get attendance list
 */
export function useAttendance(params = {}) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params),
    queryFn: () => api.attendance.list(params).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create attendance
 */
export function useCreateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.attendance.create(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      if (data.event) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.attendance.byEvent(data.event) 
        });
      }
    },
  });
}

/**
 * Hook to update attendance
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.attendance.update(id, data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      if (data.event) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.attendance.byEvent(data.event) 
        });
      }
    },
  });
}
