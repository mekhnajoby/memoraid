import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filters, setFilters] = useState({
        role: 'all',
        status: 'all',
        level: 'all'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('users/admin/users/');
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'verified') {
                // Use activation endpoint for verified → active
                await api.post(`users/admin/users/${id}/activate/`);
            } else {
                // Use existing toggle for active ↔ disabled
                const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
                await api.post(`users/admin/users/${id}/status/`, { status: newStatus });
            }
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const filteredUsers = users.filter(u => {
        const roleMatch = filters.role === 'all' || u.role === filters.role;
        const statusMatch = filters.status === 'all' || u.status === filters.status;
        const levelMatch = filters.level === 'all' || (u.care_level && String(u.care_level).toLowerCase() === filters.level);
        return roleMatch && statusMatch && levelMatch;
    });

    return (
        <AdminLayout
            title="User Management"
            subtitle="Manage system accounts and enforce access integrity."
        >
            <div className="admin-module-container">
                <div className="admin-module-header">
                    <div>
                        <h3>System User Directory</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                            This list shows all registered platform accounts. Care relationships are managed by primary caregivers.
                        </p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group">
                        <label>Role</label>
                        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                            <option value="all">All Roles</option>
                            <option value="caregiver">Caregivers</option>
                            <option value="patient">Patients</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Care Level</label>
                        <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
                            <option value="all">All Levels</option>
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p>Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <p>No users found matching the selected filters.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Name & Email</th>
                                <th>Role</th>
                                <th>Care Level</th>
                                <th>Linked To</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
                                            {u.unique_id || '—'}
                                        </code>
                                    </td>
                                    <td>
                                        <strong>{u.full_name}</strong><br />
                                        <small>{u.email}</small>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                                    <td>{u.care_level}</td>
                                    <td style={{ maxWidth: '200px' }}>
                                        <small style={{ color: '#475569' }}>{u.linked_entities}</small>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${u.status}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-action btn-view"
                                            onClick={() => setSelectedUser(u)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            className="btn-action"
                                            style={{ background: u.status === 'active' ? '#fee2e2' : '#dcfce7', color: u.status === 'active' ? '#991b1b' : '#166534' }}
                                            onClick={() => toggleStatus(u.id, u.status)}
                                        >
                                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedUser && (
                <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ width: '98%', maxWidth: '1560px', padding: '3.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>User Data</h2>
                        </div>

                        {/* Section: User Identity */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>User Identity</h4>
                            <div className="inspect-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem' }}>
                                <div className="inspect-item">
                                    <label>USER ID</label>
                                    <span style={{ fontWeight: '800', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569' }}>
                                        {selectedUser.unique_id || '—'}
                                    </span>
                                </div>
                                <div className="inspect-item">
                                    <label>FULL NAME</label>
                                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedUser.full_name}</span>
                                </div>
                                <div className="inspect-item">
                                    <label>PLATFORM ROLE</label>
                                    <span style={{
                                        textTransform: 'uppercase',
                                        fontWeight: '800',
                                        color: 'var(--admin-primary)',
                                        letterSpacing: '0.5px'
                                    }}>{selectedUser.role}</span>
                                </div>
                                <div className="inspect-item">
                                    <label>ACCOUNT STATUS</label>
                                    <span className={`status-badge status-${selectedUser.status}`} style={{ width: 'fit-content', padding: '0.5rem 1rem' }}>{selectedUser.status}</span>
                                </div>
                                <div className="inspect-item">
                                    <label>EMAIL ADDRESS</label>
                                    <span style={{ fontWeight: '500', color: '#334155' }}>{selectedUser.email}</span>
                                </div>
                                <div className="inspect-item">
                                    <label>PHONE</label>
                                    <span style={{ fontWeight: '600' }}>{selectedUser.caregiver_profile?.phone_number || selectedUser.patient_profile?.phone_number || selectedUser.patient_profile?.emergency_contact_phone || '—'}</span>
                                </div>
                                <div className="inspect-item">
                                    <label>RESIDENTIAL ADDRESS</label>
                                    <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#334155' }}>
                                        {selectedUser.patient_profile?.address || selectedUser.caregiver_profile?.address || selectedUser.caregiver_profile?.city || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section: System Authority */}
                        <div style={{ marginBottom: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>System Authority</h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', marginBottom: '2rem' }}>
                                {selectedUser.role === 'caregiver' && selectedUser.caregiver_profile?.level === 'primary' && "Primary caregivers have full authority over patient routines, clinical records, and the memory gallery."}
                                {selectedUser.role === 'caregiver' && selectedUser.caregiver_profile?.level === 'secondary' && "Secondary caregivers can view routines and receive alerts, but cannot modify core patient identity."}
                                {selectedUser.role === 'patient' && "Patients can view their personalized dashboard and orientation anchors but cannot modify clinical or system data."}
                            </p>
                            <div className="inspect-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
                                <div className="inspect-item">
                                    <label>PLATFORM ROLE</label>
                                    <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{selectedUser.role}</span>
                                </div>
                                {selectedUser.role !== 'patient' && (
                                    <div className="inspect-item">
                                        <label>CARE LEVEL</label>
                                        <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{selectedUser.care_level || '—'}</span>
                                    </div>
                                )}
                                <div className="inspect-item">
                                    <label>{selectedUser.role === 'patient' ? 'RELATED TO' : 'RELATIONSHIP TYPE'}</label>
                                    <span style={{ fontWeight: '700' }}>
                                        {selectedUser.role === 'patient'
                                            ? (selectedUser.linked_entities_list && selectedUser.linked_entities_list.length > 0
                                                ? selectedUser.linked_entities_list.map(l => `${l.name} (ID: ${l.unique_id || '—'}) [${l.relationship || 'Caregiver'}]`).join(', ')
                                                : 'No caregivers assigned')
                                            : (selectedUser.caregiver_profile?.relationship || '—')
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section: Linked Patients */}
                        {selectedUser.role === 'caregiver' && selectedUser.linked_entities_list && (
                            <div className="inspect-extra" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem', marginTop: '3rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Linked Patients</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                    {selectedUser.linked_entities_list.length === 0 ? (
                                        <p style={{ color: '#64748b' }}>No linked patients found.</p>
                                    ) : (
                                        selectedUser.linked_entities_list.map((patient) => (
                                            <div key={patient.id} style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '16px',
                                                padding: '1.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem'
                                            }}>
                                                <div>
                                                    <h5 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{patient.name}</h5>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                                                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                                                            {patient.unique_id || '—'}
                                                        </code>
                                                        <span className={`status-badge status-${patient.status || 'unknown'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{patient.status || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    <div style={{ marginBottom: '0.25rem' }}><strong>Primary Caregiver:</strong> {patient.primary_caregiver_name || 'N/A'}</div>
                                                    <div><strong>Patient Status:</strong> {patient.status ? (patient.status.charAt(0).toUpperCase() + patient.status.slice(1)) : 'Unknown'}</div>
                                                </div>
                                                <button
                                                    className="btn-action btn-view"
                                                    style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                                                    onClick={() => {
                                                        const patientRef = users.find(u => u.id === patient.id);
                                                        if (patientRef) setSelectedUser(patientRef);
                                                    }}
                                                >
                                                    → View Patient Profile
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedUser.patient_profile && (
                            <div className="inspect-extra" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem', marginTop: '3rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Patient Clinical Record</h4>
                                <div className="inspect-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem' }}>
                                    <div className="inspect-item"><label>CONDITION</label><span style={{ textTransform: 'capitalize', fontWeight: '700' }}>{selectedUser.patient_profile.condition}</span></div>
                                    <div className="inspect-item"><label>DIAGNOSIS STAGE</label><span style={{ textTransform: 'capitalize', fontWeight: '700' }}>{selectedUser.patient_profile.stage}</span></div>
                                    <div className="inspect-item"><label>RESPONSIBLE CAREGIVER</label><span style={{ fontWeight: '500' }}>{selectedUser.patient_profile.primary_caregiver_email}</span></div>
                                    <div className="inspect-item"><label>ATTENDING DOCTOR</label><span style={{ fontWeight: '600' }}>{selectedUser.patient_profile.consulting_doctor || '—'}</span></div>
                                    <div className="inspect-item">
                                        <label>CONSULTING HOSPITAL</label>
                                        <span style={{ fontWeight: '600' }}>{selectedUser.patient_profile.consulting_doctor_hospital || '—'}</span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>PATIENT D.O.B</label>
                                        <span style={{ fontWeight: '600' }}>
                                            {selectedUser.patient_profile.dob ? new Date(selectedUser.patient_profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                                            {selectedUser.age && ` (${selectedUser.age} years old)`}
                                        </span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>RESIDENTIAL ADDRESS</label>
                                        <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{selectedUser.patient_profile.address || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button className="btn-auth" onClick={() => setSelectedUser(null)} style={{ marginTop: '2rem' }}>
                            Close View
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminUserManagement;
