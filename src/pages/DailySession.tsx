import React, { useState, useEffect } from 'react';
import { Share2, Smartphone, CheckSquare, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getLatestAnalyticsSession, AnalyticsSession } from '../services/healthService';
import { analyzeSessionStats } from '../services/geminiService';

export const DailySession: React.FC = () => {
    const { profile, user } = useUser();
    const [latestSession, setLatestSession] = useState<AnalyticsSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notifyCaretaker, setNotifyCaretaker] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.uid) return;
            setIsLoading(true);
            try {
                const session = await getLatestAnalyticsSession();

                // Only display if the session is from TODAY
                if (session && session.processedAt) {
                    const sessionDate = session.processedAt.toDate();
                    const today = new Date();

                    const isToday = sessionDate.getDate() === today.getDate() &&
                        sessionDate.getMonth() === today.getMonth() &&
                        sessionDate.getFullYear() === today.getFullYear();

                    if (isToday) {
                        setLatestSession(session);

                        // Trigger AI Analysis for this session
                        setIsAnalyzing(true);
                        try {
                            const analysis = await analyzeSessionStats(profile, session as any);
                            setAiAnalysis(analysis);
                        } finally {
                            setIsAnalyzing(false);
                        }
                    } else {
                        setLatestSession(null);
                    }
                }
            } catch (error) {
                console.error("Error loading daily session:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, profile]);

    const handleShare = () => {
        alert(`Session Report sent to Caretaker.\nAuto-notify is ${notifyCaretaker ? 'ON' : 'OFF'}.`);
    };

    if (isLoading) {
        return (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p>Loading session data...</p>
            </div>
        );
    }

    if (!latestSession) {
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
                <p style={{ opacity: 0.7, maxWidth: '400px' }}>
                    You haven't completed your daily check-in yet. Please open the HomeCare Mobile App on your phone to start recording your session.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
        }}>
            {/* Left Column: Session Report */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Daily Session Report</h2>
                    <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                        {latestSession.processedAt.toDate().toLocaleString()}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>Heart Rate (Pulse)</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ opacity: 0.7 }}>Average</span>
                            <strong>{Math.round(latestSession.pulse.average)} BPM</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ opacity: 0.7 }}>Highest</span>
                            <strong>{Math.round(latestSession.pulse.max)} BPM</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.7 }}>Lowest</span>
                            <strong>{Math.round(latestSession.pulse.min)} BPM</strong>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(80,80,80,0.05)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>Breathing</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ opacity: 0.7 }}>Average</span>
                            <strong>{Math.round(latestSession.breathing.average)} bpm</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ opacity: 0.7 }}>Highest</span>
                            <strong>{Math.round(latestSession.breathing.max)} bpm</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.7 }}>Lowest</span>
                            <strong>{Math.round(latestSession.breathing.min)} bpm</strong>
                        </div>
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

            {/* Right Column: AI Analysis */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem 0' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                    }}>
                        <Sparkles size={20} />
                    </div>
                    AI Session Analysis
                </h3>

                {isAnalyzing ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.6 }}>
                        <div className="spinner"></div>
                        <p style={{ fontWeight: 500 }}>Baymax is analyzing your session...</p>
                    </div>
                ) : (
                    <div style={{
                        flex: 1,
                        lineHeight: '1.7',
                        fontSize: '1.05rem',
                        color: 'var(--color-text)',
                        background: 'rgba(255, 255, 255, 0.3)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.4)'
                    }}>
                        {aiAnalysis || "Complete a session to see your AI insights."}
                    </div>
                )}

                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    fontSize: '0.8rem',
                    opacity: 0.5,
                    fontStyle: 'italic'
                }}>
                    *Baymax uses artificial intelligence to summarize statistical data. This is not a medical diagnosis. If you have concerns, please consult a healthcare professional.
                </div>
            </div>
        </div>
    );
};
