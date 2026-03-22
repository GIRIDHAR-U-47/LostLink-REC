import React, { useState } from 'react';
import adminService from '../services/adminService';

const Broadcast = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('SYSTEM');
    const [sending, setSending] = useState(false);

    const categories = [
        { id: 'SYSTEM', label: 'System Alert', color: '#6366f1' },
        { id: 'URGENT', label: 'Urgent Alert', color: '#ef4444' },
        { id: 'ITEMS', label: 'Found Item', color: '#10b981' },
        { id: 'MAINTENANCE', label: 'Maintenance', color: '#f59e0b' }
    ];

    const currentCat = categories.find(c => c.id === category);

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
        <div style={{
            padding: '40px',
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(103, 27, 149, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.05) 0px, transparent 50%)',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontWeight: '900', fontSize: '2.5rem', color: '#1e293b', margin: '0 0 10px 0', letterSpacing: '-1px' }}>Global Uplink</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500' }}>Dispatch real-time emergency intelligence across the REC ecosystem.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px', alignItems: 'start' }}>
                    {/* Main Broadcast Form */}
                    <form onSubmit={handleBroadcast} style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        padding: '40px',
                        borderRadius: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.7)'
                    }}>
                        {/* Category Selection */}
                        <div style={{ marginBottom: '35px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '15px', letterSpacing: '1px', textTransform: 'uppercase' }}>Intelligence Classification</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: '2px solid',
                                            borderColor: category === cat.id ? cat.color : '#f1f5f9',
                                            backgroundColor: category === cat.id ? `${cat.color}10` : 'white',
                                            color: category === cat.id ? cat.color : '#64748b',
                                            fontWeight: '800',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            boxShadow: category === cat.id ? `0 10px 15px -3px ${cat.color}20` : 'none',
                                            transform: category === cat.id ? 'translateY(-2px)' : 'none'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title Input */}
                        <div style={{ marginBottom: '35px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Broadcast Vector (Title)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Mandatory Hardware Verification Session"
                                style={{
                                    width: '100%',
                                    padding: '20px',
                                    borderRadius: '18px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: '#fff',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = currentCat.color}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                required
                            />
                        </div>

                        {/* Content Input */}
                        <div style={{ marginBottom: '35px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>Payload Content</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe the alert parameters in detail..."
                                style={{
                                    width: '100%',
                                    padding: '20px',
                                    borderRadius: '18px',
                                    border: '1px solid #e2e8f0',
                                    minHeight: '220px',
                                    backgroundColor: '#fff',
                                    fontSize: '15px',
                                    lineHeight: '1.7',
                                    outline: 'none',
                                    resize: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = currentCat.color}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                required
                            />
                        </div>

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={sending}
                            style={{
                                width: '100%',
                                padding: '24px',
                                backgroundColor: currentCat.color,
                                color: 'white',
                                border: 'none',
                                borderRadius: '22px',
                                fontWeight: '900',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                boxShadow: `0 20px 25px -5px ${currentCat.color}40`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
                        >
                            {sending ? 'SYNCHRONIZING UPLINK...' : `ENGAGE ${category} BROADCAST`}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px', color: '#f59e0b', fontSize: '12px', fontWeight: '700', justifyContent: 'center' }}>
                            <span style={{ fontSize: '16px' }}>⚠️</span>
                            CRITICAL: THIS ACTION WILL REACH ALL PERSONNEL IMMEDIATELY.
                        </div>
                    </form>

                    {/* Live Preview Card */}
                    <div style={{ position: 'sticky', top: '40px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '15px', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center' }}>Live Mobile Interface</div>
                        <div style={{
                            width: '320px',
                            height: '640px',
                            backgroundColor: '#0f172a',
                            borderRadius: '50px',
                            margin: '0 auto',
                            padding: '12px',
                            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.2)',
                            border: '5px solid #334155',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Mobile Notch */}
                            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '140px', height: '30px', backgroundColor: '#334155', borderRadius: '0 0 20px 20px', zIndex: 10 }}></div>

                            {/* Screen Content */}
                            <div style={{ height: '100%', backgroundColor: '#fff', borderRadius: '40px', overflow: 'hidden', position: 'relative' }}>
                                {/* Mock Notification Center */}
                                <div style={{ padding: '20px 15px', marginTop: '40px' }}>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '6px', backgroundColor: '#671B95', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>RL</div>
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>LOSTLINK REC</span>
                                            </div>
                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>now</span>
                                        </div>
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>
                                            {title || 'Intelligence Stream Title'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                                            {message || 'Awaiting dispatch payload. Notification content will manifest here in real-time as you compose your campus-wide broadcast.'}
                                        </div>
                                        <div style={{ marginTop: '10px', height: '4px', width: '100%', backgroundColor: `${currentCat.color}20`, borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: '40%', height: '100%', backgroundColor: currentCat.color }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock App UI */}
                                <div style={{ padding: '0 20px' }}>
                                    <div style={{ fontSize: '10px', color: '#e2e8f0', letterSpacing: '4px', margin: '20px 0' }}>---------------------------</div>
                                    <div style={{ width: '100%', height: '60px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '10px' }}></div>
                                    <div style={{ width: '100%', height: '60px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '10px' }}></div>
                                    <div style={{ width: '100%', height: '120px', backgroundColor: '#f8fafc', borderRadius: '12px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Broadcast;
