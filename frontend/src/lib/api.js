import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Axios instance with default configuration
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth
  auth: {
    login: (credentials) => apiClient.post('/auth/token/', credentials),
    refresh: (refreshToken) => apiClient.post('/auth/token/refresh/', { refresh: refreshToken }),
    me: () => apiClient.get('/me/'),
    updateMe: (data) => apiClient.post('/me/', data),
    dashboard: () => apiClient.get('/dashboard/summary/'),
  },

  // Users
  users: {
    list: (params) => apiClient.get('/users/', { params }),
    get: (id) => apiClient.get(`/users/${id}/`),
    create: (data) => apiClient.post('/users/', data),
    update: (id, data) => apiClient.patch(`/users/${id}/`, data),
    delete: (id) => apiClient.delete(`/users/${id}/`),
    block: (id) => apiClient.post(`/users/${id}/block/`),
    unblock: (id) => apiClient.post(`/users/${id}/unblock/`),
  },

  // Members
  members: {
    list: (params) => apiClient.get('/members/', { params }),
    get: (id) => apiClient.get(`/members/${id}/`),
    create: (data) => apiClient.post('/members/', data),
    update: (id, data) => apiClient.patch(`/members/${id}/`, data),
    delete: (id) => apiClient.delete(`/members/${id}/`),
    getFiche: (id) => apiClient.get(`/members/${id}/fiche/`, { responseType: 'blob' }),
  },

  // Families
  families: {
    list: () => apiClient.get('/families/'),
    get: (id) => apiClient.get(`/families/${id}/`),
    create: (data) => apiClient.post('/families/', data),
    update: (id, data) => apiClient.patch(`/families/${id}/`, data),
    delete: (id) => apiClient.delete(`/families/${id}/`),
  },

  // Home Groups
  homeGroups: {
    list: () => apiClient.get('/home-groups/'),
    get: (id) => apiClient.get(`/home-groups/${id}/`),
    create: (data) => apiClient.post('/home-groups/', data),
    update: (id, data) => apiClient.patch(`/home-groups/${id}/`, data),
    delete: (id) => apiClient.delete(`/home-groups/${id}/`),
  },

  // Departments
  departments: {
    list: () => apiClient.get('/departments/'),
    get: (id) => apiClient.get(`/departments/${id}/`),
    create: (data) => apiClient.post('/departments/', data),
    update: (id, data) => apiClient.patch(`/departments/${id}/`, data),
    delete: (id) => apiClient.delete(`/departments/${id}/`),
  },

  // Ministries
  ministries: {
    list: () => apiClient.get('/ministries/'),
    get: (id) => apiClient.get(`/ministries/${id}/`),
    create: (data) => apiClient.post('/ministries/', data),
    update: (id, data) => apiClient.patch(`/ministries/${id}/`, data),
    delete: (id) => apiClient.delete(`/ministries/${id}/`),
  },

  // Activity Durations
  activityDurations: {
    list: (params) => apiClient.get('/activity-durations/', { params }),
  },

  // Events
  events: {
    list: (params) => apiClient.get('/events/', { params }),
    get: (id) => apiClient.get(`/events/${id}/`),
    create: (data) => apiClient.post('/events/', data),
    update: (id, data) => apiClient.patch(`/events/${id}/`, data),
    delete: (id) => apiClient.delete(`/events/${id}/`),
    publish: (id) => apiClient.post(`/events/${id}/publish/`),
    unpublish: (id) => apiClient.post(`/events/${id}/unpublish/`),
    setAlert: (id, message) => apiClient.post(`/events/${id}/set-alert/`, { message }),
    clearAlert: (id) => apiClient.post(`/events/${id}/clear-alert/`),
    validateClosure: (id) => apiClient.post(`/events/${id}/validate-closure/`),
    getAttendanceAggregate: (id) => apiClient.get(`/events/${id}/attendance-aggregate/`),
    updateAttendanceAggregate: (id, data) => apiClient.post(`/events/${id}/attendance-aggregate/`, data),
    getVisitorAggregate: (id) => apiClient.get(`/events/${id}/visitor-aggregate/`),
    updateVisitorAggregate: (id, data) => apiClient.post(`/events/${id}/visitor-aggregate/`, data),
    getLogisticsConsumption: (id) => apiClient.get(`/events/${id}/logistics-consumption/`),
    updateLogisticsConsumption: (id, data) => apiClient.post(`/events/${id}/logistics-consumption/`, data),
    getDepartmentMembers: (id) => apiClient.get(`/events/${id}/department-members/`),
    departmentCheckin: (id, data) => apiClient.post(`/events/${id}/department-checkin/`, data),
    getPublic: (slug) => apiClient.get(`/events/public/${slug}/`),
    addPublicComment: (slug, data) => apiClient.post(`/events/public/${slug}/comment/`, data),
  },

  // Attendance
  attendance: {
    list: (params) => apiClient.get('/attendance/', { params }),
    get: (id) => apiClient.get(`/attendance/${id}/`),
    create: (data) => apiClient.post('/attendance/', data),
    update: (id, data) => apiClient.patch(`/attendance/${id}/`, data),
    delete: (id) => apiClient.delete(`/attendance/${id}/`),
  },

  // Finance
  finance: {
    categories: {
      list: () => apiClient.get('/financial-categories/'),
      get: (id) => apiClient.get(`/financial-categories/${id}/`),
      create: (data) => apiClient.post('/financial-categories/', data),
      update: (id, data) => apiClient.patch(`/financial-categories/${id}/`, data),
      delete: (id) => apiClient.delete(`/financial-categories/${id}/`),
    },
    transactions: {
      list: (params) => apiClient.get('/financial-transactions/', { params }),
      get: (id) => apiClient.get(`/financial-transactions/${id}/`),
      create: (data) => apiClient.post('/financial-transactions/', data),
      update: (id, data) => apiClient.patch(`/financial-transactions/${id}/`, data),
      delete: (id) => apiClient.delete(`/financial-transactions/${id}/`),
      export: (params) => apiClient.get('/financial-transactions/export/', { params, responseType: 'blob' }),
      timeSeries: (params) => apiClient.get('/financial-transactions/time-series/', { params }),
      summary: () => apiClient.get('/financial-transactions/summary/'),
      verifyReceipt: (code) => apiClient.get(`/financial-transactions/verify-receipt/?code=${code}`),
      verifyDocument: (code) => apiClient.get(`/financial-transactions/verify-document/?code=${code}`),
      getReceipt: (id) => apiClient.get(`/financial-transactions/${id}/receipt/`, { responseType: 'blob' }),
      getVoucher: (id) => apiClient.get(`/financial-transactions/${id}/voucher/`, { responseType: 'blob' }),
      reportPdf: (params) => apiClient.get('/financial-transactions/report-pdf/', { params, responseType: 'blob' }),
    },
  },

  // Announcements
  announcements: {
    list: (params) => apiClient.get('/announcements/', { params }),
    get: (id) => apiClient.get(`/announcements/${id}/`),
    create: (data) => apiClient.post('/announcements/', data),
    update: (id, data) => apiClient.patch(`/announcements/${id}/`, data),
    delete: (id) => apiClient.delete(`/announcements/${id}/`),
    like: (id) => apiClient.post(`/announcements/${id}/like/`),
    getComments: (id) => apiClient.get(`/announcements/${id}/comments/`),
    addComment: (id, data) => apiClient.post(`/announcements/${id}/comments/`, data),
    likeComment: (id, commentId) => apiClient.post(`/announcements/${id}/comments/${commentId}/like/`),
  },

  // Announcement Decks
  announcementDecks: {
    list: () => apiClient.get('/announcement-decks/'),
    get: (id) => apiClient.get(`/announcement-decks/${id}/`),
    create: (data) => apiClient.post('/announcement-decks/', data),
    update: (id, data) => apiClient.patch(`/announcement-decks/${id}/`, data),
    delete: (id) => apiClient.delete(`/announcement-decks/${id}/`),
    getItems: (id) => apiClient.get(`/announcement-decks/${id}/items/`),
    setItems: (id, data) => apiClient.post(`/announcement-decks/${id}/set-items/`, data),
    generate: (id) => apiClient.post(`/announcement-decks/${id}/generate/`),
    download: (id) => apiClient.get(`/announcement-decks/${id}/download/`, { responseType: 'blob' }),
  },

  // Documents
  documents: {
    list: () => apiClient.get('/documents/'),
    get: (id) => apiClient.get(`/documents/${id}/`),
    create: (data) => apiClient.post('/documents/', data),
    update: (id, data) => apiClient.patch(`/documents/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/${id}/`),
  },

  // Logistics
  logistics: {
    list: (params) => apiClient.get('/logistics-items/', { params }),
    get: (id) => apiClient.get(`/logistics-items/${id}/`),
    create: (data) => apiClient.post('/logistics-items/', data),
    update: (id, data) => apiClient.patch(`/logistics-items/${id}/`, data),
    delete: (id) => apiClient.delete(`/logistics-items/${id}/`),
  },

  // Church Info
  church: {
    getBiography: () => apiClient.get('/church-biography/'),
    updateBiography: (id, data) => apiClient.patch(`/church-biography/${id}/`, data),
    createBiography: (data) => apiClient.post('/church-biography/', data),
    getConsistory: () => apiClient.get('/church-consistory/'),
    updateConsistory: (id, data) => apiClient.patch(`/church-consistory/${id}/`, data),
    createConsistory: (data) => apiClient.post('/church-consistory/', data),
  },

  // Audit Logs
  auditLogs: {
    list: (params) => apiClient.get('/audit-logs/', { params }),
  },

  // Notifications
  notifications: {
    list: () => apiClient.get('/notifications/'),
    get: (id) => apiClient.get(`/notifications/${id}/`),
    markAsRead: (id) => apiClient.patch(`/notifications/${id}/`, { is_read: true }),
    delete: (id) => apiClient.delete(`/notifications/${id}/`),
  },

  // Approval Requests
  approvalRequests: {
    list: (params) => apiClient.get('/approval-requests/', { params }),
    get: (id) => apiClient.get(`/approval-requests/${id}/`),
    approve: (id) => apiClient.post(`/approval-requests/${id}/approve/`),
    reject: (id, reason) => apiClient.post(`/approval-requests/${id}/reject/`, { reason }),
  },

  // Reports
  reports: {
    getCompiled: (params) => apiClient.get('/reports/compiled/', { params }),
  },
};
