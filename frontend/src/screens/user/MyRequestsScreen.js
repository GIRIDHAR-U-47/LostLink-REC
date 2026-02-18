import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

const MyRequestsScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyRequests = async () => {
        try {
            const response = await api.get('/items/my-requests');
            setItems(response.data);
        } catch (error) {
            console.log('Error fetching my requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ffc107'; // Keep status colors standard or map to theme if desired
            case 'APPROVED': return COLORS.success;
            case 'RETURNED': return COLORS.primary; // Or a specific blue if needed
            case 'RESOLVED': return COLORS.info || '#17a2b8';
            default: return COLORS.textLight;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={[styles.type, { color: item.type === 'LOST' ? COLORS.error : COLORS.success }]}>
                    {item.type}
                </Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                </View>
            </View>

            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
            {item.imageUrl ? (
                <Image
                    source={{ uri: `http://10.234.72.182:8080/${item.imageUrl}` }} // imageUrl already contains 'static/images/filename'
                    style={styles.itemImage}
                    resizeMode="cover"
                />
            ) : null}
            <Text style={styles.description}>{item.description}</Text>
            {item.location ? <Text style={styles.location}>📍 {item.location}</Text> : null}

            {item.type === 'LOST' && (item.storage_location || item.admin_remarks) && (
                <View style={styles.adminSection}>
                    <Text style={styles.adminTitle}>Admin Updates</Text>
                    {item.storage_location && (
                        <Text style={styles.storageText}>
                            <Text style={{ fontWeight: 'bold' }}>Collection Point:</Text> {item.storage_location}
                        </Text>
                    )}
                    {item.admin_remarks && (
                        <Text style={styles.remarksText}>
                            <Text style={{ fontWeight: 'bold' }}>Note:</Text> {item.admin_remarks}
                        </Text>
                    )}
                    {item.status === 'AVAILABLE' && (
                        <Text style={styles.instructionText}>
                            Please visit the collection point mentioned above to retrieve your item.
                        </Text>
                    )}
                </View>
            )}

            {item.type === 'FOUND' && item.status === 'AVAILABLE' && (
                <View style={[styles.adminSection, { backgroundColor: '#e8f5e9', borderTopColor: '#c8e6c9' }]}>
                    <Text style={[styles.adminTitle, { color: '#2e7d32' }]}>Verified Status</Text>
                    <Text style={styles.storageText}>
                        <Text style={{ fontWeight: 'bold' }}>Status:</Text> Handed over to Admin
                    </Text>
                    {item.verified_by_name && (
                        <Text style={styles.storageText}>
                            <Text style={{ fontWeight: 'bold' }}>Received by:</Text> {item.verified_by_name}
                        </Text>
                    )}
                    <Text style={styles.instructionText}>
                        Thank you for your honesty! The item is now safe with the admin desk.
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Activity</Text>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>You haven't reported anything yet.</Text>}
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
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.primary,
        paddingTop: 50,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        alignItems: 'center',
    },
    type: {
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    category: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 5,
    },
    date: {
        color: COLORS.textLight,
        fontSize: 12,
        marginBottom: 5,
    },
    description: {
        color: COLORS.textLight, // Assuming 555 is textLight/medium gray
        marginBottom: 5,
    },
    location: {
        color: COLORS.text, // Assuming 444 is close to main text
        fontSize: 12,
    },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textLight,
    },
    adminSection: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#f8f9ff',
        padding: 10,
        borderRadius: 8,
    },
    adminTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    storageText: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 5,
    },
    remarksText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 12,
        color: COLORS.success,
        fontWeight: '600',
        marginTop: 5,
        textAlign: 'center',
        backgroundColor: '#e8f5e9',
        padding: 5,
        borderRadius: 4,
    },
});

export default MyRequestsScreen;
