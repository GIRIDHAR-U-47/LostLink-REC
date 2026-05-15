import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Replace with your backend URL (e.g., 10.0.2.2 for Android Emulator, localhost for iOS Simulator)
// Use computer's Local IP for physical device connection

// Function to dynamically get the local IP address from Expo Go
const getBaseUrl = () => {
  const defaultIp = '10.120.212.238'; // fallback IP
  
  // Constants.expoConfig?.hostUri contains the IP address and port of the packager
  // e.g., '192.168.1.5:8081'
  if (Constants.expoConfig?.hostUri) {
    const ip = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${ip}:8080`;
  }
  
  return `http://${defaultIp}:8080`;
};

const BASE_URL = getBaseUrl();

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
