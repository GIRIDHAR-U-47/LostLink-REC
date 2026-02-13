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
});

export default MyRequestsScreen;
