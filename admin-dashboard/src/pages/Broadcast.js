import React, { useState } from 'react';
import adminService from '../services/adminService';

const Broadcast = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('SYSTEM');
    const [sending, setSending] = useState(false);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!title || !message) return;

        if (!window.confirm('This will send a notification to EVERY registered user. Proceed?')) return;

        setSending(true);
        try {
            await adminService.sendBroadcast({ title, message, category });
            alert('Campus-wide alert broadcasted successfully!');
            setTitle('');
            setMessage('');
        } catch (error) {
            alert('Broadcast Failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontWeight: '800', fontSize: '2.8rem', color: '#0f172a', margin: '0 0 10px 0' }}>Campus Broadcast</h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Instant emergency alerts and administrative announcements.</p>
            </div>

            <form onSubmit={handleBroadcast} style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f1f5f9'
            }}>
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>ALERT PRIORITY / TYPE</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['SYSTEM', 'URGENT', 'ITEMS', 'MAINTENANCE'].map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '2px solid',
                                    borderColor: category === cat ? (cat === 'URGENT' ? '#ef4444' : '#6366f1') : '#f1f5f9',
                                    backgroundColor: category === cat ? (cat === 'URGENT' ? '#fef2f2' : '#eef2ff') : 'white',
                                    color: category === cat ? (cat === 'URGENT' ? '#b91c1c' : '#4338ca') : '#64748b',
                                    fontWeight: '700',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>NOTIFICATION TITLE</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Identification Required for High-Value Item"
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            fontSize: '16px',
                            fontWeight: '600',
                            outlineColor: '#6366f1'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>BROADCAST CONTENT</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Provide clear instructions or details for the silver ring found in the canteen..."
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            minHeight: '200px',
                            backgroundColor: '#f8fafc',
                            fontSize: '15px',
                            lineHeight: '1.6',
                            outlineColor: '#6366f1'
                        }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={sending}
                    style={{
                        width: '100%',
                        padding: '20px',
                        backgroundColor: category === 'URGENT' ? '#ef4444' : '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '18px',
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        boxShadow: `0 10px 15px -3px ${category === 'URGENT' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(79, 70, 229, 0.3)'}`,
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {sending ? 'Establishing Uplink...' : `Send ${category} Broadcast`}
                </button>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
                    ⚠️ This action is irreversible and recorded in the audit trail.
                </p>
            </form>
        </div>
    );
};

export default Broadcast;
