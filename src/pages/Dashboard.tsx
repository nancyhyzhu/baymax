import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getReadings, Reading } from '../services/db';
import { GraphCard } from '../components/GraphCard';
import { ExpressionWidget } from '../components/ExpressionWidget';
import { AtypicalWarningModal } from '../components/AtypicalWarningModal';
import { DataPoint } from '../utils/dataUtils'; // Keep type, ignore gen functions
import { Bell } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
    const [hrData, setHrData] = useState<DataPoint[]>([]);
    const [brData, setBrData] = useState<DataPoint[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const [atypicalMetrics, setAtypicalMetrics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Load Data from Firestore
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            setLoading(true);

            const days = viewMode === 'weekly' ? 7 : 30;
            const readings = await getReadings(currentUser.id, days);

            // Transform Firestore data to Graph format
            const transformedHr = readings.map(r => ({
                time: r.timestamp.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
                value: r.heartRate,
                status: (r.heartRate > 100 || r.heartRate < 60) ? 'atypical' : 'typical'
            }));

            const transformedBr = readings.map(r => ({
                time: r.timestamp.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
                value: r.breathing,
                status: (r.breathing > 25 || r.breathing < 12) ? 'atypical' : 'typical'
            }));

            setHrData(transformedHr as any); // Type cast for quick fix on DataPoint mismatch
            setBrData(transformedBr as any);

            // Check for atypical stats
            const atypicalList: string[] = [];
            if (transformedHr.some(d => d.status === 'atypical')) atypicalList.push('Heart Rate');
            if (transformedBr.some(d => d.status === 'atypical')) atypicalList.push('Respiration Rate');

            if (atypicalList.length > 0) {
                setAtypicalMetrics(atypicalList);
                setShowWarning(true);
            }
            setLoading(false);
        };

        fetchData();
    }, [currentUser, viewMode]);

    // Handle initial alert on login
    const location = useLocation();
    useEffect(() => {
        if (location.state?.justLoggedIn) {
            // Clear the state so it doesn't reappear on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleNotify = () => {
        alert('Caretaker notified successfully!'); // Mock notification
        setShowWarning(false);
    };

    const getAverage = (data: DataPoint[]) => {
        if (data.length === 0) return 0;
        const sum = data.reduce((acc, curr) => acc + curr.value, 0);
        return sum / data.length;
    };

    return (
        <div>
            {showWarning && (
                <AtypicalWarningModal
                    atypicalStats={atypicalMetrics}
                    onNotify={handleNotify}
                    onClose={() => setShowWarning(false)}
                />
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <button
                    onClick={() => atypicalMetrics.length > 0 && setShowWarning(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: atypicalMetrics.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(128, 128, 128, 0.1)',
                        color: atypicalMetrics.length > 0 ? 'var(--color-danger)' : 'var(--text-secondary)',
                        border: atypicalMetrics.length > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(128, 128, 128, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: atypicalMetrics.length > 0 ? 'pointer' : 'default',
                        opacity: atypicalMetrics.length > 0 ? 1 : 0.7
                    }}
                >
                    <Bell size={16} />
                    {atypicalMetrics.length > 0 ? 'Show Alerts' : 'No Alerts'}
                </button>

                <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', gap: '0.25rem' }}>
                    <button
                        className={viewMode === 'weekly' ? 'primary-btn' : ''}
                        onClick={() => setViewMode('weekly')}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    >
                        Weekly
                    </button>
                    <button
                        className={viewMode === 'monthly' ? 'primary-btn' : ''}
                        onClick={() => setViewMode('monthly')}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                {/* Left Column: Graphs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 2 }}>
                    <GraphCard
                        title="Heart Rate"
                        data={hrData}
                        dataKey="value"
                        color="#ef4444"
                        unit="BPM"
                        averageValue={getAverage(hrData)}
                        status={hrData.some(d => d.status === 'atypical') ? 'atypical' : 'typical'}
                        onNotifyCaretaker={() => alert('Notifying caretaker about Heart Rate...')}
                    />
                    <GraphCard
                        title="Respiration Rate"
                        data={brData}
                        dataKey="value"
                        color="#3b82f6"
                        unit="Breaths/min"
                        averageValue={getAverage(brData)}
                        status={brData.some(d => d.status === 'atypical') ? 'atypical' : 'typical'}
                        onNotifyCaretaker={() => alert('Notifying caretaker about Respiration Rate...')}
                    />
                </div>

                {/* Right Column: Expression */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <ExpressionWidget expression="neutral" /> {/* Static for now, can be dynamic */}
                </div>
            </div>
        </div>
    );
};
