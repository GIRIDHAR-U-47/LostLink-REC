import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await adminService.getAuditLogs(100);
            setLogs(response.data);
        } catch (error) {
            console.error('Audit Fetch Failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontWeight: '800', fontSize: '2.5rem', color: '#0f172a', margin: 0 }}>Administrative Audit Trail</h1>
                <button
                    onClick={fetchLogs}
                    style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
                >
                    Refresh Logs
                </button>
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                border: '1px solid #f1f5f9'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                            <tr>
                                <th style={{ padding: '20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>TIMESTAMP</th>
                                <th style={{ padding: '20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>ADMINISTRATOR</th>
                                <th style={{ padding: '20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>ACTION TAKEN</th>
                                <th style={{ padding: '20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>TARGET RESOURCE</th>
                                <th style={{ padding: '20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>METADATA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                    Syncing with security backend...
                                </td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                    No administrative activity recorded in current epoch.
                                </td></tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '20px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                                                    {log.admin_name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{log.admin_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                backgroundColor:
                                                    log.action.includes('DELETE') || log.action.includes('DISPOSE') ? '#fef2f2' :
                                                        log.action.includes('ASSIGN') || log.action.includes('HANDOVER') ? '#f0fdf4' : '#eff6ff',
                                                color:
                                                    log.action.includes('DELETE') || log.action.includes('DISPOSE') ? '#b91c1c' :
                                                        log.action.includes('ASSIGN') || log.action.includes('HANDOVER') ? '#166534' : '#1e40af',
                                                fontSize: '11px',
                                                fontWeight: '800'
                                            }}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px', fontSize: '13px', color: '#64748b' }}>
                                            <span style={{ fontWeight: '600', color: '#475569' }}>{log.target_type}</span>
                                            <span style={{ margin: '0 5px' }}>•</span>
                                            <code style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                                {log.target_id.slice(-8)}
                                            </code>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#64748b',
                                                maxHeight: '60px',
                                                overflowY: 'auto',
                                                backgroundColor: '#f8fafc',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                fontFamily: 'monospace'
                                            }}>
                                                {JSON.stringify(log.details, null, 1)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                    * Showing most recent {logs.length} operations. All actions are cryptographically signed.
                </p>
            </div>
        </div>
    );
};

export default ActivityLogs;
