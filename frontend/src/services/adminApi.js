import api from './api';

/**
 * Admin API utilities
 */

export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => api.get('/api/admin/stats/dashboard'),
  getCategoryStats: () => api.get('/api/admin/stats/category-breakdown'),
  getRecoveryRate: () => api.get('/api/admin/stats/recovery-rate'),

  // Search & Filters
  searchItems: (query, filters) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('item_type', filters.type);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);

    return api.get(`/api/admin/items/search?${params.toString()}`);
  },

  // Notifications
  getNotifications: (unreadOnly = false) =>
    api.get(`/api/admin/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (notificationId) =>
    api.put(`/api/admin/notifications/${notificationId}/read`),
  createNotification: (adminId, title, message, type, relatedId) =>
    api.post('/api/admin/notification-trigger', {
      admin_id: adminId,
      title,
      message,
      notification_type: type,
      related_id: relatedId
    }),

  // Storage Management
  assignStorage: (itemId, location, remarks) =>
    api.put(`/api/admin/items/${itemId}/assign-storage`, {
      storage_location: location,
      admin_remarks: remarks
    }),

  // Audit Logs
  getAuditLogs: (limit = 100) =>
    api.get(`/api/admin/audit-logs?limit=${limit}`),

  // Profile
  getAdminProfile: () => api.get('/api/admin/profile'),
  getLoginHistory: () => api.get('/api/admin/login-history'),

  // Claims Management
  getClaimsByStatus: (status) => api.get('/api/claims/status', { params: status ? { status } : {} }),
  getClaimsForItem: (itemId) => api.get(`/api/claims/item/${itemId}`),
  verifyClaim: (claimId, status, remarks) =>
    api.put(`/api/claims/${claimId}/verify?status=${status}`, { remarks }),

  // Enhanced Features
  addFoundItem: (formData) => api.post('/api/admin/items/found', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMatches: () => api.get('/api/admin/items/matches'),
  handoverItem: (itemId, handoverData) => api.post(`/api/admin/items/${itemId}/handover`, handoverData),
  archiveItem: (itemId) => api.post(`/api/admin/items/${itemId}/archive`),
  disposeItem: (itemId) => api.post(`/api/admin/items/${itemId}/dispose`),
  sendBroadcast: (broadcastData) => api.post('/api/admin/broadcast', broadcastData),
  getItemContext: (itemId) => api.get(`/api/admin/items/${itemId}/context`),
  linkItems: (itemId, linkedItemId) => api.put(`/api/admin/items/${itemId}/link`, { linked_item_id: linkedItemId }),
  notifyOwner: (itemId, remarks) => api.post(`/api/admin/items/${itemId}/notify-owner`, { remarks })
};

export default adminAPI;
