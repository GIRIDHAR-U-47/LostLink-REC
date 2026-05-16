import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Configuration
// For Development: It dynamically picks up your machine's IP (for Expo Go)
// For Production: It uses the hardcoded production URL below
const PRODUCTION_URL = 'https://lostlink-api.onrender.com'; // REPLACE with your live URL when deployed
const DEV_PORT = '8080';

const getBaseUrl = () => {
  // If running in a standalone build (like APK), use the production URL
  if (Constants.appOwnership !== 'expo') {
    return PRODUCTION_URL;
  }

  // If running in Expo Go, try to get the local machine's IP
  if (Constants.expoConfig?.hostUri) {
    const ip = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${ip}:${DEV_PORT}`;
  }
  
  // Fallback for development if hostUri is missing
  return `http://10.0.2.2:${DEV_PORT}`; // Default for Android Emulator
};

const BASE_URL = getBaseUrl();
console.log('API BASE_URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout for network calls
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Session expired, logging out...');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
    }
    return Promise.reject(error);
  }
);

export const FILE_BASE_URL = BASE_URL + '/';
export default api;
