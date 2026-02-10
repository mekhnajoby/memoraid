import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldAlert,
    Bell,
    CheckCircle,
    Activity,
    ChevronRight,
    Clock,
    Zap,
    AlertTriangle,
    History as HistoryIcon,
    ChevronDown,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import CaregiverLayout from '../../components/CaregiverLayout';

const GlobalAlerts = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acknowledging, setAcknowledging] = useState(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            // Fetch all alerts (active and history) for all linked patients
            const response = await api.get('users/caregiver/alerts/');
            setAlerts(response.data);
        } catch (err) {
            console.error('Error fetching global alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId) => {
        setAcknowledging(alertId);
        try {
            await api.patch(`users/caregiver/alerts/${alertId}/`, { status: 'handled' });
            fetchAlerts();
        } catch (err) {
            console.error('Failed to acknowledge alert:', err);
        } finally {
            setAcknowledging(null);
        }
    };

    const activeAlerts = alerts.filter(a => a.status === 'active');
    const handledAlerts = alerts.filter(a => a.status === 'handled');

    return (
        <CaregiverLayout
            title="Alerts Center"
            subtitle="Monitor critical escalations and SOS triggers across all linked patients."
        >
            <div className="cg-alerts-full-container">
                {/* Active Alerts Section */}
                <section style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a', margin: 0 }}>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                    <AlertTriangle size={22} color="#ef4444" />
                                </div>
                                Active Escalations
                            </h3>
                        </div>
                    </div>

                    {loading ? (
                        <div className="cg-loading-state">
                            <Activity size={40} className="animate-spin" />
                            <p>Syncing live alerts...</p>
                        </div>
                    ) : activeAlerts.length === 0 ? (
                        <div className="cg-empty-state" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: '#f0fdf4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981',
                                marginBottom: '1.5rem'
                            }}>
                                <CheckCircle size={40} />
                            </div>
                            <h3>All Systems Stable</h3>
                            <p>There are no active alerts or unresolved SOS triggers at this time.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {activeAlerts.map((alert) => (
                                <div key={alert.id} className="cg-alert-item" style={{
                                    background: '#fff',
                                    padding: '2rem',
                                    borderRadius: '24px',
                                    border: '1.5px solid #f1f5f9',
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr auto',
                                    gap: '2rem',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '18px',
                                        background: alert.type === 'sos' ? '#fef2f2' : '#fffbeb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: alert.type === 'sos' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {alert.type === 'sos' ? <Zap size={28} /> : <AlertTriangle size={28} />}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                                                {alert.type === 'sos' ? 'SOS Emergency' : 'Missed Task Escalation'}
                                            </h4>
                                            <span style={{
                                                background: alert.type === 'sos' ? '#fee2e2' : '#fef3c7',
                                                color: alert.type === 'sos' ? '#991b1b' : '#92400e',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>
                                                {alert.type === 'sos' ? 'Critical' : 'High Priority'}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, color: '#445164', fontSize: '1rem', lineHeight: '1.5' }}>
                                            <strong>{alert.patient_name}:</strong> {
                                                alert.type === 'missed_task' && alert.routine_name && alert.routine_time
                                                    ? (() => {
                                                        const [hours, minutes] = alert.routine_time.split(':');
                                                        const hour = parseInt(hours);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        return `${alert.routine_name} at ${displayHour}:${minutes} ${ampm}`;
                                                    })()
                                                    : alert.message
                                            }
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                                                <Clock size={14} />
                                                <span>Escalation triggered on: {new Date(alert.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                            </div>
                                            {alert.latitude !== null && alert.longitude !== null && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        color: '#6366f1',
                                                        fontWeight: '700',
                                                        textDecoration: 'none',
                                                        background: '#eef2ff',
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <AlertCircle size={14} />
                                                    View Patient Location
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            className="btn-auth"
                                            style={{ width: 'auto', background: '#0f172a', color: '#fff', padding: '0.8rem 1.5rem' }}
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            disabled={acknowledging === alert.id}
                                        >
                                            {acknowledging === alert.id ? 'Processing...' : 'Acknowledge'}
                                        </button>
                                        <button
                                            className="btn-auth"
                                            style={{ width: 'auto', background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '0.8rem 1.5rem' }}
                                            onClick={() => navigate(`/caregiver/workspace/${alert.patient}/alerts`)}
                                        >
                                            Workspace <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Alerts History Section */}
                <section>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a' }}>
                            <div style={{ background: 'rgba(100, 116, 139, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <HistoryIcon size={22} color="#64748b" />
                            </div>
                            Alert History
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Previously handled escalations and system triggers.</p>
                    </div>

                    {handledAlerts.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>No historical alerts found.</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(isHistoryExpanded ? handledAlerts : handledAlerts.slice(0, 2)).map((alert) => (
                                    <AlertHistoryItem key={alert.id} alert={alert} />
                                ))}
                            </div>

                            {handledAlerts.length > 2 && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                                    <button
                                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                        style={{
                                            padding: '0.6rem 1.5rem',
                                            borderRadius: '12px',
                                            border: '1.5px solid #f1f5f9',
                                            background: '#fff',
                                            color: '#64748b',
                                            fontWeight: '700',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isHistoryExpanded ? 'Show Less History' : `View More History (${handledAlerts.length - 2} more)`}
                                        <ChevronDown size={18} style={{ transform: isHistoryExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            <footer style={{
                marginTop: '4rem',
                padding: '2.5rem 0',
                borderTop: '1.5px solid #f1f5f9',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem',
                color: '#64748b'
            }}>
                <div style={{
                    background: '#f8fafc',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    color: '#94a3b8',
                    display: 'flex'
                }}>
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontWeight: '800' }}>Care Protocols</h4>
                    <p style={{ margin: 0, fontSize: '1rem', maxWidth: '600px', lineHeight: '1.6' }}>
                        SOS alerts require immediate physical check. Missed routines warrant a welfare call to ensure patient safety and wellbeing.
                    </p>
                </div>
            </footer>
        </CaregiverLayout>
    );
};

const AlertHistoryItem = ({ alert }) => {
    const [expanded, setExpanded] = useState(false);

    const getTitle = () => {
        if (alert.type === 'sos') return 'Emergency Help Request';
        return 'Missed Care Routine';
    };

    const getContentLabel = () => {
        if (alert.type === 'sos') return 'Details:';
        return 'Task:';
    };

    // Get task details from routine fields or fallback to message
    const getTaskDetails = () => {
        if (alert.type === 'missed_task' && alert.routine_name && alert.routine_time) {
            // Format time from HH:MM:SS to 12-hour format
            const timeStr = alert.routine_time;
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${alert.routine_name} at ${displayHour}:${minutes} ${ampm}`;
        }
        // Fallback to message for legacy alerts or SOS
        return alert.message.replace('Acknowledged: ', '').replace('Missed Routine: ', '');
    };

    const taskDetails = getTaskDetails();

    return (
        <div style={{
            background: '#f8fafc',
            padding: '1.25rem 1.75rem',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#475569', fontWeight: '700' }}>
                            {getTitle()}
                        </h5>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• {alert.patient_name}</span>
                    </div>
                    {/* Show truncated task details if not expanded, full if expanded */}
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                        {expanded ? taskDetails : (taskDetails.length > 60 ? taskDetails.substring(0, 60) + '...' : taskDetails)}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Handled</div>
                    <small style={{ color: '#94a3b8' }}>{new Date(alert.created_at).toLocaleDateString()}</small>
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>{getContentLabel()}</strong> {taskDetails}</p>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Patient:</strong> {alert.patient_name}</p>
                    <p><strong>Escalation triggered on:</strong> {new Date(alert.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            )}

            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    padding: 0,
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}
            >
                {expanded ? 'Show Less' : 'View More'}
            </button>
        </div>
    );
};

export default GlobalAlerts;
