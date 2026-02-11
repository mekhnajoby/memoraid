import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setUser as setAuthUser } from '../utils/auth';
import { isSpamEmail, validatePhoneNumber } from '../utils/validation';
import logo from '../assets/icons/logo.png';
import './Auth.css';

const OnboardingFlow = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOnboardingDone, setIsOnboardingDone] = useState(false);

    // Caregiver form state
    const [caregiverData, setCaregiverData] = useState({
        relationship: 'family',
        custom_relationship: '', // Temporary state for 'other' option
        level: 'primary',
        living_arrangement: 'same_household',
        phone_number: '',
        address: '',
        city: '',
        consent: false
    });

    // Patient form state
    const [patientData, setPatientData] = useState({
        dob: '',
        phone_number: '',
        condition: 'alzheimers',
        stage: 'mild',
        familiar_name: '',
        address: '',
        primary_caregiver_name: '',
        primary_caregiver_email: '',
        consent: false
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.status === 'active') {
                navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleCaregiverSubmit = async (e) => {
        e.preventDefault();
        if (!caregiverData.consent) {
            setError('Please check the consent box to continue.');
            return;
        }
        if (!validatePhoneNumber(caregiverData.phone_number)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const dataToSubmit = { ...caregiverData };
            if (dataToSubmit.relationship === 'other') {
                dataToSubmit.relationship = caregiverData.custom_relationship || 'Caregiver';
            }
            // Remove helper field before sending
            delete dataToSubmit.custom_relationship;

            const response = await api.post('users/onboarding/', dataToSubmit);
            const updatedUser = response.data;

            console.log('Caregiver Onboarding response:', updatedUser);

            // 1. Update localStorage directly (Primary source of truth for ProtectedRoute)
            localStorage.setItem('user', JSON.stringify(updatedUser));
            sessionStorage.setItem('isAuthenticated', 'true');

            // 2. Call auth utility as backup
            setAuthUser(updatedUser);

            console.log('Onboarding successful. Status is now:', updatedUser.status);

            // 3. Set local state to show success message
            setIsOnboardingDone(true);
        } catch (err) {
            console.error('Onboarding error:', err.response?.data);
            if (err.response?.data) {
                // Display specific field errors
                const errors = err.response.data;
                const errorMessages = Object.entries(errors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join(' | ');
                setError(errorMessages || 'Failed to save onboarding data. Please check your inputs.');
            } else {
                setError('Failed to save onboarding data. Please check your inputs.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        if (!patientData.consent) {
            setError('Please check the consent box to continue.');
            return;
        }
        if (isSpamEmail(patientData.primary_caregiver_email)) {
            setError('Disposable email addresses are not allowed for the caregiver email.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await api.post('users/onboarding/', patientData);
            const updatedUser = response.data;

            console.log('Patient Onboarding response:', updatedUser);

            // 1. Update localStorage directly
            localStorage.setItem('user', JSON.stringify(updatedUser));
            sessionStorage.setItem('isAuthenticated', 'true');

            // 2. Call auth utility as backup
            setAuthUser(updatedUser);

            console.log('Onboarding successful. Status is now:', updatedUser.status);

            // 3. Set local state to show success message
            setIsOnboardingDone(true);

            // Note: We don't auto-redirect to dashboard anymore because status is 'verified'
        } catch (err) {
            console.error('Onboarding error:', err.response?.data);
            if (err.response?.data) {
                // Display specific field errors
                const errors = err.response.data;
                const errorMessages = Object.entries(errors)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join(' | ');
                setError(errorMessages || 'Failed to save onboarding data. Please check your inputs.');
            } else {
                setError('Failed to save onboarding data. Please check your inputs.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    // Debug: Check if token exists
    const token = localStorage.getItem('access_token');
    console.log('Access token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');

    return (
        <div className="auth-container">
            <div className="auth-left-panel">
                <h1>Almost<br />there!</h1>
                <p>We just need a few more details to create the perfect experience for you and your loved ones.</p>
                <div className="auth-left-footer">&copy; 2026 Memoraid. All rights reserved.</div>
            </div>

            <div className="auth-right-panel">
                <div className="auth-form-wrapper">
                    <div className="auth-logo-top">
                        <img src={logo} alt="Memoraid" className="auth-logo-img" />
                        <span>Memoraid</span>
                    </div>

                    <h2 style={{ marginBottom: '2rem' }}>Complete Profile</h2>

                    {isOnboardingDone ? (
                        <div className="onboarding-success-card" style={{
                            textAlign: 'center',
                            padding: '2rem',
                            background: '#f0fdf4',
                            borderRadius: '12px',
                            border: '1px solid #bbf7d0'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
                            <h3 style={{ color: '#166534', marginBottom: '1rem' }}>Profile Submitted!</h3>
                            <p style={{ color: '#166534', lineHeight: '1.6' }}>
                                Your profile has been successfully updated. To ensure safety and security,
                                <strong> Memoraid requires an administrator to verify the link </strong>
                                between the patient and caregiver.
                            </p>
                            <p style={{ color: '#166534', marginTop: '1rem', fontWeight: '500' }}>
                                You will be able to access your dashboard as soon as the approval is complete.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-auth"
                                style={{ marginTop: '2rem' }}
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {user.role === 'caregiver' && (
                                <form onSubmit={handleCaregiverSubmit} className="auth-form">
                                    <div className="form-group">
                                        <label>RELATIONSHIP TO PATIENT</label>
                                        <select
                                            value={caregiverData.relationship}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, relationship: e.target.value })}
                                            className="auth-select"
                                        >
                                            <option value="spouse">Spouse</option>
                                            <option value="child">Child</option>
                                            <option value="family">Family Member</option>
                                            <option value="professional">Professional Caregiver</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {caregiverData.relationship === 'other' && (
                                        <div className="form-group fade-in-up">
                                            <label>SPECIFY RELATIONSHIP</label>
                                            <input
                                                type="text"
                                                value={caregiverData.custom_relationship}
                                                onChange={(e) => setCaregiverData({ ...caregiverData, custom_relationship: e.target.value })}
                                                placeholder="e.g. Neighbor, Friend"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>CAREGIVER LEVEL</label>
                                        <select
                                            value={caregiverData.level}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, level: e.target.value })}
                                            className="auth-select"
                                        >
                                            <option value="primary">Primary (Coordinates care)</option>
                                            <option value="secondary">Secondary (Assists only)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>LIVING ARRANGEMENT</label>
                                        <select
                                            value={caregiverData.living_arrangement}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, living_arrangement: e.target.value })}
                                            className="auth-select"
                                        >
                                            <option value="same_household">Same Household</option>
                                            <option value="remote">Remote / Nearby</option>
                                            <option value="facility">Assisted Living Facility</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>PHONE NUMBER</label>
                                        <input
                                            type="tel"
                                            value={caregiverData.phone_number}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, phone_number: e.target.value })}
                                            placeholder="e.g. +1 234 567 890"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>FULL ADDRESS</label>
                                        <textarea
                                            value={caregiverData.address}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, address: e.target.value })}
                                            placeholder="Enter your full residential address"
                                            rows="3"
                                            required
                                            className="auth-input"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: '#ffffff',
                                                color: '#000000',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>CITY / LOCATION</label>
                                        <input
                                            type="text"
                                            value={caregiverData.city}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, city: e.target.value })}
                                            placeholder="e.g. New York"
                                        />
                                    </div>

                                    <div className="consent-group">
                                        <input
                                            type="checkbox"
                                            id="consent"
                                            checked={caregiverData.consent}
                                            onChange={(e) => setCaregiverData({ ...caregiverData, consent: e.target.checked })}
                                        />
                                        <label htmlFor="consent">I confirm that I am responsible for the care of this individual and have appropriate consent or authority.</label>
                                    </div>

                                    {error && <div className="auth-error">{error}</div>}

                                    <button type="submit" className="btn-auth" disabled={loading}>
                                        {loading ? 'Saving...' : 'Finish Setup'}
                                    </button>
                                </form>
                            )}

                            {user.role === 'patient' && (
                                <form onSubmit={handlePatientSubmit} className="auth-form">
                                    <div className="form-group">
                                        <label>DATE OF BIRTH</label>
                                        <input
                                            type="date"
                                            value={patientData.dob}
                                            onChange={(e) => setPatientData({ ...patientData, dob: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>PHONE NUMBER</label>
                                        <input
                                            type="tel"
                                            value={patientData.phone_number}
                                            onChange={(e) => setPatientData({ ...patientData, phone_number: e.target.value })}
                                            placeholder="e.g. +1 234 567 890"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>COGNITIVE CONDITION</label>
                                        <select
                                            value={patientData.condition}
                                            onChange={(e) => setPatientData({ ...patientData, condition: e.target.value })}
                                            className="auth-select"
                                        >
                                            <option value="alzheimers">Alzheimer's</option>
                                            <option value="dementia">Dementia</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>STAGE</label>
                                        <select
                                            value={patientData.stage}
                                            onChange={(e) => setPatientData({ ...patientData, stage: e.target.value })}
                                            className="auth-select"
                                        >
                                            <option value="mild">Mild</option>
                                            <option value="moderate">Moderate</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>FAMILIAR NAME (OPTIONAL)</label>
                                        <input
                                            type="text"
                                            value={patientData.familiar_name}
                                            onChange={(e) => setPatientData({ ...patientData, familiar_name: e.target.value })}
                                            placeholder="e.g. Grandpa"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>CURRENT ADDRESS</label>
                                        <textarea
                                            value={patientData.address}
                                            onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                                            placeholder="Enter patient's full residential address"
                                            rows="3"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: '#ffffff',
                                                color: '#000000',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>PRIMARY CAREGIVER NAME</label>
                                        <input
                                            type="text"
                                            value={patientData.primary_caregiver_name}
                                            onChange={(e) => setPatientData({ ...patientData, primary_caregiver_name: e.target.value })}
                                            placeholder="Full name of primary caregiver"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>PRIMARY CAREGIVER EMAIL</label>
                                        <input
                                            type="email"
                                            value={patientData.primary_caregiver_email}
                                            onChange={(e) => setPatientData({ ...patientData, primary_caregiver_email: e.target.value })}
                                            placeholder="caregiver@example.com"
                                            required
                                        />
                                    </div>

                                    <div className="consent-group">
                                        <input
                                            type="checkbox"
                                            id="consent-patient"
                                            checked={patientData.consent}
                                            onChange={(e) => setPatientData({ ...patientData, consent: e.target.checked })}
                                        />
                                        <label htmlFor="consent-patient">I agree to use Memoraid for my daily care routines and understand that my caregiver will be able to monitor my activity.</label>
                                    </div>

                                    {error && <div className="auth-error">{error}</div>}

                                    <button type="submit" className="btn-auth" disabled={loading}>
                                        {loading ? 'Saving...' : 'Finish Setup'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingFlow;
