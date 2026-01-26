import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { setAuthToken, setRefreshToken, setUser, isAuthenticated } from '../utils/auth';
import logo from '../assets/icons/logo.png';
import './Auth.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Redirect if already logged in
        if (isAuthenticated()) {
            navigate('/dashboard');
        }

        // Show success message from registration
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            if (location.state?.email) {
                setEmail(location.state.email);
            }
        }
    }, [navigate, location]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const errors = {};

        if (!email) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('users/login/', { email, password });
            const { access, refresh, user } = response.data;

            // Use auth utilities to set session
            setAuthToken(access);
            setRefreshToken(refresh);
            setUser(user);

            if (user.status === 'pending') {
                navigate('/onboarding');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left-panel">
                <h1>Empower Memory,<br />Simplify Care.</h1>
                <p>A dedicated coordinate-care platform designed to support daily routines and reinforce identity for individuals with cognitive impairment.</p>
                <div className="auth-left-footer">&copy; 2026 Memoraid. All rights reserved.</div>
            </div>

            <div className="auth-right-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-logo-top">
                        <img src={logo} alt="Memoraid" className="auth-logo-img" />
                        <span>Memoraid</span>
                    </div>

                    <h2>User Login</h2>
                    <p className="auth-helper-text">
                        Don't have an account? <Link to="/register">Create a new account now</Link>
                    </p>

                    {successMessage && (
                        <div style={{
                            background: '#d1fae5',
                            color: '#065f46',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontWeight: '600'
                        }}>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <label>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setFieldErrors({ ...fieldErrors, email: '' }); }}
                                placeholder="name@example.com"
                                required
                            />
                            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label>PASSWORD</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors({ ...fieldErrors, password: '' }); }}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login Now'}
                        </button>
                    </form>

                    <p className="auth-forgot-link">
                        Forget password? <Link to="/forgot-password" style={{ color: '#000', fontWeight: '700' }}>Click here</Link>
                    </p>

                    <p className="back-to-home">
                        <Link to="/">← Back to Home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};


export default LoginPage;
