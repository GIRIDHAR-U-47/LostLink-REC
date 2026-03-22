import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import KeyboardAwareView from '../../components/KeyboardAwareView';
import PasswordInput from '../../components/PasswordInput';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    const [isAdminLogin, setIsAdminLogin] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Validation Error', 'Please enter both email and password.');
            return;
        }
        try {
            await login(email, password, isAdminLogin);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Could not connect to server. Check if backend is running.';
            Alert.alert('Login Failed', errorMsg);
        }
    };

    return (
        <KeyboardAwareView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../../assets/rec_logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.title}>REC LostLink</Text>
                <Text style={styles.subtitle}>{isAdminLogin ? 'Admin Portal' : 'Lost & Found Management System'}</Text>
            </View>

            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={isAdminLogin ? "Admin ID" : "College Email ID"}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <PasswordInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Don't have an account? Register</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setIsAdminLogin(!isAdminLogin)}
                    style={[styles.adminToggle, isAdminLogin ? styles.adminToggleActive : null]}
                >
                    <Text style={[styles.adminToggleText, isAdminLogin ? styles.adminToggleTextActive : null]}>
                        {isAdminLogin ? 'Switch to Student Login' : 'Admin Login'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAwareView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoImage: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        marginTop: 5,
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: COLORS.background,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
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
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: COLORS.primary,
    },
    adminToggle: {
        marginTop: 30,
        padding: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignSelf: 'center',
        width: '60%',
        alignItems: 'center',
    },
    adminToggleActive: {
        backgroundColor: COLORS.primary,
    },
    adminToggleText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    adminToggleTextActive: {
        color: COLORS.white,
    },
});

export default LoginScreen;
