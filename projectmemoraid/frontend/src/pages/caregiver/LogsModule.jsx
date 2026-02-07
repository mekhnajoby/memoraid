import React, { useState, useEffect } from 'react';
import {
    History,
    Filter,
    Search,
    CheckCircle2,
    AlertCircle,
    Clock,
    Calendar as CalendarIcon,
    ChevronDown,
    Zap
} from 'lucide-react';
import api from '../../services/api';

const LogsModule = ({ patient }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        dateRange: 'today'
    });
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [patient.id, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Use new unified activity timeline endpoint
            const response = await api.get(`users/caregiver/activity/?patient_id=${patient.id}&status=${filters.type}`);
            setLogs(response.data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getLogIcon = (log) => {
        // Handle both task logs and alerts
        if (log.type === 'task') {
            switch (log.status) {
                case 'completed': return <CheckCircle2 size={18} color="#10b981" />;
                case 'missed':
                case 'escalated': return <Clock size={18} color="#f59e0b" />;
                default: return <History size={18} color="#64748b" />;
            }
        } else if (log.type === 'alert') {
            switch (log.status) {
                case 'sos': return <Zap size={18} color="#ef4444" />;
                case 'missed_task': return <AlertCircle size={18} color="#f59e0b" />;
                default: return <AlertCircle size={18} color="#ef4444" />;
            }
        }
        return <History size={18} color="#64748b" />;
    };

    return (
        <div className="admin-module-container" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <History size={22} color="var(--cg-accent)" /> Activity Timeline
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Accountability and care monitoring for {patient.full_name}.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="filter-group" style={{ width: '160px' }}>
                        <select
                            className="form-input-styled"
                            style={{ padding: '0.6rem 2.5rem 0.6rem 1rem', height: '42px', fontSize: '0.85rem' }}
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="all">All Events</option>
                            <option value="completed">Completed Tasks</option>
                            <option value="missed">Missed Routines</option>
                            <option value="alert">Alerts & SOS</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">
                    <p>Loading timeline...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="empty-state">
                    <History size={48} color="#e2e8f0" style={{ marginBottom: '1.5rem' }} />
                    <p style={{ fontWeight: '600', color: '#64748b' }}>No activity recorded for this period.</p>
                </div>
            ) : (
                <div className="logs-timeline" style={{ position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: '19px',
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: '#f1f5f9'
                    }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {(isExpanded ? logs : logs.slice(0, 2)).map((log) => (
                            <div key={log.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#fff',
                                    border: '2px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1,
                                    flexShrink: 0
                                }}>
                                    {getLogIcon(log)}
                                </div>
                                <div style={{
                                    flexGrow: 1,
                                    background: '#fff',
                                    padding: '1.25rem 1.75rem',
                                    borderRadius: '20px',
                                    border: '1px solid #f1f5f9',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
                                            {log.routine_name || 'Care Event'}
                                        </h4>
                                        <small style={{ color: '#94a3b8', fontWeight: '600' }}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                                        {log.type === 'task' ? (
                                            log.status === 'completed' ? (
                                                log.handled_by_role === 'patient'
                                                    ? `Successfully completed by the patient.`
                                                    : `Marked as completed by ${log.handled_by_name || 'Caregiver'}.`
                                            ) : log.status === 'missed' ? 'Routine task was not acknowledged or completed on time.' :
                                                log.status === 'escalated' ? `Escalated and acknowledged by ${log.handled_by_name || 'Caregiver'}.` :
                                                    'Activity recorded.'
                                        ) : log.type === 'alert' ? (
                                            log.status === 'sos'
                                                ? `SOS emergency alert triggered. ${log.alert_status === 'handled' ? `Handled by ${log.handled_by_name || 'Caregiver'}.` : 'Awaiting response.'}`
                                                : `Missed task alert. ${log.alert_status === 'handled' ? `Acknowledged by ${log.handled_by_name || 'Caregiver'}.` : 'Pending acknowledgment.'}`
                                        ) : 'Activity recorded.'}
                                    </p>
                                    {log.notes && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: '#f8fafc',
                                            borderRadius: '10px',
                                            borderLeft: '3px solid #cbd5e1',
                                            fontSize: '0.85rem',
                                            color: '#475569'
                                        }}>
                                            "{log.notes}"
                                        </div>
                                    )}
                                    {log.message && log.type === 'alert' && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: '#fef3c7',
                                            borderRadius: '10px',
                                            borderLeft: '3px solid #f59e0b',
                                            fontSize: '0.85rem',
                                            color: '#92400e'
                                        }}>
                                            <strong>Alert Details:</strong> {log.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {logs.length > 2 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{
                                    padding: '0.7rem 1.5rem',
                                    borderRadius: '12px',
                                    border: '1.5px solid #f1f5f9',
                                    background: '#fff',
                                    color: '#64748b',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isExpanded ? 'Show Less' : `View More Activity (${logs.length - 2} more)`}
                                <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LogsModule;
