import { queryClient, queryKeys } from './queryClient';
import { api } from './api';

/**
 * Prefetch utilities for React Query
 * Use these to preload data before user navigates to a page
 */

/**
 * Prefetch dashboard data
 */
export function prefetchDashboard() {
  queryClient.prefetchQuery({
    queryKey: queryKeys.auth.dashboard,
    queryFn: () => api.auth.dashboard().then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Prefetch members list
 */
export function prefetchMembers(params = {}) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.members.list(params),
    queryFn: () => api.members.list(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch events list
 */
export function prefetchEvents(params = {}) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => api.events.list(params).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Prefetch announcements
 */
export function prefetchAnnouncements(params = {}) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.announcements.list(params),
    queryFn: () => api.announcements.list(params).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch financial categories and summary
 */
export function prefetchFinanceData() {
  queryClient.prefetchQuery({
    queryKey: queryKeys.finance.categories,
    queryFn: () => api.finance.categories.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
  
  queryClient.prefetchQuery({
    queryKey: queryKeys.finance.summary,
    queryFn: () => api.finance.transactions.summary().then(res => res.data),
    staleTime: 30 * 1000,
  });
}

/**
 * Prefetch reference data (families, departments, ministries)
 */
export function prefetchReferenceData() {
  queryClient.prefetchQuery({
    queryKey: queryKeys.families.all,
    queryFn: () => api.families.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
  
  queryClient.prefetchQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => api.departments.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
  
  queryClient.prefetchQuery({
    queryKey: queryKeys.ministries.all,
    queryFn: () => api.ministries.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
  
  queryClient.prefetchQuery({
    queryKey: queryKeys.homeGroups.all,
    queryFn: () => api.homeGroups.list().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Prefetch user profile
 */
export function prefetchUser() {
  queryClient.prefetchQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.auth.me().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch all common data on app load
 */
export function prefetchCommonData() {
  prefetchUser();
  prefetchDashboard();
  prefetchReferenceData();
}

/**
 * React hook for hover prefetching
 * Usage: const prefetch = usePrefetchOnHover(); then onMouseEnter={prefetch.dashboard}
 */
export function usePrefetchOnHover() {
  return {
    dashboard: () => prefetchDashboard(),
    members: () => prefetchMembers(),
    events: () => prefetchEvents(),
    announcements: () => prefetchAnnouncements(),
    finances: () => prefetchFinanceData(),
    reference: () => prefetchReferenceData(),
  };
}
