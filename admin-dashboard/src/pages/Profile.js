import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

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
            const token = localStorage.getItem('userToken');

            // Fetch admin profile
            const profileResponse = await axios.get(`${API_BASE}/admin/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(profileResponse.data);

            // Fetch audit logs
            const logsResponse = await axios.get(`${API_BASE}/admin/audit-logs?limit=50`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAuditLogs(logsResponse.data || []);
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        const actionMap = {
            'verify_item': 'V',
            'assign_storage': 'S',
            'approve_claim': 'A',
            'reject_claim': 'R',
            'create_notification': 'N',
            'update_item': 'U',
            'delete_item': 'D',
            'export_report': 'E'
        };
        return actionMap[action] || '•';
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
                        <div className="card" style={{ marginBottom: '30px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    backgroundColor: '#003366',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    fontWeight: 'bold'
                                }}>
                                    {(profile.name || profile.email || 'A').charAt(0).toUpperCase()}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: '0 0 5px 0' }}>{profile.name || 'Admin User'}</h2>
                                    <p style={{ margin: '0 0 10px 0', color: '#666' }}>{profile.email}</p>
                                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                                        <strong>Role:</strong> {profile.roles?.includes('ADMIN') ? '👑 Administrator' : 'User'}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>Member Since</p>
                                    <p style={{ margin: '0', fontWeight: 'bold' }}>
                                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                        <div className="card" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196F3' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>Total Actions</p>
                            <h3 style={{ margin: '0' }}>{auditLogs.length}</h3>
                        </div>
                        <div className="card" style={{ backgroundColor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>Items Verified</p>
                            <h3 style={{ margin: '0' }}>
                                {auditLogs.filter(log => log.action_type?.includes('verify')).length}
                            </h3>
                        </div>
                        <div className="card" style={{ backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px' }}>Claims Processed</p>
                            <h3 style={{ margin: '0' }}>
                                {auditLogs.filter(log => log.action_type?.includes('claim')).length}
                            </h3>
                        </div>
                    </div>

                    {/* Audit Logs Section */}
                    <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>Recent Activity</h2>

                    {auditLogs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">-</div>
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
                                                    {getActionIcon(log.action_type)} {log.action_type || 'N/A'}
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
