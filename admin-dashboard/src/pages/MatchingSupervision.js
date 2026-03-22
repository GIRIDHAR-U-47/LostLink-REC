import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';

const MatchingSupervision = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMatches();
            setMatches(response.data);
        } catch (error) {
            console.error('Match Detection Failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#0f172a', margin: 0, fontWeight: '800', fontSize: '2.5rem' }}>Matching Supervision</h1>
                <button
                    onClick={fetchMatches}
                    style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
                >
                    Refresh Analysis
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '100px', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ marginBottom: '20px' }}>⚙️</div>
                    Analysing item trends and cross-referencing descriptions...
                </div>
            ) : matches.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', backgroundColor: 'white', borderRadius: '24px', color: '#94a3b8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <div style={{ fontSize: '50px', marginBottom: '20px' }}>✨</div>
                    <p style={{ fontSize: '18px' }}>No potential matches detected in current inventory.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {matches.map((match, idx) => (
                        <div key={idx} style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '30px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            gap: '30px',
                            alignItems: 'center',
                            borderLeft: match.confidence === 'HIGH' ? '10px solid #10b981' : '10px solid #f59e0b',
                            transition: 'transform 0.2s'
                        }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>FOUND ITEM ENTRY</label>
                                    <span style={{ fontSize: '10px', color: '#64748b' }}>ID: {match.found_item._id.slice(-6)}</span>
                                </div>
                                <h3 style={{ margin: '8px 0', color: '#064e3b' }}>{match.found_item.category}</h3>
                                <p style={{ fontSize: '14px', color: '#374151', margin: '10px 0' }}>{match.found_item.description}</p>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6b7280' }}>
                                    <span>📍 {match.found_item.location}</span>
                                    {match.found_item.storage_location && <span>📦 {match.found_item.storage_location}</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '24px' }}>🌉</div>
                                <div style={{ height: '40px', width: '2px', background: '#e2e8f0' }}></div>
                                <div style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: match.confidence === 'HIGH' ? '#d1fae5' : '#fef3c7',
                                    color: match.confidence === 'HIGH' ? '#065f46' : '#92400e',
                                    fontSize: '11px',
                                    fontWeight: '800'
                                }}>
                                    {match.confidence}
                                </div>
                            </div>

                            <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '20px', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>LOST ITEM REPORT</label>
                                    <span style={{ fontSize: '10px', color: '#64748b' }}>ID: {match.lost_item._id.slice(-6)}</span>
                                </div>
                                <h3 style={{ margin: '8px 0', color: '#1e3a8a' }}>{match.lost_item.category}</h3>
                                <p style={{ fontSize: '14px', color: '#374151', margin: '10px 0' }}>{match.lost_item.description}</p>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6b7280' }}>
                                    <span>📍 {match.lost_item.location}</span>
                                    <span>👤 Reporter: {match.lost_item.user?.name || 'Unknown'}</span>
                                </div>
                            </div>

                            <div style={{ width: '180px' }}>
                                {match.shared_keywords?.length > 0 && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px' }}>KEYWORD OVERLAP</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {match.shared_keywords.map((kw, i) => (
                                                <span key={i} style={{ padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '10px', color: '#475569' }}>{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => alert('Notification system will be triggered to both parties.')}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#6366f1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                                    }}
                                >
                                    Initiate Match
                                </button>
                                <button
                                    style={{
                                        width: '100%',
                                        marginTop: '10px',
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        color: '#94a3b8',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Dismiss Suggestion
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchingSupervision;
