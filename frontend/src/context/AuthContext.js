import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const login = async (email, password, isAdminLogin = false) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, id, email: userEmail, roles, name, registerNumber } = response.data;

            if (isAdminLogin && (!roles || !roles.includes('ADMIN'))) {
                throw new Error('Access Denied: Not an Admin account');
            }

            const userInfoData = { id, email: userEmail, roles, name, registerNumber };
            setUserInfo(userInfoData);
            setUserToken(token);

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfoData));
        } catch (error) {
            console.log('Login error', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    const register = async (name, email, password, registerNumber, role) => {
        setIsLoading(true);
        try {
            await api.post('/auth/register', { name, email, password, registerNumber, role });
        } catch (error) {
            console.log('Register error', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const isLoggedIn = async () => {
        try {
            setSplashLoading(true);

            // Artificial delay for splash screen (e.g. 5 seconds as requested)
            const minimumLoadTime = new Promise(resolve => setTimeout(resolve, 5000));
            const authCheck = (async () => {
                let userToken = await AsyncStorage.getItem('userToken');
                let userInfo = await AsyncStorage.getItem('userInfo');
                userInfo = JSON.parse(userInfo);

                if (userInfo) {
                    setUserToken(userToken);
                    setUserInfo(userInfo);
                }
            })();

            await Promise.all([minimumLoadTime, authCheck]);

            setSplashLoading(false);
        } catch (error) {
            console.log('isLoggedIn error', error);
            setSplashLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, register, isLoading, splashLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
