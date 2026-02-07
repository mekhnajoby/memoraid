import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    CheckCircle2,
    Circle,
    ChevronLeft,
    Activity,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { getUser } from '../utils/auth';
import './Dashboard.css';

const PatientRoutines = () => {
    const navigate = useNavigate();
    const [routines, setRoutines] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = getUser();

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [routinesRes, logsRes] = await Promise.all([
                api.get('users/caregiver/routines/'), // Reusing caregiver endpoint which filters by patient in backend
                api.get(`users/caregiver/logs/?date=${today}`)
            ]);
            setRoutines(routinesRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            console.error('Error fetching patient routines:', err);
            setError('Failed to load your care schedule.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCompleteTask = async (routineId) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const existingLog = logs.find(l => l.routine === routineId);

            if (!existingLog) {
                await api.post('users/caregiver/logs/', {
                    routine: routineId,
                    date: today,
                    status: 'completed',
                    handled_by: user.id // Mark as completed by patient
                });
                fetchData();
            }
        } catch (err) {
            setError('Failed to mark task as completed.');
        }
    };

    const dailyTasks = routines.map(r => {
        const log = logs.find(l => l.routine === r.id);
        return {
            ...r,
            status: log ? log.status : 'pending'
        };
    }).filter(r => {
        // Exclude routines created today AFTER their scheduled time
        const now = new Date();
        const createdDate = new Date(r.created_at);
        const [hours, minutes] = r.time.split(':').map(Number);
        const scheduledTimeToday = new Date();
        scheduledTimeToday.setHours(hours, minutes, 0, 0);

        if (createdDate.toDateString() === now.toDateString()) {
            if (createdDate > scheduledTimeToday) return false;
        }
        return true;
    }).sort((a, b) => a.time.localeCompare(b.time));

    return (
        <div className="dashboard-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <nav className="dashboard-nav" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={() => navigate('/patient-dashboard')}
                        style={{ background: '#f1f5f9', border: 'none', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', display: 'flex' }}
                    >
                        <ChevronLeft size={24} color="#64748b" />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>My Daily Care</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 2rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <p style={{ color: '#64748b', fontSize: '1.2rem' }}>Loading your schedule...</p>
                    </div>
                ) : error ? (
                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '2rem', borderRadius: '24px', textAlign: 'center' }}>
                        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                        <p style={{ color: '#b91c1c', fontWeight: '700', margin: 0 }}>{error}</p>
                        <button onClick={fetchData} className="btn-auth" style={{ marginTop: '1.5rem', width: 'auto' }}>Try Again</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {dailyTasks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                                <Clock size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                                <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '600' }}>No activities scheduled for today.</p>
                            </div>
                        ) : (
                            dailyTasks.map(task => (
                                <div key={task.id} style={{
                                    background: task.status === 'completed' ? '#f0fdf4' : '#fff',
                                    padding: '2.5rem',
                                    borderRadius: '32px',
                                    border: task.status === 'completed' ? '2px solid #dcfce7' : '2px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2.5rem',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                                    opacity: task.status === 'completed' ? 0.8 : 1,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '24px',
                                        background: task.status === 'completed' ? '#fff' : '#f0f9ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: task.status === 'completed' ? '#10b981' : '#0369a1',
                                        flexShrink: 0
                                    }}>
                                        {task.status === 'completed' ? <CheckCircle2 size={40} /> : <Activity size={40} />}
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--cg-accent)', marginBottom: '0.5rem' }}>
                                            {task.time.substring(0, 5)}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: '#0f172a' }}>{task.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                                            <Circle size={16} color={task.status === 'completed' ? '#10b981' : '#cbd5e1'} fill={task.status === 'completed' ? '#10b981' : 'none'} />
                                            <span style={{ fontSize: '1rem', color: task.status === 'completed' ? '#059669' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>
                                                {task.status === 'completed' ? 'Done' : 'Not Done Yet'}
                                            </span>
                                        </div>
                                    </div>
                                    {task.status === 'pending' && (
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            style={{
                                                background: '#10b981',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '1.5rem 3rem',
                                                borderRadius: '24px',
                                                fontSize: '1.25rem',
                                                fontWeight: '900',
                                                cursor: 'pointer',
                                                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            Done
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientRoutines;
