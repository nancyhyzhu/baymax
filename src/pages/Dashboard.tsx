import React, { useState, useEffect } from 'react';
import { GraphCard } from '../components/GraphCard';
import { ExpressionWidget } from '../components/ExpressionWidget';
import { AtypicalWarningModal } from '../components/AtypicalWarningModal';
import { generateWeeklyData, generateMonthlyData, DataPoint } from '../utils/dataUtils';

export const Dashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
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

        // Check for atypical stats on load
        const atypicalList: string[] = [];
        if (newData.some(d => d.status === 'atypical')) atypicalList.push('Heart Rate');
        if (newBrData.some(d => d.status === 'atypical')) atypicalList.push('Respiration Rate');

        if (atypicalList.length > 0) {
            setAtypicalMetrics(atypicalList);
            setShowWarning(true);
        }

    }, [viewMode]);

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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
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
