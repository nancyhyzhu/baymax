import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraphCard } from '../components/GraphCard';
import { AtypicalWarningModal } from '../components/AtypicalWarningModal';
import { MedicationWidget } from '../components/MedicationWidget';
import { MedicationCalendar } from '../components/MedicationCalendar';
import { Bell, Calendar as CalendarIcon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { checkAllHealthStats } from '../services/geminiService';
import { getHealthReadings } from '../services/healthService';
import { DataPoint } from '../utils/dataUtils';

export const Dashboard: React.FC = () => {
    const { profile, user } = useUser();
    const navigate = useNavigate();
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
                // 1. Fetch real data from Firestore (weekly view only - 7 days)
                let readings = await getHealthReadings(user.uid, 7);
                console.log(`[Dashboard] Found ${readings.length} readings.`);

                // 2. Seed data if none exists
                if (readings.length === 0) {
                    return;
                }

                // 3. Map Firestore data to chart format - weekly view only
                // Create a full week structure with all 7 days
                const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                
                // Group readings by day of week
                const readingsByDay: { [key: string]: typeof readings } = {};
                readings.forEach(r => {
                    const date = new Date(r.timestamp);
                    const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                    const dayName = weekDays[dayIndex];
                    if (!readingsByDay[dayName]) {
                        readingsByDay[dayName] = [];
                    }
                    readingsByDay[dayName].push(r);
                });

                // Create data points for all 7 days, using average for days with multiple readings
                const mappedHr = weekDays.map(day => {
                    const dayReadings = readingsByDay[day] || [];
                    if (dayReadings.length === 0) {
                        return {
                            time: day,
                            value: null as any,
                            status: 'typical' as const
                        };
                    }
                    const avgValue = dayReadings.reduce((sum, r) => sum + r.data.heartRate, 0) / dayReadings.length;
                    return {
                        time: day,
                        value: Math.round(avgValue),
                        status: 'typical' as const
                    };
                });

                const mappedBr = weekDays.map(day => {
                    const dayReadings = readingsByDay[day] || [];
                    if (dayReadings.length === 0) {
                        return {
                            time: day,
                            value: null as any,
                            status: 'typical' as const
                        };
                    }
                    const avgValue = dayReadings.reduce((sum, r) => sum + r.data.breathing, 0) / dayReadings.length;
                    return {
                        time: day,
                        value: Math.round(avgValue),
                        status: 'typical' as const
                    };
                });

                console.log(`[Dashboard] Mapped data points: HR=${mappedHr.length}, BR=${mappedBr.length}`);
                setHrData(mappedHr);
                setBrData(mappedBr);

                // Calculate averages (excluding null values)
                const hrValues = mappedHr.filter(d => d.value !== null).map(d => d.value);
                const hrAvg = hrValues.length > 0
                    ? hrValues.reduce((sum, val) => sum + val, 0) / hrValues.length
                    : 75;
                const brValues = mappedBr.filter(d => d.value !== null).map(d => d.value);
                const brAvg = brValues.length > 0
                    ? brValues.reduce((sum, val) => sum + val, 0) / brValues.length
                    : 18;

                // 4. Analyze results
                setIsAnalyzing(true);
                const results = await checkAllHealthStats(
                    profile,
                    Math.round(hrAvg),
                    Math.round(brAvg),
                    user.uid
                );

                const atypicalList: string[] = [];
                results.forEach(result => {
                    if (!result.isTypical) {
                        if (result.statName === 'heartbeat') atypicalList.push('Heart Rate');
                        if (result.statName === 'respiration rate') atypicalList.push('Respiration Rate');
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
    }, [profile, user]);

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
        // Filter out null values and calculate average only from actual data points
        const validData = data.filter(d => d.value !== null && d.value !== undefined);
        if (validData.length === 0) return 0;
        const sum = validData.reduce((acc, curr) => acc + curr.value, 0);
        return sum / validData.length;
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
            {isAnalyzing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                </div>
            )}

            {activeTab === 'overview' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '70% 30%',
                    gap: '2rem',
                    marginBottom: '2rem',
                    marginRight: '2rem',
                    alignItems: 'stretch'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ height: '320px' }}>
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
                        </div>
                        <div style={{ height: '320px' }}>
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
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(320px + 2rem + 320px)' }}>
                        <button
                            onClick={() => atypicalMetrics.length > 0 && setShowWarning(true)}
                            disabled={atypicalMetrics.length === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: atypicalMetrics.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: atypicalMetrics.length > 0 ? 'var(--color-danger)' : '#10b981',
                                border: `1px solid ${atypicalMetrics.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: atypicalMetrics.length > 0 ? 'pointer' : 'default',
                                opacity: atypicalMetrics.length > 0 ? 1 : 0.8,
                                width: '100%'
                            }}
                        >
                            <Bell size={16} />
                            {atypicalMetrics.length > 0 ? 'Show Alerts' : 'No Alerts'}
                        </button>

                        <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', gap: '0.25rem', width: '100%' }}>
                            <button
                                className={activeTab === 'overview' ? 'primary-btn' : ''}
                                onClick={() => setActiveTab('overview')}
                                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}
                            >
                                Weekly View
                            </button>
                            <div style={{ width: '1px', background: '#e5e7eb', margin: '0 0.5rem' }}></div>
                            <button
                                className=""
                                onClick={() => setActiveTab('medications')}
                                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flex: 1, justifyContent: 'center' }}
                            >
                                <CalendarIcon size={14} />
                                Schedule
                            </button>
                        </div>

                        <div style={{ flex: 1, minHeight: 0 }}>
                            <MedicationWidget />
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ height: 'calc(100vh - 200px)', width: '100%', marginRight: '2rem' }}>
                    <MedicationCalendar 
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        atypicalMetrics={atypicalMetrics}
                        onShowWarning={() => setShowWarning(true)}
                    />
                </div>
            )}
        </div>
    );
};
