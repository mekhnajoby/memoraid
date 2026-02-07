import React, { useState, useEffect } from 'react';
import {
    Bell,
    History,
    AlertCircle,
    CheckCircle,
    Clock,
    AlertTriangle,
    Zap,
    History as HistoryIcon,
    ChevronDown
} from 'lucide-react';
import api from '../../services/api';

const AlertsModule = ({ patient }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, [patient.id]);

    const fetchAlerts = async () => {
        try {
            const response = await api.get(`users/caregiver/alerts/?patient_id=${patient.id}`);
            setAlerts(response.data);
        } catch (err) {
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (id) => {
        try {
            const alertToAck = alerts.find(a => a.id === id);
            const message = alertToAck ? `Ack: ${alertToAck.message}` : undefined;

            await api.patch(`users/caregiver/alerts/${id}/`, {
                status: 'handled',
                message: message
            });
            fetchAlerts();
        } catch (err) {
            setError('Failed to acknowledge alert. Ensure you have network connectivity.');
        }
    };

    const activeAlerts = alerts.filter(a => a.status === 'active');
    const handledAlerts = alerts.filter(a => a.status === 'handled');

    return (
        <div className="admin-module-container" style={{ marginTop: 0 }}>
            <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.2rem' }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a', margin: 0 }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <AlertTriangle size={22} color="#ef4444" />
                            </div>
                            Critical Escalations
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Active SOS and time-critical care events for {patient.full_name}.</p>
                    </div>
                </div>

                {activeAlerts.length === 0 ? (
                    <div className="empty-state" style={{ background: '#f8fafc', border: '1.5px dashed #e2e8f0', padding: '3rem' }}>
                        <CheckCircle size={40} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem' }}>Zero Pulse Alerts</p>
                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>All patient safety monitors are currently stable.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {activeAlerts.map((alert) => (
                            <div key={alert.id} className="routine-item" style={{
                                background: '#ffffff',
                                border: '1.5px solid #fee2e2',
                                padding: '1.5rem',
                                borderRadius: '24px',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '16px',
                                    background: alert.type === 'sos' ? '#fef2f2' : '#fffbeb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {alert.type === 'sos' ? <Zap size={24} color="#ef4444" /> : <Clock size={24} color="#f59e0b" />}
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>
                                            {alert.type === 'sos' ? 'SOS EMERGENCY TRIGGERED' : 'ROUTINE TASK MISSED'}
                                        </h5>
                                        <span style={{
                                            padding: '0.25rem 0.6rem',
                                            background: alert.type === 'sos' ? '#fee2e2' : '#fef3c7',
                                            color: alert.type === 'sos' ? '#991b1b' : '#92400e',
                                            borderRadius: '6px',
                                            fontSize: '0.65rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>
                                            Priority High
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#445164', lineHeight: '1.5' }}>{alert.message}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                                            <Clock size={12} />
                                            <small style={{ fontWeight: '600' }}>Escalation triggered on: {new Date(alert.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</small>
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
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textDecoration: 'none',
                                                    background: '#eef2ff',
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                <AlertCircle size={12} />
                                                View Patient Location
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="btn-auth"
                                    style={{ width: 'auto', background: '#0f172a', color: '#fff', padding: '0.7rem 1.4rem', borderRadius: '12px', fontSize: '0.9rem' }}
                                    onClick={() => acknowledgeAlert(alert.id)}
                                >
                                    Acknowledge
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

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

            {/* Error Modal */}
            {error && (
                <div className="admin-modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="admin-modal-content" style={{ maxWidth: '400px', borderRadius: '24px', padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{ background: '#fef2f2', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 1.5rem' }}>
                            <AlertCircle size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>Action Failed</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>{error}</p>
                        <button onClick={() => setError(null)} className="btn-auth" style={{ width: '100%', borderRadius: '14px' }}>Dismiss</button>
                    </div>
                </div>
            )}
        </div>
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
        return alert.message.replace('Ack: ', '').replace('Missed Routine: ', '');
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
                    <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: '#475569', fontWeight: '700' }}>
                        {getTitle()}
                    </h5>
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

export default AlertsModule;
