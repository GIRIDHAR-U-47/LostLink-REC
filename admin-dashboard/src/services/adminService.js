import api from './api';

const adminService = {
    // Dashboard Stats
    getDashboardStats: () => api.get('/admin/stats/dashboard'),
    getCategoryStats: () => api.get('/admin/stats/category-breakdown'),
    getRecoveryRate: () => api.get('/admin/stats/recovery-rate'),

    // Item Management
    searchItems: (params) => api.get('/admin/items/search', { params }),
    assignStorage: (itemId, storageLocation, adminRemarks) =>
        api.put(`/admin/items/${itemId}/assign-storage`, { storage_location: storageLocation, admin_remarks: adminRemarks }),

    // Claims Management
    getClaimsByStatus: (status) => api.get('/claims/status', { params: status ? { status } : {} }),
    verifyClaim: (claimId, status) => api.put(`/claims/${claimId}/verify?status=${status}`),

    // Profile & Logs
    getProfile: () => api.get('/admin/profile'),
    getLoginHistory: () => api.get('/admin/login-history'),
    getAuditLogs: (limit = 100) => api.get(`/admin/audit-logs?limit=${limit}`),

    // Notifications
    getNotifications: (unreadOnly = false) => api.get(`/admin/notifications?unread_only=${unreadOnly}`),
    markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),

    // Helpers
    getBaseUrl: () => 'http://127.0.0.1:8080'
};

export default adminService;
