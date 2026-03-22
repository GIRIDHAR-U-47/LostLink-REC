import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your backend URL (e.g., 10.0.2.2 for Android Emulator, localhost for iOS Simulator)
// Use computer's Local IP for physical device connection
const IP_ADDRESS = '10.99.147.179';
const PORT = '8080';
const FILE_BASE_URL = `http://${IP_ADDRESS}:${PORT}/`;
const BASE_URL = `${FILE_BASE_URL}api`;

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

export { FILE_BASE_URL };
export default api;
