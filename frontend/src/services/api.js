import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your backend URL (e.g., 10.0.2.2 for Android Emulator, localhost for iOS Simulator)
// Use computer's Local IP for physical device connection
const BASE_URL = 'http://10.191.41.238:8080';

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

export default api;
