import React, { useState } from 'react';
import {
    User,
    Shield,
    Mail,
    Smartphone,
    Settings,
    Save,
    CheckCircle,
    Key,
    Eye,
    EyeOff
} from 'lucide-react';
import { getUser, setUser } from '../../utils/auth';
import CaregiverLayout from '../../components/CaregiverLayout';
import api from '../../services/api';

const AccountSettings = () => {
    const user = getUser();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone_number: user?.caregiver_profile?.phone_number || '',
        city: user?.caregiver_profile?.city || ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await api.patch('users/me/', {
                full_name: formData.full_name,
                caregiver_profile: {
                    phone_number: formData.phone_number,
                    city: formData.city
                }
            });
            setUser(response.data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        setLoading(true);
        try {
            await api.post('users/change-password/', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setShowPasswordModal(false);
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    return (
        <CaregiverLayout
            title="Account Settings"
            subtitle="Manage your personal profile and account security preferences."
        >
            <div className="admin-module-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a', fontSize: '1.4rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <User size={22} color="var(--cg-accent)" />
                            </div>
                            Account Information
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '3.5rem', marginTop: '-0.5rem' }}>Used for alerts and account recovery.</p>
                    </div>
                    <button
                        className="btn-auth"
                        style={{ width: 'auto', padding: '0.8rem 2rem' }}
                        disabled={loading}
                        onClick={handleSave}
                    >
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {message.text && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: message.type === 'success' ? '#15803d' : '#b91c1c',
                        border: `1px solid ${message.type === 'success' ? '#bcf0da' : '#fecaca'}`,
                        textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}

                <div className="inspect-grid">
                    <div className="filter-group">
                        <label>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                name="full_name"
                                className="form-input-styled"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                className="form-input-styled"
                                value={user?.email}
                                disabled
                                style={{ paddingLeft: '2.75rem', background: '#f8fafc', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>User ID</label>
                        <div style={{ position: 'relative' }}>
                            <Shield size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="form-input-styled"
                                value={user?.unique_id || '—'}
                                disabled
                                style={{ paddingLeft: '2.75rem', background: '#f8fafc', cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 'bold' }}
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Smartphone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                name="phone_number"
                                className="form-input-styled"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                placeholder="Not provided"
                                style={{ paddingLeft: '2.75rem' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '3.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '2.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                            <Shield size={22} color="var(--cg-accent)" />
                        </div>
                        Caregiver Role
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '3.5rem', marginBottom: '1.5rem' }}>Your role determines what actions you can perform in the system. Read-only. No actions.</p>

                    <div className="inspect-grid">
                        <div className="filter-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-input-styled" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', fontWeight: '700', flex: 1 }}>
                                    <CheckCircle size={16} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                                    {user?.role === 'caregiver' && user?.care_level?.toLowerCase().includes('primary') ? 'Primary Caregiver (Verified)' :
                                        user?.role === 'caregiver' && user?.care_level?.toLowerCase().includes('secondary') ? 'Secondary Caregiver (Verified)' :
                                            'Caregiver (Verified)'}
                                </div>
                                {user?.caregiver_profile?.relationship && (
                                    <div className="form-input-styled" style={{ background: 'linear-gradient(135deg, #f8fafc, #fff)', border: '1.5px solid #e2e8f0', color: '#6366f1', fontWeight: '700', flex: 1 }}>
                                        <User size={16} style={{ color: '#6366f1', marginRight: '0.5rem' }} />
                                        {user.caregiver_profile.relationship.charAt(0).toUpperCase() + user.caregiver_profile.relationship.slice(1)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '3.5rem', borderTop: '1.5px solid #f1f5f9', paddingTop: '2.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#0f172a' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                            <Key size={22} color="var(--cg-accent)" />
                        </div>
                        Security
                    </h3>
                    <div className="inspect-grid">
                        <div className="filter-group" style={{ gridColumn: 'span 2' }}>
                            <button
                                className="btn-auth"
                                style={{ background: '#ffffff', color: 'var(--cg-accent)', border: '1px solid #e2e8f0', width: 'auto', padding: '0.8rem 2rem' }}
                                onClick={() => setShowPasswordModal(true)}
                            >
                                Change Password
                            </button>
                            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                                A secure password helps protect your account and sensitive care data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="modal-content" style={{
                        background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '450px', width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label>Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.old ? "text" : "password"}
                                        className="form-input-styled"
                                        required
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('old')}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                    >
                                        {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        className="form-input-styled"
                                        required
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                    >
                                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        className="form-input-styled"
                                        required
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                    >
                                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn-auth" disabled={loading}>
                                    {loading ? 'Changing...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="btn-auth"
                                    style={{ background: '#94a3b8' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CaregiverLayout>
    );
};

export default AccountSettings;
