import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import adminService from '../services/adminService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [categoryStats, setCategoryStats] = useState(null);
    const [recoveryRate, setRecoveryRate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch main stats
            const statsRes = await adminService.getDashboardStats();
            setStats(statsRes.data);

            // Fetch category stats
            try {
                const categoryRes = await adminService.getCategoryStats();
                setCategoryStats(categoryRes.data);
            } catch (e) {
                console.log('Category stats not available');
            }

            // Fetch recovery rate
            try {
                const recoveryRes = await adminService.getRecoveryRate();
                setRecoveryRate(recoveryRes.data);
            } catch (e) {
                console.log('Recovery rate not available');
            }

            setLoading(false);
        } catch (error) {
            console.log('Error fetching stats:', error);
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (!stats) return <div className="loading">Failed to load stats</div>;

    return (
        <div>
            <h1>Dashboard</h1>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-box">
                    <div className="metric-value">{stats.total_lost}</div>
                    <div className="metric-label">Total Lost Items</div>
                </div>

                <div className="metric-box">
                    <div className="metric-value">{stats.total_found}</div>
                    <div className="metric-label">Total Found Items</div>
                </div>

                <div className="metric-box">
                    <div className="metric-value">{stats.pending_verification}</div>
                    <div className="metric-label">Pending Verification</div>
                </div>

                <div className="metric-box">
                    <div className="metric-value">{stats.available_items}</div>
                    <div className="metric-label">Available Items</div>
                </div>

                <div className="metric-box">
                    <div className="metric-value">{stats.high_risk_items}</div>
                    <div className="metric-label">High-Risk Items</div>
                </div>

                <div className="metric-box">
                    <div className="metric-value">{stats.pending_claims}</div>
                    <div className="metric-label">Pending Claims</div>
                </div>

                <div className="metric-box">
                    <div className="metric-value">{stats.returned_today}</div>
                    <div className="metric-label">Returned Today</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="metric-card">
                <h2>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                    <button className="btn btn-success" style={{ width: '100%' }}>
                        Verify Found Items ({stats.pending_verification})
                    </button>
                    <button className="btn" style={{ width: '100%' }}>
                        Review Claims ({stats.pending_claims})
                    </button>
                    <button className="btn btn-danger" style={{ width: '100%' }}>
                        Check High-Risk Items ({stats.high_risk_items})
                    </button>
                </div>
            </div>

            {/* Analytics Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {/* Items by Category Chart */}
                {categoryStats && (
                    <div className="metric-card">
                        <h2>Items by Category</h2>
                        <Bar
                            data={{
                                labels: Object.keys(categoryStats),
                                datasets: [{
                                    label: 'Item Count',
                                    data: Object.values(categoryStats),
                                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1
                                }]
                            }}
                            options={{
                                responsive: true,
                                indexAxis: 'y',
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                },
                                scales: {
                                    x: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                )}

                {/* Recovery Rate Chart */}
                {recoveryRate && (
                    <div className="metric-card">
                        <h2>Recovery Rate</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <Doughnut
                                    data={{
                                        labels: ['Returned', 'Not Returned'],
                                        datasets: [{
                                            data: [
                                                recoveryRate.returned || 0,
                                                (recoveryRate.total_found - recoveryRate.returned) || 0
                                            ],
                                            backgroundColor: [
                                                'rgba(76, 175, 80, 0.8)',
                                                'rgba(244, 67, 54, 0.8)'
                                            ],
                                            borderColor: [
                                                'rgba(76, 175, 80, 1)',
                                                'rgba(244, 67, 54, 1)'
                                            ],
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom'
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Recovery Rate:</strong>
                                </p>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', margin: '5px 0' }}>
                                    {recoveryRate.recovery_rate_percent}%
                                </p>
                                <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                                    {recoveryRate.returned} of {recoveryRate.total_found} items
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* System Status */}
            <div className="metric-card">
                <h2>System Status</h2>
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Database</strong></td>
                            <td><span className="badge badge-approved">Connected</span></td>
                        </tr>
                        <tr>
                            <td><strong>API Server</strong></td>
                            <td><span className="badge badge-approved">Running</span></td>
                        </tr>
                        <tr>
                            <td><strong>Storage</strong></td>
                            <td><span className="badge badge-approved">Available</span></td>
                        </tr>
                        {stats._debug && (
                            <tr>
                                <td><strong>DB Claims Count</strong></td>
                                <td><span className="badge badge-pending">{stats._debug.total_claims_in_db}</span></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
