import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    ChevronRight,
    User,
    Heart,
    Bell,
    ClipboardList,
    Activity,
    CheckCircle,
    AlertTriangle,
    Clock,
    Zap,
    ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import CaregiverLayout from '../../components/CaregiverLayout';
import { getUser } from '../../utils/auth';

const MyPatients = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({
        patients: [],
        is_primary: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('users/caregiver/stats/');
            setData(response.data);
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'alert': return { label: 'Alert Active', color: '#ef4444', bg: '#fef2f2', icon: <Zap size={14} /> };
            case 'attention': return { label: 'Needs Attention', color: '#f59e0b', bg: '#fffbeb', icon: <AlertTriangle size={14} /> };
            case 'pending': return { label: 'Pending Approval', color: '#64748b', bg: '#f8fafc', icon: <Clock size={14} /> };
            default: return { label: 'Stable', color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle size={14} /> };
        }
    };

    return (
        <CaregiverLayout
            title="My Patients"
            subtitle="Recent patients and their current care status."
        >
            <div className="cg-section-header" style={{ marginBottom: '2.5rem' }}>
                <div style={{ visibility: 'hidden' }}>Spacer</div>
                {data.is_primary && (
                    <Link to="/caregiver/link-patient" className="btn-auth cg-link-btn" style={{ margin: 0 }}>
                        <Plus size={18} /> Link New Patient
                    </Link>
                )}
            </div>

            {/* Caregiver Account Status Banner */}
            {!loading && getUser()?.status === 'pending' && (
                <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)'
                }}>
                    <div style={{ background: '#f59e0b', color: '#fff', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#92400e', fontSize: '1.1rem' }}>Account Verification Pending</h4>
                        <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Your caregiver account is currently being reviewed by our administration.
                            While you can still link patients, your ability to manage their workspace will be activated once your profile is verified.
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="cg-loading-state">
                    <Activity size={40} className="animate-spin" />
                    <p>Loading patient records...</p>
                </div>
            ) : (
                <>
                    {/* Active Patients Section */}
                    <div style={{ marginBottom: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ background: '#eef2ff', padding: '0.5rem', borderRadius: '8px' }}>
                                <Heart size={20} style={{ color: '#6366f1' }} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Active Patients</h3>
                        </div>

                        {data.patients.filter(p => p.status !== 'pending').length === 0 ? (
                            <div className="cg-empty-state" style={{ padding: '3rem', background: '#fff', border: '1px dashed #e2e8f0' }}>
                                <Users size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ color: '#94a3b8', maxWidth: '300px', margin: '0 auto' }}>
                                    No active patients linked to your account yet.
                                </p>
                            </div>
                        ) : (
                            <div className="cg-patient-grid">
                                {data.patients.filter(p => p.status !== 'pending').map((patient) => {
                                    const statusStyle = getStatusStyles(patient.status);
                                    return (
                                        <div
                                            key={patient.id}
                                            className="cg-patient-card"
                                            onClick={() => navigate(`/caregiver/workspace/${patient.id}`)}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2.5rem' }}
                                        >
                                            <div className="cg-patient-header" style={{ marginBottom: 0 }}>
                                                <div className="cg-patient-avatar">
                                                    <User size={32} />
                                                </div>
                                                <div className="cg-patient-info">
                                                    <h4>{patient.full_name}</h4>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                                                            ID: {patient.patient_id || '—'}
                                                        </code>
                                                    </div>
                                                    <div className="cg-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                                        {statusStyle.icon}
                                                        <span>{statusStyle.label}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="cg-chevron" />
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <div className="cg-patient-stat" style={{ border: 'none', padding: 0 }}>
                                                    <ClipboardList size={18} style={{ color: '#64748b' }} />
                                                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}><strong style={{ color: '#0f172a' }}>{patient.pending_tasks}</strong> Pending</span>
                                                </div>
                                                <div className="cg-patient-stat" style={{ border: 'none', padding: 0, color: patient.active_alerts > 0 ? '#ef4444' : '#64748b' }}>
                                                    <Bell size={18} />
                                                    <span style={{ fontSize: '0.9rem' }}><strong>{patient.active_alerts}</strong> Alerts</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <Heart size={14} style={{ color: '#6366f1' }} />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                                                        {patient.condition === 'alzheimers' ? "Alzheimer's" :
                                                            patient.condition ? patient.condition.charAt(0).toUpperCase() + patient.condition.slice(1).toLowerCase() :
                                                                'Not specified'}
                                                    </span>
                                                </div>
                                                {patient.stage && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: '#fff', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                                                            {patient.stage.charAt(0).toUpperCase() + patient.stage.slice(1).toLowerCase()}
                                                        </span>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8' }}>Stage</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ marginTop: 'auto' }}>
                                                <button className="btn-auth" style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                    Open Workspace
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* My Requests Tracker Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ background: '#fef3c7', padding: '0.5rem', borderRadius: '8px' }}>
                                <Clock size={20} style={{ color: '#d97706' }} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>My Requests</h3>
                        </div>

                        {data.patients.filter(p => p.status === 'pending').length === 0 ? (
                            <div className="cg-empty-state" style={{ padding: '3rem', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                <Clock size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p style={{ color: '#94a3b8', maxWidth: '300px', margin: '0 auto' }}>
                                    No pending linking requests. Use the "Link New Patient" button to start a new care connection.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {data.patients.filter(p => p.status === 'pending').map((request) => (
                                    <div
                                        key={request.id}
                                        className="cg-patient-card pending"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1.75rem',
                                            padding: '2.5rem',
                                            borderLeft: '6px solid #f59e0b',
                                            background: '#fff',
                                            width: '100%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '14px', color: '#f59e0b' }}>
                                                    <User size={32} />
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: '800' }}>{request.full_name}</h4>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500' }}>{request.email}</span>
                                                        <span style={{ width: '5px', height: '5px', background: '#e2e8f0', borderRadius: '50%' }}></span>
                                                        <span style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: '600' }}>ID: {request.patient_id || 'Generating...'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ padding: '8px 20px', background: '#fff7ed', borderRadius: '24px', fontSize: '0.85rem', fontWeight: '900', border: '1px solid #ffedd5', color: '#ea580c', letterSpacing: '0.05em' }}>
                                                UNDER REVIEW BY ADMIN
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: '800', letterSpacing: '0.05em' }}>Relationship</label>
                                                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>{request.relationship || 'Not specified'}</span>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: '800', letterSpacing: '0.05em' }}>Care Basis</label>
                                                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', display: 'block' }}>
                                                    {request.care_basis || 'Not specified'}
                                                </span>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', fontWeight: '800', letterSpacing: '0.05em' }}>Consent Basis</label>
                                                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>{request.consent_basis || 'Legal Guardian'}</span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '10px', color: '#64748b' }}>
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, fontWeight: '600' }}>
                                                        Initiated on {new Date(request.requested_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Verified timestamp sync pending</p>
                                                </div>
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', maxWidth: '300px', textAlign: 'right' }}>
                                                Security check in progress. You will be notified once access is granted.
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </CaregiverLayout>
    );
};

export default MyPatients;
