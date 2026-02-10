import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Plus,
    Clock,
    Activity,
    MoreVertical,
    Trash2,
    CheckCircle2,
    Circle,
    AlertCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import RoutineCalendar from './RoutineCalendar';
const CalendarPicker = ({ selectedDate, onDateChange }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
    const today = new Date();

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        const date1 = d1 instanceof Date ? d1 : new Date(d1);
        const date2 = d2 instanceof Date ? d2 : new Date(d2);
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '1.5rem', marginTop: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}>
                    <ChevronLeft size={18} color="#64748b" />
                </button>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', padding: '0.4rem', display: 'flex' }}>
                    <ChevronRight size={18} color="#64748b" />
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', padding: '0.5rem', textTransform: 'uppercase' }}>{d}</div>
                ))}
                {days.map((day, i) => {
                    const isSelected = day && isSameDay(day, selectedDate);
                    const isToday = day && isSameDay(day, today);
                    return (
                        <div
                            key={i}
                            onClick={() => day && onDateChange(day.toISOString().split('T')[0])}
                            style={{
                                padding: '0.6rem 0',
                                textAlign: 'center',
                                cursor: day ? 'pointer' : 'default',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                background: isSelected ? 'var(--cg-accent)' : isToday ? '#f0fdf4' : 'none',
                                color: isSelected ? '#fff' : isToday ? '#10b981' : '#475569',
                                border: isToday && !isSelected ? '1.5px solid #10b981' : 'none',
                                opacity: day ? 1 : 0,
                                transition: 'all 0.2s'
                            }}
                            className={day ? "calendar-day-picker-cell" : ""}
                        >
                            {day ? day.getDate() : ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RoutineManagerModule = ({ patient, onRefresh }) => {
    const [routines, setRoutines] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRoutine, setNewRoutine] = useState({
        name: '',
        time: '08:00',
        frequency: 'daily',
        days_of_week: [0, 1, 2, 3, 4, 5, 6], // Default all days for Every Day
        notes: '',
        icon: 'activity',
        patient: patient.id,
        alert_interval: 5,
        max_response_window: 30,
        escalation_enabled: true,
        target_date: ''
    });
    const [editingRoutine, setEditingRoutine] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
    const [error, setError] = useState(null);
    const [dataVersion, setDataVersion] = useState(0); // Tracks data mutations for calendar refresh

    // Permission Check: Only Primary Caregivers can edit definitions
    const canEdit = patient.care_level?.toLowerCase().includes('primary');

    useEffect(() => {
        fetchData();
    }, [patient.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const [routinesRes, logsRes] = await Promise.all([
                api.get(`users/caregiver/routines/?patient_id=${patient.id}`),
                api.get(`users/caregiver/logs/?patient_id=${patient.id}&date=${today}`)
            ]);
            setRoutines(routinesRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            console.error('Error fetching routine data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoutine = async (e) => {
        e.preventDefault();
        // Validation
        if (!newRoutine.name.trim()) return setError('Routine name is required.');
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newRoutine.time)) return setError('Invalid time format (HH:MM).');

        // Time validation: prevent creating routines with past times for today
        if (newRoutine.time && newRoutine.time.includes(':')) {
            const now = new Date();
            const [hours, minutes] = newRoutine.time.split(':').map(Number);
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            if (scheduledTime < now) {
                return setError('Cannot create a routine with a past time. Please select a future time.');
            }
        }

        try {
            await api.post('users/caregiver/routines/', newRoutine);
            setShowAddModal(false);
            setNewRoutine({ name: '', time: '08:00', frequency: 'daily', days_of_week: [0, 1, 2, 3, 4, 5, 6], notes: '', icon: 'activity', patient: patient.id });
            fetchData();
            setDataVersion(v => v + 1);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditRoutine = async (e) => {
        e.preventDefault();
        if (!editingRoutine.name.trim()) return setError('Routine name is required.');
        const timeToValidate = editingRoutine.time.length > 5 ? editingRoutine.time.substring(0, 5) : editingRoutine.time;
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeToValidate)) return setError('Invalid time format (HH:MM).');

        if (timeToValidate && timeToValidate.includes(':')) {
            const now = new Date();
            const [hours, minutes] = timeToValidate.split(':').map(Number);
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            if (scheduledTime < now) {
                return setError('Cannot set a routine time in the past. Please select a future time.');
            }
        }

        try {
            // Sanitize payload: only send fields that are editable
            const payload = {
                name: editingRoutine.name,
                time: editingRoutine.time.length === 5 ? `${editingRoutine.time}:00` : editingRoutine.time,
                frequency: editingRoutine.frequency,
                days_of_week: editingRoutine.days_of_week || [],
                notes: editingRoutine.notes || '',
                icon: editingRoutine.icon || 'activity',
                is_active: editingRoutine.is_active ?? true,
                alert_interval: editingRoutine.alert_interval,
                max_response_window: editingRoutine.max_response_window,
                escalation_enabled: editingRoutine.escalation_enabled
            };
            await api.patch(`users/caregiver/routines/${editingRoutine.id}/`, payload);
            setShowEditModal(false);
            setEditingRoutine(null);
            fetchData();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update routine.';
            setError(`Action Failed: ${msg}`);
        }
    };

    const handleToggleTask = async (routineId, currentStatus) => {
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const existingLog = logs.find(l => l.routine === routineId);

            if (existingLog) {
                // Update existing log
                await api.patch(`users/caregiver/logs/${existingLog.id}/`, {
                    status: currentStatus === 'completed' ? 'pending' : 'completed'
                });
            } else {
                // Create new log
                await api.post('users/caregiver/logs/', {
                    routine: routineId,
                    date: today,
                    status: 'completed'
                });
            }
            fetchData();
            setDataVersion(v => v + 1);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Error toggling task status:', err);
            const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update task status.';
            setError(`Action Failed: ${msg}`);
        }
    };

    const handleDeleteRoutine = async (id) => {
        try {
            await api.delete(`users/caregiver/routines/${id}/`);
            fetchData();
            setDataVersion(v => v + 1);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Error deleting routine:', err);
            setError('Failed to delete routine. Ensure you are the primary caregiver for this patient.');
        }
    };

    const [view, setView] = useState('tasks'); // 'tasks', 'routines', or 'calendar'

    // Merge routines with today's logs
    // 1. Start with defined routines
    const activeTasks = routines.map(r => {
        const log = logs.find(l => l.routine === r.id);
        return {
            ...r,
            status: log ? log.status : 'pending'
        };
    });

    // 2. Add completed/escalated logs that don't have an active routine (deleted routines)
    const ghostTasks = logs
        .filter(l => !routines.some(r => r.id === l.routine) && ['completed', 'escalated'].includes(l.status))
        .map(l => ({
            id: `ghost-${l.id}`,
            routine_id: l.routine,
            name: l.routine_name || 'Deleted Routine',
            time: l.routine_time || '00:00',
            status: l.status,
            icon: l.routine_icon || 'activity',
            is_ghost: true
        }));

    const dailyTasks = [...activeTasks, ...ghostTasks]
        .filter(r => {
            if (r.is_ghost) return true; // Always show historical completions

            // Filter by frequency/date for Today's Tracker
            const now = new Date();
            const currentWeekday = now.getDay();
            const memoraidWeekday = currentWeekday === 0 ? 6 : currentWeekday - 1;

            if (r.frequency === 'weekly') {
                if (!r.days_of_week || !r.days_of_week.includes(memoraidWeekday)) return false;
            } else if (r.frequency === 'once') {
                const todayStr = now.toLocaleDateString('en-CA');
                if (r.target_date !== todayStr) return false;
            }

            // Exclude routines created today AFTER their scheduled time
            const createdDate = new Date(r.created_at);
            if (r.time && r.time.includes(':')) {
                const [hours, minutes] = r.time.split(':').map(Number);
                const scheduledTimeToday = new Date();
                scheduledTimeToday.setHours(hours, minutes, 0, 0);

                if (createdDate.toDateString() === now.toDateString()) {
                    if (createdDate > scheduledTimeToday) return false;
                }
            }
            return true;
        })
        .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    return (
        <div className="admin-module-container" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div
                        onClick={() => setView('tasks')}
                        style={{
                            cursor: 'pointer',
                            paddingBottom: '0.75rem',
                            borderBottom: view === 'tasks' ? '4px solid var(--cg-accent)' : '4px solid transparent',
                            color: view === 'tasks' ? '#0f172a' : '#94a3b8',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Today's Care Tracker
                    </div>
                    <div
                        onClick={() => setView('routines')}
                        style={{
                            cursor: 'pointer',
                            paddingBottom: '0.75rem',
                            borderBottom: view === 'routines' ? '4px solid var(--cg-accent)' : '4px solid transparent',
                            color: view === 'routines' ? '#0f172a' : '#94a3b8',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Routine Builder
                    </div>
                    <div
                        onClick={() => setView('calendar')}
                        style={{
                            cursor: 'pointer',
                            paddingBottom: '0.75rem',
                            borderBottom: view === 'calendar' ? '4px solid var(--cg-accent)' : '4px solid transparent',
                            color: view === 'calendar' ? '#0f172a' : '#94a3b8',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Routine Calendar
                    </div>
                </div>
                {view === 'routines' && canEdit && (
                    <button className="btn-auth" style={{ width: 'auto', padding: '0.8rem 2.5rem', borderRadius: '14px', fontSize: '1rem' }} onClick={() => setShowAddModal(true)}>
                        <Plus size={20} /> Create New Plan
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Synchronizing care schedule...</p>
                </div>
            ) : view === 'tasks' ? (
                <div className="daily-tasks-view">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Daily Execution</h3>
                            <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.25rem' }}>
                                Monitoring {dailyTasks.length} routines for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.
                            </p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: '800', color: '#10b981' }}>{dailyTasks.filter(t => t.status === 'completed').length}</span>
                            <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>/</span>
                            <span style={{ fontWeight: '800', color: '#64748b' }}>{dailyTasks.length} Done</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {dailyTasks.length === 0 ? (
                            <div className="empty-state" style={{ background: '#f8fafc', border: '2px dashed #e2e8f0', padding: '5rem' }}>
                                <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                                <p style={{ fontWeight: '800', color: '#475569', fontSize: '1.2rem' }}>No routines scheduled for today.</p>
                                <p style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '400px', margin: '0.5rem auto 0' }}>Switch to the 'Routine Builder' to set up the patient's care plan.</p>
                            </div>
                        ) : (
                            dailyTasks.map((t) => (
                                <div key={t.id} className="routine-item" style={{
                                    background: t.status === 'completed' ? '#f0fdf4' : '#ffffff',
                                    padding: '2rem',
                                    borderRadius: '28px',
                                    border: t.status === 'completed' ? '1.5px solid #dcfce7' : '1.5px solid #f1f5f9',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2rem'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '20px',
                                        background: t.status === 'completed' ? '#fff' : '#f8fafc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: t.status === 'completed' ? '#10b981' : 'var(--cg-accent)',
                                        flexShrink: 0,
                                        boxShadow: t.status === 'completed' ? '0 4px 10px rgba(16, 185, 129, 0.1)' : 'none'
                                    }}>
                                        {t.status === 'completed' ? <CheckCircle2 size={32} /> : <Activity size={32} />}
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '800' }}>{t.name}</h4>
                                            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '0.2rem 0.75rem', borderRadius: '6px' }}>
                                                {(() => {
                                                    if (!t.time || !t.time.includes(':')) return '--:--';
                                                    const [h, m] = t.time.split(':');
                                                    const hour = parseInt(h);
                                                    const ampm = hour >= 12 ? 'PM' : 'AM';
                                                    const displayHour = hour % 12 || 12;
                                                    return `${displayHour}:${m} ${ampm}`;
                                                })()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Circle size={14} color={t.status === 'completed' ? '#10b981' : t.status === 'missed' ? '#ef4444' : t.status === 'escalated' ? '#6366f1' : '#cbd5e1'} fill={t.status === 'completed' ? '#10b981' : t.status === 'missed' ? '#ef4444' : t.status === 'escalated' ? '#6366f1' : 'none'} />
                                            <span style={{ fontSize: '0.9rem', color: t.status === 'completed' ? '#059669' : t.status === 'missed' ? '#dc2626' : t.status === 'escalated' ? '#6366f1' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {t.status === 'completed' ? 'Task Completed' : t.status === 'missed' ? 'Missed Routine' : t.status === 'escalated' ? 'ACKNOWLEDGED BY CAREGIVER' : 'Waiting for Execution'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {t.status !== 'escalated' ? (
                                            <button
                                                className="btn-auth"
                                                onClick={() => handleToggleTask(t.id, t.status)}
                                                style={{
                                                    width: 'auto',
                                                    background: t.status === 'completed' ? '#ffffff' : '#10b981',
                                                    color: t.status === 'completed' ? '#10b981' : '#ffffff',
                                                    border: t.status === 'completed' ? '2px solid #10b981' : 'none',
                                                    padding: '0.8rem 2.5rem',
                                                    borderRadius: '16px',
                                                    fontSize: '1rem',
                                                    fontWeight: '800'
                                                }}
                                            >
                                                {t.status === 'completed' ? 'Undo Completion' : 'Mark Completed'}
                                            </button>
                                        ) : (
                                            <div style={{
                                                padding: '0.8rem 2.5rem',
                                                borderRadius: '16px',
                                                fontSize: '1rem',
                                                fontWeight: '800',
                                                color: '#6366f1',
                                                border: '2.5px dashed rgba(99, 102, 241, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'rgba(99, 102, 241, 0.05)'
                                            }}>
                                                <Activity size={18} /> Acknowledged
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : view === 'routines' ? (
                <div className="routine-definitions-view">
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Master Care Plan</h3>
                        <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.25rem' }}>Define static routines that repeat automatically across the patient schedule.</p>
                    </div>

                    <div className="routine-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                        {routines.map((r) => (
                            <div key={r.id} className="routine-item" style={{ padding: '2.5rem', background: '#fff', borderRadius: '28px', border: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '50px', height: '50px', background: '#eff6ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                        <Clock size={28} />
                                    </div>
                                    <div className="routine-time" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--cg-accent)', background: '#f8fafc', padding: '0.4rem 1rem', borderRadius: '10px', border: '1px solid #eef2ff' }}>
                                        {(() => {
                                            if (!r.time || !r.time.includes(':')) return '--:--';
                                            const [h, m] = r.time.split(':');
                                            const hour = parseInt(h);
                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                            const displayHour = hour % 12 || 12;
                                            return `${displayHour}:${m} ${ampm}`;
                                        })()}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem', flexGrow: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '800' }}>{r.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                        <span style={{ color: '#64748b', textTransform: 'uppercase', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                            {r.frequency === 'daily' ? 'Every Day' : r.frequency === 'weekly' ? 'Specific Days' : r.frequency === 'once' ? 'Specific Date' : 'Flexible / Custom'}
                                        </span>
                                    </div>
                                    {r.frequency === 'once' && r.target_date && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--cg-accent)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Calendar size={14} /> {new Date(r.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    )}
                                    {r.frequency === 'weekly' && r.days_of_week && (
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '0.75rem' }}>
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                                                const isSelected = r.days_of_week.includes(idx);
                                                return (
                                                    <div key={idx} style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        background: isSelected ? 'var(--cg-accent)' : '#f1f5f9',
                                                        color: isSelected ? '#fff' : '#94a3b8'
                                                    }}>
                                                        {day}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {r.notes && (
                                        <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--cg-accent)' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', fontStyle: 'italic' }}>
                                                "{r.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {canEdit && (
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => { setEditingRoutine(r); setShowEditModal(true); }}
                                            style={{
                                                background: '#fff',
                                                border: '1.5px solid #e2e8f0',
                                                color: '#475569',
                                                cursor: 'pointer',
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.9rem',
                                                fontWeight: '700',
                                                transition: 'all 0.2s'
                                            }}
                                            className="btn-item-action"
                                        >
                                            <MoreVertical size={18} /> Edit Plan
                                        </button>
                                        <button
                                            onClick={() => setConfirmAction({
                                                message: `Are you sure you want to delete "${r.name}"? This will remove it from all future schedules.`,
                                                onConfirm: () => handleDeleteRoutine(r.id)
                                            })}
                                            style={{
                                                background: '#fef2f2',
                                                border: '1.5px solid #fee2e2',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.9rem',
                                                fontWeight: '700'
                                            }}
                                            className="btn-item-action-danger"
                                        >
                                            <Trash2 size={18} /> Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <RoutineCalendar key={dataVersion} patient={patient} />
            )
            }

            {
                showAddModal && (
                    <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%', borderRadius: '32px', padding: '3.5rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', color: '#0f172a' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '16px', display: 'flex' }}>
                                    <Clock size={28} color="var(--cg-accent)" />
                                </div>
                                New Routine Plan
                            </h2>
                            <form onSubmit={handleAddRoutine}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '2.5rem' }}>
                                    {/* Left Column: Identifiers & Scheduling */}
                                    <div>
                                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ROUTINE NAME</label>
                                            <input
                                                type="text"
                                                required
                                                className="form-input-styled"
                                                style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}
                                                placeholder="e.g., Morning Medication"
                                                value={newRoutine.name}
                                                onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem' }}>
                                            <div className="form-group" style={{ flexGrow: 1 }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>TIME</label>
                                                <input
                                                    type="time"
                                                    required
                                                    className="form-input-styled"
                                                    style={{ marginTop: '0.5rem' }}
                                                    value={newRoutine.time}
                                                    onChange={(e) => setNewRoutine({ ...newRoutine, time: e.target.value })}
                                                />
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                                                    {(() => {
                                                        const [h, m] = newRoutine.time.split(':');
                                                        const hour = parseInt(h);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        return `${displayHour}:${m} ${ampm}`;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ flexGrow: 1 }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>Frequency</label>
                                                <select
                                                    value={newRoutine.frequency}
                                                    onChange={(e) => setNewRoutine({ ...newRoutine, frequency: e.target.value })}
                                                    className="form-input-styled"
                                                    style={{ marginTop: '0.5rem', backgroundPosition: 'right 1rem center' }}
                                                >
                                                    <option value="daily">Every Day</option>
                                                    <option value="weekly">Specific Days</option>
                                                    <option value="once">Specific Date</option>
                                                </select>
                                            </div>
                                        </div>

                                        {newRoutine.frequency === 'once' && (
                                            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>CHOOSE DATE</label>
                                                <CalendarPicker
                                                    selectedDate={newRoutine.target_date}
                                                    onDateChange={(date) => setNewRoutine({ ...newRoutine, target_date: date })}
                                                />
                                            </div>
                                        )}

                                        {newRoutine.frequency === 'weekly' && (
                                            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>SELECT DAYS</label>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                                                        const isSelected = newRoutine.days_of_week.includes(idx);
                                                        return (
                                                            <div
                                                                key={idx}
                                                                onClick={() => {
                                                                    const newDays = isSelected
                                                                        ? newRoutine.days_of_week.filter(d => d !== idx)
                                                                        : [...newRoutine.days_of_week, idx];
                                                                    setNewRoutine({ ...newRoutine, days_of_week: newDays });
                                                                }}
                                                                style={{
                                                                    padding: '0.6rem 1rem',
                                                                    borderRadius: '12px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: '700',
                                                                    transition: 'all 0.2s',
                                                                    background: isSelected ? 'var(--cg-accent)' : '#f8fafc',
                                                                    color: isSelected ? '#fff' : '#64748b',
                                                                    border: isSelected ? 'none' : '1.5px solid #e2e8f0',
                                                                    textAlign: 'center',
                                                                    flexGrow: 1
                                                                }}
                                                            >
                                                                {day}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Instructions & Rules */}
                                    <div>
                                        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>INSTRUCTIONS / NOTES</label>
                                            <textarea
                                                className="form-input-styled"
                                                style={{ marginTop: '0.5rem', minHeight: '120px', resize: 'vertical', padding: '1.25rem' }}
                                                placeholder="e.g., Take with water, check pulse before administering..."
                                                value={newRoutine.notes}
                                                onChange={(e) => setNewRoutine({ ...newRoutine, notes: e.target.value })}
                                            />
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <AlertCircle size={20} color="var(--cg-accent)" />
                                                Alert & Escalation Rules
                                            </h3>
                                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                                <div className="form-group" style={{ flexGrow: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>REPEAT EVERY (MINS)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="form-input-styled"
                                                        style={{ marginTop: '0.5rem' }}
                                                        value={newRoutine.alert_interval}
                                                        onChange={(e) => setNewRoutine({ ...newRoutine, alert_interval: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ flexGrow: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>MAX WAIT (MINS)</label>
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        className="form-input-styled"
                                                        style={{ marginTop: '0.5rem' }}
                                                        value={newRoutine.max_response_window}
                                                        onChange={(e) => setNewRoutine({ ...newRoutine, max_response_window: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="checkbox"
                                                    id="escalation-enabled"
                                                    checked={newRoutine.escalation_enabled}
                                                    onChange={(e) => setNewRoutine({ ...newRoutine, escalation_enabled: e.target.checked })}
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                                <label htmlFor="escalation-enabled" style={{ fontSize: '0.95rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
                                                    Enable Caregiver Escalation if missed
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                    <button type="button" className="btn-auth" style={{ background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', width: 'auto', padding: '1rem 3rem', borderRadius: '18px', fontWeight: '700' }} onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-auth" style={{ width: 'auto', padding: '1rem 4rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '800' }}>
                                        Establish Routine
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Edit Modal */}
            {
                showEditModal && editingRoutine && (
                    <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%', borderRadius: '32px', padding: '3.5rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', color: '#0f172a' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '16px', display: 'flex' }}>
                                    <Clock size={28} color="var(--cg-accent)" />
                                </div>
                                Update Routine
                            </h2>
                            <form onSubmit={handleEditRoutine}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '2.5rem' }}>
                                    {/* Left Column: Identifiers & Scheduling */}
                                    <div>
                                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>Routine Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="form-input-styled"
                                                style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}
                                                value={editingRoutine.name}
                                                onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem' }}>
                                            <div className="form-group" style={{ flexGrow: 1 }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>Time</label>
                                                <input
                                                    type="time"
                                                    required
                                                    className="form-input-styled"
                                                    style={{ marginTop: '0.5rem' }}
                                                    value={editingRoutine.time.substring(0, 5)}
                                                    onChange={(e) => setEditingRoutine({ ...editingRoutine, time: e.target.value })}
                                                />
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                                                    {(() => {
                                                        if (!editingRoutine.time || !editingRoutine.time.includes(':')) return '--:--';
                                                        const [h, m] = editingRoutine.time.split(':');
                                                        const hour = parseInt(h);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        return `${displayHour}:${m} ${ampm}`;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ flexGrow: 1 }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>Frequency</label>
                                                <select
                                                    value={editingRoutine.frequency}
                                                    onChange={(e) => setEditingRoutine({ ...editingRoutine, frequency: e.target.value })}
                                                    className="form-input-styled"
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    <option value="daily">Every Day</option>
                                                    <option value="weekly">Specific Days</option>
                                                    <option value="once">Specific Date</option>
                                                </select>
                                            </div>
                                        </div>

                                        {editingRoutine.frequency === 'once' && (
                                            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>CHOOSE DATE</label>
                                                <CalendarPicker
                                                    selectedDate={editingRoutine.target_date}
                                                    onDateChange={(date) => setEditingRoutine({ ...editingRoutine, target_date: date })}
                                                />
                                            </div>
                                        )}

                                        {editingRoutine.frequency === 'weekly' && (
                                            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>SELECT DAYS</label>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                                                        const isSelected = (editingRoutine.days_of_week || []).includes(idx);
                                                        return (
                                                            <div
                                                                key={idx}
                                                                onClick={() => {
                                                                    const currentDays = editingRoutine.days_of_week || [];
                                                                    const newDays = isSelected
                                                                        ? currentDays.filter(d => d !== idx)
                                                                        : [...currentDays, idx];
                                                                    setEditingRoutine({ ...editingRoutine, days_of_week: newDays });
                                                                }}
                                                                style={{
                                                                    padding: '0.6rem 1rem',
                                                                    borderRadius: '12px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: '700',
                                                                    transition: 'all 0.2s',
                                                                    background: isSelected ? 'var(--cg-accent)' : '#f8fafc',
                                                                    color: isSelected ? '#fff' : '#64748b',
                                                                    border: isSelected ? 'none' : '1.5px solid #e2e8f0',
                                                                    textAlign: 'center',
                                                                    flexGrow: 1
                                                                }}
                                                            >
                                                                {day}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Instructions & Rules */}
                                    <div>
                                        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>INSTRUCTIONS / NOTES</label>
                                            <textarea
                                                className="form-input-styled"
                                                style={{ marginTop: '0.5rem', minHeight: '120px', resize: 'vertical', padding: '1.25rem' }}
                                                placeholder="e.g., Take with water, check pulse before administering..."
                                                value={editingRoutine.notes}
                                                onChange={(e) => setEditingRoutine({ ...editingRoutine, notes: e.target.value })}
                                            />
                                        </div>

                                        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <AlertCircle size={20} color="var(--cg-accent)" />
                                                Alert & Escalation Rules
                                            </h3>
                                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                                <div className="form-group" style={{ flexGrow: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>REPEAT EVERY (MINS)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="form-input-styled"
                                                        style={{ marginTop: '0.5rem' }}
                                                        value={editingRoutine.alert_interval}
                                                        onChange={(e) => setEditingRoutine({ ...editingRoutine, alert_interval: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ flexGrow: 1 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px' }}>MAX WAIT (MINS)</label>
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        className="form-input-styled"
                                                        style={{ marginTop: '0.5rem' }}
                                                        value={editingRoutine.max_response_window}
                                                        onChange={(e) => setEditingRoutine({ ...editingRoutine, max_response_window: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="checkbox"
                                                    id="edit-escalation-enabled"
                                                    checked={editingRoutine.escalation_enabled}
                                                    onChange={(e) => setEditingRoutine({ ...editingRoutine, escalation_enabled: e.target.checked })}
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                                <label htmlFor="edit-escalation-enabled" style={{ fontSize: '0.95rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
                                                    Enable Caregiver Escalation if missed
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                    <button type="button" className="btn-auth" style={{ background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', width: 'auto', padding: '1rem 3rem', borderRadius: '18px', fontWeight: '700' }} onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-auth" style={{ width: 'auto', padding: '1rem 4rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '800' }}>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Custom Confirmation Modal */}
            {
                confirmAction && (
                    <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
                        <div className="admin-modal-content" style={{ maxWidth: '450px', borderRadius: '28px', padding: '3rem', textAlign: 'center' }}>
                            <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 2rem' }}>
                                <AlertCircle size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Confirm Action</h3>
                            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem' }}>{confirmAction.message}</p>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <button onClick={() => setConfirmAction(null)} className="btn-auth" style={{ background: '#f1f5f9', color: '#64748b', border: 'none', flexGrow: 1 }}>Cancel</button>
                                <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="btn-auth" style={{ background: '#ef4444', color: '#fff', border: 'none', flexGrow: 1 }}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error Modal */}
            {
                error && (
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
                )
            }
        </div >
    );
};

export default RoutineManagerModule;
