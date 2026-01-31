import React from 'react';
import { AlertTriangle, Bell, X, UserPlus } from 'lucide-react';

interface AtypicalWarningModalProps {
    onClose: () => void;
    onNotify: () => void;
    atypicalStats: string[];
    hasCaretaker?: boolean;
}

export const AtypicalWarningModal: React.FC<AtypicalWarningModalProps> = ({
    onClose,
    onNotify,
    atypicalStats,
    hasCaretaker = true
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="glass-panel" style={{
                width: '400px',
                padding: '2rem',
                border: '1px solid #ef4444',
                boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
                background: 'rgba(255, 255, 255, 0.95)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
                        <AlertTriangle size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Health Alert</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', padding: '0.5rem', color: 'var(--text-main)' }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    We have detected atypical readings in the following metrics:
                    <br />
                    <strong style={{ color: '#ef4444' }}>{atypicalStats.join(', ')}</strong>
                </p>

                <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '2rem' }}>
                    {hasCaretaker
                        ? 'Would you like to notify your listed caretaker immediately?'
                        : 'You have not added a caretaker contact yet. Would you like to add one now?'
                    }
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="primary-btn"
                        style={{ flex: 1, background: '#ef4444', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                        onClick={onNotify}
                    >
                        {hasCaretaker ? (
                            <>
                                <Bell size={18} />
                                Notify Caretaker
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Add Caretaker
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};
