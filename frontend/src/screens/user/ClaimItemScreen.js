import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

const ClaimItemScreen = ({ route, navigation }) => {
    const { item } = route.params;
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera is required!");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleClaim = async () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please provide a description or proof of ownership.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('item_id', item.id || item._id);
            formData.append('verification_details', description);

            if (image) {
                let localUri = image;
                let filename = localUri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image`;
                formData.append('proof_image', { uri: localUri, name: filename, type });
            }

            await api.post('/claims/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Claim request submitted successfully!');
            navigation.goBack();
        } catch (error) {
            console.log('Claim error:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to submit claim');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Claim Item</Text>

            <View style={styles.itemCard}>
                {item.imageUrl && (
                    <Image
                        source={{ uri: `${api.defaults.baseURL.replace('/api', '')}/${item.imageUrl}` }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Category:</Text>
                    <Text style={styles.value}>{item.category}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Found at:</Text>
                    <Text style={styles.value}>{item.location}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>{new Date(item.dateTime).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <Text style={styles.subLabel}>
                    Please describe the item in detail (e.g., color, scratches, unique marks) to prove it belongs to you.
                </Text>
                <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter details..."
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Proof Image (Optional)</Text>
                <Text style={styles.subLabel}>
                    Upload a photo (e.g., receipt, old photo of item) if availble.
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity style={[styles.imageUploadBtn, { flex: 1, marginRight: 5 }]} onPress={pickImage}>
                        <Text style={styles.imageUploadText}>Upload Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.imageUploadBtn, { flex: 1, marginLeft: 5 }]} onPress={takePhoto}>
                        <Text style={styles.imageUploadText}>Take Photo</Text>
                    </TouchableOpacity>
                </View>
                {image && (
                    <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
                )}
            </View>

            <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleClaim}
                disabled={loading}
            >
                <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Claim'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: COLORS.white,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
        marginTop: 40,
    },
    itemCard: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        fontWeight: 'bold',
        width: 100,
        color: COLORS.text,
    },
    value: {
        flex: 1,
        color: COLORS.textLight,
    },
    formGroup: {
        marginBottom: 30,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5,
    },
    subLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 10,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 120,
    },
    imageUploadBtn: {
        backgroundColor: '#DDDDDD',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    imageUploadText: {
        color: '#333',
        fontWeight: 'bold',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ClaimItemScreen;
