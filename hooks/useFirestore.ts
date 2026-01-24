import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Nurse, Agenda, Schedule, Notes, StrasbourgEvent, Wishes, HistoryEntry, WorkZone } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

// Define the shape of the document in Firestore
export interface ScheduleDocument {
    nurses: Nurse[];
    agenda: Agenda;
    manualOverrides: Schedule;
    notes: Notes;
    vaccinationPeriod: { start: string; end: string } | null;
    strasbourgAssignments: Record<string, string[]>;
    strasbourgEvents: StrasbourgEvent[];
    closedMonths: Record<string, boolean>;
    wishes: Wishes;
    history: HistoryEntry[];
}

const scheduleDocRef = doc(db, "schedules", "main_schedule_2026");

// Initial state to seed the database if it's empty
const getInitialState = (): ScheduleDocument => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data, // Using the 2026 data as the base
    manualOverrides: {},
    notes: {},
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    history: [],
});

export const useFirestore = () => {
    const [data, setData] = useState<ScheduleDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const checkAndSeedDatabase = async () => {
            try {
                const docSnap = await getDoc(scheduleDocRef);
                if (!docSnap.exists()) {
                    console.log("Document not found, seeding database with initial state...");
                    await setDoc(scheduleDocRef, getInitialState());
                }
            } catch (e) {
                console.error("Error checking/seeding database:", e);
                setError(e as Error);
            }
        };

        checkAndSeedDatabase();

        const unsubscribe = onSnapshot(scheduleDocRef, (doc) => {
            if (doc.exists()) {
                setData(doc.data() as ScheduleDocument);
            } else {
                // This case should be handled by seeding, but as a fallback:
                console.log("Document does not exist! Seeding might have failed or is in progress.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore snapshot error:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateData = async (updates: Partial<ScheduleDocument>) => {
        try {
            await updateDoc(scheduleDocRef, updates);
        } catch (e) {
            console.error("Error updating document:", e);
            // Optionally handle update errors, e.g., show a notification to the user
        }
    };

    return { data, loading, error, updateData };
};
