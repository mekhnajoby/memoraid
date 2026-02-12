import React, { useState } from 'react';
import {
    Fingerprint,
    Anchor,
    Plus,
    Trash2,
    Save,
    Info,
    UserCircle,
    Phone,
    User,
    ShieldCheck,
    Image as ImageIcon,
    Camera,
    Users,
    StickyNote
} from 'lucide-react';
import api from '../../services/api';

const PatientProfileModule = ({ patient, onRefresh }) => {
    // Correctly identify caregiver permission level
    // patient.care_level will be "Primary Caregiver" or "Secondary Caregiver"
    const canEdit = patient.care_level?.toLowerCase().includes('primary');

    const [profile, setProfile] = useState(patient.patient_profile || {
        familiar_name: '',
        condition: 'alzheimers',
        stage: 'mild',
        identity_anchors: [],
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        consulting_doctor: '',
        care_notes: '',
        phone_number: ''
    });
    const [anchors, setAnchors] = useState(patient.patient_profile?.identity_anchors || []);
    const [newAnchor, setNewAnchor] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [anchorMessage, setAnchorMessage] = useState('');
    const [notesMessage, setNotesMessage] = useState('');
    const [galleryMessage, setGalleryMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    // Memory Gallery State
    const [memories, setMemories] = useState([]);
    const [fetchingMemories, setFetchingMemories] = useState(false);
    const [showMemoryModal, setShowMemoryModal] = useState(false);
    const [newMemory, setNewMemory] = useState({
        image: null,
        caption: '',
        relationship_context: ''
    });
    const [memoryPreview, setMemoryPreview] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const [deleteMemoryId, setDeleteMemoryId] = useState(null);

    const fetchMemories = async () => {
        setFetchingMemories(true);
        try {
            const response = await api.get(`users/caregiver/memories/?patient_id=${patient.id}`);
            setMemories(response.data);
        } catch (err) {
            console.error('Error fetching memories:', err);
        } finally {
            setFetchingMemories(false);
        }
    };

    React.useEffect(() => {
        if (patient.patient_profile) {
            setProfile(patient.patient_profile);
            setAnchors(patient.patient_profile.identity_anchors || []);
        }
    }, [patient]);

    React.useEffect(() => {
        fetchMemories();
    }, [patient.id]);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_photo', file);
        formData.append('target_patient_id', patient.id);

        setUploading(true);
        try {
            await api.patch('users/profile/photo/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Photo updated successfully.');
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            setMessage('Failed to upload photo.');
        } finally {
            setUploading(false);
        }
    };

    const handleAddAnchor = () => {
        if (canEdit && newAnchor.trim()) {
            setAnchors([...anchors, newAnchor.trim()]);
            setNewAnchor('');
        }
    };

    const handleRemoveAnchor = (index) => {
        if (canEdit) {
            setAnchors(anchors.filter((_, i) => i !== index));
        }
    };

    const handleSave = async (section = 'profile') => {
        if (!canEdit) return;
        setLoading(true);

        // Reset only the relevant message
        if (section === 'profile') setProfileMessage('');
        else if (section === 'anchors') setAnchorMessage('');
        else if (section === 'notes') setNotesMessage('');

        const displayMessage = section === 'anchors' ? 'Identity anchors saved successfully!' :
            section === 'notes' ? 'Notes updated successfully.' :
                'Profile updated successfully.';

        try {
            const payload = {
                familiar_name: profile.familiar_name,
                condition: profile.condition,
                stage: profile.stage,
                emergency_contact_phone: profile.emergency_contact_phone,
                emergency_contact_relation: profile.emergency_contact_relation,
                emergency_contact_name: profile.emergency_contact_name,
                consulting_doctor: profile.consulting_doctor,
                consulting_doctor_hospital: profile.consulting_doctor_hospital,
                consulting_doctor_contact: profile.consulting_doctor_contact,
                care_notes: profile.care_notes,
                phone_number: profile.phone_number,
                identity_anchors: anchors
            };

            await api.patch(`users/onboarding/`, {
                patient_profile: payload,
                target_patient_id: patient.id
            });

            if (section === 'profile') {
                setProfileMessage(displayMessage);
                setTimeout(() => setProfileMessage(''), 3000);
            } else if (section === 'anchors') {
                setAnchorMessage(displayMessage);
                setTimeout(() => setAnchorMessage(''), 3000);
            } else if (section === 'notes') {
                setNotesMessage(displayMessage);
                setTimeout(() => setNotesMessage(''), 3000);
            }

            if (onRefresh) onRefresh();
        } catch (err) {
            console.error(err);
            const errorMsg = 'Failed to update profile.';
            if (section === 'profile') setProfileMessage(errorMsg);
            else if (section === 'anchors') setAnchorMessage(errorMsg);
            else if (section === 'notes') setNotesMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-module-container" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Fingerprint size={22} color="var(--cg-accent)" /> Patient Profile & Care Context
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Maintain clinical context and reassuring facts for the patient interface.</p>
                </div>
                {canEdit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {profileMessage && <span style={{ fontSize: '0.85rem', color: profileMessage.includes('success') ? '#10b981' : '#ef4444', fontWeight: '700' }}>{profileMessage}</span>}
                        <button className="btn-auth" style={{ width: 'auto', padding: '0.6rem 2rem' }} onClick={() => handleSave('profile')} disabled={loading}>
                            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '24px',
                        background: '#f1f5f9',
                        border: '2px dashed #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        marginBottom: '1rem',
                        overflow: 'hidden'
                    }}>
                        {patient.profile_photo ? (
                            <img
                                src={patient.profile_photo}
                                alt={patient.full_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <UserCircle size={64} />
                        )}
                    </div>
                    {canEdit && (
                        <>
                            <input
                                type="file"
                                id="photo-upload"
                                hidden
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                            <button
                                onClick={() => document.getElementById('photo-upload').click()}
                                disabled={uploading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--cg-primary)',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    opacity: uploading ? 0.5 : 1
                                }}
                            >
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </button>
                        </>
                    )}
                </div>

                <div className="inspect-grid" style={{ flexGrow: 1, gridTemplateColumns: '1fr 1fr' }}>
                    <div className="inspect-item">
                        <label>Legal Full Name</label>
                        <input
                            type="text"
                            value={patient.full_name}
                            disabled
                            className="form-input-styled"
                            style={{ background: '#f8fafc' }}
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Preferred Name / Nickname</label>
                        <input
                            type="text"
                            value={profile.familiar_name || ''}
                            onChange={(e) => setProfile({ ...profile, familiar_name: e.target.value })}
                            disabled={!canEdit}
                            placeholder="e.g. Grandma Betty"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Patient Contact Number</label>
                        <input
                            type="text"
                            value={profile.phone_number || ''}
                            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                            disabled={!canEdit}
                            placeholder="e.g. +1 234 567 890"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Patient Email Address</label>
                        <input
                            type="text"
                            value={patient.email || ''}
                            disabled
                            className="form-input-styled"
                            style={{ background: '#f8fafc' }}
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Primary Condition</label>
                        <select
                            className="form-input-styled"
                            value={profile.condition || ''}
                            onChange={(e) => setProfile({ ...profile, condition: e.target.value })}
                            disabled={!canEdit}
                        >
                            <option value="alzheimers">Alzheimer’s Disease</option>
                            <option value="dementia">General Dementia</option>
                        </select>
                    </div>
                    <div className="inspect-item">
                        <label>Disease Stage</label>
                        <select
                            className="form-input-styled"
                            value={profile.stage || ''}
                            onChange={(e) => setProfile({ ...profile, stage: e.target.value })}
                            disabled={!canEdit}
                        >
                            <option value="mild">Mild (Early Stage)</option>
                            <option value="moderate">Moderate (Middle Stage)</option>
                            <option value="severe">Severe (Late Stage)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem', marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: '800' }}>Emergency & Medical Oversight</h4>
                <div className="inspect-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="inspect-item">
                        <label>Emergency Contact</label>
                        <input
                            type="text"
                            value={profile.emergency_contact_name || ''}
                            onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Full Name"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Contact Phone</label>
                        <input
                            type="text"
                            value={profile.emergency_contact_phone || ''}
                            onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Phone Number"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Relationship to Patient</label>
                        <input
                            type="text"
                            value={profile.emergency_contact_relation || ''}
                            onChange={(e) => setProfile({ ...profile, emergency_contact_relation: e.target.value })}
                            disabled={!canEdit}
                            placeholder="e.g. Son, Neighbour, Paid Carer"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Consulting Doctor</label>
                        <input
                            type="text"
                            value={profile.consulting_doctor || ''}
                            onChange={(e) => setProfile({ ...profile, consulting_doctor: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Doctor Name"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Hospital / Clinic</label>
                        <input
                            type="text"
                            value={profile.consulting_doctor_hospital || ''}
                            onChange={(e) => setProfile({ ...profile, consulting_doctor_hospital: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Hospital Name"
                            className="form-input-styled"
                        />
                    </div>
                    <div className="inspect-item">
                        <label>Dr. Contact Number</label>
                        <input
                            type="text"
                            value={profile.consulting_doctor_contact || ''}
                            onChange={(e) => setProfile({ ...profile, consulting_doctor_contact: e.target.value })}
                            disabled={!canEdit}
                            placeholder="Contact Number"
                            className="form-input-styled"
                        />
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Anchor size={22} color="var(--cg-accent)" />
                        <h3 style={{ margin: 0 }}>Identity Anchors</h3>
                        <div className="info-tooltip" style={{ position: 'relative', cursor: 'help' }}>
                            <Info size={14} color="#94a3b8" />
                        </div>
                    </div>
                    {canEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {anchorMessage && <span style={{ fontSize: '0.85rem', color: anchorMessage.includes('success') ? '#10b981' : '#ef4444', fontWeight: '700' }}>{anchorMessage}</span>}
                            <button
                                className="btn-auth"
                                style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                                onClick={() => handleSave('anchors')}
                                disabled={loading}
                            >
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Anchors'}
                            </button>
                        </div>
                    )}
                </div>
                <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e0f2fe', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#0369a1', margin: 0, fontWeight: '600', lineHeight: '1.5' }}>
                        <strong>Tip:</strong> Anchors should be short, reassuring statements like <em>"You are at home with your daughter, Sarah"</em> or <em>"It is Monday afternoon."</em> These will be displayed prominently to the patient to help with orientation.
                    </p>
                </div>

                <div className="anchors-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {anchors.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem', border: '1.5px dashed #cbd5e1' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>No identity anchors added yet. Anchors help patients feel secure and oriented if they become confused.</p>
                        </div>
                    ) : (
                        anchors.map((anchor, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.25rem 1.75rem',
                                background: '#f8fafc',
                                borderRadius: '16px',
                                border: '1px solid #f1f5f9',
                                transition: 'all 0.2s'
                            }}>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{anchor}</span>
                                {canEdit && (
                                    <button onClick={() => handleRemoveAnchor(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {canEdit && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="text"
                            placeholder="e.g., 'You are at home with your son, Mark.'"
                            value={newAnchor}
                            onChange={(e) => setNewAnchor(e.target.value)}
                            className="form-input-styled"
                            style={{ flexGrow: 1 }}
                        />
                        <button className="btn-auth" style={{ width: 'auto', background: '#0f172a', color: '#fff', border: 'none', padding: '0.8rem 1.5rem' }} onClick={handleAddAnchor}>
                            <Plus size={18} /> Add Anchor
                        </button>
                    </div>
                )}
            </div>

            {/* Memory Gallery Section */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '3rem', marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                                <ImageIcon size={22} color="var(--cg-accent)" /> Memory Gallery
                            </h3>
                            {galleryMessage && (
                                <span className="fade-in" style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700', padding: '0.25rem 0.75rem', background: '#ecfdf5', borderRadius: '8px' }}>
                                    {galleryMessage}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>Photos and captions to reassure and orient the patient.</p>
                    </div>
                    {canEdit && (
                        <button
                            className="btn-auth"
                            style={{ width: 'auto', padding: '0.6rem 1.5rem', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}
                            onClick={() => setShowMemoryModal(true)}
                        >
                            <Plus size={18} /> Add Photo
                        </button>
                    )}
                </div>

                {fetchingMemories ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading memories...</div>
                ) : memories.length === 0 ? (
                    <div className="empty-state" style={{ padding: '4rem', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '24px' }}>
                        <ImageIcon size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                        <p style={{ fontWeight: '700', color: '#64748b' }}>No memories added yet.</p>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>Upload photos of family, friends, or familiar places with reassuring captions.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                        {memories.map((memory) => (
                            <div key={memory.id} style={{
                                background: '#fff',
                                padding: '1.25rem',
                                borderRadius: '24px',
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                position: 'relative'
                            }}>
                                <div style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                                    <img src={memory.image} alt={memory.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>{memory.caption}</h4>
                                {memory.relationship_context && (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cg-accent)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Users size={14} /> {memory.relationship_context}
                                    </p>
                                )}
                                {canEdit && (
                                    <button
                                        onClick={() => setDeleteMemoryId(memory.id)}
                                        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Care Notes Section */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '3rem', marginTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <StickyNote size={22} color="var(--cg-accent)" />
                    <h3 style={{ margin: 0 }}>Care Notes</h3>
                </div>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                        Provide specific notes regarding the patient's daily care, preferences, or recent changes. This information is shared with all caregivers linked to the patient.
                    </p>
                    <textarea
                        className="form-input-styled"
                        style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '1rem',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            background: canEdit ? '#fff' : '#f1f5f9'
                        }}
                        placeholder="Add some notes about patient care..."
                        value={profile.care_notes || ''}
                        onChange={(e) => setProfile({ ...profile, care_notes: e.target.value })}
                        disabled={!canEdit}
                    />
                    {canEdit && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                            {notesMessage && <span style={{ fontSize: '0.85rem', color: notesMessage.includes('success') ? '#10b981' : '#ef4444', fontWeight: '700' }}>{notesMessage}</span>}
                            <button
                                className="btn-auth"
                                style={{ width: 'auto', padding: '0.6rem 2rem' }}
                                onClick={() => handleSave('notes')}
                                disabled={loading}
                            >
                                <Save size={18} /> {loading ? 'Saving Notes...' : 'Save Notes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Memory Upload Modal */}
            {showMemoryModal && (
                <div className="admin-modal-overlay" onClick={() => setShowMemoryModal(false)}>
                    <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Camera size={24} color="var(--cg-accent)" /> Add Memory Photo
                        </h3>
                        <div style={{ marginBottom: '2rem' }}>
                            <div
                                onClick={() => document.getElementById('memory-file').click()}
                                style={{
                                    height: '240px',
                                    background: '#f8fafc',
                                    borderRadius: '20px',
                                    border: '2px dashed #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden'
                                }}
                            >
                                {memoryPreview ? (
                                    <img src={memoryPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <ImageIcon size={48} color="#94a3b8" />
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1rem', fontWeight: '600' }}>Click to select photo</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                id="memory-file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setNewMemory({ ...newMemory, image: file });
                                        setMemoryPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Image Caption</label>
                            <input
                                type="text"
                                className="form-input-styled"
                                placeholder="e.g. Grandma Betty laughing"
                                value={newMemory.caption}
                                onChange={(e) => setNewMemory({ ...newMemory, caption: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label>Relationship / Identity Anchor</label>
                            <input
                                type="text"
                                className="form-input-styled"
                                placeholder="e.g. Your daughter Sarah"
                                value={newMemory.relationship_context}
                                onChange={(e) => setNewMemory({ ...newMemory, relationship_context: e.target.value })}
                            />
                        </div>

                        {uploadError && (
                            <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                {uploadError}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-auth" style={{ background: '#f8fafc', color: '#64748b' }} onClick={() => setShowMemoryModal(false)}>Cancel</button>
                            <button
                                className="btn-auth"
                                disabled={uploading}
                                onClick={async () => {
                                    if (!newMemory.image) {
                                        setUploadError('Please select an image first.');
                                        return;
                                    }
                                    if (!newMemory.caption) {
                                        setUploadError('Please provide a caption for the memory.');
                                        return;
                                    }
                                    setUploading(true);
                                    setUploadError('');
                                    const formData = new FormData();
                                    formData.append('image', newMemory.image);
                                    formData.append('caption', newMemory.caption);
                                    formData.append('relationship_context', newMemory.relationship_context);
                                    formData.append('patient', patient.id);

                                    try {
                                        await api.post('users/caregiver/memories/', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        setShowMemoryModal(false);
                                        setNewMemory({ image: null, caption: '', relationship_context: '' });
                                        setMemoryPreview(null);
                                        fetchMemories();
                                        setGalleryMessage('Photo added successfully.');
                                        setTimeout(() => setGalleryMessage(''), 3000);
                                    } catch (err) {
                                        console.error(err);
                                        const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to upload memory. Please try again.';
                                        setUploadError(errMsg);
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                            >
                                {uploading ? 'Uploading...' : 'Upload Memory'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteMemoryId && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', padding: '2.5rem' }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#0f172a' }}>Delete Memory?</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                            This memory will be permanently removed from the gallery. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-auth"
                                style={{ background: '#f8fafc', color: '#64748b', flex: 1 }}
                                onClick={() => setDeleteMemoryId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-auth"
                                style={{ background: '#ef4444', flex: 1 }}
                                onClick={async () => {
                                    try {
                                        await api.delete(`users/caregiver/memories/${deleteMemoryId}/`);
                                        setDeleteMemoryId(null);
                                        fetchMemories();
                                    } catch (err) {
                                        console.error('Delete failed:', err);
                                        const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to delete memory.';
                                        setUploadError(errMsg);
                                        setDeleteMemoryId(null);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfileModule;
