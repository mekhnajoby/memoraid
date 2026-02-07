import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const AdminPatientRegistry = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [consistencyDetails, setConsistencyDetails] = useState(null);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await api.get('users/admin/users/');
                setPatients(response.data.filter(u => u.role === 'patient'));
            } catch (err) {
                console.error('Error fetching patient registry:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const formatCondition = (str) => {
        if (!str) return '—';
        if (str === 'alzheimers') return "Alzheimer's";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const reasonsCount = (p) => {
        let count = 0;
        const primary = p.linked_entities_list?.find(l => l.level === 'primary');
        const secondary = p.linked_entities_list?.filter(l => l.level === 'secondary') || [];
        const hasEmergency = p.patient_profile?.emergency_contact_phone;
        const isDocAsEmergency = p.patient_profile?.emergency_contact_name && p.patient_profile.emergency_contact_name === p.patient_profile.consulting_doctor;

        if (!primary) count++;
        if (secondary.length === 0) count++;
        if (!hasEmergency || isDocAsEmergency) count++;
        if (!p.patient_profile?.phone_number) count++;
        if (!p.patient_profile?.identity_anchors?.length) count++;
        return count;
    };

    return (
        <AdminLayout
            title="Patient Registry"
            subtitle="Monitor patient profiles and caregiver assignment structure."
        >
            <div className="admin-module-container">
                <h3>Global Patient Directory</h3>
                {loading ? (
                    <p>Loading patient data...</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Patient Name</th>
                                <th>Condition & Stage</th>
                                <th>Primary Caregiver</th>
                                <th>Link Status</th>
                                <th style={{ textAlign: 'center' }}>Profile Integrity</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((p) => {
                                const primaryCaregiver = p.linked_entities_list?.find(l => l.level === 'primary');
                                const totalIssues = reasonsCount(p);
                                return (
                                    <tr key={p.id}>
                                        <td>
                                            <code style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                                {p.unique_id || '—'}
                                            </code>
                                        </td>
                                        <td>
                                            <strong>{p.full_name}</strong><br />
                                            <small>{p.email}</small>
                                        </td>
                                        <td>
                                            {formatCondition(p.patient_profile?.condition)} <br />
                                            <small style={{ color: '#64748b' }}>Stage: {p.patient_profile?.stage ? (p.patient_profile.stage.charAt(0).toUpperCase() + p.patient_profile.stage.slice(1)) : '—'}</small>
                                        </td>
                                        <td>
                                            {primaryCaregiver ? (
                                                <>
                                                    <strong>{primaryCaregiver.name}</strong><br />
                                                    <code style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {primaryCaregiver.unique_id || '—'}</code>
                                                </>
                                            ) : (
                                                <small style={{ color: '#94a3b8' }}>Not Assigned</small>
                                            )}
                                        </td>
                                        <td>
                                            {p.linked_entities_list?.length > 0 ? (
                                                <div>
                                                    {p.linked_entities_list.every(l => l.is_approved) ? (
                                                        <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: '700', background: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', width: 'fit-content' }}>Connected</span>
                                                    ) : (
                                                        <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: '700', background: '#fffbeb', padding: '4px 10px', borderRadius: '12px', width: 'fit-content' }}>Pending</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No Links</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <span
                                                    className="consistency-badge"
                                                    title={totalIssues === 0 ? "Profile implementation complete" : `${totalIssues} configuration issues detected`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const reasons = [];
                                                        const primary = p.linked_entities_list?.find(l => l.level === 'primary');
                                                        const secondary = p.linked_entities_list?.filter(l => l.level === 'secondary') || [];
                                                        const hasEmergency = p.patient_profile?.emergency_contact_phone;
                                                        const isDocAsEmergency = p.patient_profile?.emergency_contact_name && p.patient_profile.emergency_contact_name === p.patient_profile.consulting_doctor;

                                                        if (!primary) reasons.push("Primary caregiver not assigned");
                                                        if (secondary.length === 0) reasons.push("Secondary caregivers not assigned");
                                                        if (!hasEmergency) reasons.push("Emergency contact details not configured");
                                                        if (isDocAsEmergency) reasons.push("Doctor assigned as emergency contact (Manual Check Required)");
                                                        if (!p.patient_profile?.phone_number) reasons.push("Patient phone number missing");
                                                        if (!p.patient_profile?.identity_anchors?.length) reasons.push("Identity anchors missing");


                                                        setConsistencyDetails({
                                                            patientName: p.full_name,
                                                            reasons: reasons
                                                        });
                                                    }}
                                                >
                                                    {totalIssues === 0 ? '✔ healthy' : `⚠ ${totalIssues} issues`}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="btn-action btn-view"
                                                onClick={() => setSelectedPatient(p)}
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {
                selectedPatient && (
                    <div className="admin-modal-overlay" onClick={() => setSelectedPatient(null)}>
                        <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ width: '98%', maxWidth: '1560px', padding: '3.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Patient Data</h2>
                                <button className="btn-auth" onClick={() => setSelectedPatient(null)} style={{ background: '#94a3b8', width: 'auto', padding: '0.7rem 2rem' }}>
                                    Close View
                                </button>
                            </div>

                            {/* Section 1: Identity & Clinical Background */}
                            <div style={{ marginBottom: '3rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Identity & Clinical Background</h4>
                                <div className="inspect-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                                    <div className="inspect-item">
                                        <label>USER ID</label>
                                        <span style={{ fontWeight: '800', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569' }}>
                                            {selectedPatient.unique_id || '—'}
                                        </span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>FULL NAME</label>
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedPatient.full_name}</span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>DATE OF BIRTH</label>
                                        <span style={{ fontWeight: '600' }}>
                                            {selectedPatient.patient_profile?.dob ? new Date(selectedPatient.patient_profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                                            {selectedPatient.age && ` (${selectedPatient.age} years old)`}
                                        </span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>RESIDENTIAL ADDRESS</label>
                                        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#334155' }}>
                                            {selectedPatient.patient_profile?.address || '—'}
                                        </span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>EMAIL</label>
                                        <span style={{ fontWeight: '500' }}>{selectedPatient.email}</span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>PHONE</label>
                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                            {selectedPatient.patient_profile?.phone_number || '—'}
                                        </span>
                                    </div>
                                    <div className="inspect-item">
                                        <label>CONDITION</label>
                                        <span style={{ fontWeight: '700' }}>{formatCondition(selectedPatient.patient_profile?.condition)} ({selectedPatient.patient_profile?.stage || '—'})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Care & Emergency Contacts */}
                            <div style={{ marginBottom: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Care & Emergency Contacts</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>CARE NETWORK</label>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#475569' }}>Primary Caregiver</p>
                                            {selectedPatient.linked_entities_list?.find(l => l.level === 'primary') ? (
                                                <div style={{ fontSize: '0.95rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    • <strong>{selectedPatient.linked_entities_list.find(l => l.level === 'primary').name}</strong> (Rel: {selectedPatient.linked_entities_list.find(l => l.level === 'primary').relationship} | ID: {selectedPatient.linked_entities_list.find(l => l.level === 'primary').unique_id || '—'} | Tel: {selectedPatient.linked_entities_list.find(l => l.level === 'primary').phone})
                                                </div>
                                            ) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>None assigned</p>}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#475569' }}>Secondary Caregivers</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {selectedPatient.linked_entities_list?.filter(l => l.level === 'secondary').map((l, idx) => (
                                                    <div key={idx} style={{ fontSize: '0.95rem', background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                        • <strong>{l.name}</strong> (Rel: {l.relationship} | ID: {l.unique_id || '—'} | Tel: {l.phone})
                                                    </div>
                                                )) || <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>None assigned</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>MEDICAL AUTHORITY</label>
                                        <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #bae6fd' }}>
                                            <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '1rem', color: '#0369a1' }}>Consulting Doctor</p>
                                            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
                                                <div><span style={{ color: '#64748b' }}>Name:</span> <strong>{selectedPatient.patient_profile?.consulting_doctor || '—'}</strong></div>
                                                <div><span style={{ color: '#64748b' }}>Hospital:</span> <strong>{selectedPatient.patient_profile?.consulting_doctor_hospital || '—'}</strong></div>
                                                <div><span style={{ color: '#64748b' }}>Contact:</span> <strong>{selectedPatient.patient_profile?.consulting_doctor_contact || '—'}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Emergency Escalation */}
                            <div style={{ marginBottom: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Emergency Escalation</h4>
                                    {selectedPatient.patient_profile?.emergency_contact_name && selectedPatient.patient_profile.emergency_contact_name === selectedPatient.patient_profile.consulting_doctor && (
                                        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <AlertTriangle size={14} /> Caregiver Attention Required: Doctor assigned as Emergency Contact
                                        </div>
                                    )}
                                </div>
                                <div style={{ background: '#fff1f2', padding: '1.5rem', borderRadius: '16px', border: '1px solid #fecdd3' }}>
                                    <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem', color: '#be123c' }}>Level 1 Emergency Contact</p>
                                    <div style={{ fontSize: '1rem' }}>
                                        {selectedPatient.patient_profile?.emergency_contact_phone ? (
                                            <>
                                                <strong>{selectedPatient.patient_profile.emergency_contact_name}</strong> | {selectedPatient.patient_profile.emergency_contact_relation || 'No Relation Specified'} | <strong>{selectedPatient.patient_profile.emergency_contact_phone}</strong>
                                            </>
                                        ) : <span style={{ color: '#be123c', fontWeight: '600' }}>Emergency Contact Details Not Configured</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Configuration Status */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-accent)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>Configuration Status</h4>
                                <div style={{ display: 'flex', gap: '3rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {selectedPatient.linked_entities_list?.some(l => l.level === 'primary') ? <CheckCircle size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
                                        <span>Primary Caregiver Assigned</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {selectedPatient.linked_entities_list?.some(l => l.level === 'secondary') ? <CheckCircle size={20} color="#16a34a" /> : <XCircle size={20} color="#94a3b8" />}
                                        <span>Secondary Caregiver Assigned</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}>
                                        {selectedPatient.patient_profile?.emergency_contact_phone ? <CheckCircle size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
                                        <span>Emergency Contact Set</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {consistencyDetails && (
                <div className="admin-modal-overlay" onClick={() => setConsistencyDetails(null)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#0f172a' }}>Profile Integrity Report</h3>
                            <button
                                onClick={() => setConsistencyDetails(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                &times;
                            </button>
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ color: '#64748b', fontSize: '1rem' }}>Patient: <strong style={{ color: '#0f172a' }}>{consistencyDetails.patientName}</strong></p>
                            <div style={{ marginTop: '1.5rem' }}>
                                {consistencyDetails.reasons.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {consistencyDetails.reasons.map((r, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: '#fff1f2', borderRadius: '14px', border: '1px solid #fecdd3' }}>
                                                <div style={{ background: '#be123c', color: '#fff', borderRadius: '50%', padding: '0.4rem', display: 'flex' }}>
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <span style={{ color: '#be123c', fontWeight: '700', fontSize: '0.95rem' }}>{r}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '2.5rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                        <CheckCircle size={40} color="#16a34a" style={{ marginBottom: '1rem' }} />
                                        <p style={{ color: '#16a34a', fontWeight: '800', margin: 0, fontSize: '1.1rem' }}>Profile Integrity Healthy</p>
                                        <p style={{ color: '#15803d', fontSize: '0.9rem', marginTop: '0.5rem', margin: 0 }}>All core administrative and care requirements are met.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            className="btn-auth"
                            onClick={() => setConsistencyDetails(null)}
                            style={{ width: '100%', background: '#94a3b8', padding: '1rem' }}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout >
    );
};

export default AdminPatientRegistry;
