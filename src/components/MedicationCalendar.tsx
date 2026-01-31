import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Plus, X, GripVertical } from 'lucide-react';

export const MedicationCalendar: React.FC = () => {
    const { medications, addMedication, schedule, addToSchedule, removeFromSchedule } = useUser();
    const [newMed, setNewMed] = useState('');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    const handleAddMedication = () => {
        if (newMed.trim()) {
            addMedication(newMed.trim());
            setNewMed('');
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Top Section: Available Medications (Palette) */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#3b82f6' }}>Available Medications</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.7 }}>
                    Drag these medications into the daily slots below.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    {medications.map((med, idx) => (
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
                        >
                            <GripVertical size={14} color="#9ca3af" />
                            <span style={{ fontWeight: 500, color: '#374151' }}>{med}</span>
                        </div>
                    ))}

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
                flex: 1
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
                            borderBottom: '1px solid rgba(0,0,0,0.1)',
                            color: '#4b5563'
                        }}>
                            {day}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            {(schedule[day] || []).map((med, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem',
                                        background: 'white',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <span>{med}</span>
                                    <button
                                        onClick={() => removeFromSchedule(day, med, idx)}
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
                            ))}
                            {(schedule[day] || []).length === 0 && (
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
