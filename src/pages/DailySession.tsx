import React, { useState } from 'react';
import { Share2, Smartphone, CheckSquare } from 'lucide-react';

export const DailySession: React.FC = () => {
    const [hasSessionData, setHasSessionData] = useState(false);
    const [notifyCaretaker, setNotifyCaretaker] = useState(true);

    // Mock Session Data
    const sessionStats = {
        heartRate: { avg: 72, high: 85, low: 65 },
        breathing: { avg: 16, high: 20, low: 14 },
        mood: 'Calm'
    };

    const handleStartCheckIn = () => {
        // Simulate mobile check-in
        setTimeout(() => {
            setHasSessionData(true);
        }, 1000);
    };

    const handleShare = () => {
        alert(`Session Report sent to Caretaker.\nAuto-notify is ${notifyCaretaker ? 'ON' : 'OFF'}.`);
    };

    if (!hasSessionData) {
        return (
            <div className="glass-panel" style={{
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                marginTop: '2rem'
            }}>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '50%',
                    marginBottom: '1.5rem'
                }}>
                    <Smartphone size={48} color="#3b82f6" />
                </div>
                <h2>No Session Data for Today</h2>
                <p style={{ opacity: 0.7, maxWidth: '400px', marginBottom: '2rem' }}>
                    You haven't completed your daily check-in yet. Please open the Baymax Mobile App on your phone to start recording your session.
                </p>
                <button className="primary-btn" onClick={handleStartCheckIn}>
                    Start Check-in (Simulator)
                </button>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Daily Session Report</h2>
                <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>{new Date().toLocaleDateString()}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {/* Heart Rate Stats */}
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>Heart Rate</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Average</span>
                        <strong>{sessionStats.heartRate.avg} BPM</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Highest</span>
                        <strong>{sessionStats.heartRate.high} BPM</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Lowest</span>
                        <strong>{sessionStats.heartRate.low} BPM</strong>
                    </div>
                </div>

                {/* Breathing Stats */}
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>Breathing</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Average</span>
                        <strong>{sessionStats.breathing.avg} bpm</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Highest</span>
                        <strong>{sessionStats.breathing.high} bpm</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Lowest</span>
                        <strong>{sessionStats.breathing.low} bpm</strong>
                    </div>
                </div>

                {/* Overall Mood */}
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>Mood Analysis</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {sessionStats.mood}
                    </div>
                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>
                        Patient appeared stable and relaxed throughout the session.
                    </p>
                </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '2px solid rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: notifyCaretaker ? '#3b82f6' : 'transparent',
                        borderColor: notifyCaretaker ? '#3b82f6' : 'rgba(0,0,0,0.2)'
                    }}
                        onClick={() => setNotifyCaretaker(!notifyCaretaker)}
                    >
                        {notifyCaretaker && <CheckSquare size={14} color="white" />}
                    </div>
                    <span>Always notify caretaker of session results</span>
                </label>

                <button className="primary-btn" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Share2 size={18} />
                    Share Results
                </button>
            </div>
        </div>
    );
};
