import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

const AdminFoundItemsScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchItems = async () => {
        try {
            // For Admin, we might want to see ALL found items or just PENDING ones. 
            // The backend /items/found endpoint currently returns PENDING.
            // We might need a specific admin endpoint to see all statuses, but let's use the found one for now
            // knowing admins can update PENDING items.
            const response = await api.get('/items/found');
            setItems(response.data);
        } catch (error) {
            console.log('Error fetching items', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleVerify = async (itemId) => {
        try {
            await api.put(`/items/${itemId}/status`, null, { params: { status: 'APPROVED' } });
            Alert.alert('Success', 'Item verified and marked as APPROVED');
            fetchItems(); // Refresh
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.location}>Submitted from: {item.location}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.reporter}>Reported by: {item.user?.name} ({item.user?.registerNumber})</Text>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.button, styles.verifyButton]}
                    onPress={() => handleVerify(item.id)}
                >
                    <Text style={styles.buttonText}>Confirm Receipt</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pending items to verify.</Text>}
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
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: COLORS.background,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    category: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    date: {
        color: COLORS.textLight,
        fontSize: 12,
    },
    location: {
        color: COLORS.text,
        marginBottom: 5,
    },
    description: {
        color: COLORS.textLight,
        marginBottom: 10,
    },
    reporter: {
        fontStyle: 'italic',
        color: COLORS.secondary || '#666',
        marginBottom: 10,
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    verifyButton: {
        backgroundColor: COLORS.success,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textLight,
    },
});

export default AdminFoundItemsScreen;
