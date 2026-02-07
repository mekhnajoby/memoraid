import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Send,
    LifeBuoy
} from 'lucide-react';
import api from '../../services/api';
import CaregiverLayout from '../../components/CaregiverLayout';

const InquiriesModule = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'routine'
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('users/inquiries/', formData);
            setShowForm(false);
            setFormData({ subject: '', message: '', priority: 'medium', category: 'routine' });
            fetchInquiries();
        } catch (err) {
            alert('Failed to submit inquiry.');
        }
    };

    return (
        <CaregiverLayout
            title="Support Hub"
            subtitle="Submit inquiries or complaints to system administrators regarding your care experience."
        >
            <div className="admin-module-container" style={{ marginTop: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <LifeBuoy size={22} color="var(--cg-accent)" /> My Support Tickets
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Track and manage your communications with Memoraid staff.</p>
                    </div>
                    {!showForm && (
                        <button className="btn-auth" style={{ width: 'auto', padding: '0.75rem 1.5rem' }} onClick={() => setShowForm(true)}>
                            <Plus size={18} /> New Inquiry
                        </button>
                    )}
                </div>

                {showForm ? (
                    <div className="inquiry-form" style={{ background: '#ffffff', padding: '2.5rem', borderRadius: '24px', border: '1.5px solid #e2e8f0', marginBottom: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a', fontSize: '1.25rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <Send size={20} color="var(--cg-accent)" />
                            </div>
                            Submit New Request
                        </h4>
                        <form onSubmit={handleSubmit}>
                            <div className="filter-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input-styled"
                                    placeholder="Brief summary of your issue"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="filter-group" style={{ flexGrow: 1 }}>
                                    <label>Priority</label>
                                    <select
                                        className="form-input-styled"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>
                                <div className="filter-group" style={{ flexGrow: 1 }}>
                                    <label>Category</label>
                                    <select className="form-input-styled">
                                        <option value="routine">Routine Support</option>
                                        <option value="access">Account Access</option>
                                        <option value="alerts">Alerts & Notifications</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="filter-group" style={{ marginBottom: '2rem' }}>
                                <label>Detailed Description</label>
                                <textarea
                                    required
                                    className="form-input-styled"
                                    placeholder="Please provide as much detail as possible so we can assist you better..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-auth" style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', width: 'auto', padding: '0.8rem 2rem' }} onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-auth" style={{ flexGrow: 1 }}>
                                    Send Inquiry <Send size={18} style={{ marginLeft: '0.5rem' }} />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="inquiry-list">
                        {loading ? (
                            <p>Loading your tickets...</p>
                        ) : inquiries.length === 0 ? (
                            <div className="empty-state">
                                <LifeBuoy size={48} color="#e2e8f0" style={{ marginBottom: '1.5rem' }} />
                                <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#64748b' }}>No support tickets found.</p>
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>Our team is here to help whenever you need assistance.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {inquiries.map((ticket) => (
                                    <div key={ticket.id} className="routine-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', padding: '1.75rem', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>{ticket.subject}</h4>
                                                <span className={`status-badge status-${ticket.status}`} style={{ fontSize: '0.65rem', padding: '0.25rem 0.6rem' }}>{ticket.status}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                                                <Clock size={14} />
                                                <small style={{ fontWeight: '600' }}>{new Date(ticket.created_at).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#445164', lineHeight: '1.6' }}>{ticket.message}</p>

                                        {ticket.admin_response && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                padding: '1.5rem',
                                                background: '#f8fafc',
                                                borderRadius: '16px',
                                                borderLeft: '4px solid var(--cg-accent)',
                                                width: '100%',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                                    <div style={{ background: 'var(--cg-accent)', padding: '0.25rem', borderRadius: '6px' }}>
                                                        <MessageSquare size={12} color="#fff" />
                                                    </div>
                                                    <small style={{ fontWeight: '800', color: 'var(--cg-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Support Response</small>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b', lineHeight: '1.6' }}>{ticket.admin_response}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CaregiverLayout>
    );
};

export default InquiriesModule;
