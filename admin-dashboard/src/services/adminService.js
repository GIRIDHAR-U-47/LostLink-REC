import api from './api';

const adminService = {
    // Dashboard Stats
    getDashboardStats: () => api.get('/admin/stats/dashboard'),
    getCategoryStats: () => api.get('/admin/stats/category-breakdown'),
    getRecoveryRate: () => api.get('/admin/stats/recovery-rate'),

    // Item Management
    searchItems: (params) => api.get('/admin/items/search', { params }),
    assignStorage: (itemId, storageLocation, adminRemarks, status) =>
        api.put(`/admin/items/${itemId}/assign-storage`, {
            storage_location: storageLocation,
            admin_remarks: adminRemarks,
            status: status
        }),

    // Claims Management
    getClaimsByStatus: (status) => api.get('/claims/status', { params: status ? { status } : {} }),
    getClaimsForItem: (itemId) => api.get(`/claims/item/${itemId}`),
    verifyClaim: (claimId, status, remarks) =>
        api.put(`/claims/${claimId}/verify?status=${status}`, { remarks }),

    // Profile & Logs
    getProfile: () => api.get('/admin/profile'),
    getLoginHistory: () => api.get('/admin/login-history'),
    getAuditLogs: (limit = 100) => api.get(`/admin/audit-logs?limit=${limit}`),

    // Notifications
    getNotifications: (unreadOnly = false) => api.get(`/admin/notifications?unread_only=${unreadOnly}`),
    markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),

    // New Enhanced Features
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
    notifyOwner: (itemId, remarks) => api.post(`/admin/items/${itemId}/notify-owner`, { remarks }),

    // Helpers
    getBaseUrl: () => 'http://127.0.0.1:8080'
};

export default adminService;
