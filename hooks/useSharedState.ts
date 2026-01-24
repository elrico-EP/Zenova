import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config';
import type { AppState } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: {},
    notes: {},
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    jornadasLaborales: [],
    manualChangeLog: [],
});

export const useSharedState = () => {
    const [data, setData] = useState<AppState | null>(getInitialState());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Si Firebase no está configurado, no hacemos nada.
        if (!db) {
            setLoading(false);
            return;
        }

        const scheduleDocRef = doc(db, "schedules", "main_schedule_2026");

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
                setData(doc.data() as AppState);
            } else {
                console.log("Document does not exist. Waiting for seeding...");
                setData(getInitialState());
            }
            setLoading(false);
        }, (err) => {
            console.error("Firestore snapshot error:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateData = useCallback(async (updates: Partial<AppState>) => {
        if (!db) {
            console.error("Cannot update data: Firestore is not initialized.");
            return;
        }
        const scheduleDocRef = doc(db, "schedules", "main_schedule_2026");
        try {
            await updateDoc(scheduleDocRef, updates);
        } catch (e) {
            console.error("Error updating document in Firestore:", e);
        }
    }, []);

    return { data, loading, error, updateData };
};
