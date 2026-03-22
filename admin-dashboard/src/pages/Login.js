import React, { useState } from 'react';
import api from '../services/api';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            const { token, roles, ...userInfo } = response.data;

            // Check if admin
            if (!roles || !roles.includes('ADMIN')) {
                setError('Access denied. Admin credentials required.');
                setLoading(false);
                return;
            }

            // Save to localStorage
            localStorage.setItem('userToken', token);
            localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, roles }));

            // Callback
            onLoginSuccess(token, { ...userInfo, roles });
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Check server connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>REC LostLink</h1>
                    <p>Admin Dashboard</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@rec.edu.in"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <p><strong>Demo Admin Credentials:</strong></p>
                    <p>Email: admin@rec.edu.in</p>
                    <p>Password: admin123</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
