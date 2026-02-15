import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <View>
                        <Text style={styles.headerTitle}>Admin Dashboard</Text>
                        <Text style={styles.headerSubtitle}>{userInfo?.name} | Student Care</Text>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    {notifications > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>{notifications}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutIcon}>➜</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : stats ? (
                    <>
                        {/* Key Metrics Grid */}
                        <View style={styles.metricsGrid}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>LOST ITEMS</Text>
                                <Text style={styles.metricValue}>{stats.total_lost}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>FOUND ITEMS</Text>
                                <Text style={styles.metricValue}>{stats.total_found}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>PENDING</Text>
                                <Text style={[styles.metricValue, { color: COLORS.warning }]}>{stats.pending_verification}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>AVAILABLE</Text>
                                <Text style={[styles.metricValue, { color: COLORS.success }]}>{stats.available_items}</Text>
                            </View>
                        </View>

                        {/* Recent Returns Banner */}
                        <View style={[styles.card, { backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: COLORS.success }]}>
                            <Text style={styles.cardLabel}>ITEMS RETURNED TODAY</Text>
                            <Text style={[styles.largeValue, { color: COLORS.success }]}>{stats.returned_today}</Text>
                        </View>

                        {/* Management Section */}
                        <Text style={styles.sectionTitle}>Management Console</Text>

                        <TouchableOpacity
                            style={styles.navCard}
                            onPress={() => navigation.navigate('AdminFoundItems')}
                        >
                            <View style={[styles.iconBox, { backgroundColor: COLORS.lavender }]}>
                                <Text style={{ fontSize: 24 }}>📦</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Found Items</Text>
                                <Text style={styles.cardDesc}>Verify & Assign Storage</Text>
                            </View>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeTextSmall}>{stats.pending_verification}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navCard}
                            onPress={() => navigation.navigate('AdminLostItems')}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                                <Text style={{ fontSize: 24 }}>🔍</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Lost Reports</Text>
                                <Text style={styles.cardDesc}>View & Track Reports</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navCard}
                            onPress={() => navigation.navigate('AdminClaims')}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                                <Text style={{ fontSize: 24 }}>📝</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Claims</Text>
                                <Text style={styles.cardDesc}>Approve Ownership</Text>
                            </View>
                            <View style={[styles.badgeContainer, { backgroundColor: COLORS.warning }]}>
                                <Text style={styles.badgeTextSmall}>{stats.pending_claims}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Remove bottom logout as it's now in header */}
                    </>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: COLORS.primary,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    notificationBadge: {
        backgroundColor: COLORS.error,
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    logoutBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    logoutIcon: {
        color: COLORS.white,
        fontSize: 20,
    },
    scrollContent: {
        backgroundColor: '#f3f4f6', // Matching web background
        flexGrow: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
        marginTop: 10,
        paddingBottom: 40,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricBox: {
        width: '48%',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    metricLabel: {
        fontSize: 10,
        color: COLORS.textLight,
        fontWeight: 'bold',
        marginBottom: 5,
        letterSpacing: 1,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 2,
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    largeValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
    },
    navCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    cardDesc: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    badgeContainer: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    badgeTextSmall: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 50,
    }
});

export default AdminHomeScreen;
