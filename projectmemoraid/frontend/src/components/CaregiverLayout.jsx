import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Bell,
    LogOut,
    Heart,
    Settings,
    MessageCircle,
    Plus,
    AlertCircle,
    X,
    CheckCircle
} from 'lucide-react';
import logo from '../assets/icons/logo.png';
import { logout, getUser } from '../utils/auth';
import { requestForToken, onMessageListener } from '../firebase';
import api from '../services/api';
import '../pages/caregiver/Caregiver.css';

const CaregiverLayout = ({ children, title, subtitle }) => {
    const navigate = useNavigate();
    const user = getUser();
    const [notification, setNotification] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const setupNotifications = async () => {
            try {
                const token = await requestForToken();
                if (token) {
                    await api.post('users/fcm-token/', { token });
                    console.log('Caregiver FCM Token registered');
                }
            } catch (err) {
                console.error('Notification setup failed:', err);
            }
        };

        setupNotifications();

        onMessageListener().then(payload => {
            console.log('Caregiver Foreground Msg:', payload);
            if (payload && payload.notification) {
                // 1. Trigger Browser Notification (Standard Web API)
                if (Notification.permission === 'granted') {
                    new Notification(payload.notification.title, {
                        body: payload.notification.body,
                        icon: '/logo.png'
                    });
                }

                // 2. Show In-App Toast
                setNotification({
                    title: payload.notification.title,
                    body: payload.notification.body,
                    data: payload.data // Pass data for navigation if needed
                });

                // Auto hide toast after 8 seconds
                setTimeout(() => setNotification(null), 8000);
            }
        }).catch(err => console.log('FCM Listener err:', err));

    }, []);

    return (
        <div className="caregiver-layout">
            {/* Notification Toast Overlay */}
            {notification && (
                <div className="cg-notification-toast">
                    <div className="cg-nt-icon">
                        <AlertCircle size={24} color="#fff" />
                    </div>
                    <div className="cg-nt-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.body}</p>
                    </div>
                    <button className="cg-nt-close" onClick={() => setNotification(null)}>
                        <X size={18} />
                    </button>
                    {/* Optional: Add 'View' button if data points to a specific patient/alert */}
                    {notification.data && notification.data.patient_id && (
                        <button
                            className="cg-nt-view-btn"
                            onClick={() => {
                                navigate(`/caregiver/workspace/${notification.data.patient_id}/alerts`);
                                setNotification(null);
                            }}
                        >
                            View
                        </button>
                    )}
                </div>
            )}

            <nav className="caregiver-navbar">
                <div className="caregiver-nav-left">
                    <img src={logo} alt="Memoraid" className="caregiver-nav-logo" />
                    <div className="caregiver-nav-info">
                        <h1>Memoraid <span className="theme-divider">|</span> Caregiver Workspace</h1>
                    </div>
                </div>

                <div className="caregiver-nav-links">
                    <NavLink to="/caregiver-dashboard" className={({ isActive }) => isActive ? "caregiver-nav-link active" : "caregiver-nav-link"}>
                        <LayoutDashboard size={18} /> Dashboard
                    </NavLink>
                    <NavLink to="/caregiver/my-patients" className={({ isActive }) => isActive ? "caregiver-nav-link active" : "caregiver-nav-link"}>
                        <Users size={18} /> My Patients
                    </NavLink>
                    <NavLink to="/caregiver/alerts" className={({ isActive }) => isActive ? "caregiver-nav-link active" : "caregiver-nav-link"}>
                        <Bell size={18} /> Alerts
                    </NavLink>
                    <NavLink to="/caregiver/link-patient" className={({ isActive }) => isActive ? "caregiver-nav-link active" : "caregiver-nav-link"}>
                        <Plus size={18} /> Link Patient
                    </NavLink>
                    <NavLink to="/caregiver/inquiries" className={({ isActive }) => isActive ? "caregiver-nav-link active" : "caregiver-nav-link"}>
                        <MessageCircle size={18} /> Support
                    </NavLink>
                    <NavLink to="/caregiver/settings" className={({ isActive }) => isActive ? "caregiver-nav-link active" : "caregiver-nav-link"}>
                        <Settings size={18} /> Settings
                    </NavLink>
                </div>

                <div className="caregiver-nav-right">
                    <div className="caregiver-user-brief">
                        <span className="user-name">{user?.full_name}</span>
                        <span className="user-role">{user?.care_level || 'Caregiver'}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-caregiver-logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </nav>

            <main className="caregiver-content">
                <div style={{ width: '80%', maxWidth: '1440px' }}>
                    <header className="caregiver-header" style={{ marginBottom: '2.5rem' }}>
                        <h1>{title}</h1>
                        <p className="caregiver-subtitle">{subtitle}</p>
                    </header>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default CaregiverLayout;
