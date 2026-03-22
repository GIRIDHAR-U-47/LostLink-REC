import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/me');
            setNotifications(res.data);

            // Mark all as read when opening the screen
            const unreadIds = res.data.filter(n => !n.read).map(n => n._id);
            if (unreadIds.length > 0) {
                await Promise.all(unreadIds.map(id => api.put(`/notifications/${id}/read`)));
            }
        } catch (error) {
            console.log('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const renderItem = ({ item }) => {
        const isBroadcast = item.type === 'SYSTEM' || item.notification_type === 'BROADCAST';
        const icon = isBroadcast ? '📢' : '✅';
        const bgColor = isBroadcast ? '#E1F5FE' : '#E8F5E9';
        const iconBg = isBroadcast ? '#03A9F4' : '#4CAF50';

        return (
            <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    <Text style={styles.iconText}>{icon}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>
                        {new Date(item.created_at || item.timestamp).toLocaleDateString()} at {new Date(item.created_at || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>❮</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Campus Alerts</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>You're all caught up! Important alerts will appear here.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F3F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        fontSize: 20,
        color: COLORS.primary,
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    unreadCard: {
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '05',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconText: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#495057',
        lineHeight: 20,
        marginBottom: 8,
    },
    time: {
        fontSize: 12,
        color: '#ADB5BD',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4444',
        marginLeft: 10,
        marginTop: 5,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6C757D',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default NotificationsScreen;
