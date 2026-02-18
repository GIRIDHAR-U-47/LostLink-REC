import React, { useEffect, useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import adminService from '../services/adminService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [categoryStats, setCategoryStats] = useState(null);
    const [recoveryRate, setRecoveryRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const statsRes = await adminService.getDashboardStats();
            setStats(statsRes.data);

            try {
                const categoryRes = await adminService.getCategoryStats();
                setCategoryStats(categoryRes.data);
            } catch (e) {
                console.error('Category stats fetch failed:', e);
            }

            try {
                const recoveryRes = await adminService.getRecoveryRate();
                setRecoveryRate(recoveryRes.data);
            } catch (e) {
                console.error('Recovery rate fetch failed:', e);
            }

        } catch (error) {
            console.error('Core Dashboard stats fetch failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => fetchStats(true), 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', color: '#6c5ce7' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #6c5ce7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '20px', fontWeight: '500', color: '#636e72', letterSpacing: '0.5px' }}>SYNCHRONIZING SYSTEM DATA</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!stats) return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
            <h2 style={{ color: '#d63031', fontWeight: '700' }}>CONNECTION ERROR</h2>
            <p style={{ color: '#636e72' }}>Unable to establish communication with the central repository.</p>
            <button onClick={() => fetchStats()} className="btn" style={{ backgroundColor: '#6c5ce7', color: 'white', marginTop: '20px', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: '600' }}>Retry Authentication</button>
        </div>
    );

    const chartColors = [
        '#6c5ce7', '#a29bfe', '#00cec9', '#00b894', '#fd79a8', '#fab1a0', '#ffeaa7', '#74b9ff'
    ];

    return (
        <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e293b', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Administrative Overview</h1>
                    <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '15px' }}>Centralized asset management and discovery tracking for REC Campus.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: refreshing ? 'not-allowed' : 'pointer',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '13px',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        {refreshing ? 'REFRESHING...' : 'SYNC SYSTEM DATA'}
                    </button>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Auto-sync interval: 60s</div>
                </div>
            </div>

            {/* Professional KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Lost Reports', value: stats.total_lost, color: '#ef4444' },
                    { label: 'Found Items', value: stats.total_found, color: '#10b981' },
                    { label: 'Pending Verification', value: stats.pending_verification, color: '#f59e0b' },
                    { label: 'Available for Collection', value: stats.available_items, color: '#3b82f6' },
                    { label: 'Active Personnel Claims', value: stats.pending_claims, color: '#8b5cf6' },
                    { label: 'Successfully Resolved', value: stats.returned_today, color: '#f97316' }
                ].map((metric, i) => (
                    <div key={i} style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: `4px solid ${metric.color}`,
                    }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{metric.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{metric.value}</div>
                    </div>
                ))}
            </div>

            {/* Analytics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '40px' }}>

                {/* Categorical Intelligence */}
                <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ borderLeft: '4px solid #6c5ce7', paddingLeft: '15px', marginBottom: '30px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Inventory Distribution</h3>
                    </div>
                    {categoryStats ? (
                        <div style={{ height: '320px' }}>
                            <Bar
                                data={{
                                    labels: Object.keys(categoryStats),
                                    datasets: [{
                                        label: 'Item Volume',
                                        data: Object.values(categoryStats),
                                        backgroundColor: chartColors,
                                        borderRadius: 4,
                                        barThickness: 24,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { color: '#64748b', font: { weight: '600' } } },
                                        x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b', font: { weight: '600' } } }
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                            Awaiting categorical data stream...
                        </div>
                    )}
                </div>

                {/* KPI Performance Chart */}
                <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderLeft: '4px solid #10b981', paddingLeft: '15px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Recovery Performance</h3>
                    </div>

                    {recoveryRate ? (
                        <div style={{ display: 'flex', alignItems: 'center', height: '320px' }}>
                            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                                <Doughnut
                                    data={{
                                        labels: ['Successfully Returned', 'Active Inventory'],
                                        datasets: [{
                                            data: [recoveryRate.returned, recoveryRate.total_found - recoveryRate.returned],
                                            backgroundColor: ['#10b981', '#f1f5f9'],
                                            borderWidth: 0,
                                            cutout: '82%'
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: '600' } } } }
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>
                                        {recoveryRate.recovery_rate_percent}%
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency</div>
                                </div>
                            </div>
                            <div style={{ width: '180px', paddingLeft: '40px', borderLeft: '1px solid #f1f5f9', marginLeft: '20px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Items Returned</div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{recoveryRate.returned}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Total Processed</div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{recoveryRate.total_found}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                            Compiling recovery statistics...
                        </div>
                    )}
                </div>
            </div>

            {/* Technical Infrastructure Status */}
            <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Infrastructure Status</h3>
                        <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Operational health and connectivity status of the REC LostLink ecosystem.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '30px' }}>
                        {[
                            { label: 'Database', state: 'OPTIMAL' },
                            { label: 'API Server', state: 'ACTIVE' },
                            { label: 'Auth Gateway', state: 'SECURE' }
                        ].map((node, i) => (
                            <div key={i} style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>{node.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '8px' }}></span>
                                    {node.state}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
