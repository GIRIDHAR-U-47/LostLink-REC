import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import adminAPI from '../../services/adminApi';
import { COLORS } from '../../constants/theme';

const AdminBroadcastScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('SYSTEM');
    const [sending, setSending] = useState(false);

    const categories = [
        { id: 'SYSTEM', label: 'System Alert', color: '#6366f1', icon: '📢' },
        { id: 'URGENT', label: 'Urgent Alert', color: '#ef4444', icon: '🚨' },
        { id: 'ITEMS', label: 'Found Item', color: '#10b981', icon: '📦' },
        { id: 'MAINTENANCE', label: 'Maintenance', color: '#f59e0b', icon: '🛠️' }
    ];

    const currentCat = categories.find(c => c.id === category);

    const handleBroadcast = async () => {
        if (!title || !message) {
            Alert.alert('Error', 'Please fill in both title and message');
            return;
        }

        Alert.alert(
            'Confirm Broadcast',
            'This will send a notification to EVERY registered user. Proceed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'SEND BROADCAST',
                    style: 'destructive',
                    onPress: async () => {
                        setSending(true);
                        try {
                            await adminAPI.sendBroadcast({ title, message, category });
                            Alert.alert('Success', 'Campus-wide alert broadcasted successfully!');
                            setTitle('');
                            setMessage('');
                        } catch (error) {
                            Alert.alert('Broadcast Failed', error.response?.data?.detail || error.message);
                        } finally {
                            setSending(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.headerBox}>
                    <Text style={styles.header}>Global Uplink</Text>
                    <Text style={styles.subtitle}>Dispatch real-time intelligence to the REC ecosystem.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>CLASSIFICATION</Text>
                    <View style={styles.catGrid}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.catBtn,
                                    category === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}15` }
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <Text style={styles.catIcon}>{cat.icon}</Text>
                                <Text style={[
                                    styles.catText,
                                    category === cat.id && { color: cat.color, fontWeight: 'bold' }
                                ]}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>BROADCAST VECTOR (TITLE)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Mandatory Hardware Verification Session"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>PAYLOAD CONTENT</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe the alert parameters in detail..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.engageBtn, { backgroundColor: currentCat.color }]}
                    onPress={handleBroadcast}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.engageText}>ENGAGE {category} BROADCAST</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ CRITICAL: REACHES ALL PERSONNEL IMMEDIATELY.</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    headerBox: {
        marginBottom: 30,
    },
    header: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 5,
    },
    section: {
        marginBottom: 25,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 10,
    },
    catGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    catBtn: {
        width: '48%',
        padding: 15,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        marginBottom: 10,
        flexDirection: 'row',
        gap: 10,
    },
    catIcon: {
        fontSize: 18,
    },
    catText: {
        fontSize: 13,
        color: '#64748b',
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#1e293b',
    },
    textArea: {
        height: 150,
    },
    engageBtn: {
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    engageText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    warningBox: {
        marginTop: 20,
        alignItems: 'center',
    },
    warningText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#f59e0b',
        textAlign: 'center',
    }
});

export default AdminBroadcastScreen;
