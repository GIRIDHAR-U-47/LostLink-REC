import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import adminAPI from '../../services/adminApi';
import { COLORS } from '../../constants/theme';

const AdminProfileScreen = ({ navigation }) => {
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const [profileRes, logsRes] = await Promise.all([
                adminAPI.getAdminProfile(),
                adminAPI.getAuditLogs(20)
            ]);
            setProfile(profileRes.data);
            setLogs(logsRes.data || []);
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Admin Profile</Text>

            {profile && (
                <>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>👤</Text>
                            </View>
                        </View>

                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Name</Text>
                                <Text style={styles.value}>{profile.name}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Email</Text>
                                <Text style={styles.value}>{profile.email}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Role</Text>
                                <View style={[styles.badge, { backgroundColor: '#c8e6c9' }]}>
                                    <Text style={[styles.value, { color: '#2e7d32' }]}>{profile.role}</Text>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Register Number</Text>
                                <Text style={styles.value}>{profile.registerNumber}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => setShowLogs(!showLogs)}
                    >
                        <Text style={styles.toggleBtnText}>
                            {showLogs ? '📋 Hide Audit Logs' : '📋 Show Audit Logs'}
                        </Text>
                    </TouchableOpacity>

                    {showLogs && (
                        <View style={styles.logsSection}>
                            <Text style={styles.sectionTitle}>Recent Actions</Text>
                            {logs.length > 0 ? (
                                logs.slice(0, 20).map((log, index) => (
                                    <View key={index} style={styles.logEntry}>
                                        <View style={styles.logHeader}>
                                            <Text style={styles.action}>{log.action}</Text>
                                            <Text style={styles.timestamp}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </Text>
                                        </View>
                                        <Text style={styles.logDetail}>
                                            Target: {log.target_type} ({log.target_id})
                                        </Text>
                                        {log.details && (
                                            <Text style={styles.logDetail}>
                                                Details: {JSON.stringify(log.details)}
                                            </Text>
                                        )}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No audit logs available.</Text>
                            )}
                        </View>
                    )}
                </>
            )}
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
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        paddingTop: 10,
        marginBottom: 20,
    },
    profileCard: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
    },
    infoSection: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 15,
    },
    infoRow: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 3,
        fontWeight: '600',
    },
    value: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    toggleBtn: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    toggleBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    logsSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 12,
    },
    logEntry: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    action: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    timestamp: {
        fontSize: 11,
        color: COLORS.textLight,
    },
    logDetail: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 3,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 20,
    },
});

export default AdminProfileScreen;
