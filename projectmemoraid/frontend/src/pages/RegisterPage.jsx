import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { setAuthToken, setRefreshToken, setUser, isAuthenticated } from '../utils/auth';
import { isSpamEmail } from '../utils/validation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
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
    const [verificationMode, setVerificationMode] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [uniqueId, setUniqueId] = useState('');
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
        } else if (isSpamEmail(formData.email)) {
            errors.email = 'Disposable email addresses are not allowed';
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

        const dataToSubmit = { ...formData, username: formData.email };

        try {
            const response = await api.post('users/register/', dataToSubmit);
            setUniqueId(response.data.unique_id);
            setVerificationMode(true);
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

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError({});

        try {
            // 1. Verify OTP
            try {
                await api.post('users/otp/verify/', {
                    email: formData.email,
                    code: otpCode
                });
            } catch (otpErr) {
                if (otpErr.response?.data) {
                    setError(otpErr.response.data);
                } else {
                    setError({ General: 'OTP verification failed. Please check the code.' });
                }
                setLoading(false);
                return;
            }

            // 2. Log in after successful verification
            try {
                const loginResponse = await api.post('users/login/', {
                    email: formData.email,
                    password: formData.password
                });

                const { access, refresh, user } = loginResponse.data;
                setAuthToken(access);
                setRefreshToken(refresh);
                setUser(user);

                if (user.status === 'pending') {
                    window.location.href = '/onboarding';
                } else {
                    navigate('/dashboard');
                }
            } catch (loginErr) {
                setError({ General: 'Verification successful, but login failed. Please go to Login page.' });
            }
        } catch (err) {
            setError({ General: 'An unexpected error occurred.' });
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

                    {!verificationMode ? (
                        <>
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
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        {formData.password && (
                                            <div className="password-strength">
                                                <div className="strength-bars">
                                                    <div className={`strength-bar ${passwordStrength.level >= 1 ? 'active weak' : ''}`}></div>
                                                    <div className={`strength-bar ${passwordStrength.level >= 2 ? 'active medium' : ''}`}></div>
                                                    <div className={`strength-bar ${passwordStrength.level >= 3 ? 'active strong' : ''}`}></div>
                                                </div>
                                                <span className={`strength-text ${passwordStrength.text.toLowerCase()}`}>
                                                    Password: {passwordStrength.text}
                                                </span>
                                            </div>
                                        )}
                                        {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
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
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        {passwordMatch !== null && formData.confirm_password && (
                                            <div className={`password-match-indicator ${passwordMatch ? 'match' : 'no-match'}`}>
                                                {passwordMatch ? <Check size={14} /> : <X size={14} />}
                                                {passwordMatch ? 'Passwords match' : 'Passwords do not match'}
                                            </div>
                                        )}
                                        {fieldErrors.confirm_password && <span className="field-error">{fieldErrors.confirm_password}</span>}
                                    </div>
                                </div>
                                {error.non_field_errors && <div className="auth-error">{error.non_field_errors}</div>}

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
                        </>
                    ) : (
                        <>
                            <h2>Verify OTP</h2>
                            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                                    Welcome to Memoraid! Your unique ID is <strong>{uniqueId}</strong>.
                                </p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                    We've sent a 6-digit confirmation code to <strong>{formData.email}</strong>.
                                </p>
                            </div>

                            <form onSubmit={handleVerify} className="auth-form">
                                <div className="form-group">
                                    <label>CONFIRMATION CODE</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: '700' }}
                                        required
                                    />
                                    {error.code && <span className="field-error">{error.code}</span>}
                                    {error.non_field_errors && <div className="auth-error">{error.non_field_errors}</div>}
                                    {error.General && <div className="auth-error">{error.General}</div>}
                                    {error.detail && <div className="auth-error">{error.detail}</div>}
                                </div>

                                <button type="submit" className="btn-auth" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                            </form>

                            <p className="back-to-home">
                                <button
                                    onClick={() => setVerificationMode(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                                >
                                    ← Back to registration
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
