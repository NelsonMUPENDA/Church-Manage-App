import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib';

// ==================== AUTH HOOKS ====================

/**
 * Hook to get current user profile
 */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.auth.me().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update current user profile
 */
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.auth.updateMe(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });
}

/**
 * Hook to get dashboard summary
 */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.auth.dashboard,
    queryFn: () => api.auth.dashboard().then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ==================== USERS HOOKS ====================

/**
 * Hook to get users list with filtering
 */
export function useUsers(params = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => api.users.list(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a single user
 */
export function useUser(id) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => api.users.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.users.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.users.update(id, data).then(res => res.data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Hook to block/unblock a user
 */
export function useToggleUserBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'block') {
        return api.users.block(id).then(res => res.data);
      }
      return api.users.unblock(id).then(res => res.data);
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ==================== MEMBERS HOOKS ====================

/**
 * Hook to get members list with filtering
 */
export function useMembers(params = {}) {
  return useQuery({
    queryKey: queryKeys.members.list(params),
    queryFn: () => api.members.list(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a single member
 */
export function useMember(id) {
  return useQuery({
    queryKey: queryKeys.members.detail(id),
    queryFn: () => api.members.get(id).then(res => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a member
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.members.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.dashboard });
    },
  });
}

/**
 * Hook to update a member
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.members.update(id, data).then(res => res.data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
  });
}

/**
 * Hook to download member fiche PDF
 */
export function useMemberFiche() {
  return useMutation({
    mutationFn: (id) => api.members.getFiche(id),
  });
}

// ==================== FAMILIES HOOKS ====================

/**
 * Hook to get all families
 */
export function useFamilies() {
  return useQuery({
    queryKey: queryKeys.families.all,
    queryFn: () => api.families.list().then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes - families don't change often
  });
}

/**
 * Hook to create a family
 */
export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.families.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.families.all });
    },
  });
}

// ==================== HOME GROUPS HOOKS ====================

/**
 * Hook to get all home groups
 */
export function useHomeGroups() {
  return useQuery({
    queryKey: queryKeys.homeGroups.all,
    queryFn: () => api.homeGroups.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== DEPARTMENTS HOOKS ====================

/**
 * Hook to get all departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => api.departments.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== MINISTRIES HOOKS ====================

/**
 * Hook to get all ministries
 */
export function useMinistries() {
  return useQuery({
    queryKey: queryKeys.ministries.all,
    queryFn: () => api.ministries.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== ACTIVITY DURATIONS HOOKS ====================

/**
 * Hook to get activity durations
 */
export function useActivityDurations(params = {}) {
  return useQuery({
    queryKey: ['activityDurations', params],
    queryFn: () => api.activityDurations.list(params).then(res => res.data),
    staleTime: 30 * 60 * 1000, // 30 minutes - very static data
  });
}
