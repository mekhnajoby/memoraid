import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Activity
} from 'lucide-react';
import api from '../../services/api';

const RoutineCalendar = ({ patient }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [logs, setLogs] = useState([]);
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (patient?.id) {
            fetchDataForDate(selectedDate);
        }
    }, [selectedDate, patient?.id]);

    const fetchDataForDate = async (date) => {
        if (!patient?.id) return;
        setLoading(true);
        try {
            const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD sequence in any locale
            const [logsRes, routinesRes] = await Promise.all([
                api.get(`users/caregiver/logs/?patient_id=${patient.id}&date=${dateStr}`),
                api.get(`users/caregiver/routines/?patient_id=${patient.id}&date=${dateStr}`)
            ]);
            console.log('Calendar Data - Date:', dateStr);
            console.log('Calendar Data - Logs:', logsRes.data);
            console.log('Calendar Data - Routines:', routinesRes.data);
            setLogs(logsRes.data);
            setRoutines(routinesRes.data);
        } catch (err) {
            console.error('Error fetching calendar data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const isSameDay = (date1, date2) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 size={24} color="#10b981" />;
            case 'missed':
                return <XCircle size={24} color="#ef4444" />;
            case 'escalated':
                return <AlertCircle size={24} color="#6366f1" />;
            default:
                return <Activity size={24} color="#94a3b8" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return { bg: '#f0fdf4', border: '#dcfce7', text: '#059669' };
            case 'missed':
                return { bg: '#fef2f2', border: '#fee2e2', text: '#dc2626' };
            case 'escalated':
                return { bg: '#eef2ff', border: '#e0e7ff', text: '#6366f1' };
            default:
                return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'missed':
                return 'Missed';
            case 'escalated':
                return 'Acknowledged';
            case 'pending':
                return 'Pending';
            default:
                return 'Unknown';
        }
    };

    const days = getDaysInMonth(currentMonth);
    const today = new Date();

    // Merge routines with logs for selected date
    const tasksForSelectedDate = [
        // 1. Start with all existing logs (including those for deleted/deactivated routines)
        ...logs.map(log => ({
            id: log.routine,
            name: log.routine_name,
            time: log.routine_time || '00:00',
            icon: log.routine_icon || 'activity',
            status: log.status,
            logId: log.id
        })),
        // 2. Add pending entries ONLY for current active routines that weren't logged yet
        ...routines
            .filter(r => !logs.some(l => l.routine === r.id))
            .map(r => ({
                ...r,
                status: 'pending',
                logId: null
            }))
    ].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    const completedCount = tasksForSelectedDate.filter(t => ['completed', 'escalated'].includes(t.status)).length;
    const totalCount = tasksForSelectedDate.length;

    const handleAcknowledgeTask = async (task) => {
        try {
            const dateStr = selectedDate.toLocaleDateString('en-CA');
            if (task.logId) {
                // Update existing log
                await api.patch(`users/caregiver/logs/${task.logId}/`, {
                    status: 'escalated'
                });
            } else {
                // Create new log as escalated
                await api.post('users/caregiver/logs/', {
                    routine: task.id,
                    date: dateStr,
                    status: 'escalated'
                });
            }
            fetchDataForDate(selectedDate);
        } catch (err) {
            console.error('Error acknowledging task:', err);
        }
    };

    return (
        <div className="routine-calendar-container">
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Routine Calendar</h3>
                <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.25rem' }}>
                    View task history and completion status by date.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                {/* Calendar Section */}
                <div style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: '28px', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <button
                            onClick={previousMonth}
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <ChevronLeft size={20} color="#64748b" />
                        </button>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button
                            onClick={nextMonth}
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <ChevronRight size={20} color="#64748b" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} style={{ textAlign: 'center', fontWeight: '800', fontSize: '0.75rem', color: '#94a3b8', padding: '0.5rem' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                        {days.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} />;
                            }

                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, today);

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        background: isSelected ? 'var(--cg-accent)' : isToday ? '#f0fdf4' : '#fff',
                                        color: isSelected ? '#fff' : isToday ? '#10b981' : '#1e293b',
                                        border: isSelected ? 'none' : isToday ? '2px solid #10b981' : '1px solid #f1f5f9',
                                        transition: 'all 0.2s'
                                    }}
                                    className="calendar-day"
                                >
                                    {day.getDate()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Task List Section */}
                <div style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: '28px', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {completedCount} of {totalCount} tasks completed
                            </p>
                        </div>
                        <div style={{
                            background: '#f8fafc',
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <CalendarIcon size={20} color="var(--cg-accent)" />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            <Activity size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                            <p>Loading tasks...</p>
                        </div>
                    ) : tasksForSelectedDate.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <CalendarIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p style={{ fontWeight: '700' }}>No routines scheduled for this date</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                            {tasksForSelectedDate.map(task => {
                                const colors = getStatusColor(task.status);
                                return (
                                    <div
                                        key={task.id}
                                        style={{
                                            background: colors.bg,
                                            border: `1.5px solid ${colors.border}`,
                                            borderRadius: '16px',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                    >
                                        <div style={{ flexShrink: 0 }}>
                                            {getStatusIcon(task.status)}
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                                                {task.name}
                                            </h5>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                                                    {(() => {
                                                        if (!task.time || !task.time.includes(':')) return '--:--';
                                                        const [h, m] = task.time.split(':');
                                                        const hour = parseInt(h);
                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour % 12 || 12;
                                                        return `${displayHour}:${m} ${ampm}`;
                                                    })()}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '800',
                                                    color: colors.text,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {getStatusLabel(task.status)}
                                                </span>
                                            </div>
                                        </div>
                                        {['missed', 'pending'].includes(task.status) && (
                                            <button
                                                onClick={() => handleAcknowledgeTask(task)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#fff',
                                                    border: '1.5px solid var(--cg-accent)',
                                                    borderRadius: '10px',
                                                    color: 'var(--cg-accent)',
                                                    fontWeight: '800',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="btn-ack"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoutineCalendar;
