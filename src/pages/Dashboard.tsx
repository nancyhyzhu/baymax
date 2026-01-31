import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GraphCard } from '../components/GraphCard';
import { ExpressionWidget } from '../components/ExpressionWidget';
import { AtypicalWarningModal } from '../components/AtypicalWarningModal';
import { MedicationWidget } from '../components/MedicationWidget';
import { MedicationCalendar } from '../components/MedicationCalendar';
import { generateWeeklyData, generateMonthlyData, DataPoint } from '../utils/dataUtils';
import { Bell, Calendar as CalendarIcon } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
    const [activeTab, setActiveTab] = useState<'overview' | 'medications'>('overview');

    const [hrData, setHrData] = useState<DataPoint[]>([]);
    const [brData, setBrData] = useState<DataPoint[]>([]);
    const [showWarning, setShowWarning] = useState(false);
    const [atypicalMetrics, setAtypicalMetrics] = useState<string[]>([]);

    // Load Initial Data
    useEffect(() => {
        const newData = viewMode === 'weekly'
            ? generateWeeklyData(75, 20)
            : generateMonthlyData(78, 15);

        const newBrData = viewMode === 'weekly'
            ? generateWeeklyData(18, 5)
            : generateMonthlyData(18, 5);

        setHrData(newData);
        setBrData(newBrData);

        // Calculate atypical metrics for the widget/button, but don't auto-show modal here
        const atypicalList: string[] = ['Heart Rate', 'Respiration Rate'];
        if (atypicalList.length > 0) {
            setAtypicalMetrics(atypicalList);
        }

    }, [viewMode]);

    // Handle initial alert on login
    const location = useLocation();
    useEffect(() => {
        if (location.state?.justLoggedIn) {
            setShowWarning(true);
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
                        status={hrData.some(d => d.status === 'atypical') ? 'atypical' : 'typical'}
                        onNotifyCaretaker={() => alert('Notifying caretaker about Heart Rate...')}
                    />
                    <ExpressionWidget expression="neutral" /> {/* Static for now */}

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
