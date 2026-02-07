import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/icons/logo.png';
import patientIcon from '../assets/icons/patient.png';
import caregiverIcon from '../assets/icons/caregiver.png';
import { getUser, isAuthenticated, logout } from '../utils/auth';
import './LandingPage.css';

const LandingPage = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated()) {
            setCurrentUser(getUser());
        }
    }, []);

    const handleLogout = () => {
        logout();
        setCurrentUser(null);
        window.location.reload();
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="landing-container">
            <nav className="navbar">
                <div className="nav-logo-section">
                    <div className="logo-group">
                        <img src={logo} alt="Memoraid Logo" className="nav-logo" />
                        <h1 className="nav-title">Memoraid</h1>
                    </div>
                    <span className="nav-caption">Supporting care and memory, step by step</span>
                </div>
                <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
                    <a href="#about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</a>
                    {currentUser ? (
                        <>
                            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                                Welcome, {currentUser.full_name}
                            </span>
                            <Link to="/dashboard">
                                <button className="btn-login">Dashboard</button>
                            </Link>
                            <button className="btn-register" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-login-link">
                                <button className="btn-login">Login</button>
                            </Link>
                            <Link to="/register">
                                <button className="btn-register">Register</button>
                            </Link>
                        </>
                    )}
                </div>
                <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
                    <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
                </button>
            </nav>


            <main className="hero-section">
                <div className="motion-card">
                    <h2 className="hero-title">Designed to support daily care routines when memory becomes difficult.</h2>
                    <p className="hero-subtitle">Built for caregivers and families supporting individuals with Alzheimer’s or dementia.</p>
                </div>
                <div className="pillars-tagline">
                    Supporting families • Guiding care • Ensuring safety
                </div>

                <section className="role-cards">
                    <div className="role-card">
                        <div className="role-icon">
                            <img src={patientIcon} alt="Patient" />
                        </div>
                        <h3>Patient</h3>
                        <p>Receive guided reminders and request help when needed.</p>
                    </div>

                    <div className="role-card">
                        <div className="role-icon">
                            <img src={caregiverIcon} alt="Caregiver" />
                        </div>
                        <h3>Caregiver</h3>
                        <p>Configure routines, monitor care, and respond to alerts.</p>
                    </div>
                </section>

                <section id="about" className="about-section">
                    <h2>About Memoraid</h2>
                    <div className="about-content">
                        <p>
                            Memoraid is a caregiver-centric web platform designed to support the daily care of individuals with mild to moderate Alzheimer’s or dementia.
                        </p>
                        <p>
                            The system helps caregivers and families coordinate routines, reinforce identity, and ensure safety, while providing care recipients with a simplified, guided interface tailored to cognitive impairment.
                        </p>
                        <div className="disclaimer-box">
                            <p className="disclaimer-text">
                                <strong>Important Note:</strong> Memoraid is not intended to replace human care. Instead, it acts as a supportive care coordination tool, helping families deliver consistent, structured assistance and respond quickly when help is needed.
                            </p>
                        </div>
                    </div>
                </section>


                <section className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Caregiver sets routine</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Assisted reminder is delivered to the patient</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Memoraid logs activity and alerts caregivers</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <p>&copy; 2026 Memoraid. Supporting memory, step by step.</p>
            </footer>
        </div>
    );
};


export default LandingPage;
