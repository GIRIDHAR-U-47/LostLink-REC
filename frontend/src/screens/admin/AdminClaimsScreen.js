import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

const AdminClaimsScreen = ({ navigation }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClaims = async () => {
        try {
            const response = await api.get('/claims/status', { params: { status: 'PENDING' } });
            setClaims(response.data);
        } catch (error) {
            console.log('Error fetching claims', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    const handleVerify = async (claimId, status) => {
        try {
            await api.put(`/claims/${claimId}/verify`, null, { params: { status: status } });
            Alert.alert('Success', `Claim ${status}`);
            fetchClaims(); // Refresh
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.itemTitle}>Claim for: {item.item?.category}</Text>
                <Text style={styles.date}>{new Date(item.submissionDate).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.claimant}>Claimant: {item.claimant?.name} ({item.claimant?.registerNumber})</Text>
            <Text style={styles.detailsHeader}>Verification Details:</Text>
            <Text style={styles.details}>{item.verificationDetails || 'No details provided'}</Text>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleVerify(item.id, 'REJECTED')}
                >
                    <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleVerify(item.id, 'APPROVED')}
                >
                    <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
                <FlatList
                    data={claims}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pending claims.</Text>}
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
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    date: {
        color: COLORS.textLight,
        fontSize: 12,
    },
    claimant: {
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 14,
        color: COLORS.text,
    },
    detailsHeader: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    details: {
        color: COLORS.text,
        marginBottom: 15,
        fontStyle: 'italic',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        paddingVertical: 10,
        width: '48%',
        borderRadius: 8,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: COLORS.success,
    },
    rejectButton: {
        backgroundColor: COLORS.error,
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

export default AdminClaimsScreen;
