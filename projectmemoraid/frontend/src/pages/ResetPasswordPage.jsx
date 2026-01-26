import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('users/password-reset-confirm/', { token, password });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left-panel">
                <h1>Secure<br />Account.🛡️</h1>
                <p>Your security is our priority. Choose a strong new password to protect your Memoraid care journey.</p>
                <div className="auth-left-footer">&copy; 2026 Memoraid. All rights reserved.</div>
            </div>

            <div className="auth-right-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-logo-top">Memoraid</div>

                    <h2>Reset Password</h2>
                    <p className="auth-helper-text">
                        Enter and confirm your new password below.
                    </p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>NEW PASSWORD</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>CONFIRM NEW PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {message && <div style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '600' }}>{message}. Redirecting to login...</div>}
                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Resetting...' : 'Set New Password'}
                        </button>
                    </form>

                    <p className="back-to-home">
                        <Link to="/login">← Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
