import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminApprovals = () => {
    const [approvals, setApprovals] = useState([]);
    const [approvalHistory, setApprovalHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReq, setSelectedReq] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchApprovals();
        fetchHistory();
    }, []);

    const fetchApprovals = async () => {
        try {
            const response = await api.get('users/admin/approvals/');
            setApprovals(response.data);
        } catch (err) {
            console.error('Error fetching approvals:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await api.get('users/admin/approval-history/');
            setApprovalHistory(response.data);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.post(`users/admin/approvals/${id}/`, { action });
            fetchApprovals(); // Refresh pending list
            fetchHistory(); // Refresh history
        } catch (err) {
            alert('Failed to process request');
        }
    };

    return (
        <AdminLayout
            title="Pending Approvals"
            subtitle="Review and authorize connection requests between caregivers and patients."
        >
            <div className="admin-module-container">
                <h3>Access Request Queue</h3>
                {loading ? (
                    <p>Loading requests...</p>
                ) : approvals.length === 0 ? (
                    <p style={{ marginTop: '2rem', color: '#64748b' }}>No pending approvals found.</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Patient</th>
                                <th>Caregiver ID</th>
                                <th>Caregiver</th>
                                <th>Requested On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvals.map((req) => (
                                <tr key={req.id}>
                                    <td>
                                        <code style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {req.patient.unique_id || '—'}
                                        </code>
                                    </td>
                                    <td>
                                        <strong>{req.patient.full_name}</strong><br />
                                        <small>{req.patient.email}</small>
                                    </td>
                                    <td>
                                        <code style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {req.caregiver.unique_id || '—'}
                                        </code>
                                    </td>
                                    <td>
                                        <strong>{req.caregiver.full_name}</strong><br />
                                        <small>{req.caregiver.email}</small>
                                    </td>
                                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn-action"
                                            style={{ background: '#f1f5f9', color: '#475569', marginRight: '0.5rem' }}
                                            onClick={() => { setSelectedReq(req); setShowModal(true); }}
                                        >
                                            Inspect
                                        </button>
                                        <button
                                            className="btn-action btn-approve"
                                            onClick={() => handleAction(req.id, 'approve')}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn-action btn-reject"
                                            onClick={() => handleAction(req.id, 'reject')}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Previous Requests Section */}
                <div style={{ marginTop: '4rem', borderTop: '2px solid #e2e8f0', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Previous Requests</h3>
                        <button
                            className="btn-action"
                            style={{ background: '#f1f5f9', color: '#475569' }}
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            {showHistory ? 'Hide History' : 'Show History'}
                        </button>
                    </div>

                    {showHistory && (
                        approvalHistory.length === 0 ? (
                            <p style={{ color: '#64748b' }}>No processed requests found.</p>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Caregiver</th>
                                        <th>Status</th>
                                        <th>Processed By</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvalHistory.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <strong>{req.patient.full_name}</strong><br />
                                                <code style={{ fontSize: '0.75rem' }}>{req.patient.unique_id}</code>
                                            </td>
                                            <td>
                                                <strong>{req.caregiver.full_name}</strong><br />
                                                <code style={{ fontSize: '0.75rem' }}>{req.caregiver.unique_id}</code>
                                            </td>
                                            <td>
                                                <span
                                                    className={`status-badge status-${req.approval_status}`}
                                                    style={{
                                                        background: req.approval_status === 'approved' ? '#f0fdf4' : '#fff1f2',
                                                        color: req.approval_status === 'approved' ? '#16a34a' : '#be123c'
                                                    }}
                                                >
                                                    {req.approval_status}
                                                </span>
                                            </td>
                                            <td>{req.approved_by || '—'}</td>
                                            <td>{req.approved_at ? new Date(req.approved_at).toLocaleDateString() : '—'}</td>
                                            <td>
                                                <button
                                                    className="btn-action btn-view"
                                                    onClick={() => {
                                                        setSelectedReq(req);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    className="btn-action"
                                                    style={{ background: '#fef3c7', color: '#92400e', marginLeft: '0.5rem' }}
                                                    onClick={() => handleAction(req.id, 'revoke')}
                                                >
                                                    Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            </div>

            {showModal && selectedReq && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-content" style={{
                        background: 'white',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        width: '90%',
                        maxWidth: '600px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Request Details</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <h4 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Patient</h4>
                                <p style={{ margin: 0, fontWeight: '600' }}>{selectedReq.patient.full_name}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{selectedReq.patient.email}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                                    Tel: {selectedReq.patient.patient_profile?.phone_number || 'N/A'}
                                </p>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px' }}>ID: {selectedReq.patient.unique_id}</span>
                                </p>
                            </div>
                            <div>
                                <h4 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Caregiver</h4>
                                <p style={{ margin: 0, fontWeight: '600' }}>{selectedReq.caregiver.full_name}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{selectedReq.caregiver.email}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                                    Tel: {selectedReq.caregiver.caregiver_profile?.phone_number || 'N/A'}
                                </p>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px' }}>ID: {selectedReq.caregiver.unique_id}</span>
                                </p>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>RELATIONSHIP</label>
                                <p style={{ margin: 0, fontWeight: '500', textTransform: 'capitalize' }}>{selectedReq.relationship || 'Not specified'}</p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>CAREGIVER LEVEL</label>
                                <p style={{ margin: 0, fontWeight: '500', textTransform: 'capitalize' }}>{selectedReq.level}</p>
                            </div>
                            <div>
                                <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>LIVING ARRANGEMENT</label>
                                <p style={{ margin: 0, fontWeight: '500' }}>
                                    {selectedReq.living_arrangement === 'same_household' ? 'Same Household' :
                                        selectedReq.living_arrangement === 'remote' ? 'Remote / Nearby' :
                                            selectedReq.living_arrangement === 'facility' ? 'Assisted Living Facility' :
                                                selectedReq.living_arrangement || 'Not specified'}
                                </p>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>CARE BASIS</label>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>{selectedReq.care_context || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>CONSENT BASIS</label>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>{selectedReq.consent_basis || 'Not specified'}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>LIVING RISK FACTORS</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {selectedReq.risk_lives_alone && (
                                        <span style={{ padding: '2px 10px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            LIVES ALONE
                                        </span>
                                    )}
                                    {selectedReq.risk_wandering && (
                                        <span style={{ padding: '2px 10px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            WANDERING RISK
                                        </span>
                                    )}
                                    {!selectedReq.risk_lives_alone && !selectedReq.risk_wandering && (
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>None reported</p>
                                    )}
                                </div>
                            </div>

                            {selectedReq.notes && (
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>ADMIN NOTES / BACKGROUND</label>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        {selectedReq.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn-action"
                                style={{ background: '#f1f5f9', color: '#475569' }}
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                            {selectedReq.approval_status === 'pending' || !selectedReq.approval_status ? (
                                <>
                                    <button
                                        className="btn-action btn-approve"
                                        onClick={() => { handleAction(selectedReq.id, 'approve'); setShowModal(false); }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="btn-action btn-reject"
                                        onClick={() => { handleAction(selectedReq.id, 'reject'); setShowModal(false); }}
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-action"
                                    style={{ background: '#fef3c7', color: '#92400e' }}
                                    onClick={() => { handleAction(selectedReq.id, 'revoke'); setShowModal(false); }}
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </AdminLayout >
    );
};

export default AdminApprovals;
