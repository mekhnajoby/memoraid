import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    HandHeart,
    Home,
    MapPin,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import CaregiverLayout from '../../components/CaregiverLayout';

const PatientLinking = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        relationship: '',
        custom_relationship: '', // Temporary state for 'other' option
        living_arrangement: 'same_household',
        care_context: '',
        consent_basis: '',
        risk_lives_alone: false,
        risk_wandering: false,
        notes: '',
        consent: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.consent) {
            setError('Please confirm consent and responsibility to continue.');
            return;
        }

        setLoading(true);
        try {
            const dataToSubmit = { ...formData };
            if (dataToSubmit.relationship === 'other') {
                dataToSubmit.relationship = formData.custom_relationship || 'Caregiver';
            }
            // Remove helper field before sending
            delete dataToSubmit.custom_relationship;

            await api.post('users/caregiver/link-patient/', dataToSubmit);
            // Redirect to dashboard with success state or message
            navigate('/caregiver-dashboard', { state: { message: 'Patient linking request submitted. Awaiting admin approval.' } });
        } catch (err) {
            const errorData = err.response?.data;
            let errorMessage = 'Failed to submit request. Please check patient details.';

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.email) {
                    errorMessage = errorData.email[0];
                } else if (typeof errorData === 'object') {
                    // Get the first error message from any field
                    const firstKey = Object.keys(errorData)[0];
                    const firstVal = errorData[firstKey];
                    errorMessage = Array.isArray(firstVal) ? firstVal[0] : firstVal;
                }
            }

            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <CaregiverLayout
            title="Link New Patient"
            subtitle="Initiate care by creating a patient profile and requesting primary caregiver status."
        >
            <div className="admin-module-container" style={{ width: '100%', margin: '0' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#0f172a' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <UserPlus size={20} color="var(--cg-accent)" />
                            </div>
                            Basic Identity
                        </h3>
                        <div className="inspect-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="filter-group">
                                <label>Patient Full Name</label>
                                <input
                                    className="form-input-styled"
                                    type="text"
                                    placeholder="Enter legal name (e.g. John Doe)"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="filter-group" style={{ marginTop: '1.25rem' }}>
                                <label>Patient Email</label>
                                <input
                                    className="form-input-styled"
                                    type="email"
                                    placeholder="Enter patient's email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="filter-group" style={{ marginTop: '1.25rem' }}>
                                <label>Patient Phone Number</label>
                                <input
                                    className="form-input-styled"
                                    type="tel"
                                    placeholder="Enter contact number (e.g. 8890765432)"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#0f172a' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <HandHeart size={20} color="var(--cg-accent)" />
                            </div>
                            Care Context
                        </h3>
                        <div className="inspect-grid">
                            <div className="filter-group">
                                <label>Relationship</label>
                                <select
                                    className="form-input-styled"
                                    value={formData.relationship}
                                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                    required
                                >
                                    <option value="">Select Relationship</option>
                                    <option value="spouse">Spouse</option>
                                    <option value="child">Child</option>
                                    <option value="family">Family Member</option>
                                    <option value="professional">Professional Caregiver</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Living Arrangement</label>
                                <select
                                    className="form-input-styled"
                                    value={formData.living_arrangement}
                                    onChange={(e) => setFormData({ ...formData, living_arrangement: e.target.value })}
                                >
                                    <option value="same_household">Same Household</option>
                                    <option value="remote">Remote / Nearby</option>
                                    <option value="facility">Assisted Living Facility</option>
                                </select>
                            </div>
                        </div>

                        {formData.relationship === 'other' && (
                            <div className="filter-group fade-in-up" style={{ marginTop: '1.25rem' }}>
                                <label>Specify Relationship</label>
                                <input
                                    className="form-input-styled"
                                    type="text"
                                    placeholder="e.g. Neighbor, Friend"
                                    value={formData.custom_relationship}
                                    onChange={(e) => setFormData({ ...formData, custom_relationship: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-grid" style={{ marginTop: '1.5rem', rowGap: '2rem' }}>
                            <div className="filter-group">
                                <label>Care Basis</label>
                                <select
                                    className="form-input-styled"
                                    value={formData.care_context}
                                    onChange={(e) => setFormData({ ...formData, care_context: e.target.value })}
                                    required
                                >
                                    <option value="">Select Basis</option>
                                    <option value="Age-related memory support">Age-related memory support</option>
                                    <option value="Post-hospital recovery">Post-hospital recovery</option>
                                    <option value="Chronic condition support">Chronic condition support</option>
                                    <option value="Other / Not specified">Other / Not specified</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Consent Basis</label>
                                <select
                                    className="form-input-styled"
                                    value={formData.consent_basis}
                                    onChange={(e) => setFormData({ ...formData, consent_basis: e.target.value })}
                                    required
                                >
                                    <option value="">Select Basis</option>
                                    <option value="Patient has given informed consent">Patient has given informed consent</option>
                                    <option value="Legal guardian">Legal guardian</option>
                                    <option value="Family-based care (patient unable to consent)">Family-based care (patient unable to consent)</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-group" style={{ marginTop: '2.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                Living Risk Factors (Optional)
                            </label>
                            <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '18px', height: '18px' }}
                                        checked={formData.risk_lives_alone}
                                        onChange={(e) => setFormData({ ...formData, risk_lives_alone: e.target.checked })}
                                    /> LIVES ALONE
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '18px', height: '18px' }}
                                        checked={formData.risk_wandering}
                                        onChange={(e) => setFormData({ ...formData, risk_wandering: e.target.checked })}
                                    /> HISTORY OF WANDERING
                                </label>
                            </div>
                        </div>

                        <div className="filter-group" style={{ marginTop: '2.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                Additional Notes
                            </label>
                            <textarea
                                className="form-input-styled"
                                placeholder="Any additional background info for the administrator..."
                                style={{ minHeight: '100px', paddingTop: '1rem', marginTop: '0.75rem' }}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{
                        background: '#f8fafc',
                        padding: '1.75rem',
                        borderRadius: '20px',
                        border: '1.5px solid #e2e8f0',
                        marginBottom: '2.5rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                            <input
                                type="checkbox"
                                id="consent"
                                style={{
                                    marginTop: '0.3rem',
                                    width: '22px',
                                    height: '22px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--cg-primary)'
                                }}
                                checked={formData.consent}
                                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                            />
                            <label htmlFor="consent" style={{ fontSize: '0.925rem', lineHeight: '1.6', color: '#334155' }}>
                                <strong style={{ color: '#0f172a' }}>Mandatory Confirmation</strong><br />
                                I confirm I am responsible for this patient’s care and have obtained appropriate consent to manage their health data on Memoraid. I understand this account will be pending until verified by a system administrator.
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: '12px',
                            color: '#dc2626',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            className="btn-auth"
                            style={{ background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', width: 'auto', padding: '0.8rem 2rem' }}
                            onClick={() => navigate('/caregiver-dashboard')}
                        >
                            <ArrowLeft size={18} /> Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-auth"
                            disabled={loading || !formData.consent}
                            style={{ flexGrow: 1 }}
                        >
                            {loading ? 'Submitting...' : 'Initiate Linking Request'} <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </CaregiverLayout>
    );
};

export default PatientLinking;
