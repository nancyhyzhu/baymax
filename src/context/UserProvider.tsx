import React, { useState, ReactNode, useEffect } from 'react';
import { UserContext } from './UserContext';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';

const defaultProfile = {
    name: '',
    age: 0,
    height: '',
    weight: '',
    sex: '',
    conditions: '',
    caretakerName: '',
    caretakerPhone: '',
    email: ''
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(defaultProfile);
    const [medications, setMedications] = useState<string[]>([]);
    const [medicationDetails, setMedicationDetails] = useState<Array<{
        name: string;
        frequency: string;
        time: string;
        reminder: boolean;
    }>>([]);
    const [schedule, setSchedule] = useState<Record<string, string[]>>({});
    const [takenRecords, setTakenRecords] = useState<Record<string, boolean>>({});

    // 1. Listen for Auth Changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
            setUser(currUser);
            if (currUser) {
                // Fetch user profile
                await fetchUserData(currUser.uid);
            } else {
                setProfile(defaultProfile);
                setMedications([]);
                setMedicationDetails([]);
                setSchedule({});
                setTakenRecords({});
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // 2. Fetch Data from Firestore
    const fetchUserData = async (uid: string) => {
        try {
            // Profile
            const userDocFn = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocFn);
            if (userDocSnap.exists()) {
                const firestoreData = userDocSnap.data();
                // Merge with default profile to ensure all fields exist
                setProfile({
                    ...defaultProfile,
                    ...firestoreData,
                    // Ensure age is a number
                    age: firestoreData.age || defaultProfile.age
                });
                console.log('Profile loaded from Firestore:', firestoreData);
            } else {
                console.log('No user profile found in Firestore');
            }

            // Medications & Schedule (Stored in 'medications' collection)
            // Schema: { userId, name, schedule: [days], takenRecords: {date: bool} }
            const q = query(collection(db, 'medications'), where('userId', '==', uid));
            const querySnapshot = await getDocs(q);

            const newMeds: string[] = [];
            const newMedicationDetails: Array<{
                name: string;
                frequency: string;
                time: string;
                reminder: boolean;
            }> = [];
            const newSchedule: Record<string, string[]> = {};
            // Initialize schedule days to avoid undefined
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(d => newSchedule[d] = []);

            const newTakenRecords: Record<string, boolean> = {};

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const medName = data.name;
                newMeds.push(medName);

                // Store medication details
                newMedicationDetails.push({
                    name: medName,
                    frequency: data.frequency || '',
                    time: data.time || '',
                    reminder: data.reminder || false
                });

                // Populate Schedule
                if (data.schedule && Array.isArray(data.schedule)) {
                    data.schedule.forEach((day: string) => {
                        if (!newSchedule[day]) newSchedule[day] = [];
                        newSchedule[day].push(medName);
                    });
                }
                // Populate Taken Records (prefix key with medName to ensure uniqueness if needed, but context key logic handles it)
                // Actually takenRecords key is "YYYY-MM-DD_MedName_Index". 
                // We'll just load what we have. 
                // Wait, if we use separate docs for meds, we need to map the "taken" status correctly.
                // Simplification for this prompt: Store taken records in the med document too?
                // Or "health_data" might be better?
                // Let's assume data.takenRecords = { "2023-10-27_0": true } etc.
            });

            // To simplify takenRecords sync, let's just use a top-level collection or field?
            // User asked for "third table... medications, days...".
            // Let's store taken records on the medication document itself for now.
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.takenHistory) {
                    Object.assign(newTakenRecords, data.takenHistory);
                }
            });

            setMedications(newMeds);
            setMedicationDetails(newMedicationDetails);
            setSchedule(newSchedule);
            setTakenRecords(newTakenRecords);

        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // 3. Update Methods
    const updateProfile = async (updates: Partial<typeof profile>) => {
        if (!user) return;
        setProfile(prev => ({ ...prev, ...updates }));
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { ...profile, ...updates }, { merge: true });
    };

    const addMedication = async (med: string) => {
        if (!user) return;
        if (medications.includes(med)) return;

        // Optimistic update
        setMedications(prev => [...prev, med]);

        // Add to collection
        await addDoc(collection(db, 'medications'), {
            userId: user.uid,
            name: med,
            schedule: [],
            takenHistory: {}
        });
    };

    const removeMedication = async (med: string) => {
        if (!user) return;

        // Optimistic
        setMedications(prev => prev.filter(m => m !== med));
        setMedicationDetails(prev => prev.filter(m => m.name !== med));
        setSchedule(prev => {
            const newSchedule = { ...prev };
            Object.keys(newSchedule).forEach(day => {
                newSchedule[day] = newSchedule[day].filter(m => m !== med);
            });
            return newSchedule;
        });

        // Delete from Firestore
        // Need to find the doc first
        const q = query(collection(db, 'medications'), where('userId', '==', user.uid), where('name', '==', med));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
            await deleteDoc(doc(db, 'medications', d.id));
        });
    };

    const addMedicationWithDetails = async (med: { name: string; frequency: string; time: string; reminder: boolean }) => {
        if (!user) return;
        if (medications.includes(med.name)) return;

        // Optimistic update
        setMedications(prev => [...prev, med.name]);
        setMedicationDetails(prev => [...prev, med]);

        // Add to Firestore
        await setDoc(doc(db, 'medications', `${user.uid}_${med.name}`), {
            userId: user.uid,
            name: med.name,
            frequency: med.frequency || '',
            time: med.time || '',
            reminder: med.reminder || false,
            schedule: [],
            takenHistory: {}
        });
    };

    const removeMedicationByIndex = async (index: number) => {
        if (!user) return;
        const medToRemove = medicationDetails[index];
        if (!medToRemove) return;

        // Optimistic
        setMedications(prev => prev.filter(m => m !== medToRemove.name));
        setMedicationDetails(prev => prev.filter((_, i) => i !== index));
        setSchedule(prev => {
            const newSchedule = { ...prev };
            Object.keys(newSchedule).forEach(day => {
                newSchedule[day] = newSchedule[day].filter(m => m !== medToRemove.name);
            });
            return newSchedule;
        });

        // Delete from Firestore
        await deleteDoc(doc(db, 'medications', `${user.uid}_${medToRemove.name}`));
    };

    const updateMedicationReminder = async (index: number, reminder: boolean) => {
        if (!user) return;
        const med = medicationDetails[index];
        if (!med) return;

        // Optimistic update
        setMedicationDetails(prev => prev.map((m, i) => i === index ? { ...m, reminder } : m));

        // Update Firestore
        const medRef = doc(db, 'medications', `${user.uid}_${med.name}`);
        await updateDoc(medRef, {
            reminder: reminder
        });
    };

    const addToSchedule = async (day: string, med: string) => {
        if (!user) return;

        // Optimistic
        setSchedule(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), med]
        }));

        // Update Firestore
        // Find doc
        const q = query(collection(db, 'medications'), where('userId', '==', user.uid), where('name', '==', med));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const medDoc = snapshot.docs[0];
            const currentSchedule = medDoc.data().schedule || [];
            await updateDoc(medDoc.ref, {
                schedule: [...currentSchedule, day]
            });
        }
    };

    const removeFromSchedule = async (day: string, med: string, index: number) => {
        if (!user) return;

        // Optimistic
        setSchedule(prev => {
            const dayMeds = [...(prev[day] || [])];
            dayMeds.splice(index, 1);
            return { ...prev, [day]: dayMeds };
        });

        // Update Firestore by removing ONE instance of day
        const q = query(collection(db, 'medications'), where('userId', '==', user.uid), where('name', '==', med));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const medDoc = snapshot.docs[0];
            const currentSchedule: string[] = medDoc.data().schedule || [];
            // Remove first occurrence of day (approximation since we don't track indices)
            const removeIdx = currentSchedule.indexOf(day);
            if (removeIdx > -1) {
                currentSchedule.splice(removeIdx, 1);
                await updateDoc(medDoc.ref, {
                    schedule: currentSchedule
                });
            }
        }
    };

    const toggleTaken = async (recordId: string) => {
        if (!user) return;

        // Optimistic
        setTakenRecords(prev => ({
            ...prev,
            [recordId]: !prev[recordId] // Toggle boolean
        }));

        // Determine which med this belongs to
        // key format: "YYYY-MM-DD_MedName_Idx"
        // We need to parse MedName from this key to find the doc
        // This is tricky if med names have underscores.
        // Let's iterate meds to find which one matches? Or change key format?
        // Let's assume med name is the middle part. 
        // Better: parse it robustly or store it in context differently.
        // Current: `${dateStr}_${med}_${idx}`
        const parts = recordId.split('_');
        const dateStr = parts[0];
        const idx = parts.pop(); // remove index
        const medName = parts.slice(1).join('_'); // Rejoin rest as med name

        const q = query(collection(db, 'medications'), where('userId', '==', user.uid), where('name', '==', medName));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const medDoc = snapshot.docs[0];
            const currentHistory = medDoc.data().takenHistory || {};
            // Toggle in DB
            const newVal = !currentHistory[recordId]; // Logic should match optimistic
            // If optimistic was true -> false, means DB needs false.
            // Actually we can just set it to the value in state, but state is async/optimistic.
            // Lets use the optimistic value we just set? No, safer to just toggle current logic or read state.
            // We can just set it to true if it wasn't there, or false/delete if it was.

            await updateDoc(medDoc.ref, {
                [`takenHistory.${recordId}`]: newVal
            });
        }
    };

    // Refresh user data from Firestore (useful after onboarding or profile updates)
    const refreshUserData = async () => {
        if (user) {
            await fetchUserData(user.uid);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            loading,
            profile,
            updateProfile,
            medications,
            medicationDetails,
            addMedication,
            addMedicationWithDetails,
            removeMedication,
            removeMedicationByIndex,
            updateMedicationReminder,
            schedule,
            addToSchedule,
            removeFromSchedule,
            takenRecords,
            toggleTaken,
            refreshUserData
        }}>
            {children}
        </UserContext.Provider>
    );
};
