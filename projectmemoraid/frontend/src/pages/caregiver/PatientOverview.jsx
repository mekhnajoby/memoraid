import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp,
    Calendar,
    Check
} from 'lucide-react';
import api from '../../services/api';

const PatientOverview = ({ patient, onRefresh }) => {
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        missed: 0,
        escalated: 0,
        total: 0,
        nextTask: 'Loading...',
    });
    const [marking, setMarking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [patient.id]);

    const fetchStats = async () => {
        try {
            const res = await api.get(`users/caregiver/stats/`);
            // The stats view returns a list of patients with their specific stats
            const pStats = res.data.patients.find(p => p.id === patient.id);
            if (pStats) {
                setStats({
                    pending: pStats.pending_tasks || 0,
                    completed: pStats.completed_tasks || 0,
                    missed: pStats.missed_tasks || 0,
                    escalated: pStats.escalated_tasks || 0,
                    total: pStats.total_tasks || 0,
                    nextTask: pStats.next_task || 'No more routines',
                    nextTaskTime: pStats.next_task_time || '--:--',
                    nextTaskId: pStats.next_task_id
                });
            }
        } catch (err) {
            console.error('Error fetching overview stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!patient || loading) return (
        <div style={{ height: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontWeight: '600', color: '#64748b' }}>Syncing care stats...</p>
        </div>
    );

    const handleMarkCompleted = async () => {
        if (!stats.nextTaskId || marking) return;

        setMarking(true);
        try {
            await api.post('users/caregiver/logs/', {
                routine: stats.nextTaskId,
                status: 'completed',
                date: new Date().toISOString().split('T')[0],
                notes: 'Completed via Overview Quick-Action'
            });
            if (onRefresh) onRefresh();
            fetchStats();
        } catch (err) {
            console.error('Error marking task completed:', err);
            setError('Only primary caregivers may perform this quick-action. Please coordinate with the workspace owner.');
        } finally {
            setMarking(false);
        }
    };

    const getUrgencyStyles = () => {
        if (stats.nextTaskTime.includes('Tomorrow')) {
            return { bg: '#f8fafc', color: '#6366f1', label: 'Up Next (Tomorrow)', border: '#eef2ff' };
        }

        const now = new Date();
        const timePart = stats.nextTaskTime.split(' ')[0]; // Handle cases like "08:00 (Tomorrow)" if it somehow gets through
        const [hours, minutes] = timePart.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);

        const diffMinutes = (taskTime - now) / (1000 * 60);

        if (diffMinutes < 0) {
            return { bg: '#fef2f2', color: '#ef4444', label: 'OVERDUE', border: '#fee2e2' };
        } else if (diffMinutes < 30) {
            return { bg: '#fffbeb', color: '#f59e0b', label: 'DUE SOON', border: '#fef3c7' };
        }
        return { bg: '#f8fafc', color: '#6366f1', label: 'Scheduled Routine', border: '#eef2ff' };
    };

    const urgency = getUrgencyStyles();

    return (
        <div className="patient-overview-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Daily Care Progress</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>Overview of today's routines and health priorities.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #eef2ff' }}>
                    <Calendar size={20} color="#6366f1" />
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
                <div style={{ background: '#f0fdf4', padding: '2rem', borderRadius: '24px', border: '1.5px solid #dcfce7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#fff', padding: '0.6rem', borderRadius: '12px', color: '#10b981' }}>
                            <CheckCircle size={24} />
                        </div>
                        <span style={{ fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Completed</span>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: '#065f46' }}>
                        {stats.completed + stats.escalated} <span style={{ fontSize: '1.5rem', opacity: 0.6, fontWeight: '600' }}>of {stats.total}</span>
                    </div>
                    <p style={{ margin: '0.5rem 0 0', color: '#059669', fontWeight: '600' }}>
                        {stats.escalated > 0 ? `${stats.completed} Done • ${stats.escalated} Handled` : 'Routines done today'}
                    </p>
                </div>

                <div style={{ background: '#fffbeb', padding: '2rem', borderRadius: '24px', border: '1.5px solid #fef3c7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#fff', padding: '0.6rem', borderRadius: '12px', color: '#f59e0b' }}>
                            <ClipboardList size={24} />
                        </div>
                        <span style={{ fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Upcoming</span>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: '#92400e' }}>{stats.pending}</div>
                    <p style={{ margin: '0.5rem 0 0', color: '#d97706', fontWeight: '600' }}>Future routines today</p>
                </div>

                <div style={{ background: '#fef2f2', padding: '2rem', borderRadius: '24px', border: '1.5px solid #fee2e2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#fff', padding: '0.6rem', borderRadius: '12px', color: '#ef4444' }}>
                            <AlertCircle size={24} />
                        </div>
                        <span style={{ fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Due/Missed</span>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: '#991b1b' }}>{stats.missed}</div>
                    <p style={{ margin: '0.5rem 0 0', color: '#dc2626', fontWeight: '600' }}>Tasks requiring check-in</p>
                </div>
            </div>

            <div style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: '32px', padding: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '14px', color: '#6366f1' }}>
                            <Clock size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Up Next</h3>
                    </div>
                    {stats.nextTaskId && (
                        <button
                            onClick={handleMarkCompleted}
                            disabled={marking}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                opacity: marking ? 0.7 : 1,
                                transition: 'all 0.2s'
                            }}
                            className="btn-complete-quick"
                        >
                            {marking ? 'Updating...' : <><Check size={18} /> Mark Completed</>}
                        </button>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.75rem',
                    background: urgency.bg,
                    borderRadius: '20px',
                    border: `1.5px solid ${urgency.border}`,
                    transition: 'all 0.3s'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '800',
                            color: urgency.color,
                            background: '#fff',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '12px',
                            boxShadow: `0 4px 12px ${urgency.color}20`
                        }}>
                            {stats.nextTaskTime}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.nextTask}</h4>
                            <p style={{ color: urgency.color, margin: '0.25rem 0 0', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {urgency.label}
                            </p>
                        </div>
                    </div>
                    <TrendingUp size={24} color={urgency.color} style={{ opacity: 0.6 }} />
                </div>
            </div>

            {error && (
                <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="admin-modal-content" style={{ maxWidth: '400px', borderRadius: '24px', padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{ background: '#fef2f2', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 1.5rem' }}>
                            <AlertCircle size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>Action Required</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>{error}</p>
                        <button onClick={() => setError(null)} className="btn-auth" style={{ width: '100%', borderRadius: '14px' }}>Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientOverview;
