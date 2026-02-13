import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your backend URL (e.g., 10.0.2.2 for Android Emulator, localhost for iOS Simulator)
// Use computer's Local IP for physical device connection
const BASE_URL = 'http://10.234.72.182:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // 5 seconds timeout
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

export default api;
