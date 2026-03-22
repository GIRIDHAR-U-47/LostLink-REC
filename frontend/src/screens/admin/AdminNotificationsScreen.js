import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import adminAPI from '../../services/adminApi';
import { COLORS } from '../../constants/theme';
import { useFocusEffect } from '@react-navigation/native';

const AdminNotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getNotifications(false);
            setNotifications(response.data || []);
        } catch (error) {
            console.log('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await adminAPI.markNotificationRead(notificationId);
            fetchNotifications();
        } catch (error) {
            console.log('Error marking as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        return null;
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => handleMarkAsRead(item.id || item._id)}
        >
            <View style={styles.notificationHeader}>

                <View style={styles.titleSection}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.date}>
                        {new Date(item.created_at).toLocaleString()}
                    </Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.type}>{item.notification_type}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Notifications</Text>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || item._id)?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        paddingTop: 10,
        marginBottom: 15,
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    unreadCard: {
        backgroundColor: '#eff7ff',
        borderColor: COLORS.primary,
        borderWidth: 1.5,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    icon: {
        fontSize: 24,
        marginRight: 10,
    },
    titleSection: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    date: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 2,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: 10,
    },
    message: {
        fontSize: 13,
        color: COLORS.text,
        marginBottom: 8,
    },
    type: {
        fontSize: 11,
        color: COLORS.primary,
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textLight,
    },
});

export default AdminNotificationsScreen;
