import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCheck,
    Users,
    ClipboardList,
    ShieldAlert,
    MessageSquare,
    LogOut
} from 'lucide-react';
import logo from '../assets/icons/logo.png';
import { logout, getUser } from '../utils/auth';

const AdminNavbar = () => {
    const navigate = useNavigate();
    const user = getUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="admin-navbar">
            <div className="admin-nav-left">
                <img src={logo} alt="Memoraid" className="admin-nav-logo" />
                <div className="admin-nav-info">
                    <h1>Memoraid <span style={{ fontWeight: '300', color: '#94a3b8', margin: '0 0.5rem' }}>|</span> System Admin</h1>
                </div>
            </div>

            <div className="admin-nav-links">
                <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                    <LayoutDashboard size={18} /> Overview
                </NavLink>
                <NavLink to="/admin/approvals" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                    <UserCheck size={18} /> Approvals
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                    <Users size={18} /> Users
                </NavLink>
                <NavLink to="/admin/patients" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                    <ClipboardList size={18} /> Registry
                </NavLink>
                <NavLink to="/admin/alerts" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                    <ShieldAlert size={18} /> Alerts
                </NavLink>
                <NavLink to="/admin/inquiries" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                    <MessageSquare size={18} /> Inquiries
                </NavLink>
            </div>

            <div className="admin-nav-right">
                <span className="admin-user-info">Logged in: {user?.full_name}</span>
                <button onClick={handleLogout} className="btn-admin-logout">
                    <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default AdminNavbar;
