import React, { useState, ReactNode } from 'react';
import { UserContext } from './UserContext';

const defaultProfile = {
    name: 'Hiro Hamada',
    age: 14,
    height: '5\'4"',
    weight: '110 lbs',
    sex: 'Male',
    conditions: 'None',
    caretakerName: 'Cass Hamada',
    caretakerPhone: '555-0199',
    email: 'hiro@sfit.edu'
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from local storage or default
    const [profile, setProfile] = useState(defaultProfile);

    // Sample initial medications
    const [medications, setMedications] = useState<string[]>(['Ibuprofen', 'Amoxicillin']);

    // Schedule state (Day -> meds)
    const [schedule, setSchedule] = useState<Record<string, string[]>>({
        'Monday': ['Ibuprofen'],
        'Wednesday': ['Ibuprofen'],
        'Friday': ['Amoxicillin']
    });

    const [takenRecords, setTakenRecords] = useState<Record<string, boolean>>({});

    const updateProfile = (updates: Partial<typeof profile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const addMedication = (med: string) => {
        if (!medications.includes(med)) {
            setMedications(prev => [...prev, med]);
        }
    };

    const removeMedication = (med: string) => {
        setMedications(prev => prev.filter(m => m !== med));

        // Remove from schedule as well
        setSchedule(prev => {
            const newSchedule = { ...prev };
            Object.keys(newSchedule).forEach(day => {
                newSchedule[day] = newSchedule[day].filter(m => m !== med);
            });
            return newSchedule;
        });
    };

    const addToSchedule = (day: string, med: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), med]
        }));
    };

    const removeFromSchedule = (day: string, med: string, index: number) => {
        setSchedule(prev => {
            const dayMeds = [...(prev[day] || [])];
            // Remove instance at index
            dayMeds.splice(index, 1);
            return { ...prev, [day]: dayMeds };
        });
    };

    const toggleTaken = (recordId: string) => {
        setTakenRecords(prev => ({
            ...prev,
            [recordId]: !prev[recordId]
        }));
    };

    return (
        <UserContext.Provider value={{
            profile,
            updateProfile,
            medications,
            addMedication,
            removeMedication,
            schedule,
            addToSchedule,
            removeFromSchedule,
            takenRecords,
            toggleTaken
        }}>
            {children}
        </UserContext.Provider>
    );
};
