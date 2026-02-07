import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

import {
    Users,
    UserCheck,
    ClipboardList,
    ShieldAlert,
    MessageSquare,
    UserPlus
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_caregivers: 0,
        total_patients: 0,
        pending_approvals: 0,
        open_inquiries: 0,
        active_alerts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('users/admin/stats/');
                setStats(response.data);
            } catch (err) {
                console.error('Error fetching admin stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        {
            title: 'Total Users',
            val: stats.total_users,
            label: 'Total Users',
            desc: 'All registered platform accounts',
            icon: <Users size={32} />,
            link: '/admin/users'
        },
        {
            title: 'Total Caregivers',
            val: stats.total_caregivers,
            label: 'Verified Caregivers',
            desc: 'Approved caregivers with system access',
            icon: <UserCheck size={32} />,
            link: '/admin/users'
        },
        {
            title: 'Total Patients',
            val: stats.total_patients,
            label: 'Active Patients',
            desc: 'Patients currently under care',
            icon: <ClipboardList size={32} />,
            link: '/admin/patients'
        },
        {
            title: 'Pending Approvals',
            val: stats.pending_approvals,
            label: 'Pending Approvals',
            desc: 'Requests awaiting admin review',
            icon: <UserPlus size={32} />,
            link: '/admin/approvals',
            color: stats.pending_approvals > 0 ? '#f59e0b' : null
        },
        {
            title: 'Active Alerts',
            val: stats.active_alerts,
            label: 'Active Escalations',
            desc: 'Unresolved SOS or escalation events',
            icon: <ShieldAlert size={32} />,
            link: '/admin/alerts',
            color: stats.active_alerts > 0 ? '#ef4444' : null
        },
        {
            title: 'Open Inquiries',
            val: stats.open_inquiries,
            label: 'Caregiver Tickets',
            desc: 'Support inquiries needing response',
            icon: <MessageSquare size={32} />,
            link: '/admin/inquiries'
        }
    ];

    return (
        <AdminLayout
            title="Overview Dashboard"
            subtitle="System access, approvals, and oversight summary."
        >
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={async () => {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            window.location.reload();
                        } else {
                            alert("Notifications are blocked in your browser settings.");
                        }
                    }}
                    style={{
                        fontSize: '0.8rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        cursor: 'pointer',
                        color: '#4338ca',
                        fontWeight: '700'
                    }}
                >
                    Enable Browser Notifications
                </button>
            </div>
            <div className="admin-grid">
                {cards.map((card, index) => (
                    <Link to={card.link} className="admin-card" key={index}>
                        <span className="admin-card-icon" style={{ color: card.color || 'var(--admin-accent)' }}>
                            {card.icon}
                        </span>
                        <h3>{card.title}</h3>
                        <p>{card.desc}</p>
                        <div className="admin-card-stat">
                            <span className="stat-val" style={{ color: card.color || 'var(--admin-accent)' }}>
                                {loading ? '...' : card.val}
                            </span>
                            <span className="stat-label">{card.label}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
