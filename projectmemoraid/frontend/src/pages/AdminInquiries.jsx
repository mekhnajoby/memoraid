import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [updateStatus, setUpdateStatus] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const response = await api.get('users/inquiries/');
            setInquiries(response.data);
        } catch (err) {
            console.error('Error fetching inquiries:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await api.patch(`users/inquiries/${selectedInquiry.id}/`, {
                status: updateStatus,
                admin_response: adminResponse
            });
            fetchInquiries();
            setMessage({ type: 'success', text: 'Inquiry updated successfully' });
            setTimeout(() => {
                setSelectedInquiry(null);
                setMessage({ type: '', text: '' });
            }, 2000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update inquiry' });
        }
    };

    return (
        <AdminLayout
            title="Inquiries & Complaints"
            subtitle="View and respond to support tickets submitted by caregivers."
        >
            <div className="admin-module-container">
                <h3>Support Ticket Queue</h3>
                {loading ? (
                    <p>Loading tickets...</p>
                ) : inquiries.length === 0 ? (
                    <p style={{ marginTop: '2rem', color: '#64748b' }}>No inquiries found.</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Caregiver ID</th>
                                <th style={{ textAlign: 'left' }}>Caregiver</th>
                                <th style={{ textAlign: 'left' }}>Subject</th>
                                <th style={{ textAlign: 'center' }}>Priority</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Date</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inquiries.map((iq) => (
                                <tr key={iq.id}>
                                    <td style={{ textAlign: 'left' }}>
                                        <code style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {iq.caregiver_unique_id || '—'}
                                        </code>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>
                                        <strong>{iq.caregiver_name}</strong><br />
                                        <small>{iq.caregiver_email}</small>
                                    </td>
                                    <td style={{ textAlign: 'left' }}>{iq.subject}</td>
                                    <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                                        <span style={{
                                            color: iq.priority === 'high' ? '#ef4444' : iq.priority === 'medium' ? '#f59e0b' : '#22c55e',
                                            fontWeight: '700'
                                        }}>
                                            {iq.priority}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`status-badge status-${iq.status.replace(' ', '-')}`}>
                                            {iq.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{new Date(iq.created_at).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn-action btn-view"
                                            onClick={() => {
                                                setSelectedInquiry(iq);
                                                setAdminResponse(iq.admin_response || '');
                                                setUpdateStatus(iq.status);
                                            }}
                                        >
                                            View & Respond
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedInquiry && (
                <div className="admin-modal-overlay" onClick={() => setSelectedInquiry(null)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ width: '98%', maxWidth: '1400px', padding: '3.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Respond to Support Inquiry</h2>
                            <button className="btn-auth" onClick={() => setSelectedInquiry(null)} style={{ background: '#94a3b8', width: 'auto', padding: '0.7rem 2rem' }}>
                                Close
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Inquiry Details</h4>
                                <div className="inspect-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                    <div className="inspect-item"><label>Subject</label><span style={{ fontWeight: '700' }}>{selectedInquiry.subject}</span></div>
                                    <div className="inspect-item"><label>Priority</label>
                                        <span style={{
                                            color: selectedInquiry.priority === 'high' ? '#ef4444' : selectedInquiry.priority === 'medium' ? '#f59e0b' : '#22c55e',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>
                                            {selectedInquiry.priority}
                                        </span>
                                    </div>
                                    <div className="inspect-item"><label>Message</label><p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.6' }}>{selectedInquiry.message}</p></div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdate} style={{ padding: '2rem', background: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Response Action</h4>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>SET RESOLUTION STATUS</label>
                                    <select
                                        className="auth-select"
                                        value={updateStatus}
                                        onChange={(e) => setUpdateStatus(e.target.value)}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label>RESPONSE MESSAGE</label>
                                    <textarea
                                        style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '180px', marginTop: '0.5rem', fontSize: '1rem' }}
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        placeholder="Type your official response to the caregiver..."
                                    />
                                </div>
                                {message.text && (
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        marginBottom: '1.5rem',
                                        background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                        color: message.type === 'success' ? '#15803d' : '#b91c1c',
                                        textAlign: 'center',
                                        border: `1px solid ${message.type === 'success' ? '#bcf0da' : '#fecaca'}`
                                    }}>
                                        {message.text}
                                    </div>
                                )}
                                <button type="submit" className="btn-auth" style={{ width: '100%', padding: '1rem' }}>Submit Update</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminInquiries;
