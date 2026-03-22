import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Fetch admin profile
            const profileRes = await adminService.getProfile();
            const userData = profileRes.data;
            setProfile(userData);

            // Fetch audit logs and filter for this admin
            const logsRes = await adminService.getAuditLogs(100);
            const allLogs = logsRes.data || [];

            // Filter logs where admin_id matches current user's id
            const myLogs = allLogs.filter(log => log.admin_id === userData.id);
            setAuditLogs(myLogs);
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const getActionColor = (action) => {
        if (!action) return '#64748b';
        const act = action.toLowerCase();
        if (act.includes('reject') || act.includes('delete') || act.includes('dispose')) return '#ef4444';
        if (act.includes('approve') || act.includes('verify') || act.includes('handover') || act.includes('assigned')) return '#10b981';
        if (act.includes('create') || act.includes('broadcast')) return '#6366f1';
        return '#003366';
    };

    const getActionLabel = (action) => {
        if (!action) return 'Unknown Action';
        return action.replace(/_/g, ' ');
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', color: '#1e293b', fontWeight: '800' }}>My Profile</h1>
                <button className="btn btn-danger" onClick={handleLogout} style={{ padding: '8px 16px' }}>
                    <span>Logout</span>
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                    <div className="loading" style={{ fontSize: '18px', color: '#64748b' }}>Loading profile information...</div>
                </div>
            ) : (
                <>
                    {/* Profile Header Card */}
                    {profile && (
                        <div className="metric-card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '32px',
                            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
                            borderLeft: '5px solid #671B95'
                        }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, #671B95, #4A148C)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '42px',
                                fontWeight: 'bold',
                                boxShadow: '0 10px 20px rgba(103, 27, 149, 0.2)'
                            }}>
                                {(profile.name || profile.email || 'A').charAt(0).toUpperCase()}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                    <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '700' }}>{profile.name}</h2>
                                    <span className="badge badge-available" style={{ padding: '4px 12px', fontSize: '11px', textTransform: 'uppercase' }}>
                                        {profile.role || 'ADMIN'}
                                    </span>
                                </div>
                                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '16px' }}>{profile.email}</p>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px' }}>
                                        <span style={{ color: '#94a3b8' }}>ID:</span> {profile.registerNumber || 'N/A'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px' }}>
                                        <span style={{ color: '#94a3b8' }}>Account Type:</span> Global Administrator
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '32px' }}>
                                <p style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>System Status</p>
                                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '18px', color: '#10b981' }}>
                                    Active
                                </p>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                        {/* Stats Column */}
                        <div>
                            <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#334155' }}>Your Impact</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                <div className="metric-box" style={{ padding: '20px', alignItems: 'flex-start' }}>                                    <div className="metric-value" style={{ margin: '0', fontSize: '28px' }}>{auditLogs.length}</div>
                                    <div className="metric-label">Total Actions</div>
                                </div>
                                <div className="metric-box" style={{ padding: '20px', alignItems: 'flex-start' }}>
                                    <div className="metric-value" style={{ margin: '0', fontSize: '28px' }}>
                                        {auditLogs.filter(log =>
                                            log.action?.includes('CLAIM') ||
                                            log.action?.includes('ASSIGNED') ||
                                            log.action?.includes('ITEM_CREATED')
                                        ).length}
                                    </div>
                                    <div className="metric-label">Tasks Completed</div>
                                </div>
                                <div className="metric-box" style={{ padding: '20px', alignItems: 'flex-start' }}>                                    <div className="metric-value" style={{ margin: '0', fontSize: '28px' }}>
                                        {auditLogs.filter(log => log.action?.includes('HANDOVER')).length}
                                    </div>
                                    <div className="metric-label">Return Successes</div>
                                </div>
                            </div>

                            <div className="metric-card" style={{ marginTop: '24px', padding: '20px' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', textTransform: 'uppercase', color: '#64748b' }}>Permissions</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {['User Management', 'Item Moderation', 'Audit Access', 'System Broadcasts', 'Storage Control'].map((perm, i) => (
                                        <li key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '10px',
                                            fontSize: '14px',
                                            color: '#475569'
                                        }}>
                                            <span style={{ color: '#10b981' }}>✓</span> {perm}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Activity Column */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', color: '#334155' }}>Recent Activity</h3>
                                <button className="btn btn-secondary" onClick={fetchProfile} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    Refresh
                                </button>
                            </div>

                            {auditLogs.length === 0 ? (
                                <div className="empty-state" style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <p>No activity records found for this account.</p>
                                    <p style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '8px' }}>Actions you take in the dashboard will appear here.</p>
                                </div>
                            ) : (
                                <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    <table>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                <th>Action</th>
                                                <th>Target</th>
                                                <th>Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.map((log, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{
                                                                color: getActionColor(log.action),
                                                                fontSize: '13px',
                                                                fontWeight: '700',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                {getActionLabel(log.action)}
                                                            </span>
                                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                                REF: {log.target_id?.substring(0, 12)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-pending" style={{
                                                            fontSize: '11px',
                                                            backgroundColor: '#f1f5f9',
                                                            color: '#475569',
                                                            border: 'none',
                                                            fontWeight: '600'
                                                        }}>
                                                            {log.target_type}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                                        {log.timestamp ? new Date(log.timestamp).toLocaleString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;

