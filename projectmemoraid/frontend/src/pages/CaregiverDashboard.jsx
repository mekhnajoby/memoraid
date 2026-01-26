import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preventBackNavigation, logout, getUser } from '../utils/auth';
import logo from '../assets/icons/logo.png';
import './Dashboard.css';

const CaregiverDashboard = () => {
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
                    <h2>Memoraid Caregiver</h2>
                </div>
                <div className="dashboard-user">
                    <span>{user?.full_name}</span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Caregiver Dashboard</h1>
                    <p className="dashboard-subtitle">Care Coordination & Patient Support</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">🧑‍⚕️</div>
                        <h3>My Patients</h3>
                        <p>View and manage patients</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Assigned Patients</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📅</div>
                        <h3>Daily Schedule</h3>
                        <p>Today's care activities</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Tasks Pending</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🔔</div>
                        <h3>Alerts</h3>
                        <p>Important notifications</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">New Alerts</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📊</div>
                        <h3>Progress Reports</h3>
                        <p>Patient progress tracking</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Reports Available</span>
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

export default CaregiverDashboard;
