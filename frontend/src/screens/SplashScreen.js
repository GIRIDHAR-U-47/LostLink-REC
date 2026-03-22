import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/rec_logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.mascotContainer}>
                <Image
                    source={require('../../assets/mascot.webp')}
                    style={styles.mascot}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.productNameContainer}>
                <Text style={styles.productName}>LostLink</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 50,
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 50,
    },
    logo: {
        width: width * 0.7,
        height: 150,
    },
    productNameContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    productName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    mascotContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
    },
    mascot: {
        width: width * 0.8,
        height: 300,
    }
});

export default SplashScreen;
