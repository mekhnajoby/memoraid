import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Bell,
    Calendar,
    Plus,
    ChevronRight,
    ChevronDown,
    User,
    Heart,
    Clock,
    Activity,
    ShieldAlert,
    CheckCircle,
    AlertTriangle,
    ClipboardList,
    Zap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import CaregiverLayout from '../../components/CaregiverLayout';
import { getUser } from '../../utils/auth';

const CaregiverDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
    const [data, setData] = useState({
        patients: [],
        recent_alerts: [],
        total_pending_today: 0,
        total_active_alerts: 0,
        is_primary: false
    });
    const [loading, setLoading] = useState(true);
    const [acknowledging, setAcknowledging] = useState(null);
    const [showAlertsExpanded, setShowAlertsExpanded] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        // Poll every 30 seconds for live alert updates
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('users/caregiver/stats/');
            setData(response.data);
        } catch (err) {
            console.error('Error fetching caregiver stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId) => {
        setAcknowledging(alertId);
        try {
            await api.patch(`users/caregiver/alerts/${alertId}/`, { status: 'handled' });
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to acknowledge alert:', err);
        } finally {
            setAcknowledging(null);
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

    const totalPatients = data.patients.length;
    const completedToday = data.patients.reduce((acc, p) => {
        const totalRoutines = p.pending_tasks + (p.completed_tasks || 0);
        return acc + (totalRoutines - p.pending_tasks);
    }, 0);

    const statsCards = [
        {
            title: 'Linked Patients',
            value: totalPatients,
            label: 'Active Care Links',
            icon: <Users size={28} />,
            color: '#6366f1',
            bg: '#eff6ff'
        },
        {
            title: 'Active Alerts',
            value: data.total_active_alerts,
            label: 'Requires Attention',
            icon: <ShieldAlert size={28} />,
            color: data.total_active_alerts > 0 ? '#ef4444' : '#10b981',
            bg: data.total_active_alerts > 0 ? '#fef2f2' : '#f0fdf4'
        },
        {
            title: 'Needs Attention',
            value: data.patients.filter(p => p.status === 'attention' || p.status === 'alert').length,
            label: 'High Priority Patients',
            icon: <AlertTriangle size={28} />,
            color: '#f59e0b',
            bg: '#fffbeb'
        }
    ];

    return (
        <CaregiverLayout title="" subtitle="">
            {/* Success Notification */}
            {successMessage && (
                <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #10b981',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', padding: '0.25rem', display: 'flex' }}>
                            <CheckCircle size={20} />
                        </div>
                        <p style={{ margin: 0, color: '#065f46', fontWeight: '600' }}>{successMessage}</p>
                    </div>
                    <button
                        onClick={() => setSuccessMessage('')}
                        style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: '800', fontSize: '1.2rem' }}
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Welcome Banner */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={async () => {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            window.location.reload();
                        } else {
                            alert("Notifications are blocked in your browser settings.");
                        }
                    }}
                    className="btn-notification-trigger"
                    style={{
                        fontSize: '0.75rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontWeight: '600'
                    }}
                >
                    Enable Browser Notifications
                </button>
            </div>
            <div className="cg-welcome-banner">
                <div className="cg-welcome-content">
                    <div className="cg-welcome-badge">
                        <Activity size={20} />
                        <span>Memoraid | Caregiver Workspace</span>
                    </div>
                    <h1>Welcome back, {getUser()?.full_name?.split(' ')[0]}</h1>
                    <p>Monitor your patient network and manage daily care priorities from this central hub.</p>
                </div>
                <div className="cg-welcome-decoration"></div>
            </div>

            {/* Stats Cards Grid */}
            <div className="cg-stats-grid">
                {statsCards.map((card, index) => (
                    <div key={index} className="cg-stat-card">
                        <div className="cg-stat-icon" style={{ background: card.bg, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className="cg-stat-info">
                            <h3>{card.title}</h3>
                            <div className="cg-stat-value" style={{ color: card.color }}>
                                {loading ? '...' : card.value}
                            </div>
                            <span className="cg-stat-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid: Patients + Alerts Sidebar */}
            <div className="cg-main-grid">
                {/* Patient Network Section */}
                <main className="cg-patients-section">
                    <div className="cg-section-header">
                        <div>
                            <h2>My Patients</h2>
                            <p>Recent patients and their current care status.</p>
                        </div>
                        <Link to="/caregiver/my-patients" className="btn-enter-workspace" style={{ fontSize: '0.95rem' }}>
                            View All Patients <ChevronRight size={18} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="cg-loading-state">
                            <Activity size={40} className="animate-spin" />
                            <p>Loading patient data...</p>
                        </div>
                    ) : data.patients.length === 0 ? (
                        <div className="cg-empty-state">
                            <Users size={56} />
                            <h3>No Patient Links</h3>
                            <p>You are not currently linked to any patient records.</p>
                            {data.is_primary && (
                                <Link to="/caregiver/link-patient" className="btn-auth" style={{ marginTop: '1.5rem' }}>
                                    Link Your First Patient
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="cg-patient-grid">
                            {data.patients.filter(p => p.status !== 'pending').slice(0, 2).map((patient) => {
                                const statusStyle = getStatusStyles(patient.status);
                                return (
                                    <div
                                        key={patient.id}
                                        className="cg-patient-card"
                                        onClick={() => navigate(`/caregiver/workspace/${patient.id}`)}
                                    >
                                        <div className="cg-patient-header">
                                            <div className="cg-patient-avatar">
                                                <User size={32} />
                                            </div>
                                            <div className="cg-patient-info">
                                                <h4>{patient.full_name}</h4>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>
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

                                        <div className="cg-patient-stats">
                                            <div className="cg-patient-stat">
                                                <ClipboardList size={18} />
                                                <span><strong>{patient.completed_tasks || 0} of {(patient.pending_tasks || 0) + (patient.completed_tasks || 0) + (patient.missed_tasks || 0)}</strong> tasks</span>
                                            </div>
                                            <div className="cg-patient-stat" style={{ color: patient.active_alerts > 0 ? '#ef4444' : '#64748b' }}>
                                                <Bell size={18} />
                                                <span><strong>{patient.active_alerts}</strong> Alerts</span>
                                            </div>
                                        </div>

                                        <div className="cg-patient-condition-stage" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                            <div style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
                                                <Heart size={14} color="#6366f1" />
                                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>
                                                    {patient.condition === 'alzheimers' ? "Alzheimer's" :
                                                        patient.condition ? patient.condition.charAt(0).toUpperCase() + patient.condition.slice(1).toLowerCase() :
                                                            'General Care'}
                                                </span>
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #fff, #f8fafc)', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#475569' }}>
                                                    {patient.stage ? patient.stage.charAt(0).toUpperCase() + patient.stage.slice(1).toLowerCase() : 'Mild'}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.3rem', fontWeight: '700' }}>Stage</span>
                                            </div>
                                        </div>

                                        <div className="cg-patient-card-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                                            <button className="btn-enter-workspace" style={{
                                                width: '100%',
                                                padding: '0.9rem',
                                                borderRadius: '14px',
                                                fontSize: '1rem',
                                                background: 'var(--cg-primary)',
                                                color: '#ffffff',
                                                border: 'none',
                                                fontWeight: '800',
                                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                                                textAlign: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                Open Workspace
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pending Requests Section */}
                    {!loading && data.patients.filter(p => p.status === 'pending').length > 0 && (
                        <div style={{ marginTop: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <Clock size={20} style={{ color: '#f59e0b' }} />
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Pending Approvals</h3>
                            </div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {data.patients.filter(p => p.status === 'pending').map(request => (
                                    <div
                                        key={request.id}
                                        style={{
                                            background: '#fffbeb',
                                            border: '1px solid #fef3c7',
                                            borderRadius: '16px',
                                            padding: '1.25rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ margin: '0 0 0.25rem 0', color: '#92400e' }}>{request.full_name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309' }}>
                                                Awaiting administrator verification • Sent {new Date(request.requested_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div style={{
                                            padding: '0.5rem 1rem',
                                            background: '#fff',
                                            borderRadius: '10px',
                                            border: '1px solid #fde68a',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            color: '#d97706'
                                        }}>
                                            PENDING
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                {/* Alerts Sidebar */}
                <aside className={`cg-alerts-sidebar ${data.recent_alerts.length > 0 ? 'urgent' : ''}`}>
                    <div className="cg-alerts-header" style={{ cursor: 'pointer' }} onClick={() => navigate('/caregiver/alerts')}>
                        <ShieldAlert size={22} />
                        <h3>Alerts Status</h3>
                        {data.recent_alerts.length > 0 && (
                            <span style={{
                                background: '#ef4444',
                                color: '#fff',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: '800'
                            }}>
                                {data.recent_alerts.length}
                            </span>
                        )}
                        <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </div>

                    <div className="cg-alerts-list">
                        {loading ? (
                            <p className="cg-alerts-loading">Syncing alerts...</p>
                        ) : data.recent_alerts.length === 0 ? (
                            <div className="cg-alerts-empty">
                                <div className="cg-alerts-empty-icon">
                                    <CheckCircle size={24} />
                                </div>
                                <p>All Clear</p>
                                <span>No active alerts or SOS events.</span>
                            </div>
                        ) : (
                            <>
                                {(showAlertsExpanded ? data.recent_alerts : data.recent_alerts.slice(0, 2)).map((alert) => (
                                    <div key={alert.id} className="cg-alert-item">
                                        <div className="cg-alert-type">
                                            {alert.type === 'sos' ? <Zap size={16} /> : <Clock size={16} />}
                                            <span>{alert.type === 'sos' ? 'SOS' : 'Missed Task'}</span>
                                            <small>Escalation triggered on: {new Date(alert.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</small>
                                        </div>
                                        <p className="cg-alert-message">
                                            <strong>{alert.patient_name}:</strong> {alert.message}
                                        </p>
                                        <div className="cg-alert-actions">
                                            <button
                                                className="cg-alert-ack-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    acknowledgeAlert(alert.id);
                                                }}
                                                disabled={acknowledging === alert.id}
                                            >
                                                {acknowledging === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                                            </button>
                                            <button
                                                className="cg-alert-view-btn"
                                                onClick={() => navigate(`/caregiver/workspace/${alert.patient}/alerts`)}
                                            >
                                                View <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {data.recent_alerts.length > 2 && (
                                    <button
                                        onClick={() => setShowAlertsExpanded(!showAlertsExpanded)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: '#f8fafc',
                                            border: '1px dashed #e2e8f0',
                                            borderRadius: '12px',
                                            color: '#64748b',
                                            fontWeight: '700',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            marginTop: '0.5rem',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                                        onMouseOut={(e) => e.target.style.background = '#f8fafc'}
                                    >
                                        {showAlertsExpanded ? 'Show Less' : `View More (${data.recent_alerts.length - 2} more)`}
                                        <ChevronDown size={14} style={{ transform: showAlertsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                </aside>
            </div>
        </CaregiverLayout>
    );
};

export default CaregiverDashboard;
