import React, { useEffect, useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import adminService from '../services/adminService';
import { formatDateTime, formatTime, getRelativeTime } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [categoryStats, setCategoryStats] = useState(null);
    const [recoveryRate, setRecoveryRate] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Advanced Analytics
    const [trends, setTrends] = useState(null);
    const [bottlenecks, setBottlenecks] = useState(null);
    const [categoryPerf, setCategoryPerf] = useState(null);
    const [analyticsTab, setAnalyticsTab] = useState('overview');
    const [trendDays, setTrendDays] = useState(14);

    const fetchStats = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        try {
            const statsRes = await adminService.getDashboardStats();
            setStats(statsRes.data);

            try { const categoryRes = await adminService.getCategoryStats(); setCategoryStats(categoryRes.data); } catch (e) { console.error(e); }
            try { const recoveryRes = await adminService.getRecoveryRate(); setRecoveryRate(recoveryRes.data); } catch (e) { console.error(e); }
            try { const logsRes = await adminService.getAuditLogs(5); setRecentLogs(logsRes.data); } catch (e) { console.error(e); }
            try { const trendsRes = await adminService.getAnalyticsTrends(trendDays); setTrends(trendsRes.data); } catch (e) { console.error(e); }
            try { const bottRes = await adminService.getBottleneckAnalysis(); setBottlenecks(bottRes.data); } catch (e) { console.error(e); }
            try { const catPerfRes = await adminService.getCategoryPerformance(); setCategoryPerf(catPerfRes.data); } catch (e) { console.error(e); }
        } catch (error) {
            console.error('Dashboard stats fetch failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [trendDays]);

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
            <p style={{ color: '#636e72' }}>Unable to reach the server.</p>
            <button onClick={() => fetchStats()} style={{ backgroundColor: '#6c5ce7', color: 'white', marginTop: '20px', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: '600' }}>Retry</button>
        </div>
    );

    const chartColors = ['#6c5ce7', '#a29bfe', '#00cec9', '#00b894', '#fd79a8', '#fab1a0', '#ffeaa7', '#74b9ff'];

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'HIGH': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '🔴' };
            case 'MEDIUM': return { bg: '#fff7ed', border: '#f97316', text: '#9a3412', icon: '🟡' };
            case 'LOW': return { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '🟢' };
            default: return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', icon: '⚪' };
        }
    };

    /* KPI definitions with tooltips — uses backend stats API values */
    const kpiMetrics = [
        { label: 'Pending Items', value: stats.pending_verification ?? 0, color: '#f59e0b', tooltip: 'Items awaiting admin verification before they become available' },
        { label: 'Available Items', value: stats.available_items ?? 0, color: '#3b82f6', tooltip: 'Verified items ready for claim by owners' },
        { label: 'Returned Items', value: stats.total_resolved ?? 0, color: '#10b981', tooltip: 'Items successfully returned to their owners' },
        { label: 'Lost Reports', value: stats.total_lost ?? 0, color: '#ef4444', tooltip: 'Total lost-item reports filed by students' },
        { label: 'Found Items', value: stats.total_found ?? 0, color: '#8b5cf6', tooltip: 'Total found-item entries in the system' },
        { label: 'Pending Claims', value: stats.pending_claims ?? 0, color: '#f97316', tooltip: 'Claims awaiting admin verification' },
        ...(bottlenecks ? [
            { label: 'Avg Resolution', value: `${bottlenecks.resolution_time?.avg_hours || 0}h`, color: '#0ea5e9', tooltip: 'Average time from item found to item returned' },
            { label: 'Avg Claim Processing', value: `${bottlenecks.claim_processing_time?.avg_hours || 0}h`, color: '#14b8a6', tooltip: 'Average time to process a claim request' },
        ] : [])
    ];

    return (
        <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e293b', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Administrative Overview</h1>
                    <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '15px' }}>Centralized management & intelligence for REC Campus.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <button onClick={() => fetchStats(true)} disabled={refreshing}
                        style={{ padding: '10px 24px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: refreshing ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: '600', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {refreshing ? 'REFRESHING...' : '↻ SYNC DATA'}
                    </button>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Auto-sync: 60s</div>
                </div>
            </div>

            {/* Bottleneck Alerts */}
            {bottlenecks?.bottleneck_alerts?.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    {bottlenecks.bottleneck_alerts.map((alert, i) => {
                        const style = getSeverityStyle(alert.severity);
                        return (
                            <div key={i} style={{
                                padding: '12px 20px', borderRadius: '12px', background: style.bg,
                                border: `1px solid ${style.border}30`, display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: '240px'
                            }}>
                                <span style={{ fontSize: '16px' }}>{style.icon}</span>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: style.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{alert.type.replace(/_/g, ' ')}</div>
                                    <div style={{ fontSize: '13px', color: style.text, fontWeight: '600' }}>{alert.message}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* KPI Grid — with tooltips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '32px' }}>
                {kpiMetrics.map((metric, i) => (
                    <div key={i} title={metric.tooltip}
                        style={{
                            backgroundColor: 'white', padding: '20px', borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${metric.color}`,
                            cursor: 'default', transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {metric.label}
                            <span style={{ fontSize: '12px', color: '#94a3b8', cursor: 'help' }} title={metric.tooltip}>ⓘ</span>
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b' }}>{metric.value}</div>
                    </div>
                ))}
            </div>

            {/* Analytics Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                    { key: 'overview', label: '📊 Overview' },
                    { key: 'trends', label: '📈 Trends' },
                    { key: 'bottlenecks', label: '🔍 Bottlenecks' },
                    { key: 'categories', label: '📦 Category Performance' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setAnalyticsTab(tab.key)}
                        style={{
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                            background: analyticsTab === tab.key ? '#6c5ce7' : '#fff',
                            color: analyticsTab === tab.key ? '#fff' : '#475569',
                            border: `1px solid ${analyticsTab === tab.key ? '#6c5ce7' : '#e2e8f0'}`
                        }}>{tab.label}</button>
                ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {analyticsTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {/* Category Bar Chart */}
                    <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ borderLeft: '4px solid #6c5ce7', paddingLeft: '15px', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Distribution</h3>
                        </div>
                        {categoryStats ? (
                            <div style={{ height: '300px' }}>
                                <Bar data={{ labels: Object.keys(categoryStats), datasets: [{ label: 'Items', data: Object.values(categoryStats), backgroundColor: chartColors, borderRadius: 4, barThickness: 24 }] }}
                                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' }, border: { display: false } }, x: { grid: { display: false }, border: { display: false } } } }} />
                            </div>
                        ) : <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading...</div>}
                    </div>

                    {/* Recovery Rate Doughnut */}
                    <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '15px', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recovery Performance</h3>
                        </div>
                        {recoveryRate ? (
                            <div style={{ display: 'flex', alignItems: 'center', height: '300px' }}>
                                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                                    <Doughnut data={{ labels: ['Returned', 'Active'], datasets: [{ data: [recoveryRate.returned, recoveryRate.total_found - recoveryRate.returned], backgroundColor: ['#10b981', '#f1f5f9'], borderWidth: 0, cutout: '82%' }] }}
                                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: '600' } } } } }} />
                                    <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{recoveryRate.recovery_rate_percent}%</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Rate</div>
                                    </div>
                                </div>
                                <div style={{ width: '160px', paddingLeft: '30px', borderLeft: '1px solid #f1f5f9', marginLeft: '20px' }}>
                                    <div style={{ marginBottom: '20px' }}><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Returned</div><div style={{ fontSize: '20px', fontWeight: '700' }}>{recoveryRate.returned}</div></div>
                                    <div><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Total Found</div><div style={{ fontSize: '20px', fontWeight: '700' }}>{recoveryRate.total_found}</div></div>
                                </div>
                            </div>
                        ) : <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading...</div>}
                    </div>
                </div>
            )}

            {/* ===== TRENDS TAB ===== */}
            {analyticsTab === 'trends' && (
                <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Period:</span>
                        {[7, 14, 30].map(d => (
                            <button key={d} onClick={() => setTrendDays(d)}
                                style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: trendDays === d ? '#6c5ce7' : '#fff', color: trendDays === d ? '#fff' : '#475569', border: `1px solid ${trendDays === d ? '#6c5ce7' : '#e2e8f0'}` }}>
                                {d} days
                            </button>
                        ))}
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '15px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', borderLeft: '4px solid #6c5ce7', paddingLeft: '12px' }}>Daily Activity Trends</h3>
                        {trends && trends.length > 0 ? (
                            <div style={{ height: '350px' }}>
                                <Line data={{
                                    labels: trends.map(t => formatDate(t.date)),
                                    datasets: [
                                        { label: 'Lost Reports', data: trends.map(t => t.lost), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3, pointRadius: 3 },
                                        { label: 'Found Items', data: trends.map(t => t.found), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3, pointRadius: 3 },
                                        { label: 'Resolved', data: trends.map(t => t.resolved), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3, pointRadius: 3 },
                                        { label: 'Claims', data: trends.map(t => t.claims), borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.3, pointRadius: 3 },
                                    ]
                                }} options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { position: 'top', labels: { usePointStyle: true, font: { weight: '600', size: 11 } } } },
                                    scales: { y: { grid: { color: '#f1f5f9' }, border: { display: false }, beginAtZero: true }, x: { grid: { display: false }, border: { display: false } } }
                                }} />
                            </div>
                        ) : <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No trend data available</div>}
                    </div>
                </div>
            )}

            {/* ===== BOTTLENECKS TAB ===== */}
            {analyticsTab === 'bottlenecks' && bottlenecks && (
                <div>
                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                        {[
                            { label: 'Avg Resolution Time', value: `${bottlenecks.resolution_time?.avg_hours || 0}h`, sub: `${bottlenecks.resolution_time?.sample_size || 0} items`, color: '#0ea5e9' },
                            { label: 'Avg Claim Processing', value: `${bottlenecks.claim_processing_time?.avg_hours || 0}h`, sub: `${bottlenecks.claim_processing_time?.sample_size || 0} claims`, color: '#8b5cf6' },
                            { label: 'Stale Available Items', value: bottlenecks.stale_available_items, sub: '>7 days, no claims', color: bottlenecks.stale_available_items > 0 ? '#f59e0b' : '#10b981' },
                            { label: 'Overdue Claims', value: bottlenecks.overdue_pending_claims, sub: 'Pending > 24h', color: bottlenecks.overdue_pending_claims > 0 ? '#ef4444' : '#10b981' },
                            { label: 'Unverified Items', value: bottlenecks.unverified_items, sub: 'Awaiting review', color: bottlenecks.unverified_items > 0 ? '#f59e0b' : '#10b981' },
                        ].map((m, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', borderLeft: `4px solid ${m.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{m.label}</div>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{m.value}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{m.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Category Bottleneck Table */}
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e293b' }}>Category Resolution Performance</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Sorted by slowest resolution rate (bottlenecks first)</p>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Pending</th>
                                        <th>Total</th>
                                        <th>Resolved</th>
                                        <th>Resolution Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bottlenecks.category_performance?.length > 0 ? bottlenecks.category_performance.map((cat, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: '600' }}>{cat.category}</td>
                                            <td><span style={{ color: cat.pending_items > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>{cat.pending_items}</span></td>
                                            <td>{cat.total_items}</td>
                                            <td>{cat.resolved_items}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#f1f5f9', overflow: 'hidden', maxWidth: '100px' }}>
                                                        <div style={{ width: `${cat.resolution_rate}%`, height: '100%', borderRadius: '3px', background: cat.resolution_rate > 50 ? '#10b981' : cat.resolution_rate > 20 ? '#f59e0b' : '#ef4444' }}></div>
                                                    </div>
                                                    <span style={{ fontWeight: '700', fontSize: '13px', color: cat.resolution_rate > 50 ? '#10b981' : cat.resolution_rate > 20 ? '#f59e0b' : '#ef4444' }}>{cat.resolution_rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No category data available</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CATEGORY PERFORMANCE TAB ===== */}
            {analyticsTab === 'categories' && categoryPerf && (
                <div>
                    {categoryPerf.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {categoryPerf.map((cat, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{cat.category}</h4>
                                        <span style={{
                                            fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px',
                                            background: cat.recovery_rate > 50 ? '#f0fdf4' : cat.recovery_rate > 20 ? '#fefce8' : '#fef2f2',
                                            color: cat.recovery_rate > 50 ? '#166534' : cat.recovery_rate > 20 ? '#854d0e' : '#991b1b'
                                        }}>{cat.recovery_rate}% recovery</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                        <div style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', background: '#fef2f2' }}>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{cat.total_lost}</div>
                                            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: '#ef4444' }}>Lost</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', background: '#f0fdf4' }}>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{cat.total_found}</div>
                                            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: '#10b981' }}>Found</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', background: '#f5f3ff' }}>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#6d28d9' }}>{cat.returned}</div>
                                            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: '#6d28d9' }}>Returned</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                        <div><strong>{cat.total_claims}</strong> claims ({cat.approval_rate}% approved)</div>
                                        <div><strong>{cat.pending}</strong> pending</div>
                                    </div>
                                    {(cat.recent_7d?.lost > 0 || cat.recent_7d?.found > 0) && (
                                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                                            <span>7d: 📉 {cat.recent_7d.lost} lost</span>
                                            <span>📈 {cat.recent_7d.found} found</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', color: '#94a3b8' }}>No category performance data available.</div>
                    )}
                </div>
            )}

            {/* Recent Activity Feed — uses dayjs for timestamps, tracking ID instead of raw _id */}
            {analyticsTab === 'overview' && (
                <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderLeft: '4px solid #ef4444', paddingLeft: '15px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Real-time Audit Stream</h3>
                        <a href="/logs" style={{ fontSize: '12px', color: '#6c5ce7', fontWeight: '700', textDecoration: 'none', textTransform: 'uppercase' }}>View All →</a>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9', fontSize: '13px', fontWeight: '800' }}>
                                        {log.admin_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                                            {log.admin_name || 'System'} <span style={{ fontWeight: '400', color: '#64748b' }}>—</span> {log.action?.replace(/_/g, ' ') || 'ACTION'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                            {formatDateTime(log.timestamp)} • {log.target_type}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                    {log.target_id ? log.target_id.slice(-6).toUpperCase() : 'N/A'}
                                </div>
                            </div>
                        )) : <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No recent activities</div>}
                    </div>
                </div>
            )}

            {/* Infrastructure Status */}
            {analyticsTab === 'overview' && (
                <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Infrastructure Status</h3>
                            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '12px' }}>System health of the REC LostLink platform.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            {[{ label: 'Database', state: 'OPTIMAL' }, { label: 'API Server', state: 'ACTIVE' }, { label: 'Auth Gateway', state: 'SECURE' }].map((node, i) => (
                                <div key={i} style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>{node.label}</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '8px' }}></span>{node.state}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper used for trend chart labels — short date format
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default Dashboard;
