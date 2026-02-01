import React, { useState, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { Plus, X, GripVertical, Bell, Calendar as CalendarIcon } from 'lucide-react';

interface MedicationCalendarProps {
    activeTab: 'overview' | 'medications';
    setActiveTab: (tab: 'overview' | 'medications') => void;
    atypicalMetrics: string[];
    onShowWarning: () => void;
}

export const MedicationCalendar: React.FC<MedicationCalendarProps> = ({ 
    activeTab, 
    setActiveTab, 
    atypicalMetrics, 
    onShowWarning 
}) => {
    const { medications, medicationDetails, addMedication, schedule, addToSchedule, removeFromSchedule } = useUser();
    const [newMed, setNewMed] = useState('');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get current day name
    const todayDate = new Date();
    const currentDayName = days[todayDate.getDay()];

    // Get all medication names - combine medicationDetails (from onboarding) and medications (manually added)
    // This ensures we show all medications the user has, whether from onboarding or manually added
    const availableMedications = useMemo(() => {
        const medsFromDetails = medicationDetails.map(med => med.name).filter(Boolean);
        const medsFromList = medications.filter(Boolean);
        // Combine both sources and remove duplicates
        return Array.from(new Set([...medsFromDetails, ...medsFromList]));
    }, [medicationDetails, medications]);

    // Compute the effective schedule: combine manual schedule with automatic daily medications
    const effectiveSchedule = useMemo(() => {
        const effective: Record<string, string[]> = {};
        
        // Initialize all days
        days.forEach(day => {
            effective[day] = [...(schedule[day] || [])];
        });

        // Add daily medications to all days (regardless of reminder status)
        // Daily medications should always appear in the schedule
        medicationDetails.forEach(med => {
            if (med.name && med.frequency === 'daily') {
                days.forEach(day => {
                    // Only add if not already in the schedule (avoid duplicates)
                    if (!effective[day].includes(med.name)) {
                        effective[day].push(med.name);
                    }
                });
            }
        });

        return effective;
    }, [schedule, medicationDetails, days]);

    const handleDragStart = (e: React.DragEvent, med: string) => {
        e.dataTransfer.setData('med', med);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent, day: string) => {
        e.preventDefault();
        const med = e.dataTransfer.getData('med');
        if (med) {
            addToSchedule(day, med);
        }
    };

    const handleAddMedication = async () => {
        if (newMed.trim()) {
            // Check if medication already exists
            const exists = availableMedications.includes(newMed.trim());
            if (exists) {
                alert('This medication already exists');
                return;
            }
            // Add medication using the simple addMedication function
            // This will add it to the medications list but without full details
            await addMedication(newMed.trim());
            setNewMed('');
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
            {/* Top Section: Available Medications (Palette) */}
            <div className="glass-panel" style={{ padding: '1.5rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#3b82f6' }}>Available Medications</h3>
                        <p style={{ fontSize: '0.9rem', margin: 0, opacity: 0.7 }}>
                            Drag these medications into the daily slots below.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={onShowWarning}
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
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: atypicalMetrics.length > 0 ? 'pointer' : 'default',
                                opacity: atypicalMetrics.length > 0 ? 1 : 0.8,
                                width: 'auto',
                                minWidth: '100px'
                            }}
                        >
                            <Bell size={14} />
                            {atypicalMetrics.length > 0 ? 'Show Alerts' : 'No Alerts'}
                        </button>

                        <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', gap: '0.25rem' }}>
                            <button
                                className={activeTab === 'overview' ? 'primary-btn' : ''}
                                onClick={() => setActiveTab('overview')}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.9rem', display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}
                            >
                                Weekly View
                            </button>
                            <div style={{ width: '1px', background: '#e5e7eb', margin: '0 0.5rem' }}></div>
                            <button
                                className={activeTab === 'medications' ? 'primary-btn' : ''}
                                onClick={() => setActiveTab('medications')}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.9rem', display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <CalendarIcon size={12} />
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    {availableMedications.map((med, idx) => {
                        const medDetails = medicationDetails.find(m => m.name === med);
                        return (
                            <div
                                key={idx}
                                draggable
                                onDragStart={(e) => handleDragStart(e, med)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'grab',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                                title={medDetails?.time ? `${medDetails.frequency || ''} at ${medDetails.time}` : undefined}
                            >
                                <GripVertical size={14} color="#9ca3af" />
                                <span style={{ fontWeight: 500, color: '#374151' }}>{med}</span>
                                {medDetails?.time && (
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, color: '#6b7280' }}>
                                        {medDetails.time}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Add New */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <input
                            type="text"
                            value={newMed}
                            onChange={(e) => setNewMed(e.target.value)}
                            placeholder="Add new medication..."
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMedication()}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--input-border)',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            onClick={handleAddMedication}
                            style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1rem',
                flex: 1,
                width: '100%'
            }}>
                {days.map(day => (
                    <div
                        key={day}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day)}
                        className="glass-panel"
                        style={{
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '200px',
                            background: 'rgba(255, 255, 255, 0.5)'
                        }}
                    >
                        <h4 style={{
                            textAlign: 'center',
                            marginTop: 0,
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: day === currentDayName 
                                ? '3px solid var(--color-primary)' 
                                : '1px solid rgba(0,0,0,0.1)',
                            color: day === currentDayName ? 'var(--color-primary)' : '#4b5563',
                            fontWeight: day === currentDayName ? 600 : 400
                        }}>
                            {day}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            {effectiveSchedule[day].map((med, idx) => {
                                const medDetails = medicationDetails.find(m => m.name === med);
                                const isAutoScheduled = medDetails?.frequency === 'daily';
                                const isManuallyScheduled = (schedule[day] || []).includes(med);
                                
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.5rem',
                                            background: isAutoScheduled ? 'rgba(59, 130, 246, 0.1)' : 'white',
                                            border: isAutoScheduled ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
                                            borderRadius: '6px',
                                            fontSize: '0.85rem',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                            <span>{med}</span>
                                            {medDetails?.time && (
                                                <span style={{ fontSize: '0.75rem', opacity: 0.6, color: '#6b7280' }}>
                                                    {medDetails.time}
                                                </span>
                                            )}
                                        </div>
                                        {/* Show delete button for all medications - including daily ones */}
                                        <button
                                            onClick={() => {
                                                // Find the index in the schedule for this day
                                                const currentSchedule = schedule[day] || [];
                                                const idx = currentSchedule.indexOf(med);
                                                
                                                // Remove from schedule - removeFromSchedule will handle:
                                                // 1. Updating Firestore schedule
                                                // 2. Changing frequency from daily if needed
                                                // 3. Optimistic local state update (if medication is in local state)
                                                removeFromSchedule(day, med, idx !== -1 ? idx : 0);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 2,
                                                cursor: 'pointer',
                                                opacity: 0.5
                                            }}
                                            title="Remove from schedule"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                            {effectiveSchedule[day].length === 0 && (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.3,
                                    fontSize: '0.8rem',
                                    border: '1px dashed #cbd5e1',
                                    borderRadius: '6px',
                                    margin: '0.5rem 0'
                                }}>
                                    Drop here
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
