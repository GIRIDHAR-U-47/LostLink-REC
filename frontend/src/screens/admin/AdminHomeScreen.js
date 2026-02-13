import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import adminAPI from '../../services/adminApi';

const AdminHomeScreen = ({ navigation }) => {
    const { logout, userInfo } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState(0);

    useEffect(() => {
        fetchDashboardData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, notifRes] = await Promise.all([
                adminAPI.getDashboardStats(),
                adminAPI.getNotifications(true)
            ]);
            setStats(statsRes.data);
            setNotifications(notifRes.data.length);
        } catch (error) {
            console.log('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.welcomeText}>Admin Dashboard</Text>
                        <Text style={styles.subText}>{userInfo?.name} | Student Care</Text>
                    </View>
                    {notifications > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>{notifications}</Text>
                        </View>
                    )}
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : stats ? (
                <>
                    {/* Key Metrics Row 1 */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricBox, { backgroundColor: '#e3f2fd' }]}>
                            <Text style={styles.metricLabel}>Lost Items</Text>
                            <Text style={styles.metricValue}>{stats.total_lost}</Text>
                        </View>
                        <View style={[styles.metricBox, { backgroundColor: '#f3e5f5' }]}>
                            <Text style={styles.metricLabel}>Found Items</Text>
                            <Text style={styles.metricValue}>{stats.total_found}</Text>
                        </View>
                    </View>

                    {/* Key Metrics Row 2 */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricBox, { backgroundColor: '#fff3e0' }]}>
                            <Text style={styles.metricLabel}>Pending Verify</Text>
                            <Text style={[styles.metricValue, { color: '#ff9800' }]}>{stats.pending_verification}</Text>
                        </View>
                        <View style={[styles.metricBox, { backgroundColor: '#f1f8e9' }]}>
                            <Text style={styles.metricLabel}>Available</Text>
                            <Text style={[styles.metricValue, { color: '#8bc34a' }]}>{stats.available_items}</Text>
                        </View>
                    </View>

                    {/* Key Metrics Row 3 */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricBox, { backgroundColor: '#ffebee' }]}>
                            <Text style={styles.metricLabel}>High-Risk Items</Text>
                            <Text style={[styles.metricValue, { color: '#f44336' }]}>{stats.high_risk_items}</Text>
                        </View>
                        <View style={[styles.metricBox, { backgroundColor: '#e0f2f1' }]}>
                            <Text style={styles.metricLabel}>Pending Claims</Text>
                            <Text style={[styles.metricValue, { color: '#009688' }]}>{stats.pending_claims}</Text>
                        </View>
                    </View>

                    {/* Returned Today */}
                    <View style={[styles.card, { backgroundColor: '#c8e6c9' }]}>
                        <Text style={styles.cardLabel}>Items Returned Today</Text>
                        <Text style={[styles.largeValue, { color: '#2e7d32' }]}>{stats.returned_today}</Text>
                    </View>

                    {/* Action Cards */}
                    <Text style={styles.sectionTitle}>Management</Text>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: COLORS.lavender }]}
                        onPress={() => navigation.navigate('AdminFoundItems')}
                    >
                        <Text style={styles.cardTitle}>📦 Manage Found Items</Text>
                        <Text style={styles.cardDesc}>Verify physical receipt, assign storage location</Text>
                        <Text style={styles.actionBadge}>{stats.pending_verification} pending</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: COLORS.pastel }]}
                        onPress={() => navigation.navigate('AdminLostItems')}
                    >
                        <Text style={styles.cardTitle}>🔍 View Lost Reports</Text>
                        <Text style={styles.cardDesc}>Search and view all lost item reports</Text>
                        <Text style={styles.actionBadge}>{stats.total_lost} reports</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#e1f5fe' }]}
                        onPress={() => navigation.navigate('AdminClaims')}
                    >
                        <Text style={styles.cardTitle}>⚖️ Manage Claims</Text>
                        <Text style={styles.cardDesc}>Approve or reject ownership claims</Text>
                        <Text style={styles.actionBadge}>{stats.pending_claims} pending</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#f3e5f5' }]}
                        onPress={() => navigation.navigate('AdminNotifications')}
                    >
                        <Text style={styles.cardTitle}>🔔 Notifications</Text>
                        <Text style={styles.cardDesc}>View and manage system alerts</Text>
                        {notifications > 0 && <Text style={styles.actionBadge}>{notifications} new</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#ffe0b2' }]}
                        onPress={() => navigation.navigate('AdminProfile')}
                    >
                        <Text style={styles.cardTitle}>👤 Profile & Logs</Text>
                        <Text style={styles.cardDesc}>View admin details and audit logs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>🚪 Logout</Text>
                    </TouchableOpacity>
                </>
            ) : null}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: COLORS.white,
        flexGrow: 1,
    },
    header: {
        marginBottom: 20,
        marginTop: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subText: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 2,
    },
    notificationBadge: {
        backgroundColor: '#f44336',
        borderRadius: 50,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    loader: {
        marginTop: 50,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metricBox: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 6,
        alignItems: 'center',
        elevation: 2,
    },
    metricLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 5,
        textAlign: 'center',
    },
    metricValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    card: {
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5,
    },
    cardDesc: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 10,
    },
    actionBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
        paddingTop: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 15,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    largeValue: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5,
    },
    cardLabel: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 10,
    },
    logoutButton: {
        padding: 15,
        backgroundColor: '#ffcdd2',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    logoutText: {
        color: '#c62828',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default AdminHomeScreen;
