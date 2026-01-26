import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('users/password-reset/', { email });
            setMessage(response.data.message);
        } catch (err) {
            setError('Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left-panel">
                <h1>Restore<br />Access.🔑</h1>
                <p>Don't worry, it happens to the best of us. Enter your email and we'll get you back on track with Memoraid.</p>
                <div className="auth-left-footer">&copy; 2026 Memoraid. All rights reserved.</div>
            </div>

            <div className="auth-right-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-logo-top">Memoraid</div>

                    <h2>Forgot Password?</h2>
                    <p className="auth-helper-text">
                        Enter the email address associated with your account.
                    </p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>EMAIL ADDRESS</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        {message && <div style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '600' }}>{message}</div>}
                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="btn-auth" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
