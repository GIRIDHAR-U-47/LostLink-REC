import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Image } from 'react-native';
import adminAPI from '../../services/adminApi';
import { COLORS } from '../../constants/theme';

const AdminLostItemsScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        searchItems();
    }, []);

    const searchItems = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.searchItems(searchQuery, {
                ...filters,
                item_type: 'LOST'
            });
            setItems(response.data || []);
        } catch (error) {
            console.log('Error searching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.category}>{item.category}</Text>
                    <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#ffcdd2' }]}>
                    <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
                </View>
            </View>

            {item.imageUrl && (
                <Image
                    source={{ uri: `http://10.234.72.182:8080/${item.imageUrl}` }}
                    style={styles.itemImage}
                    resizeMode="cover"
                />
            )}

            <Text style={styles.location}>Location: {item.location}</Text>
            <Text style={styles.description}>{item.description}</Text>
            {item.user && (
                <Text style={styles.reporter}>Reported by: {item.user.name}</Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Lost Item Reports</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={searchItems}
                />
                <TouchableOpacity onPress={searchItems} style={styles.searchBtn}>
                    <Text style={styles.searchBtnText}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    style={styles.filterBtn}
                >
                    <Text style={styles.searchBtnText}>Filter</Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={styles.filterSection}>
                    <TextInput
                        style={styles.filterInput}
                        placeholder="Category (e.g., DEVICES)"
                        value={filters.category}
                        onChangeText={(text) => setFilters({ ...filters, category: text })}
                    />
                    <TextInput
                        style={styles.filterInput}
                        placeholder="Status (e.g., PENDING)"
                        value={filters.status}
                        onChangeText={(text) => setFilters({ ...filters, status: text })}
                    />
                    <TouchableOpacity style={styles.applyFilterBtn} onPress={searchItems}>
                        <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No lost items found.</Text>}
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
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    searchBtn: {
        padding: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        marginRight: 5,
    },
    filterBtn: {
        padding: 10,
        backgroundColor: COLORS.secondary || '#666',
        borderRadius: 8,
    },
    searchBtnText: {
        color: COLORS.white,
        fontSize: 16,
    },
    filterSection: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    filterInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
        fontSize: 12,
    },
    applyFilterBtn: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    applyFilterBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    category: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    date: {
        color: COLORS.textLight,
        fontSize: 11,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: COLORS.text,
        fontSize: 11,
        fontWeight: 'bold',
    },
    itemImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    location: {
        color: COLORS.text,
        marginBottom: 5,
        fontSize: 13,
    },
    description: {
        color: COLORS.textLight,
        marginBottom: 8,
        fontSize: 12,
    },
    reporter: {
        fontStyle: 'italic',
        color: COLORS.secondary || '#666',
        fontSize: 11,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textLight,
    },
});

export default AdminLostItemsScreen;
