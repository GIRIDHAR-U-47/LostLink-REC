import api from './api';

/**
 * Admin API utilities
 */

export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => api.get('/admin/stats/dashboard'),
  getCategoryStats: () => api.get('/admin/stats/category-breakdown'),
  getRecoveryRate: () => api.get('/admin/stats/recovery-rate'),

  // Search & Filters
  searchItems: (query, filters) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('item_type', filters.type);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);

    return api.get(`/admin/items/search?${params.toString()}`);
  },

  // Notifications
  getNotifications: (unreadOnly = false) =>
    api.get(`/admin/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (notificationId) =>
    api.put(`/admin/notifications/${notificationId}/read`),
  createNotification: (adminId, title, message, type, relatedId) =>
    api.post('/admin/notification-trigger', {
      admin_id: adminId,
      title,
      message,
      notification_type: type,
      related_id: relatedId
    }),

  // Storage Management
  assignStorage: (itemId, location, remarks) =>
    api.put(`/admin/items/${itemId}/assign-storage`, {
      storage_location: location,
      admin_remarks: remarks
    }),

  // Audit Logs
  getAuditLogs: (limit = 100) =>
    api.get(`/admin/audit-logs?limit=${limit}`),

  // Profile
  getAdminProfile: () => api.get('/admin/profile'),
  getLoginHistory: () => api.get('/admin/login-history'),

  // Claims Management
  getClaimsByStatus: (status) => api.get('/claims/status', { params: status ? { status } : {} }),
  getClaimsForItem: (itemId) => api.get(`/claims/item/${itemId}`),
  verifyClaim: (claimId, status, remarks) =>
    api.put(`/claims/${claimId}/verify?status=${status}`, { remarks }),

  // Enhanced Features
  addFoundItem: (formData) => api.post('/admin/items/found', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMatches: () => api.get('/admin/items/matches'),
  handoverItem: (itemId, handoverData) => api.post(`/admin/items/${itemId}/handover`, handoverData),
  archiveItem: (itemId) => api.post(`/admin/items/${itemId}/archive`),
  disposeItem: (itemId) => api.post(`/admin/items/${itemId}/dispose`),
  sendBroadcast: (broadcastData) => api.post('/admin/broadcast', broadcastData),
  getItemContext: (itemId) => api.get(`/admin/items/${itemId}/context`),
  linkItems: (itemId, linkedItemId) => api.put(`/admin/items/${itemId}/link`, { linked_item_id: linkedItemId }),
  notifyOwner: (itemId, remarks) => api.post(`/admin/items/${itemId}/notify-owner`, { remarks })
};

export default adminAPI;
