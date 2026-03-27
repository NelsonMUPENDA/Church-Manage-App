import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration with optimized caching strategies
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (disabled for performance)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'stale',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Optimistic updates are handled per-mutation
    },
  },
});

/**
 * Query keys for cache management
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
    dashboard: ['auth', 'dashboard'],
  },
  users: {
    all: ['users'],
    detail: (id) => ['users', id],
    list: (filters) => ['users', 'list', filters],
  },
  members: {
    all: ['members'],
    detail: (id) => ['members', id],
    list: (filters) => ['members', 'list', filters],
  },
  families: {
    all: ['families'],
    detail: (id) => ['families', id],
  },
  homeGroups: {
    all: ['homeGroups'],
    detail: (id) => ['homeGroups', id],
  },
  departments: {
    all: ['departments'],
    detail: (id) => ['departments', id],
  },
  ministries: {
    all: ['ministries'],
    detail: (id) => ['ministries', id],
  },
  events: {
    all: ['events'],
    detail: (id) => ['events', id],
    list: (filters) => ['events', 'list', filters],
    public: (slug) => ['events', 'public', slug],
  },
  attendance: {
    all: ['attendance'],
    byEvent: (eventId) => ['attendance', 'event', eventId],
  },
  finance: {
    categories: ['finance', 'categories'],
    transactions: ['finance', 'transactions'],
    list: (filters) => ['finance', 'transactions', 'list', filters],
    summary: ['finance', 'summary'],
    timeSeries: (params) => ['finance', 'timeSeries', params],
  },
  announcements: {
    all: ['announcements'],
    detail: (id) => ['announcements', id],
    list: (filters) => ['announcements', 'list', filters],
    comments: (id) => ['announcements', id, 'comments'],
  },
  announcementDecks: {
    all: ['announcementDecks'],
    detail: (id) => ['announcementDecks', id],
  },
  documents: {
    all: ['documents'],
    detail: (id) => ['documents', id],
  },
  logistics: {
    all: ['logistics'],
    detail: (id) => ['logistics', id],
  },
  church: {
    biography: ['church', 'biography'],
    consistory: ['church', 'consistory'],
  },
  auditLogs: {
    all: ['auditLogs'],
    list: (filters) => ['auditLogs', 'list', filters],
  },
  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread'],
  },
  approvalRequests: {
    all: ['approvalRequests'],
    detail: (id) => ['approvalRequests', id],
    pending: ['approvalRequests', 'pending'],
  },
  reports: {
    summary: (params) => ['reports', 'summary', params],
  },
};
