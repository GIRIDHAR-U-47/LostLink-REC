import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView, Dimensions } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const UserHomeScreen = ({ navigation }) => {
    const { logout, userInfo } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <View>
                        <Text style={styles.headerTitle}>REC LostLink</Text>
                        <Text style={styles.headerSubtitle}>Rajalakshmi Engineering College</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutIcon}>➜</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Welcome Card */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeLabel}>Welcome back,</Text>
                    <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
                    {userInfo?.registerNumber ? (
                        <Text style={styles.userRoll}>{userInfo.registerNumber}</Text>
                    ) : null}
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>

                {/* Primary Actions Grid */}
                <View style={styles.gridContainer}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#FF4444' }]} // Red for Lost
                        onPress={() => navigation.navigate('ReportLost')}
                    >
                        <View style={styles.actionIconCircle}>
                            <Text style={styles.actionIconText}>🔍</Text>
                        </View>
                        <Text style={styles.actionTitle}>Report Lost Item</Text>
                        <Text style={styles.actionDesc}>Lost something on campus?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: '#00C851' }]} // Green for Found
                        onPress={() => navigation.navigate('ReportFound')}
                    >
                        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={styles.actionIconText}>✓</Text>
                        </View>
                        <Text style={styles.actionTitle}>Report Found Item</Text>
                        <Text style={styles.actionDesc}>Found something?</Text>
                    </TouchableOpacity>
                </View>

                {/* Secondary Actions Row */}
                <View style={styles.secondaryRow}>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => navigation.navigate('FoundItems')}
                    >
                        <Text style={styles.secondaryBtnIcon}>👁</Text>
                        <Text style={styles.secondaryBtnText}>Browse Items</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => navigation.navigate('MyRequests')}
                    >
                        <Text style={styles.secondaryBtnIcon}>📋</Text>
                        <Text style={styles.secondaryBtnText}>My Requests</Text>
                    </TouchableOpacity>
                </View>

                {/* Dashboard Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>My Lost Items</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>My Claims</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>Available Items</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.primary, // Header background matches theme
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // Added extra space above
        paddingBottom: 15,
        backgroundColor: COLORS.primary,
    },
    logoRow: {
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
    logoutBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutIcon: {
        color: COLORS.white,
        fontSize: 20,
    },

    container: {
        backgroundColor: COLORS.white,
        flexGrow: 1,
        borderTopLeftRadius: 30, // Restored curved edges
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
        marginTop: 10,
        paddingBottom: 40,
    },
    welcomeCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
    },
    welcomeLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 5,
    },
    userName: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userRoll: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        borderRadius: 15,
    },
    roleText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 15,
    },

    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionCard: {
        width: (width - 55) / 2, // responsive half width
        height: 180,
        borderRadius: 20,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    actionIconCircle: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    actionIconText: {
        fontSize: 24,
        color: COLORS.white,
    },
    actionTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    actionDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },

    secondaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    secondaryBtn: {
        width: (width - 55) / 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 15,
        borderRadius: 15,
        elevation: 1, // light shadow
    },
    secondaryBtnIcon: {
        fontSize: 18,
        color: COLORS.primary,
        marginRight: 8,
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },

    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        width: (width - 60) / 3,
        backgroundColor: COLORS.background, // Light gray/blue tint
        paddingVertical: 20,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});

export default UserHomeScreen;
