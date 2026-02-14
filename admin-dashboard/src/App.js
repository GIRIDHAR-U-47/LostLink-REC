import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FoundItemsManagement from './pages/FoundItemsManagement';
import LostItemsViewer from './pages/LostItemsViewer';
import ClaimsManagement from './pages/ClaimsManagement';
import Profile from './pages/Profile';
import Login from './pages/Login';

const App = () => {
    const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
    const [userInfo, setUserInfo] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (userToken) {
            // Verify token and fetch user info
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                setUserInfo(JSON.parse(userInfoStr));
            }
        }

        // Axios Interceptor to handle 401 Unauthorized
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    console.log('Session expired or invalid. Logging out...');
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [userToken]);

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        setUserToken(null);
        setUserInfo(null);
        window.location.href = '/login';
    };

    if (!userToken) {
        return <Login onLoginSuccess={(token, info) => {
            setUserToken(token);
            setUserInfo(info);
        }} />;
    }

    return (
        <Router>
            <div className="app">
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} userInfo={userInfo} />
                <div className="main-content">
                    <Navbar userInfo={userInfo} onLogout={handleLogout} />
                    <div className="content">
                        <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/found-items" element={<FoundItemsManagement />} />
                            <Route path="/lost-items" element={<LostItemsViewer />} />
                            <Route path="/claims" element={<ClaimsManagement />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default App;
