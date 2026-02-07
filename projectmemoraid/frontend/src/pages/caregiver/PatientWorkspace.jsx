import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet, Routes, Route, Navigate } from 'react-router-dom';
import {
    User,
    Calendar,
    Shield,
    Bell,
    History,
    ChevronLeft,
    Activity,
    Brain,
    ClipboardList,
    Clock
} from 'lucide-react';
import api from '../../services/api';
import CaregiverLayout from '../../components/CaregiverLayout';
import PatientOverview from './PatientOverview';
import PatientProfileModule from './PatientProfileModule';
import RoutineManagerModule from './RoutineManagerModule';
import CareNetworkModule from './CareNetworkModule';
import AlertsModule from './AlertsModule';
import LogsModule from './LogsModule';

const PatientWorkspace = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPatientDetails = async () => {
        try {
            const response = await api.get(`users/caregiver/patient/${patientId}/`);
            const p = response.data;

            // Map backend data to frontend expected fields if necessary
            // UserSerializer returns patient_profile, we might want to flatten some common ones for easy access
            const profile = p.patient_profile || {};
            const enrichedPatient = {
                ...p,
                condition: profile.condition,
                stage: profile.stage,
                pending_tasks: p.pending_tasks || 0, // Should be calculated or included in serializer
                care_level: p.care_level // Already provided by Serializer Method Field
            };

            setPatient(enrichedPatient);
        } catch (err) {
            console.error('Error fetching patient details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatientDetails();
        const interval = setInterval(fetchPatientDetails, 30000);
        return () => clearInterval(interval);
    }, [patientId]);

    if (loading) {
        return (
            <CaregiverLayout title="" subtitle="">
                <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <Activity size={48} color="var(--cg-accent)" className="animate-spin" />
                    <p style={{ fontWeight: '700', color: '#64748b', fontSize: '1.2rem' }}>Opening Secure Workspace...</p>
                </div>
            </CaregiverLayout>
        );
    }

    if (!patient) {
        return (
            <CaregiverLayout title="Forbidden" subtitle="">
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>Access Restricted</h2>
                    <p style={{ color: '#64748b', marginTop: '1rem' }}>You do not have a registered care link for this patient ID.</p>
                </div>
            </CaregiverLayout>
        );
    }

    return (
        <CaregiverLayout title="" subtitle="">
            <div style={{ marginBottom: '3rem' }}>
                <NavLink to="/caregiver-dashboard" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: '#64748b',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    marginBottom: '2rem',
                    transition: 'all 0.2s'
                }} className="back-link">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <ChevronLeft size={18} />
                    </div>
                    Patient Workspace
                </NavLink>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', border: '1.5px solid #eef2ff' }}>
                            <User size={54} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                                <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, color: '#0f172a', letterSpacing: '-0.05em', fontFamily: '"Outfit", sans-serif' }}>{patient.full_name}</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}></div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', letterSpacing: '0.5px' }}>Active Care</span>
                                </div>
                            </div>
                            <p style={{ color: '#475569', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
                                <div style={{ background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #e2e8f0' }}>
                                    <Brain size={22} color="#6366f1" />
                                    <span style={{ color: '#1e293b' }}>
                                        {patient.condition === 'alzheimers' ? "Alzheimer's" :
                                            patient.condition ? patient.condition.charAt(0).toUpperCase() + patient.condition.slice(1).toLowerCase() :
                                                'General Care'}
                                    </span>
                                </div>
                                <span style={{ color: '#94a3b8', fontSize: '1.5rem', fontWeight: '300' }}>•</span>
                                <div style={{ background: 'linear-gradient(135deg, #fff, #f8fafc)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#475569' }}>
                                        {patient.stage ? patient.stage.charAt(0).toUpperCase() + patient.stage.slice(1).toLowerCase() : 'Mild'}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '0.4rem', fontWeight: '700' }}>Stage</span>
                                </div>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ background: '#fff', padding: '1.25rem 2.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.5rem', display: 'block' }}>Today's Care Status</label>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{(patient.pending_tasks || 0) + (patient.missed_tasks || 0)} <small style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Tasks Left</small></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="workspace-main" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '4rem', marginTop: '4rem' }}>
                <aside>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '2rem' }}>
                        <NavLink to={`/caregiver/workspace/${patientId}/overview`} className={({ isActive }) => isActive ? "ws-nav-link active" : "ws-nav-link"}>
                            <Activity size={22} />
                            <span>Overview</span>
                        </NavLink>
                        <NavLink to={`/caregiver/workspace/${patientId}/profile`} className={({ isActive }) => isActive ? "ws-nav-link active" : "ws-nav-link"}>
                            <User size={22} />
                            <span>Patient Profile</span>
                        </NavLink>
                        <NavLink to={`/caregiver/workspace/${patientId}/routines`} className={({ isActive }) => isActive ? "ws-nav-link active" : "ws-nav-link"}>
                            <ClipboardList size={22} />
                            <span>Routines</span>
                        </NavLink>
                        <NavLink to={`/caregiver/workspace/${patientId}/network`} className={({ isActive }) => isActive ? "ws-nav-link active" : "ws-nav-link"}>
                            <Shield size={22} />
                            <span>Care Network</span>
                        </NavLink>
                        <NavLink to={`/caregiver/workspace/${patientId}/alerts`} className={({ isActive }) => isActive ? "ws-nav-link active" : "ws-nav-link"}>
                            <Bell size={22} />
                            <span>Alerts & SOS</span>
                        </NavLink>
                        <NavLink to={`/caregiver/workspace/${patientId}/logs`} className={({ isActive }) => isActive ? "ws-nav-link active" : "ws-nav-link"}>
                            <History size={22} />
                            <span>Activity Timeline</span>
                        </NavLink>
                    </nav>
                </aside>

                <div className="workspace-view-container" style={{ background: '#fff', borderRadius: '40px', padding: '2.5rem', border: '1.5px solid #f1f5f9', boxShadow: '0 20px 50px rgba(0,0,0,0.02)', minHeight: '600px' }}>
                    <Routes>
                        <Route path="overview" element={<PatientOverview patient={patient} onRefresh={fetchPatientDetails} />} />
                        <Route path="profile" element={<PatientProfileModule patient={patient} onRefresh={fetchPatientDetails} />} />
                        <Route path="routines" element={<RoutineManagerModule patient={patient} onRefresh={fetchPatientDetails} />} />
                        <Route path="network" element={<CareNetworkModule patient={patient} onRefresh={fetchPatientDetails} />} />
                        <Route path="alerts" element={<AlertsModule patient={patient} onRefresh={fetchPatientDetails} />} />
                        <Route path="logs" element={<LogsModule patient={patient} onRefresh={fetchPatientDetails} />} />
                        <Route path="/" element={<Navigate to="overview" replace />} />
                    </Routes>
                </div>
            </div>
        </CaregiverLayout>
    );
};

export default PatientWorkspace;
