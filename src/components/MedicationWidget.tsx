import React, { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { CheckSquare, Square } from 'lucide-react';

export const MedicationWidget: React.FC = () => {
    const { schedule, takenRecords, toggleTaken, medicationDetails } = useUser();

    const todayDate = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[todayDate.getDay()];
    const dateStr = todayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

    // Get medications that should be shown today
    // Priority: Show medications from medicationDetails that have reminder enabled
    // This ensures daily medications with reminder show up as checkboxes
    const todaysMeds = useMemo(() => {
        // Show ALL daily medications (regardless of reminder or time)
        // Also show medications with reminder enabled and time set
        const medsFromDatabase = medicationDetails
            .filter(med => {
                if (!med.name) return false;
                
                // Show ALL daily medications (even without reminder or time)
                if (med.frequency === 'daily') {
                    return true;
                }
                
                // For non-daily medications, only show if reminder is enabled and time is set
                if (!med.reminder) return false;
                if (!med.frequency || !med.time) return false;
                
                // Show weekly medications every day (user can take them any day)
                if (med.frequency === 'weekly') {
                    return true;
                }
                
                // Show "as-needed" medications if they have a time set
                if (med.frequency === 'as-needed') {
                    return true;
                }
                
                return false;
            })
            .map(med => med.name);

        // Also check schedule for manually scheduled medications
        const scheduledMeds = schedule[dayName] || [];
        
        // Combine both sources
        const allMedsSet = new Set([...medsFromDatabase, ...scheduledMeds]);
        return Array.from(allMedsSet);
    }, [medicationDetails, schedule, dayName]);

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                <CheckSquare size={20} />
                Daily Medications
            </h3>

            <p style={{ margin: 0, marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
                {dayName}, {todayDate.toLocaleDateString()}
            </p>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {todaysMeds.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontStyle: 'italic', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                        No medications to take today.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {todaysMeds.map((med, idx) => {
                            const uniqueKey = `${dateStr}_${med}_${idx}`; // Simple unique key for today/index
                            const isTaken = !!takenRecords[uniqueKey];
                            // Find medication details from database
                            const medDetails = medicationDetails.find(m => m.name === med);

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        background: isTaken ? 'rgba(16, 185, 129, 0.1)' : 'var(--input-bg)',
                                        border: `1px solid ${isTaken ? 'rgba(16, 185, 129, 0.3)' : 'var(--input-border)'}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.2s ease',
                                        opacity: isTaken ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                        <button
                                            onClick={() => toggleTaken(uniqueKey)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                display: 'flex',
                                                color: isTaken ? '#10b981' : 'var(--text-main)'
                                            }}
                                        >
                                            {isTaken ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </button>
                                        <span style={{
                                            textDecoration: isTaken ? 'line-through' : 'none',
                                            fontWeight: 500,
                                            fontSize: '1rem'
                                        }}>
                                            {med}
                                        </span>
                                    </div>
                                    {medDetails && medDetails.time && (
                                        <span style={{ 
                                            fontSize: '0.9rem', 
                                            opacity: 0.7,
                                            color: 'var(--text-secondary)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {medDetails.time}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
