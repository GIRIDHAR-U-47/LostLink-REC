import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, Alert, RefreshControl, TextInput,
    Modal, ScrollView, Image
} from 'react-native';
import adminAPI from '../../services/adminApi';
import { COLORS } from '../../constants/theme';

const AdminFoundItemsScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
    });

    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [storageLocation, setStorageLocation] = useState('');
    const [remarks, setRemarks] = useState('');
    const [itemContext, setItemContext] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [receiverId, setReceiverId] = useState('');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminAPI.searchItems(searchQuery, {
                ...filters,
                item_type: 'FOUND'
            });
            setItems(response.data || []);
        } catch (error) {
            console.log('Error fetching items', error);
            Alert.alert('Error', 'Failed to load items');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
    };

    const handleOpenDetail = async (item) => {
        setSelectedItem(item);
        setStorageLocation(item.storage_location || '');
        setRemarks(item.admin_remarks || '');
        setShowDetailModal(true);

        try {
            const contextRes = await adminAPI.getItemContext(item.id || item._id);
            setItemContext(contextRes.data);
        } catch (error) {
            console.log('Error fetching context:', error);
        }
    };

    const handleAssignStorage = async () => {
        if (!storageLocation) {
            Alert.alert('Error', 'Please enter storage location');
            return;
        }
        setUpdating(true);
        try {
            await adminAPI.assignStorage(selectedItem.id || selectedItem._id, storageLocation, remarks);
            Alert.alert('Success', 'Storage assigned successfully');
            fetchItems();
            setShowDetailModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to assign storage');
        } finally {
            setUpdating(false);
        }
    };

    const handleHandoverSubmit = async () => {
        if (!receiverId) {
            Alert.alert('Error', 'Please enter Receiver ID');
            return;
        }
        setUpdating(true);
        try {
            await adminAPI.handoverItem(selectedItem.id || selectedItem._id, {
                student_id: receiverId,
                admin_name: 'Admin (Mobile)',
                remarks: 'Handed over via mobile app'
            });
            Alert.alert('Success', 'Handover recorded');
            setReceiverId('');
            setShowHandoverModal(false);
            setShowDetailModal(false);
            fetchItems();
        } catch (error) {
            Alert.alert('Error', 'Handover failed');
        } finally {
            setUpdating(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleOpenDetail(item)}>
            <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>
            </View>
            <View style={styles.statusRow}>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'AVAILABLE' ? '#dcfce7' :
                        item.status === 'PENDING' ? '#fef9c3' : '#fee2e2'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'AVAILABLE' ? '#166534' :
                            item.status === 'PENDING' ? '#854d0e' : '#991b1b'
                    }]}>{item.status || 'PENDING'}</Text>
                </View>
                {item.storage_location && (
                    <Text style={styles.storageLabel}>📍 {item.storage_location}</Text>
                )}
            </View>
            <Text style={styles.location}>Found at: {item.location}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.reporter}>By: {item.user?.name || 'Anonymous'}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search found items..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
                    <Text style={styles.filterBtnText}>{showFilters ? '✕' : 'Filters'}</Text>
                </TouchableOpacity>
            </View>

            {/* Filters Section */}
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                        {['', 'PENDING', 'AVAILABLE', 'RETURNED'].map(stat => (
                            <TouchableOpacity
                                key={stat}
                                style={[styles.pill, filters.status === stat && styles.pillActive, { backgroundColor: '#f1f5f9' }]}
                                onPress={() => setFilters({ ...filters, status: stat })}
                            >
                                <Text style={[styles.pillText, filters.status === stat && styles.pillTextActive]}>
                                    {stat || 'All Statuses'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || item._id).toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No found items matching criteria.</Text>}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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
                            <Text style={styles.modalTitle}>Manage Discovery</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedItem && (
                                <>
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>ITEM INFO</Text>
                                        <Text style={styles.detailMain}>{selectedItem.category}</Text>
                                        <Text style={styles.detailSub}>{selectedItem.description}</Text>
                                        <Text style={styles.detailSub}>📍 {selectedItem.location}</Text>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionLabel}>ADMIN CONTROL</Text>
                                        <Text style={styles.inputLabel}>Storage Slot</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder="Room / Box / Rack"
                                            value={storageLocation}
                                            onChangeText={setStorageLocation}
                                        />
                                        <Text style={styles.inputLabel}>Internal Remarks</Text>
                                        <TextInput
                                            style={[styles.modalInput, { height: 60 }]}
                                            placeholder="Any notes for staff..."
                                            value={remarks}
                                            onChangeText={setRemarks}
                                            multiline
                                        />
                                        <TouchableOpacity
                                            style={styles.saveBtn}
                                            onPress={handleAssignStorage}
                                            disabled={updating}
                                        >
                                            <Text style={styles.saveBtnText}>{updating ? 'SAVING...' : 'UPDATE & VERIFY'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {itemContext?.claims?.length > 0 && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.sectionLabel}>ACTIVE CLAIMS ({itemContext.claims.length})</Text>
                                            {itemContext.claims.map(claim => (
                                                <View key={claim.id} style={styles.claimMini}>
                                                    <Text style={styles.claimantName}>{claim.claimant?.name}</Text>
                                                    <Text style={styles.claimStatus}>{claim.status}</Text>
                                                </View>
                                            ))}
                                            <TouchableOpacity
                                                style={styles.viewClaimsBtn}
                                                onPress={() => {
                                                    setShowDetailModal(false);
                                                    navigation.navigate('AdminClaims', { itemId: selectedItem.id });
                                                }}
                                            >
                                                <Text style={styles.viewClaimsText}>Review All Claims</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View style={styles.actionSection}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
                                            onPress={() => setShowHandoverModal(true)}
                                        >
                                            <Text style={styles.actionBtnText}>🤝 Record Handover</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Handover Modal */}
            <Modal
                visible={showHandoverModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentSmall}>
                        <Text style={styles.modalTitle}>Confirm Handover</Text>
                        <Text style={styles.modalSub}>Verify the student's ID and enter their Register Number.</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Student Register No (e.g. 211201...)"
                            value={receiverId}
                            onChangeText={setReceiverId}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowHandoverModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: COLORS.success }]}
                                onPress={handleHandoverSubmit}
                                disabled={updating}
                            >
                                <Text style={styles.confirmBtnText}>
                                    {updating ? 'Processing...' : 'Confirm Delivery'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        padding: 15,
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
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    storageLabel: {
        fontSize: 12,
        color: '#0f172a',
        fontWeight: '600',
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
        height: '85%',
        paddingBottom: 20,
    },
    modalContentSmall: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        width: '90%',
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        padding: 24,
        elevation: 10,
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
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
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
        marginBottom: 10,
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
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginTop: 15,
        marginBottom: 5,
    },
    modalInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    claimMini: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    claimantName: {
        fontWeight: '600',
        color: '#1e293b',
    },
    claimStatus: {
        color: COLORS.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    viewClaimsBtn: {
        marginTop: 10,
        alignItems: 'center',
    },
    viewClaimsText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    actionSection: {
        marginTop: 10,
        paddingBottom: 40,
    },
    actionBtn: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    actionBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 18,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
    },
    cancelBtn: {
        padding: 12,
        marginRight: 10,
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: 'bold',
    },
    confirmBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    confirmBtnText: {
        color: COLORS.white,
        fontWeight: 'bold',
    }
});

export default AdminFoundItemsScreen;
