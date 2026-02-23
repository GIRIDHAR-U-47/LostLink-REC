import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
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
            console.log('Error fetching activity feed', error);
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

    const [expandedItems, setExpandedItems] = useState({});

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderItem = ({ item }) => {
        const itemId = item.id || item._id;
        const isExpanded = expandedItems[itemId];

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleExpand(itemId)}
                style={styles.card}
            >
                <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.type, { color: item.type === 'LOST' ? COLORS.error : COLORS.success }]}>
                            {item.type}
                        </Text>
                        {item.is_report && (
                            <View style={[styles.sourceBadge, { backgroundColor: COLORS.info + '20' }]}>
                                <Text style={[styles.sourceBadgeText, { color: COLORS.info }]}>YOUR REPORT</Text>
                            </View>
                        )}
                        {item.is_claim && (
                            <View style={[styles.sourceBadge, { backgroundColor: COLORS.primary + '20' }]}>
                                <Text style={[styles.sourceBadgeText, { color: COLORS.primary }]}>YOUR CLAIM</Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                </View>

                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.trackingId}>
                    ID: {item.Lost_ID || item.Found_ID || itemId.substring(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.date}>{new Date(item.dateTime).toLocaleDateString()}</Text>

                {item.imageUrl ? (
                    <Image
                        source={{ uri: `http://10.234.72.182:8080/${item.imageUrl}` }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                ) : null}

                <Text style={styles.description} numberOfLines={isExpanded ? undefined : 2}>
                    {item.description}
                </Text>

                {isExpanded && (
                    <View style={styles.detailsGroup}>
                        <Text style={styles.detailsTitle}>Report Details</Text>
                        <Text style={styles.description}>{item.description}</Text>
                        {item.location ? <Text style={styles.location}>📍 Location: {item.location}</Text> : null}

                        {item.user_claim && (
                            <View style={styles.userSubmissionSection}>
                                <Text style={styles.submissionTitle}>
                                    {item.is_report ? "Claimant's Proof:" : "How You Claimed:"}
                                </Text>
                                <Text style={styles.submissionText}>
                                    <Text style={{ fontWeight: 'bold' }}>Proof Details:</Text> {item.user_claim.verificationDetails}
                                </Text>
                                {item.user_claim.proofImageUrl && (
                                    <Image
                                        source={{ uri: `http://10.234.72.182:8080/${item.user_claim.proofImageUrl}` }}
                                        style={styles.proofImage}
                                        resizeMode="cover"
                                    />
                                )}
                                <View style={[styles.claimStatusBadge, { backgroundColor: getStatusColor(item.user_claim.status) + '20' }]}>
                                    <Text style={[styles.claimStatusText, { color: getStatusColor(item.user_claim.status) }]}>
                                        {item.is_report ? 'Process Status: ' : 'Claim Status: '}{item.user_claim.status}
                                    </Text>
                                </View>
                            </View>
                        )}

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
                            </View>
                        )}
                    </View>
                )}

                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }}>
                    {isExpanded ? 'Show Less ▴' : 'Tap to view whole report ▾'}
                </Text>

                {item.type === 'FOUND' && !item.is_report && !item.is_claim && item.status !== 'CLAIMED' && (
                    <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => navigation.navigate('ClaimItem', { item })}
                    >
                        <Text style={styles.claimButtonText}>This is mine!</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>❮</Text>
                </TouchableOpacity>
                <Text style={styles.header}>My Activity</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => (item.id || item._id).toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📂</Text>
                            <Text style={styles.emptyText}>No reports or claims yet.</Text>
                            <Text style={styles.emptySubtext}>Your activity will appear here.</Text>
                        </View>
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
    remarksText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F3F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    backIcon: {
        fontSize: 18,
        color: COLORS.primary,
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    type: {
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: 'bold',
    },
    category: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 5,
    },
    date: {
        color: COLORS.textLight,
        fontSize: 12,
        marginBottom: 8,
    },
    trackingId: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    description: {
        color: COLORS.text,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    location: {
        color: COLORS.textLight,
        fontSize: 13,
        fontWeight: '500',
    },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginVertical: 12,
    },
    detailsGroup: {
        marginVertical: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    detailsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    userSubmissionSection: {
        backgroundColor: '#F8F9FF',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
    },
    submissionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    submissionText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    proofImage: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        marginVertical: 10,
    },
    claimStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        marginTop: 10,
    },
    claimStatusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    sourceBadge: {
        marginLeft: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    sourceBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    claimButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    claimButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    adminSection: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    adminTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#B45309',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    storageText: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default MyRequestsScreen;
