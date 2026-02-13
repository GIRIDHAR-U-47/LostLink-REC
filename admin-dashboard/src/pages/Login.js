import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

const API_BASE = 'http://localhost:8080/api';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email,
                password
            });

            const { token, roles, ...userInfo } = response.data;

            // Check if admin
            if (!roles.includes('ADMIN')) {
                setError('Access denied. Admin credentials required.');
                setLoading(false);
                return;
            }

            // Save to localStorage
            localStorage.setItem('userToken', token);
            localStorage.setItem('userInfo', JSON.stringify({...userInfo, roles}));

            // Callback
            onLoginSuccess(token, {...userInfo, roles});
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">🏫</div>
                    <h1>REC LostLink</h1>
                    <p>Admin Dashboard</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@rajalakshmi.edu.in"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <p><strong>Demo Credentials:</strong></p>
                    <p>Email: admin@rajalakshmi.edu.in</p>
                    <p>Password: admin123</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
