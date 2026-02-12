import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { preventBackNavigation, logout, getUser } from '../utils/auth';
import { CheckCircle, AlertCircle, Heart, Users, LogOut, Clock, Calendar, Bell } from 'lucide-react';
import api from '../services/api';
import { requestForToken, onMessageListener } from '../firebase';
import './PatientDashboard.css';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const user = getUser();

    // Role guard: only patients can access this dashboard
    if (user && user.role !== 'patient') {
        return <Navigate to="/dashboard" replace />;
    }

    const [profile, setProfile] = useState(null);
    const [network, setNetwork] = useState(null);
    const [memories, setMemories] = useState([]);
    const [nextTask, setNextTask] = useState(null);
    const [summary, setSummary] = useState({ done: 0, remaining: 0 });
    const [sosSent, setSosSent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notification, setNotification] = useState(null); // { title, body }
    const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');

    const fetchData = async () => {
        try {
            const today = new Date().toLocaleDateString('en-CA');
            const timestamp = Date.now(); // Cache buster
            const [meRes, netRes, routinesRes, logsRes, memoriesRes] = await Promise.all([
                api.get(`users/me/?t=${timestamp}`),
                api.get('users/caregiver/network/'),
                api.get(`users/caregiver/routines/?date=${today}`),
                api.get(`users/caregiver/logs/?date=${today}`),
                api.get('users/caregiver/memories/')
            ]);

            setProfile(meRes.data.patient_profile);
            setMemories(memoriesRes.data || []);
            setNetwork(netRes.data);

            // Calculate Tasks
            const routines = routinesRes.data;
            const logs = logsRes.data;

            // Map routines to their log status
            const fullSchedule = routines.map(r => {
                const log = logs.find(l => l.routine === r.id);
                return {
                    ...r,
                    status: log ? log.status : 'pending',
                    log_id: log ? log.id : null
                };
            }).sort((a, b) => a.time.localeCompare(b.time));

            // Exclude both completed AND escalated tasks from "Next Task"
            const remainingTasks = fullSchedule.filter(t => t.status === 'pending' || t.status === 'missed');

            // Count only completed tasks for "done" count
            const doneCount = logs.filter(l => l.status === 'completed').length;
            const handledCount = logs.filter(l => l.status === 'escalated').length;

            if (remainingTasks.length > 0) {
                setNextTask(remainingTasks[0]);
            } else {
                setNextTask(null);
            }

            setSummary({
                done: doneCount,
                handled: handledCount,
                remaining: remainingTasks.length,
                total: fullSchedule.length,
                schedule: fullSchedule
            });
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch patient data:', err);
            setLoading(false);
        }
    };

    const setupFCM = async () => {
        try {
            const currentToken = await requestForToken();
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                await api.post('/users/fcm-token/', { token: currentToken });
            } else {
                console.log('No FCM token available. Request permission to generate one.');
            }
        } catch (err) {
            console.error('Failed to get FCM token or send to backend:', err);
        }
    };

    useEffect(() => {
        console.log('Current notification permission:', notifPermission);
        preventBackNavigation();
        fetchData();
        setupFCM();

        // Listen for foreground messages
        onMessageListener().then(payload => {
            if (!payload) return;
            console.log('Received foreground message:', payload);
            setNotification({
                title: payload.notification?.title || "Notification",
                body: payload.notification?.body || ""
            });
            // Auto hide notification after 10s
            setTimeout(() => setNotification(null), 10000);
            // Refresh data as it might be a routine reminder update
            fetchData();
        }).catch(err => console.log('FCM Listener failed: ', err));

        // Refresh every 10 seconds for faster profile and task updates
        const interval = setInterval(() => {
            fetchData();
            setCurrentTime(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const getTaskStatus = () => {
        if (!nextTask) return 'normal';

        const now = currentTime;
        const [hours, minutes] = nextTask.time.split(':');
        const taskTime = new Date();
        taskTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const diffMinutes = (taskTime - now) / 60000;

        // If task is in the past and still pending, it's missed
        if (diffMinutes < 0) return 'missed';

        // If task is within 30 minutes, it's upcoming (orange)
        if (diffMinutes <= 30) return 'upcoming';

        return 'normal';
    };

    const taskStatus = getTaskStatus();

    const handleComplete = async () => {
        if (!nextTask) return;
        try {
            const today = new Date().toLocaleDateString('en-CA');

            if (nextTask.log_id) {
                // Update existing log
                await api.patch(`users/caregiver/logs/${nextTask.log_id}/`, {
                    status: 'completed'
                });
            } else {
                // Create new log if none exists, but handle possible race contentions
                try {
                    await api.post('users/caregiver/logs/', {
                        routine: nextTask.id,
                        status: 'completed',
                        date: today
                    });
                } catch (postErr) {
                    console.log("POST failed, attempting recovery...", postErr);

                    // If log was created by background process, fetch it and update
                    try {
                        const logsRes = await api.get(`users/caregiver/logs/?date=${today}`);
                        const logs = logsRes.data;
                        const existingLog = logs.find(l => l.routine === nextTask.id);

                        if (existingLog) {
                            console.log("Found existing log, patching instead:", existingLog.id);
                            await api.patch(`users/caregiver/logs/${existingLog.id}/`, {
                                status: 'completed'
                            });
                        } else {
                            throw postErr; // Re-throw if not found
                        }
                    } catch (retryErr) {
                        console.error("Retry failed:", retryErr);
                        throw postErr;
                    }
                }
            }
            fetchData();
        } catch (err) {
            console.error('Failed to complete task:', err);
            let msg = "Could not update task. Please check your connection.";
            if (err.response) {
                if (err.response.status === 400 || err.response.status === 500) {
                    msg = "Task update failed. Please try refreshing the page.";
                }
            }
            alert(msg);
        }
    };

    const [sosSending, setSosSending] = useState(false);

    const handleSOS = async () => {
        if (sosSending) return;
        setSosSending(true);

        const sendAlert = async (lat = null, lng = null) => {
            try {
                await api.post('users/caregiver/alerts/', {
                    type: 'sos',
                    message: 'Patient requested immediate help via dashboard.',
                    latitude: lat,
                    longitude: lng
                });
                setSosSent(true);
                setTimeout(() => {
                    setSosSent(false);
                    setSosSending(false);
                }, 10000);
            } catch (err) {
                console.error('Failed to send SOS:', err);
                setSosSending(false);
                const errorMsg = err.response?.data?.error || err.message || "Connection error";
                alert(`Could not send help request: ${errorMsg}. Please try calling your caregiver directly if possible.`);
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("Location captured:", position.coords.latitude, position.coords.longitude);
                    sendAlert(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error.code, error.message);
                    // Still send SOS even if location fails
                    sendAlert();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            console.warn("Geolocation not supported by this browser.");
            sendAlert();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) return <div className="patient-dashboard">Loading...</div>;

    const primaryCaregiver = network?.team?.find(m => m.role.toLowerCase().includes('primary'));
    const familiarName = profile?.familiar_name || user?.full_name || 'Achamma';

    return (
        <div className="patient-dashboard">
            <div className="patient-dashboard-header">
                <div className="pd-header-left">
                    <button className="btn-sos" onClick={handleSOS} disabled={sosSending}>
                        <AlertCircle size={24} />
                        {sosSending ? 'Sending...' : 'I NEED HELP'}
                    </button>
                </div>

                <div className="pd-header-right">
                    <button
                        className={`btn-notif-pill ${notifPermission === 'granted' ? 'granted' : ''}`}
                        onClick={async () => {
                            if (!("Notification" in window)) {
                                alert("This browser does not support desktop notifications");
                                return;
                            }
                            if (notifPermission === 'granted') {
                                alert("Notifications are already enabled!");
                                return;
                            }
                            const permission = await Notification.requestPermission();
                            setNotifPermission(permission);
                            if (permission === 'granted') {
                                window.location.reload();
                            } else if (permission === 'denied') {
                                alert("Notifications are blocked in browser settings.");
                            }
                        }}
                    >
                        <Bell size={18} />
                        <span>{notifPermission === 'granted' ? 'Alerts ON' : 'Enable Alerts'}</span>
                    </button>

                    <button className="btn-logout-patient" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>


            {/* Main Content Area */}
            <div className="patient-content-column">
                {/* 1. Identity & Reassurance Block */}
                <header className="reassurance-block">
                    <h1>Hello, {familiarName}</h1>
                    <div className="reassurance-main">
                        {profile?.identity_anchors?.length > 0 ? (
                            <div className="anchor-list">
                                {profile.identity_anchors.map((anchor, idx) => (
                                    <div key={idx} className="anchor-msg-card">
                                        {anchor}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="fallback-msg">
                                You're safe and cared for, {familiarName}. Everything is okay.
                            </p>
                        )}
                    </div>
                </header>

                {/* 2. Your Next Task */}
                <main className="task-section">
                    <div className={`next-task-card ${!nextTask ? 'empty' : ''} ${taskStatus}`}>
                        <span className="task-label">Your Next Task</span>

                        {nextTask ? (
                            <>
                                <div className={`task-time-badge-centered ${taskStatus}`}>
                                    <Clock size={20} />
                                    <span>{nextTask.time.split(':').slice(0, 2).map((t, i) => i === 0 ? (parseInt(t) % 12 || 12) : t).join(':')} {parseInt(nextTask.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}</span>
                                </div>

                                <h2 className="task-title">
                                    It's time for {nextTask.name}
                                </h2>
                                {nextTask.notes && (
                                    <div className="task-notes">
                                        "{nextTask.notes}"
                                    </div>
                                )}
                                <button className="btn-complete" onClick={handleComplete}>
                                    <CheckCircle size={28} style={{ marginRight: '1rem' }} />
                                    I have done this
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="task-title" style={{ marginTop: '2rem' }}>
                                    <Heart size={64} color="#10b981" />
                                    <div style={{ marginTop: '1.5rem' }}>You're all set for now</div>
                                </h2>
                                <p style={{ fontSize: '1.6rem', color: '#64748b', marginTop: '1rem' }}>
                                    Please relax. We'll remind you if something comes up.
                                </p>
                            </>
                        )}

                        <div className="summary-soft">
                            Today: • {summary.done + summary.handled} of {summary.total} things done
                        </div>
                    </div>
                </main>

                {/* 3. Today's Schedule */}
                <div className="schedule-section">
                    <div className="schedule-card-full">
                        <div className="schedule-header">
                            <Calendar size={22} color="#6366f1" />
                            <h3>Today's Schedule</h3>
                        </div>
                        <div className="schedule-list">
                            {summary.schedule && summary.schedule.length > 0 ? (
                                summary.schedule.map((item, idx) => (
                                    <div key={idx} className="schedule-item">
                                        <div className="schedule-item-time">
                                            {item.time.split(':').slice(0, 2).map((t, i) => i === 0 ? (parseInt(t) % 12 || 12) : t).join(':')} {parseInt(item.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                        </div>
                                        <div className="schedule-item-details">
                                            <div className="schedule-item-name">{item.name}</div>
                                            <div className={`schedule-item-badge ${item.status}`}>
                                                {item.status === 'completed' ? 'Done' :
                                                    item.status === 'escalated' ? 'Handled' :
                                                        item.status === 'missed' ? 'Missed' : 'Upcoming'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', fontSize: '0.95rem', textAlign: 'center', padding: '2rem 1rem' }}>All clear for today. You're doing great!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Memories */}
                {memories.length > 0 && (
                    <section className="memory-section">
                        <h3 className="section-title">Your Precious Memories</h3>
                        <div className="memory-gallery">
                            {memories.map((memory) => (
                                <div key={memory.id} className="memory-card">
                                    <img src={memory.image} alt={memory.caption} />
                                    <div className="memory-caption">
                                        <p>{memory.caption}</p>
                                        {memory.relationship_context && (
                                            <div className="relationship-context">
                                                <Users size={14} />
                                                <span>{memory.relationship_context}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* SOS Feedback Modal */}
            {
                sosSent && (
                    <div className="sos-sent-modal">
                        <Heart size={80} />
                        <h2 style={{ fontSize: '3rem', marginTop: '2rem' }}>Help is on the way</h2>
                        <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>Stay where you are. We are coming to help you.</p>
                    </div>
                )
            }

            {/* Foreground Notification Toast */}
            {
                notification && (
                    <div className="notification-toast" onClick={() => setNotification(null)}>
                        <div className="notification-icon">
                            <AlertCircle size={24} color="#fff" />
                        </div>
                        <div className="notification-text">
                            <strong>{notification.title}</strong>
                            <p>{notification.body}</p>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default PatientDashboard;
