import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

const FoundItemsScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        try {
            const response = await api.get('/items/found');
            setItems(response.data);
        } catch (error) {
            console.log('Error fetching found items', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
            </View>
            {item.imageUrl ? (
                <Image
                    source={{ uri: `http://10.234.72.182:8080/${item.imageUrl}` }}
                    style={styles.itemImage}
                    resizeMode="cover"
                />
            ) : null}
            <Text style={styles.location}>📍 {item.location}</Text>
            <Text style={styles.description}>{item.description}</Text>

            {/* Assuming we might want to Claim it */}
            <TouchableOpacity
                style={styles.claimButton}
                onPress={() => navigation.navigate('ClaimItem', { item })} // To be implemented
            >
                <Text style={styles.claimButtonText}>This is mine!</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Lost & Found Feed</Text>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No found items reported yet.</Text>}
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
        paddingTop: 10, // Added space above first card
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
        fontWeight: '500',
    },
    description: {
        color: COLORS.textLight,
        marginBottom: 10,
    },
    claimButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    claimButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textLight,
    },
});

export default FoundItemsScreen;
