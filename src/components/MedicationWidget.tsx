import React, { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { CheckSquare, Square } from 'lucide-react';

export const MedicationWidget: React.FC = () => {
    const { schedule, takenRecords, toggleTaken } = useUser();

    const todayDate = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[todayDate.getDay()];
    const dateStr = todayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

    const todaysMeds = schedule[dayName] || [];

    // Filter duplicates if needed, or just show all instances (e.g. taken multiple times a day)
    // The context stores strings. If a med is in the array twice, it appears twice.
    // We need unique IDs ideally, but index works for simple list.

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

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        background: isTaken ? 'rgba(16, 185, 129, 0.1)' : 'var(--input-bg)',
                                        border: `1px solid ${isTaken ? 'rgba(16, 185, 129, 0.3)' : 'var(--input-border)'}`,
                                        borderRadius: '8px',
                                        transition: 'all 0.2s ease',
                                        opacity: isTaken ? 0.7 : 1
                                    }}
                                >
                                    <button
                                        onClick={() => toggleTaken(uniqueKey)} // Using index in key to distinguish duplicates
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
                                        fontWeight: 500
                                    }}>
                                        {med}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
