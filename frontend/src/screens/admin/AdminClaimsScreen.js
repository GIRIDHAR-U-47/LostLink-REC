import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, Alert, Image, ScrollView, Modal, TextInput
} from 'react-native';
import adminAPI from '../../services/adminApi';
import { COLORS } from '../../constants/theme';

const AdminClaimsScreen = ({ route, navigation }) => {
    const { itemId } = route.params || {};
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');

    const [selectedClaim, setSelectedClaim] = useState(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            let response;
            if (itemId) {
                response = await adminAPI.getClaimsForItem(itemId);
            } else {
                response = await adminAPI.getClaimsByStatus(statusFilter === 'ALL' ? '' : statusFilter);
            }
            setClaims(response.data || []);
        } catch (error) {
            console.log('Error fetching claims', error);
            Alert.alert('Error', 'Failed to load claims');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, itemId]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    const handleOpenVerify = (claim, status) => {
        setSelectedClaim(claim);
        setVerifyStatus(status);
        setShowVerifyModal(true);
    };

    const handleVerifySubmit = async () => {
        setUpdating(true);
        try {
            await adminAPI.verifyClaim(selectedClaim.id || selectedClaim._id, verifyStatus, remarks);
            Alert.alert('Success', `Claim ${verifyStatus.toLowerCase()} successfully`);
            setShowVerifyModal(false);
            setRemarks('');
            fetchClaims();
        } catch (error) {
            Alert.alert('Error', 'Failed to update claim');
        } finally {
            setUpdating(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.item?.category}</Text>
                    <Text style={styles.itemLoc}>📍 {item.item?.location}</Text>
                </View>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'APPROVED' ? '#dcfce7' :
                        item.status === 'REJECTED' ? '#fee2e2' : '#fef9c3'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'APPROVED' ? '#166534' :
                            item.status === 'REJECTED' ? '#991b1b' : '#854d0e'
                    }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.claimantInfo}>
                <Text style={styles.claimantLabel}>Claimant:</Text>
                <Text style={styles.claimantName}>{item.claimant?.name}</Text>
                <Text style={styles.claimantId}>({item.claimant?.registerNumber})</Text>
            </View>

            <Text style={styles.detailsHeader}>Reasoning/Details:</Text>
            <Text style={styles.details}>{item.verificationDetails || 'No proof provided'}</Text>

            {item.status === 'PENDING' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.miniBtn, styles.rejectBtn]}
                        onPress={() => handleOpenVerify(item, 'REJECTED')}
                    >
                        <Text style={styles.miniBtnText}>REJECT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.miniBtn, styles.approveBtn]}
                        onPress={() => handleOpenVerify(item, 'APPROVED')}
                    >
                        <Text style={styles.miniBtnText}>APPROVE</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {!itemId && (
                <View style={styles.filterBar}>
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterPill, statusFilter === status && styles.filterPillActive]}
                            onPress={() => setStatusFilter(status)}
                        >
                            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                                {status === 'ALL' ? 'Show All' : status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {itemId && (
                <View style={styles.contextHeader}>
                    <Text style={styles.contextTitle}>Claims for specific item</Text>
                    <TouchableOpacity onPress={() => navigation.setParams({ itemId: null })}>
                        <Text style={styles.clearContext}>Show All Claims</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={claims}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || item._id).toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No claims found here.</Text>}
                />
            )}

            {/* Verify Modal */}
            <Modal
                visible={showVerifyModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {verifyStatus === 'APPROVED' ? 'Approve Ownership' : 'Reject Claim'}
                        </Text>
                        <Text style={styles.modalSub}>
                            {verifyStatus === 'APPROVED'
                                ? 'This will allow the student to collect the item.'
                                : 'Please provide a reason for rejection.'}
                        </Text>

                        <TextInput
                            style={styles.remarksInput}
                            placeholder="Add internal remarks/reason..."
                            value={remarks}
                            onChangeText={setRemarks}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowVerifyModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: verifyStatus === 'APPROVED' ? COLORS.success : COLORS.error }]}
                                onPress={handleVerifySubmit}
                                disabled={updating}
                            >
                                <Text style={styles.confirmBtnText}>
                                    {updating ? 'Processing...' : `Confirm ${verifyStatus === 'APPROVED' ? 'Approval' : 'Rejection'}`}
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
    filterBar: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    filterPill: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#f1f5f9',
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    filterTextActive: {
        color: COLORS.white,
    },
    contextHeader: {
        padding: 15,
        backgroundColor: '#eff6ff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contextTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    clearContext: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    itemLoc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    claimantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    claimantLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginRight: 5,
    },
    claimantName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        marginRight: 5,
    },
    claimantId: {
        fontSize: 13,
        color: '#64748b',
    },
    detailsHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: 4,
    },
    details: {
        fontSize: 14,
        color: '#475569',
        fontStyle: 'italic',
        lineHeight: 20,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    miniBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    rejectBtn: {
        backgroundColor: '#fef2f2',
        marginRight: 10,
    },
    approveBtn: {
        backgroundColor: '#f0fdf4',
    },
    miniBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 60,
        color: '#94a3b8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
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
    remarksInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 15,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
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

export default AdminClaimsScreen;
