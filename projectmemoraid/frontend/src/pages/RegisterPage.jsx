import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { setAuthToken, setRefreshToken, setUser, isAuthenticated } from '../utils/auth';
import logo from '../assets/icons/logo.png';
import './Auth.css';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        username: '',
        password: '',
        confirm_password: '',
        role: 'caregiver'
    });
    const [error, setError] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: '' });
    const [passwordMatch, setPasswordMatch] = useState(null); // null, true, or false
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if already logged in
        if (isAuthenticated()) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const calculatePasswordStrength = (password) => {
        if (!password) return { level: 0, text: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return { level: 1, text: 'Weak' };
        if (strength <= 4) return { level: 2, text: 'Medium' };
        return { level: 3, text: 'Strong' };
    };

    const validatePassword = (password) => {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.full_name.trim()) {
            errors.full_name = 'Full name is required';
        } else if (formData.full_name.trim().length < 2) {
            errors.full_name = 'Name must be at least 2 characters';
        }

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!validatePassword(formData.password)) {
            errors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (!formData.confirm_password) {
            errors.confirm_password = 'Please confirm your password';
        } else if (formData.password !== formData.confirm_password) {
            errors.confirm_password = 'Passwords do not match';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);

        // Calculate password strength
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
            // Check match with confirm password
            if (newFormData.confirm_password) {
                setPasswordMatch(value === newFormData.confirm_password);
            }
        }

        // Check password match when confirm password changes
        if (name === 'confirm_password') {
            if (value && newFormData.password) {
                setPasswordMatch(value === newFormData.password);
            } else {
                setPasswordMatch(null);
            }
        }

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: '' });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError({});

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        // Minor fix: set username to email if it's empty
        const dataToSubmit = { ...formData, username: formData.email };

        try {
            const response = await api.post('users/register/', dataToSubmit);

            // After successful registration, automatically log in to get tokens
            const loginResponse = await api.post('users/login/', {
                email: formData.email,
                password: formData.password
            });

            const { access, refresh, user } = loginResponse.data;

            // Use auth utilities to set session
            setAuthToken(access);
            setRefreshToken(refresh);
            setUser(user);

            // Redirect based on user status
            if (user.status === 'pending') {
                // Navigate to onboarding - using window.location.href for guaranteed redirection
                console.log('User status is pending, forcing redirection to /onboarding via window.location.href');
                window.location.href = '/onboarding';
            } else {
                console.log('User status is not pending, navigating to /dashboard');
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response?.data) {
                setError(err.response.data);
            } else {
                setError({ General: 'Registration failed. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left-panel">
                <h1>Empower Memory,<br />Simplify Care.</h1>
                <p>A caregiver-centric platform designed to support daily care routines and ensure safety for your loved ones.</p>
                <div className="auth-left-footer">&copy; 2026 Memoraid. All rights reserved.</div>
            </div>

            <div className="auth-right-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-logo-top">
                        <img src={logo} alt="Memoraid" className="auth-logo-img" />
                        <span>Memoraid</span>
                    </div>

                    <h2>Create Account</h2>
                    <p className="auth-helper-text">
                        Already have an account? <Link to="/login">Login now</Link>
                    </p>

                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <label>FULL NAME</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                            />
                            {(fieldErrors.full_name || error.full_name) && <span className="field-error">{fieldErrors.full_name || error.full_name}</span>}
                        </div>

                        <div className="form-group">
                            <label>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                required
                            />
                            {(fieldErrors.email || error.email) && <span className="field-error">{fieldErrors.email || error.email}</span>}
                        </div>

                        <div className="row-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="form-group">
                                <label>PASSWORD</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
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
                                {formData.password && (
                                    <div className="password-strength">
                                        <div className="strength-bars">
                                            <div className={`strength-bar ${passwordStrength.level >= 1 ? `active ${passwordStrength.text.toLowerCase()}` : ''}`}></div>
                                            <div className={`strength-bar ${passwordStrength.level >= 2 ? `active ${passwordStrength.text.toLowerCase()}` : ''}`}></div>
                                            <div className={`strength-bar ${passwordStrength.level >= 3 ? `active ${passwordStrength.text.toLowerCase()}` : ''}`}></div>
                                        </div>
                                        <span className={`strength-text ${passwordStrength.text.toLowerCase()}`}>
                                            {passwordStrength.text} Password
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>CONFIRM</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirmPassword ? (
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
                                {fieldErrors.confirm_password && <span className="field-error">{fieldErrors.confirm_password}</span>}
                                {formData.confirm_password && passwordMatch !== null && (
                                    <div className={`password-match-indicator ${passwordMatch ? 'match' : 'no-match'}`}>
                                        {passwordMatch ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Passwords do not match</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {error.non_field_errors && <div className="auth-error" style={{ marginTop: '0' }}>{error.non_field_errors}</div>}

                        <div className="form-group">
                            <label>SELECT YOUR ROLE</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="auth-select">
                                <option value="caregiver">Caregiver</option>
                                <option value="patient">Patient</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Processing...' : 'Register Now'}
                        </button>
                    </form>

                    <p className="back-to-home">
                        <Link to="/">← Back to Home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};


export default RegisterPage;
