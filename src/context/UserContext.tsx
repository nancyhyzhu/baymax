import React, { createContext, useContext } from 'react';

// Define the shape of our context state
interface UserContextType {
    // Profile Data (migrated from Settings.tsx local state)
    profile: {
        name: string;
        age: number;
        height: string;
        weight: string;
        sex: string;
        conditions: string;
        caretakerName: string;
        caretakerPhone: string;
        email: string;
    };
    updateProfile: (updates: Partial<UserContextType['profile']>) => void;

    // Medication Data
    medications: string[]; // List of available medications
    addMedication: (med: string) => void;
    removeMedication: (med: string) => void;

    // Schedule: Day -> List of medications
    schedule: Record<string, string[]>;
    addToSchedule: (day: string, med: string) => void;
    removeFromSchedule: (day: string, med: string, index: number) => void;

    // Taken Status
    takenRecords: Record<string, boolean>;
    toggleTaken: (recordId: string) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
