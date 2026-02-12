import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) => {
    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
        },
        content: {
            background: '#fff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        },
        iconContainer: {
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            background: type === 'danger' ? '#fef2f2' : '#f0fdf4',
            color: type === 'danger' ? '#ef4444' : '#22c55e'
        },
        closeBtn: {
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '10px',
            transition: 'all 0.2s'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#0f172a',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
        },
        message: {
            fontSize: '1rem',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '2rem'
        },
        actions: {
            display: 'flex',
            gap: '1rem'
        },
        btn: {
            flex: 1,
            padding: '0.875rem',
            borderRadius: '14px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.content} onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={styles.closeBtn}
                    onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                    <X size={20} />
                </button>

                <div style={styles.iconContainer}>
                    <AlertTriangle size={28} />
                </div>

                <h3 style={styles.title}>{title || 'Confirm Action'}</h3>
                <p style={styles.message}>{message}</p>

                <div style={styles.actions}>
                    <button
                        style={{ ...styles.btn, background: '#f1f5f9', color: '#475569' }}
                        onClick={onClose}
                    >
                        {cancelText || 'Cancel'}
                    </button>
                    <button
                        style={{
                            ...styles.btn,
                            background: type === 'danger' ? '#ef4444' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: '#fff',
                            boxShadow: type === 'danger' ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)' : '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                        }}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideIn { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                `}
            </style>
        </div>
    );
};

export default ConfirmModal;
