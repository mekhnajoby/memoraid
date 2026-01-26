import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preventBackNavigation, logout, getUser } from '../utils/auth';
import logo from '../assets/icons/logo.png';
import './Dashboard.css';

const AdminDashboard = () => {
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
                    <h2>Memoraid Admin</h2>
                </div>
                <div className="dashboard-user">
                    <span>{user?.full_name}</span>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Admin Dashboard</h1>
                    <p className="dashboard-subtitle">System Management & Oversight</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">👥</div>
                        <h3>User Management</h3>
                        <p>Manage caregivers and patients</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Pending Approvals</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📊</div>
                        <h3>System Analytics</h3>
                        <p>View platform statistics</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">Active Users</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">⚙️</div>
                        <h3>Settings</h3>
                        <p>Configure system settings</p>
                        <div className="card-stat">
                            <span className="stat-number">All</span>
                            <span className="stat-label">Systems Operational</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📝</div>
                        <h3>Reports</h3>
                        <p>Generate and view reports</p>
                        <div className="card-stat">
                            <span className="stat-number">0</span>
                            <span className="stat-label">New Reports</span>
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

export default AdminDashboard;
