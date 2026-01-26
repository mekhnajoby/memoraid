import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preventBackNavigation, logout, getUser } from '../utils/auth';
import logo from '../assets/icons/logo.png';
import './Dashboard.css';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const user = getUser();

    useEffect(() => {
        preventBackNavigation();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="dashboard-logo">
                    <img src={logo} alt="Memoraid" className="dashboard-logo-img" />
                    <h2>Memoraid Patient</h2>
                </div>
                <div className="dashboard-user">
                    <span>{user?.full_name}</span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Patient Dashboard</h1>
                    <p className="dashboard-subtitle">Your Daily Care & Memory Support</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">📋</div>
                        <h3>Today's Activities</h3>
                        <p>Your daily routine</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Activities Scheduled</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">💊</div>
                        <h3>Medications</h3>
                        <p>Medication reminders</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Doses Today</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">👨‍👩‍👧</div>
                        <h3>Family Photos</h3>
                        <p>Remember your loved ones</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Photos Available</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🎯</div>
                        <h3>Memory Games</h3>
                        <p>Cognitive exercises</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Games Available</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-info">
                    <p><strong>Role:</strong> {user?.role}</p>
                    <p><strong>Status:</strong> {user?.status}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
