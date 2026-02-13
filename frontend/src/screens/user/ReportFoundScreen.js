import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker
import api from '../../services/api';
import { COLORS } from '../../constants/theme';

const ReportFoundScreen = ({ navigation }) => {
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState(null); // State for image
    const [loading, setLoading] = useState(false);

    const categories = [
        "DOCUMENTS",
        "DEVICES",
        "ACCESSORIES",
        "PERSONAL_ITEMS",
        "KEYS",
        "BOOKS",
        "JEWELLERY",
        "OTHERS"
    ];

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Disable cropping
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
            allowsEditing: false, // Disable cropping
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // Mandatory Image Check
        if (!image) {
            Alert.alert('Error', 'Image upload is mandatory for Data Quality.');
            return;
        }
        if (!category || !description || !location) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('type', 'FOUND');
            formData.append('category', category);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('dateTime', new Date().toISOString());
            formData.append('status', 'PENDING');

            let localUri = image;
            let filename = localUri.split('/').pop();

            let match = /\.(\w+)$/.exec(filename);
            let type = match ? `image/${match[1]}` : `image`;

            formData.append('image', { uri: localUri, name: filename, type });

            await api.post('/items/report', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert('Success', 'Found item reported! Please submit the item to Student Care.');
            navigation.goBack();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to report item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.header}>Report Found Item</Text>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.alertBox}>
                    <Text style={styles.alertText}>⚠️ Please submit the found item physically to the Student Care department after reporting.</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={category}
                            onValueChange={(itemValue) => setCategory(itemValue)}
                        >
                            <Picker.Item label="Select Category" value="" color="#999" />
                            {categories.map((cat, index) => (
                                <Picker.Item key={index} label={cat} value={cat} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe the item..."
                        multiline
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Found Location</Text>
                    <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g., Block A, Lab 3" />
                </View>

                {/* Image Upload Section (Mandatory) */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Image (Required)</Text>
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

                <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit Report'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        padding: 20,
    },
    header: {
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.primary,
        paddingTop: 50,
        paddingHorizontal: 20,
        marginBottom: 10,
        backgroundColor: COLORS.white,
        zIndex: 1,
    },
    alertBox: {
        backgroundColor: '#fff3cd', // Keep yellow buffer/warning color
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffeeba',
    },
    alertText: {
        color: '#856404',
        fontSize: 14,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 15,
        borderRadius: 10,
    },
    pickerContainer: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        overflow: 'hidden',
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
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
    },
});

export default ReportFoundScreen;
