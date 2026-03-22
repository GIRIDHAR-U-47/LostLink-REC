import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import KeyboardAwareView from '../../components/KeyboardAwareView';
import PasswordInput from '../../components/PasswordInput';
// import { Picker } from '@react-native-picker/picker'; // Unused and causing errors

// Assuming simple text input for Role or a toggle for now to avoid extra dependencies if possible
// Or I'll just use TextInput for Role (User/Admin) for prototype simplicity
// The prompt said "Student Care (Admin)" vs "Student/Faculty". I'll default to USER and maybe have a secret toggle or just manual entry for Admin testing.

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registerNumber, setRegisterNumber] = useState('');
    const { register } = useContext(AuthContext);

    const handleRegister = async () => {
        if (!name || !email || !password || !registerNumber) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }
        try {
            await register(name, email, password, registerNumber, 'USER');
            Alert.alert('Success', 'Registration successful! Please login.');
            navigation.navigate('Login');
        } catch (e) {
            console.log("Registration failed", e);
            const errorMsg = e.response?.data?.detail || 'Could not register. Check backend connection.';
            Alert.alert('Registration Failed', errorMsg);
        }
    };

    return (
        <KeyboardAwareView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Create Account</Text>

            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="College Email ID"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Register Number"
                    value={registerNumber}
                    onChangeText={setRegisterNumber}
                />
                <PasswordInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 30,
        textAlign: 'center',
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
        backgroundColor: COLORS.accent, // Purple Accent instead of Maroon
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
});

export default RegisterScreen;
