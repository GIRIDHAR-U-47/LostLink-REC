import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, TextInput, Image, Modal, ScrollView, Alert
} from 'react-native';
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
    });

    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [itemContext, setItemContext] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [adminRemarks, setAdminRemarks] = useState('');

    const searchItems = useCallback(async () => {
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
    }, [searchQuery, filters]);

    useEffect(() => {
        searchItems();
    }, [searchItems]);

    const handleOpenDetail = async (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
        setItemContext(null);
        setAdminRemarks(item.admin_remarks || '');

        try {
            const contextRes = await adminAPI.getItemContext(item.id || item._id);
            setItemContext(contextRes.data);
        } catch (error) {
            console.log('Error fetching context:', error);
        }
    };

    const handleLinkItem = async (foundItemId) => {
        setUpdating(true);
        try {
            await adminAPI.linkItems(foundItemId, selectedItem.id || selectedItem._id);
            Alert.alert('Success', 'Reports linked successfully');
            // Refresh context
            const contextRes = await adminAPI.getItemContext(selectedItem.id || selectedItem._id);
            setItemContext(contextRes.data);
            searchItems();
        } catch (error) {
            Alert.alert('Error', 'Failed to link items');
        } finally {
            setUpdating(false);
        }
    };

    const handleNotifyOwner = async () => {
        setUpdating(true);
        try {
            await adminAPI.notifyOwner(selectedItem.id || selectedItem._id, adminRemarks);
            Alert.alert('Success', 'Owner notified successfully');
            searchItems();
            setShowDetailModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to notify owner');
        } finally {
            setUpdating(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleOpenDetail(item)}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.category}>{item.category}</Text>
                    <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'HANDED_OVER' ? '#dcfce7' : '#fee2e2'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'HANDED_OVER' ? '#166534' : '#991b1b'
                    }]}>{item.status || 'PENDING'}</Text>
                </View>
            </View>

            <Text style={styles.location}>📍 {item.location}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            {item.user && (
                <Text style={styles.reporter}>Reported by: {item.user.name}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search lost reports..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
                    <Text style={styles.filterBtnText}>{showFilters ? '✕' : 'Filters'}</Text>
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={styles.filterBox}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['', 'DEVICES', 'DOCUMENTS', 'ACCESSORIES', 'KEYS', 'JEWELLERY', 'BOOKS'].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.pill, filters.category === cat && styles.pillActive]}
                                onPress={() => setFilters({ ...filters, category: cat })}
                            >
                                <Text style={[styles.pillText, filters.category === cat && styles.pillTextActive]}>
                                    {cat || 'All Categories'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || item._id).toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No lost reports found.</Text>}
                />
            )}

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Lost Report Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedItem && (
                                <>
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>REPORT INFO</Text>
                                        <Text style={styles.detailMain}>{selectedItem.category}</Text>
                                        <Text style={styles.detailSub}>{selectedItem.description}</Text>
                                        <Text style={styles.detailSub}>📍 Reported at: {selectedItem.location}</Text>
                                        <Text style={[styles.detailSub, { fontStyle: 'italic' }]}>
                                            Owner: {selectedItem.user?.name} ({selectedItem.user?.registerNumber})
                                        </Text>
                                    </View>

                                    {itemContext?.linked_item ? (
                                        <View style={[styles.detailSection, styles.matchSection]}>
                                            <Text style={styles.sectionLabel}>LINKED FOUND ITEM ✅</Text>
                                            <View style={styles.matchCard}>
                                                <Text style={styles.matchTitle}>{itemContext.linked_item.category}</Text>
                                                <Text style={styles.matchDesc}>{itemContext.linked_item.description}</Text>
                                                <Text style={styles.matchLoc}>Storage: {itemContext.linked_item.storage_location || 'Pending'}</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.sectionLabel}>CONTEXTUAL MATCHES</Text>
                                            {itemContext?.potential_matches?.length > 0 ? (
                                                itemContext.potential_matches.map(match => (
                                                    <View key={match.id} style={styles.matchCardPlaceholder}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.matchTitleSmall}>{match.category}</Text>
                                                            <Text style={styles.matchLocSmall}>{match.location}</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.linkBtn}
                                                            onPress={() => handleLinkItem(match.id)}
                                                            disabled={updating}
                                                        >
                                                            <Text style={styles.linkBtnText}>LINK</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noMatchText}>No matching found items detected yet.</Text>
                                            )}
                                        </View>
                                    )}

                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>ADMIN REMARKS (NOTIFIED TO OWNER)</Text>
                                        <TextInput
                                            style={styles.remarksInput}
                                            placeholder="Add notes for the owner (e.g. 'Found at Canteen, please collect')"
                                            multiline
                                            value={adminRemarks}
                                            onChangeText={setAdminRemarks}
                                        />
                                    </View>

                                    <View style={styles.actionSection}>
                                        {selectedItem.status !== 'HANDED_OVER' && selectedItem.status !== 'AVAILABLE' && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: COLORS.success, marginBottom: 12 }]}
                                                onPress={handleNotifyOwner}
                                                disabled={updating}
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    {updating ? 'Sending...' : '🔔 Notify Owner (Found Match)'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                            onPress={() => {
                                                setShowDetailModal(false);
                                                navigation.navigate('AdminFoundItems', { search: selectedItem.category });
                                            }}
                                        >
                                            <Text style={styles.actionBtnText}>🔍 Search Global Found Items</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    searchRow: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: COLORS.white,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
    },
    filterBtn: {
        marginLeft: 10,
        padding: 10,
    },
    filterBtnText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    filterBox: {
        padding: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    pill: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    pillText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    pillTextActive: {
        color: COLORS.white,
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    category: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    date: {
        color: '#64748b',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    location: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 5,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 10,
    },
    reporter: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#94a3b8',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeBtn: {
        fontSize: 20,
        color: '#64748b',
    },
    modalBody: {
        padding: 20,
    },
    detailSection: {
        marginBottom: 25,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 12,
    },
    detailMain: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    detailSub: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 5,
    },
    matchSection: {
        backgroundColor: '#f0fdf4',
        padding: 15,
        borderRadius: 16,
    },
    matchCard: {
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#166534',
    },
    matchDesc: {
        fontSize: 14,
        color: '#3f6212',
        marginTop: 4,
    },
    matchLoc: {
        fontSize: 12,
        color: '#166534',
        fontWeight: 'bold',
        marginTop: 8,
    },
    matchCardPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    matchTitleSmall: {
        fontWeight: 'bold',
        color: '#1e293b',
    },
    matchLocSmall: {
        fontSize: 12,
        color: '#64748b',
    },
    linkBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    linkBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    noMatchText: {
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    actionSection: {
        marginTop: 10,
        paddingBottom: 30,
    },
    actionBtn: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    actionBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    remarksInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
        fontSize: 14,
        color: '#1e293b',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    }
});

export default AdminLostItemsScreen;
