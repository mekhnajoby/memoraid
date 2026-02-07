import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldAlert,
    Bell,
    CheckCircle,
    Activity,
    ChevronRight,
    Clock,
    Zap,
    AlertTriangle,
    Search
} from 'lucide-react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminAlerts = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acknowledging, setAcknowledging] = useState(null);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await api.get('users/caregiver/alerts/');
            setAlerts(response.data);
        } catch (err) {
            console.error('Error fetching system alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlert = async (alertId) => {
        setAcknowledging(alertId);
        try {
            await api.patch(`users/caregiver/alerts/${alertId}/`, { status: 'handled' });
            fetchAlerts();
        } catch (err) {
            console.error('Failed to acknowledge alert:', err);
        } finally {
            setAcknowledging(null);
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        if (activeTab === 'active') return alert.status === 'active';
        if (activeTab === 'resolved') return alert.status === 'handled';
        return true; // History shows all
    });

    const TabButton = ({ id, label, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`admin-tab-btn ${activeTab === id ? 'active' : ''}`}
        >
            {label}
            {count > 0 && <span className="tab-count">{count}</span>}
        </button>
    );

    return (
        <AdminLayout
            title="System Alert Monitor"
            subtitle="Real-time oversight of all SOS triggers and missed routine escalations across the platform."
        >
            <div className="admin-module-container">
                <div className="admin-tabs-container">
                    <div className="admin-tabs-list">
                        <TabButton
                            id="active"
                            label="Active Alerts"
                            count={alerts.filter(a => a.status === 'active').length}
                        />
                        <TabButton
                            id="resolved"
                            label="Resolved"
                        />
                        <TabButton
                            id="history"
                            label="System History"
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <Activity className="spin" size={32} color="#6366f1" />
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>Syncing system alerts...</p>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                        <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: '#0f172a' }}>
                            {activeTab === 'active' ? 'System Healthy' : 'No Records Found'}
                        </h3>
                        <p style={{ color: '#64748b' }}>
                            {activeTab === 'active'
                                ? 'No active escalations or SOS alerts detected.'
                                : 'There are no alerts in this category yet.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {filteredAlerts.map((alert) => (
                            <div key={alert.id} className={`admin-alert-card ${alert.status === 'handled' ? 'resolved' : 'active'}`} style={{
                                background: 'white',
                                padding: '1.5rem 2rem',
                                borderRadius: '20px',
                                border: `1.5px solid ${alert.status === 'active' ? (alert.type === 'sos' ? '#fee2e2' : '#fef3c7') : '#f1f5f9'}`,
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                gap: '2rem',
                                alignItems: 'center',
                                boxShadow: alert.status === 'active' ? '0 10px 25px rgba(0,0,0,0.02)' : 'none',
                                opacity: alert.status === 'handled' ? 0.8 : 1
                            }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: alert.type === 'sos' ? '#fef2f2' : '#fffbeb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: alert.type === 'sos' ? '#ef4444' : '#f59e0b'
                                }}>
                                    {alert.type === 'sos' ? <Zap size={28} /> : <AlertTriangle size={28} />}
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                                            {alert.type === 'sos' ? 'SOS EMERGENCY' : 'MISSED ROUTINE ESCALATION'}
                                        </h4>
                                        <span style={{
                                            background: alert.status === 'active' ? (alert.type === 'sos' ? '#fee2e2' : '#fef3c7') : '#f1f5f9',
                                            color: alert.status === 'active' ? (alert.type === 'sos' ? '#991b1b' : '#92400e') : '#64748b',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>
                                            {alert.status === 'active' ? (alert.type === 'sos' ? 'Critical' : 'High Priority') : 'Resolved'}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>
                                        <strong>{alert.patient_name}</strong>: {alert.message}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                                            <Clock size={14} />
                                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                                        </div>
                                        {alert.handled_by_name && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>
                                                <CheckCircle size={14} color="#10b981" />
                                                <span>Handled by: {alert.handled_by_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {alert.status === 'active' && (
                                        <button
                                            className="btn-action"
                                            style={{ background: '#0f172a', color: 'white' }}
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            disabled={acknowledging === alert.id}
                                        >
                                            {acknowledging === alert.id ? '...' : 'Resolve'}
                                        </button>
                                    )}
                                    <button
                                        className="btn-action btn-view"
                                        onClick={() => navigate(`/admin/patients`)} // Registry is where patients are managed
                                    >
                                        Inspect Patient
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAlerts;
