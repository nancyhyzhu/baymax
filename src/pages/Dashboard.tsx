import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraphCard } from '../components/GraphCard';
import { ExpressionWidget } from '../components/ExpressionWidget';
import { AtypicalWarningModal } from '../components/AtypicalWarningModal';
import { MedicationWidget } from '../components/MedicationWidget';
import { MedicationCalendar } from '../components/MedicationCalendar';
import { Bell, Calendar as CalendarIcon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { checkAllHealthStats } from '../services/geminiService';
import { getHealthReadings } from '../services/healthService';
import { seedSampleHealthData } from '../utils/seedData';
import { DataPoint } from '../utils/dataUtils';

export const Dashboard: React.FC = () => {
    const { profile, user } = useUser();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
    const [activeTab, setActiveTab] = useState<'overview' | 'medications'>('overview');

    const [hrData, setHrData] = useState<DataPoint[]>([]);
    const [brData, setBrData] = useState<DataPoint[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const [atypicalMetrics, setAtypicalMetrics] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(true); // Start as true to prevent early alerts

    // Load Initial Data and Analyze with Gemini
    useEffect(() => {
        const loadAndAnalyzeData = async () => {
            // Early return if profile is still loading or really incomplete
            if (!profile.age || !profile.sex || !user?.uid) {
                return;
            }

            try {
                console.log(`[Dashboard] Fetching data for user: ${user.uid}...`);
                // 1. Fetch real data from Firestore
                let readings = await getHealthReadings(user.uid, viewMode === 'weekly' ? 7 : 30);
                console.log(`[Dashboard] Found ${readings.length} readings.`);

                // 2. Seed data if none exists
                if (readings.length === 0) {
                    console.log(`[Dashboard] No data found. Seeding sample data...`);
                    const seededData = await seedSampleHealthData(user.uid);
                    if (seededData && seededData.length > 0) {
                        readings = seededData;
                        console.log(`[Dashboard] Using ${readings.length} seeded readings.`);
                    } else {
                        console.warn(`[Dashboard] Seeding failed or returned no data.`);
                    }
                }

                // 3. Map Firestore data to chart format
                const mappedHr = readings.map(r => ({
                    time: new Date(r.timestamp).toLocaleDateString([], { weekday: 'short' }),
                    value: r.data.heartRate,
                    status: 'typical' as const
                }));

                const mappedBr = readings.map(r => ({
                    time: new Date(r.timestamp).toLocaleDateString([], { weekday: 'short' }),
                    value: r.data.breathing,
                    status: 'typical' as const
                }));

                console.log(`[Dashboard] Mapped data points: HR=${mappedHr.length}, BR=${mappedBr.length}`);
                setHrData(mappedHr);
                setBrData(mappedBr);

                // Calculate averages
                const hrAvg = mappedHr.length > 0
                    ? mappedHr.reduce((sum, d) => sum + d.value, 0) / mappedHr.length
                    : 75;
                const brAvg = mappedBr.length > 0
                    ? mappedBr.reduce((sum, d) => sum + d.value, 0) / mappedBr.length
                    : 18;
                const moodScore = readings.length > 0
                    ? readings[readings.length - 1].data.mood
                    : 7;

                // 4. Analyze results
                setIsAnalyzing(true);
                const results = await checkAllHealthStats(
                    profile,
                    Math.round(hrAvg),
                    Math.round(brAvg),
                    moodScore,
                    user.uid
                );

                const atypicalList: string[] = [];
                results.forEach(result => {
                    if (!result.isTypical) {
                        if (result.statName === 'heartbeat') atypicalList.push('Heart Rate');
                        if (result.statName === 'respiration rate') atypicalList.push('Respiration Rate');
                        if (result.statName === 'mood') atypicalList.push('Mood');
                    }
                });

                setAtypicalMetrics(atypicalList);
                console.log('Analysis complete. Atypical metrics:', atypicalList);

            } catch (error) {
                console.error('Error loading or analyzing health stats:', error);
                setAtypicalMetrics([]);
            } finally {
                setIsAnalyzing(false);
            }
        };

        loadAndAnalyzeData();
    }, [viewMode, profile, user]);

    // Handle initial alert on login - only if analysis is done and finds issues
    const location = useLocation();
    const [hasAttemptedInitialAlert, setHasAttemptedInitialAlert] = useState(false);

    useEffect(() => {
        // Only trigger if data has loaded, analysis is finished, and it's a login event
        if (location.state?.justLoggedIn && !isAnalyzing && !hasAttemptedInitialAlert && hrData.length > 0) {
            if (atypicalMetrics.length > 0) {
                console.log('[Dashboard] Initial login alert triggered for metrics:', atypicalMetrics);
                setShowWarning(true);
            } else {
                console.log('[Dashboard] No atypical metrics found on login. Skipping alert.');
            }
            setHasAttemptedInitialAlert(true);
            // Clear the state so it doesn't reappear on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location, atypicalMetrics, isAnalyzing, hasAttemptedInitialAlert, hrData]);

    const handleNotify = (metricName?: string) => {
        // Check if caretaker exists
        if (!profile.caretakerName || !profile.caretakerPhone) {
            const shouldAddCaretaker = window.confirm(
                'No caretaker contact found. Would you like to add one now?'
            );
            if (shouldAddCaretaker) {
                navigate('/settings');
            }
            setShowWarning(false);
            return;
        }

        const message = metricName
            ? `Notifying caretaker ${profile.caretakerName} about atypical ${metricName} readings...`
            : `Notifying caretaker ${profile.caretakerName} about health alerts...`;

        alert(message);
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
                    hasCaretaker={!!(profile.caretakerName && profile.caretakerPhone)}
                />
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                {isAnalyzing && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}>
                        <div className="spinner" style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(59, 130, 246, 0.3)',
                            borderTop: '2px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        Analyzing health stats...
                    </div>
                )}
                <button
                    onClick={() => atypicalMetrics.length > 0 && setShowWarning(true)}
                    disabled={atypicalMetrics.length === 0}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: atypicalMetrics.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: atypicalMetrics.length > 0 ? 'var(--color-danger)' : '#10b981',
                        border: `1px solid ${atypicalMetrics.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: atypicalMetrics.length > 0 ? 'pointer' : 'default',
                        opacity: atypicalMetrics.length > 0 ? 1 : 0.8
                    }}
                >
                    <Bell size={16} />
                    {atypicalMetrics.length > 0 ? 'Show Alerts' : 'No Alerts'}
                </button>

                <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', gap: '0.25rem' }}>
                    <button
                        className={activeTab === 'overview' && viewMode === 'weekly' ? 'primary-btn' : ''}
                        onClick={() => { setActiveTab('overview'); setViewMode('weekly'); }}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                    >
                        Weekly
                    </button>
                    <button
                        className={activeTab === 'overview' && viewMode === 'monthly' ? 'primary-btn' : ''}
                        onClick={() => { setActiveTab('overview'); setViewMode('monthly'); }}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                    >
                        Monthly
                    </button>
                    <div style={{ width: '1px', background: '#e5e7eb', margin: '0 0.5rem' }}></div>
                    <button
                        className={activeTab === 'medications' ? 'primary-btn' : ''}
                        onClick={() => setActiveTab('medications')}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                    >
                        <CalendarIcon size={14} />
                        Schedule
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gridAutoRows: '320px',
                    gap: '2rem',
                    marginBottom: '2rem'
                }}>
                    <GraphCard
                        title="Heart Rate"
                        data={hrData}
                        dataKey="value"
                        color="#ef4444"
                        unit="BPM"
                        averageValue={getAverage(hrData)}
                        status={atypicalMetrics.includes('Heart Rate') ? 'atypical' : 'typical'}
                        onNotifyCaretaker={() => handleNotify('Heart Rate')}
                    />
                    <ExpressionWidget
                        expression={atypicalMetrics.includes('Mood') ? 'anxious' : 'neutral'}
                    />

                    <GraphCard
                        title="Respiration Rate"
                        data={brData}
                        dataKey="value"
                        color="#3b82f6"
                        unit="Breaths/min"
                        averageValue={getAverage(brData)}
                        status={atypicalMetrics.includes('Respiration Rate') ? 'atypical' : 'typical'}
                        onNotifyCaretaker={() => handleNotify('Respiration Rate')}
                    />
                    <MedicationWidget />
                </div>
            ) : (
                <div style={{ height: 'calc(100vh - 200px)', paddingBottom: '2rem' }}>
                    <MedicationCalendar />
                </div>
            )}
        </div>
    );
};
