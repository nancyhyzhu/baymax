import React, { createContext, useContext } from 'react';

// Define the shape of our context state
interface UserContextType {
    // Auth State
    user: any | null; // Firebase User object
    loading: boolean;

    // Profile Data
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
    updateProfile: (updates: Partial<UserContextType['profile']>) => Promise<void>;

    // Medication Data
    medications: string[]; // List of available medications (Derived from schedule/db)
    addMedication: (med: string) => Promise<void>;
    removeMedication: (med: string) => Promise<void>;

    // Schedule: Day -> List of medications
    schedule: Record<string, string[]>;
    addToSchedule: (day: string, med: string) => Promise<void>;
    removeFromSchedule: (day: string, med: string, index: number) => Promise<void>;

    // Taken Status
    takenRecords: Record<string, boolean>;
    toggleTaken: (recordId: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
