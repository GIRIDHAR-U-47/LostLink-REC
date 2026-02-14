import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Fetch admin profile
            const profileRes = await adminService.getProfile();
            setProfile(profileRes.data);

            // Fetch audit logs
            const logsRes = await adminService.getAuditLogs(50);
            setAuditLogs(logsRes.data || []);
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        return null;
    };

    const getActionColor = (action) => {
        if (action.includes('reject') || action.includes('delete')) return '#dc3545';
        if (action.includes('approve') || action.includes('verify')) return '#28a745';
        return '#003366';
    };

    return (
        <div>
            <h1>Admin Profile</h1>

            {loading ? (
                <div className="loading">Loading profile...</div>
            ) : (
                <>
                    {/* Profile Card */}
                    {profile && (
                        <div className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #671B95, #4A148C)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 10px rgba(103, 27, 149, 0.3)'
                            }}>
                                {(profile.name || profile.email || 'A').charAt(0).toUpperCase()}
                            </div>

                            <div style={{ flex: 1 }}>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#1e293b' }}>{profile.name || 'Admin User'}</h2>
                                <p style={{ margin: '0 0 10px 0', color: '#64748b' }}>{profile.email}</p>
                                <span className="badge badge-available" style={{ fontSize: '13px' }}>
                                    {profile.roles?.includes('ADMIN') ? 'Administrator' : 'User'}
                                </span>
                            </div>

                            <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
                                <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Member Since</p>
                                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px', color: '#334155' }}>
                                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Statistics Section */}
                    <div className="metrics-grid">
                        <div className="metric-box">
                            <div className="metric-value">{auditLogs.length}</div>
                            <div className="metric-label">Total Actions</div>
                        </div>
                        <div className="metric-box">
                            <div className="metric-value">{auditLogs.filter(log => log.action_type?.includes('verify')).length}</div>
                            <div className="metric-label">Items Verified</div>
                        </div>
                        <div className="metric-box">
                            <div className="metric-value">{auditLogs.filter(log => log.action_type?.includes('claim')).length}</div>
                            <div className="metric-label">Claims Processed</div>
                        </div>
                    </div>

                    {/* Audit Logs Section */}
                    <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Recent Activity</h2>

                    {auditLogs.length === 0 ? (
                        <div className="empty-state">
                            <p>No activity records yet</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                        <th>Target</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.slice(0, 50).map((log, index) => (
                                        <tr key={index}>
                                            <td style={{ fontSize: '12px', color: '#666' }}>
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                            </td>
                                            <td>
                                                <span style={{
                                                    backgroundColor: getActionColor(log.action_type),
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '3px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {log.action_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                {log.target_type && (
                                                    <span style={{ color: '#666', fontSize: '12px' }}>
                                                        {log.target_type}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '12px', color: '#666', maxWidth: '300px' }}>
                                                {log.details ? (
                                                    <details style={{ cursor: 'pointer' }}>
                                                        <summary>View</summary>
                                                        <pre style={{
                                                            backgroundColor: '#f5f5f5',
                                                            padding: '10px',
                                                            borderRadius: '3px',
                                                            fontSize: '11px',
                                                            overflow: 'auto',
                                                            maxHeight: '200px'
                                                        }}>
                                                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Refresh Button */}
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button className="btn" onClick={fetchProfile}>
                            Refresh Activity
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;
