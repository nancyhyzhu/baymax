import React, { useState, useEffect } from 'react';
import { Share2, Smartphone, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTodaySession, Reading } from '../services/db';
import { supabase } from '../lib/supabase';

export const DailySession: React.FC = () => {
    const { currentUser } = useAuth();
    const [sessionData, setSessionData] = useState<Reading | null>(null);
    const [loading, setLoading] = useState(true);
    const [notifyCaretaker, setNotifyCaretaker] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            if (currentUser) {
                const data = await getTodaySession(currentUser.id);
                setSessionData(data);
                setLoading(false);
            }
        };
        fetchSession();
    }, [currentUser]);

    const handleStartCheckIn = async () => {
        if (!currentUser) return;

        // Create a new reading (simulate a workout/session)
        const newReading = {
            user_id: currentUser.id,
            heart_rate: 75 + Math.floor(Math.random() * 10),
            breathing: 16 + Math.floor(Math.random() * 4),
            mood: 'Calm',
            timestamp: new Date().toISOString()
        };

        const { error } = await supabase.from('readings').insert([newReading]);

        if (!error) {
            // Refresh local state
            const refreshed = await getTodaySession(currentUser.id);
            setSessionData(refreshed);
        }
    };

    const handleShare = () => {
        alert(`Session Report sent to Caretaker.\nAuto-notify is ${notifyCaretaker ? 'ON' : 'OFF'}.`);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Checking for daily sessions...</div>;

    if (!sessionData) {
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
                    You haven't completed your daily check-in yet. Click below to simulate a session or use the mobile app.
                </p>
                <button className="primary-btn" onClick={handleStartCheckIn}>
                    Start Check-in (Simulator)
                </button>
            </div>
        );
    }

    // Calculate simulated high/low stats based on the single reading for display
    const stats = {
        hr: { avg: sessionData.heartRate, high: sessionData.heartRate + 12, low: sessionData.heartRate - 8 },
        br: { avg: sessionData.breathing, high: sessionData.breathing + 4, low: sessionData.breathing - 2 }
    };

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
                        <strong>{stats.hr.avg} BPM</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Highest</span>
                        <strong>{stats.hr.high} BPM</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Lowest</span>
                        <strong>{stats.hr.low} BPM</strong>
                    </div>
                </div>

                {/* Breathing Stats */}
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>Breathing</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Average</span>
                        <strong>{stats.br.avg} bpm</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ opacity: 0.7 }}>Highest</span>
                        <strong>{stats.br.high} bpm</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Lowest</span>
                        <strong>{stats.br.low} bpm</strong>
                    </div>
                </div>

                {/* Overall Mood */}
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>Mood Analysis</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                        {sessionData.mood}
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
