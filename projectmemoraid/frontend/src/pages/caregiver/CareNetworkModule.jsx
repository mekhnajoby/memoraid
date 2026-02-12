import React, { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    UserPlus,
    Trash2,
    Phone,
    Mail,
    Plus,
    UserCircle,
    AlertTriangle,
    X
} from 'lucide-react';
import api from '../../services/api';

const CareNetworkModule = ({ patient, onRefresh }) => {
    const [team, setTeam] = useState([]);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [consultingDoctors, setConsultingDoctors] = useState([]);
    const [isPrimary, setIsPrimary] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', name: '', relationship: 'Family Assistant' });
    const [inviteError, setInviteError] = useState('');

    const [showContactModal, setShowContactModal] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', phone: '', relation: 'Family', customRelation: '', notes: '' });

    // Custom Confirm Dialog State
    const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }

    const fetchNetwork = async () => {
        setLoading(true);
        try {
            const response = await api.get(`users/caregiver/network/?patient_id=${patient.id}`);
            setTeam(response.data.team || []);
            setEmergencyContacts(response.data.emergency_contacts || []);
            setConsultingDoctors(response.data.consulting_doctors || []);
            setIsPrimary(!!response.data.is_primary);
        } catch (err) {
            console.error('Error fetching care network:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNetwork();
    }, [patient.id]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        try {
            await api.post('users/caregiver/network/manage/', {
                patient_id: patient.id,
                action: 'invite',
                email: inviteData.email,
                name: inviteData.name,
                relationship: inviteData.relationship
            });
            setShowInviteModal(false);
            setInviteData({ email: '', name: '', relationship: 'Family Assistant' });
            fetchNetwork();
            if (onRefresh) onRefresh();
        } catch (err) {
            setInviteError(err.response?.data?.error || 'Failed to invite caregiver.');
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member? they will lose all access to this workspace.')) return;
        try {
            await api.post('users/caregiver/network/manage/', {
                patient_id: patient.id,
                action: 'remove_member',
                member_id: memberId
            });
            fetchNetwork();
            if (onRefresh) onRefresh();
        } catch (err) {
            alert('Failed to remove member.');
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        try {
            const isDoctor = newContact.relation === 'Doctor' || newContact.relation === 'Consulting Physician';
            const finalRelation = newContact.relation === 'Other' ? newContact.customRelation : newContact.relation;

            await api.patch('users/onboarding/', {
                target_patient_id: patient.id,
                patient_profile: isDoctor ? {
                    consulting_doctor: newContact.name,
                    consulting_doctor_contact: newContact.phone,
                    consulting_doctor_hospital: newContact.hospital,
                    consulting_doctor_notes: newContact.notes
                } : {
                    emergency_contact_name: newContact.name,
                    emergency_contact_phone: newContact.phone,
                    emergency_contact_relation: finalRelation
                }
            });
            setShowContactModal(false);
            setNewContact({ name: '', phone: '', relation: 'Family', customRelation: '', notes: '' });
            setIsEditingContact(false);
            fetchNetwork();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            alert('Failed to update contact.');
        }
    };

    const handleEditClick = (contact) => {
        setIsEditingContact(true);
        const standardRelations = ['Neighbour', 'Family', 'Doctor'];
        const isOther = !standardRelations.includes(contact.relation);
        setNewContact({
            name: contact.name,
            phone: contact.phone === 'N/A' || contact.phone === 'Not available' || !contact.phone ? '' : contact.phone,
            relation: isOther ? 'Other' : contact.relation,
            customRelation: isOther ? contact.relation : '',
            hospital: contact.hospital || '',
            notes: contact.notes || ''
        });
        setShowContactModal(true);
    };

    // Permission: Only Primary
    const canEdit = isPrimary;

    return (
        <div className="admin-module-container" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Shield size={22} color="var(--cg-accent)" /> Care Team & Safety Network
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Coordinate with other caregivers and manage emergency outreach protocols.</p>
                </div>
            </div>

            <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Active Care Team</h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#64748b' }}>Authorised caregivers with real-time workspace access.</p>
                    </div>
                    {canEdit && (
                        <button onClick={() => setShowInviteModal(true)} className="btn-auth" style={{ width: 'auto', padding: '0.8rem 1.75rem', borderRadius: '14px', fontSize: '1rem' }}>
                            <UserPlus size={18} style={{ marginRight: '0.6rem' }} /> Invite Caregiver
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {loading ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Syncing team data...</p>
                    ) : (
                        team.map((member) => (
                            <div key={member.id} className="routine-item" style={{
                                background: '#ffffff',
                                padding: '2rem',
                                borderRadius: '28px',
                                border: '1.5px solid #f1f5f9',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2rem'
                            }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                    <UserCircle size={36} />
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <h5 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>{member.name}</h5>
                                    <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            color: member.role.includes('Primary') ? 'var(--cg-accent)' : '#6366f1',
                                            fontWeight: '800',
                                            fontSize: '0.8rem',
                                            textTransform: 'none',
                                            letterSpacing: '0.5px',
                                            background: member.role.includes('Primary') ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '8px'
                                        }}>
                                            {member.role}
                                        </span>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
                                            • {member.relationship}
                                        </span>
                                        {!member.is_approved && (
                                            <span style={{
                                                background: '#fff7ed',
                                                color: '#c2410c',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                textTransform: 'none',
                                                border: '1px solid #ffedd5'
                                            }}>
                                                Pending Admin Approval
                                            </span>
                                        )}
                                        <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>
                                            <Mail size={16} /> {member.email}
                                        </div>
                                    </div>
                                </div>
                                {canEdit && !member.role.includes('Primary') && (
                                    <button onClick={() => setConfirmAction({
                                        message: `Are you sure you want to remove ${member.name}? They will lose all access to this workspace.`,
                                        onConfirm: () => handleRemoveMember(member.id)
                                    })} style={{ background: '#fef2f2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.8rem', borderRadius: '14px', transition: 'all 0.2s' }}>
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                    {!loading && team.length === 0 && (
                        <div style={{ padding: '3rem', background: '#f8fafc', borderRadius: '28px', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                            <p style={{ color: '#94a3b8', fontWeight: '600' }}>No active care team members found.</p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Emergency Directory</h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#64748b' }}>Immediate outreach protocols.</p>
                    </div>
                    {canEdit && (
                        <button onClick={() => setShowContactModal(true)} className="btn-auth" style={{ width: 'auto', padding: '0.8rem 1.75rem', borderRadius: '14px', fontSize: '1rem', background: '#ffffff', color: 'var(--cg-text-main)', border: '1.5px solid #e2e8f0' }}>
                            <Plus size={18} style={{ marginRight: '0.6rem' }} /> Add Emergency Contact
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {emergencyContacts.map((contact, index) => {
                        const isMissingInfo = !contact.phone || !contact.name;
                        return (
                            <div key={index} className="routine-item" style={{
                                background: isMissingInfo ? '#fff9f9' : '#ffffff',
                                borderColor: isMissingInfo ? '#fee2e2' : '#f1f5f9',
                                padding: '2.5rem',
                                borderRadius: '28px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: isMissingInfo ? '#fee2e2' : '#f8fafc', color: isMissingInfo ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={28} />
                                    </div>
                                    <span style={{ color: isMissingInfo ? '#ef4444' : '#64748b', fontWeight: '800', textTransform: 'none', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                        {contact.relation || 'Contact'}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h5 style={{ margin: 0, fontSize: '1.4rem', color: isMissingInfo ? '#991b1b' : '#0f172a', fontWeight: '800' }}>{contact.name || 'Missing Name'}</h5>
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEditClick(contact)}
                                                style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                Edit Info
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', marginTop: '0.75rem', fontSize: '1.1rem' }}>
                                        <Phone size={20} /> {contact.phone || 'No phone number'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {emergencyContacts.length === 0 && (
                        <div style={{ gridColumn: 'span 2', padding: '4rem', background: '#f8fafc', borderRadius: '28px', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                            <p style={{ color: '#94a3b8', fontWeight: '600' }}>No emergency outreach protocols established.</p>
                        </div>
                    )}
                </div>
            </section>

            <section style={{ marginTop: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Consulting Physicians</h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#64748b' }}>Primary medical oversight.</p>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => {
                                setNewContact({ name: '', phone: '', relation: 'Doctor', customRelation: '', notes: '', hospital: '' });
                                setIsEditingContact(false);
                                setShowContactModal(true);
                            }}
                            className="btn-auth"
                            style={{
                                width: 'auto',
                                padding: '0.8rem 1.75rem',
                                borderRadius: '14px',
                                fontSize: '1rem',
                                background: '#f0f9ff',
                                color: '#0369a1',
                                border: '1.5px solid #bae6fd'
                            }}
                        >
                            <Shield size={18} style={{ marginRight: '0.6rem' }} /> Add Consulting Physician
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {consultingDoctors.length > 0 ? (
                        consultingDoctors.map((doc, index) => (
                            <div key={index} className="routine-item" style={{
                                background: '#f0f9ff',
                                borderColor: '#e0f2fe',
                                padding: '2.5rem',
                                borderRadius: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2.5rem',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={32} />
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h5 style={{ margin: 0, fontSize: '1.4rem', color: '#0c4a6e', fontWeight: '800' }}>{doc.name}</h5>
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEditClick({ ...doc, relation: 'Doctor' })}
                                                style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                Edit Info
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', alignItems: 'center' }}>
                                        <span style={{ color: '#475569', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={18} /> {doc.phone}
                                        </span>
                                        {doc.hospital && (
                                            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>
                                                • {doc.hospital}
                                            </span>
                                        )}
                                    </div>
                                    {doc.notes && (
                                        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e0f2fe' }}>
                                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Clinical Notes & Instructions</span>
                                            <p style={{ margin: 0, color: '#0369a1', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.5' }}>"{doc.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '3rem', background: '#f8fafc', borderRadius: '28px', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                            <p style={{ color: '#94a3b8', fontWeight: '600' }}>No consulting physicians recorded.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="admin-modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', borderRadius: '32px', padding: '3.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Invite New Caregiver</h2>
                            <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowInviteModal(false)} />
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input-styled"
                                    placeholder="e.g. Sarah Johnson"
                                    style={{ marginTop: '0.5rem' }}
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="form-input-styled"
                                    placeholder="email@example.com"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                    style={{ marginTop: '0.5rem' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Relationship</label>
                                    <select
                                        className="form-input-styled"
                                        style={{ marginTop: '0.5rem' }}
                                        value={inviteData.relationship}
                                        onChange={(e) => setInviteData({ ...inviteData, relationship: e.target.value })}
                                    >
                                        <option value="Family Assistant">Family Assistant</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Child">Child</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Professional Caregiver">Professional Caregiver</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            {inviteError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '700' }}>{inviteError}</p>}
                            <button type="submit" className="btn-auth" style={{ width: '100%', borderRadius: '16px', fontWeight: '800', padding: '1.1rem' }}>
                                Sending Access Invite
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && (
                <div className="admin-modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', borderRadius: '32px', padding: '3.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
                                {isEditingContact ? 'Edit Contact Info' : 'Add Emergency Contact'}
                            </h2>
                            <X size={24} style={{ cursor: 'pointer' }} onClick={() => { setShowContactModal(false); setIsEditingContact(false); }} />
                        </div>
                        <form onSubmit={handleAddContact}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Contact Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input-styled"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    style={{ marginTop: '0.5rem' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: (newContact.relation === 'Doctor' || newContact.relation === 'Consulting Physician') ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                {(newContact.relation !== 'Doctor' && newContact.relation !== 'Consulting Physician') && (
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Relationship</label>
                                        <select
                                            className="form-input-styled"
                                            style={{ marginTop: '0.5rem' }}
                                            value={newContact.relation}
                                            onChange={(e) => setNewContact({ ...newContact, relation: e.target.value, customRelation: e.target.value === 'Other' ? '' : newContact.customRelation })}
                                        >
                                            <option value="Neighbour">Neighbour</option>
                                            <option value="Family">Family</option>
                                            <option value="Doctor">Doctor</option>
                                            <option value="Other">Other Relationship</option>
                                        </select>
                                    </div>
                                )}
                                {newContact.relation === 'Other' && (
                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--cg-accent)', textTransform: 'none', letterSpacing: '0.5px' }}>Specify Relationship</label>
                                        <input
                                            type="text"
                                            required
                                            className="form-input-styled"
                                            placeholder="e.g. Physical Therapist"
                                            value={newContact.customRelation}
                                            onChange={(e) => setNewContact({ ...newContact, customRelation: e.target.value })}
                                            style={{ marginTop: '0.5rem' }}
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Phone Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input-styled"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        style={{ marginTop: '0.5rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                {(newContact.relation === 'Doctor' || newContact.relation === 'Consulting Physician') ? (
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Hospital (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input-styled"
                                            style={{ marginTop: '0.5rem' }}
                                            value={newContact.hospital || ''}
                                            onChange={(e) => setNewContact({ ...newContact, hospital: e.target.value })}
                                        />
                                    </div>
                                ) : null}
                                <div className="form-group">
                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="form-input-styled"
                                        style={{ marginTop: '0.5rem' }}
                                    />
                                </div>
                            </div>
                            {(newContact.relation === 'Doctor' || newContact.relation === 'Consulting Physician') && (
                                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8', textTransform: 'none', letterSpacing: '0.5px' }}>Additional Clinical Notes</label>
                                    <textarea
                                        className="form-input-styled"
                                        style={{ marginTop: '0.5rem', minHeight: '100px', resize: 'vertical', padding: '1rem' }}
                                        placeholder="e.g. Specialists details, preferred pharmacies, or specific care instructions..."
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                                    />
                                </div>
                            )}
                            <button type="submit" className="btn-auth" style={{ width: '100%', borderRadius: '16px', fontWeight: '800', padding: '1.1rem' }}>
                                {isEditingContact ? 'Save Changes' : 'Register Contact'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmAction && (
                <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="admin-modal-content" style={{ maxWidth: '450px', borderRadius: '28px', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 2rem' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Are you sure?</h3>
                        <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>{confirmAction.message}</p>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <button onClick={() => setConfirmAction(null)} className="btn-auth" style={{ background: '#f1f5f9', color: '#64748b', border: 'none', flexGrow: 1 }}>Cancel</button>
                            <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="btn-auth" style={{ background: '#ef4444', color: '#fff', border: 'none', flexGrow: 1 }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareNetworkModule;
