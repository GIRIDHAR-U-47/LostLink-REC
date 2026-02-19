import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';

const HandoverRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchHandovers();
    }, []);

    const fetchHandovers = async () => {
        setLoading(true);
        try {
            // Fetch items with RETURNED status to show handover history
            const params = { status: 'RETURNED' };
            const response = await adminService.searchItems(params);
            setRecords(response.data || []);
        } catch (error) {
            console.error('Handover Search Failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = records.filter(r =>
        (r.handed_over_to_student_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontWeight: '800', fontSize: '2.8rem', color: '#0f172a', margin: 0 }}>Handover Registry</h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Permanent record of physical item returns and student verifications.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Student ID or Item..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '14px 20px 14px 45px',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                width: '350px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={fetchHandovers}
                        style={{ padding: '14px 24px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', color: '#475569' }}
                    >
                        🔄 Sync
                    </button>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '26px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                border: '1px solid #f1f5f9'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                            <tr>
                                <th style={{ padding: '25px 20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>HANDOVER TIMESTAMP</th>
                                <th style={{ padding: '25px 20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>STUDENT RECIPIENT</th>
                                <th style={{ padding: '25px 20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>ITEM DELIVERED</th>
                                <th style={{ padding: '25px 20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>AUTHORIZED BY</th>
                                <th style={{ padding: '25px 20px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>OFFICIAL REMARKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
                                    Opening secure archives...
                                </td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>📜</div>
                                    No handover events found in current filters.
                                </td></tr>
                            ) : (
                                filteredRecords.map((record, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fcfcfd'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '22px 20px', fontSize: '13px', color: '#64748b' }}>
                                            {record.handed_over_at ? new Date(record.handed_over_at).toLocaleString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '22px 20px' }}>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '6px 12px',
                                                backgroundColor: '#ecfdf5',
                                                color: '#065f46',
                                                borderRadius: '8px',
                                                fontWeight: '800',
                                                fontSize: '13px',
                                                fontFamily: 'monospace'
                                            }}>
                                                {record.handed_over_to_student_id}
                                            </div>
                                        </td>
                                        <td style={{ padding: '22px 20px' }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{record.category}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {record.description}
                                            </div>
                                        </td>
                                        <td style={{ padding: '22px 20px', fontSize: '14px', color: '#475569', fontWeight: '600' }}>
                                            {record.handed_over_by_name || 'Admin'}
                                        </td>
                                        <td style={{ padding: '22px 20px' }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#64748b',
                                                backgroundColor: '#f8fafc',
                                                padding: '10px',
                                                borderRadius: '10px',
                                                fontStyle: 'italic',
                                                border: '1px solid #f1f5f9'
                                            }}>
                                                "{record.admin_remarks || 'Handover verified and recorded.'}"
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    * Records are stored permanently and cannot be deleted once verified.
                </p>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    Displaying {filteredRecords.length} records
                </div>
            </div>
        </div>
    );
};

export default HandoverRecords;
