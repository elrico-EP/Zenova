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

export const useSharedState = (skip: boolean) => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // If the skip flag is true (e.g., auth is still loading), do nothing.
        // The loading state will remain true until this effect can run.
        if (skip) {
            // Ensure loading is true if we are skipping
            if (!loading) setLoading(true);
            return;
        }

        // When skip becomes false, this logic will execute.
        if (!db) {
            setError(new Error("No se pudo conectar a la base de datos. Por favor, revisa tu configuración de Firebase y tu conexión de red."));
            setLoading(false);
            return;
        }

        const scheduleDocRef = doc(db, "schedules", "main_schedule_2026");
        let isSubscribed = true;

        const timeoutId = setTimeout(() => {
            if (isSubscribed) {
                setError(new Error("La conexión con la base de datos ha tardado demasiado. Por favor, comprueba tu conexión a internet y recarga la página."));
                setLoading(false);
            }
        }, 15000); // 15-second timeout

        const unsubscribe = onSnapshot(scheduleDocRef, 
            (docSnap) => {
                if (!isSubscribed) return;
                clearTimeout(timeoutId);
                if (docSnap.exists()) {
                    setData(docSnap.data() as AppState);
                } else {
                    console.log("Document not found, seeding database with initial state...");
                    const initialState = getInitialState();
                    setDoc(scheduleDocRef, initialState).then(() => {
                        if(isSubscribed) setData(initialState);
                    }).catch(seedError => {
                        if(isSubscribed) {
                           console.error("Error seeding database:", seedError);
                           setError(seedError as Error);
                        }
                    });
                }
                setLoading(false);
            }, 
            (err) => {
                if (!isSubscribed) return;
                clearTimeout(timeoutId);
                console.error("Firestore snapshot error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            isSubscribed = false;
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, [skip]); // This effect is now controlled by the skip flag.

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
    
    // Return initial state while loading to prevent errors from undefined data.
    const displayData = data ?? getInitialState();

    return { data: displayData, loading: skip || loading, error, updateData };
};
