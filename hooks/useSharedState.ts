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
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // FIX: If Firebase isn't ready, treat it as an error state instead of proceeding with default data.
        // This prevents the app from getting stuck on "Loading..." when the connection is slow or fails.
        if (!db) {
            setError(new Error("No se pudo conectar a la base de datos. Por favor, revisa tu configuración de Firebase y tu conexión de red."));
            setLoading(false);
            return;
        }

        const scheduleDocRef = doc(db, "schedules", "main_schedule_2026");

        const timeoutId = setTimeout(() => {
            if (loading) { // Only trigger timeout if still loading
                setError(new Error("La conexión con la base de datos ha tardado demasiado. Por favor, comprueba tu conexión a internet y recarga la página."));
                setLoading(false);
            }
        }, 15000); // 15-second timeout

        const unsubscribe = onSnapshot(scheduleDocRef, 
            (docSnap) => {
                clearTimeout(timeoutId);
                if (docSnap.exists()) {
                    setData(docSnap.data() as AppState);
                } else {
                    console.log("Document not found, seeding database with initial state...");
                    const initialState = getInitialState();
                    setDoc(scheduleDocRef, initialState).then(() => {
                        setData(initialState);
                    }).catch(seedError => {
                        console.error("Error seeding database:", seedError);
                        setError(seedError as Error);
                    });
                }
                setLoading(false);
            }, 
            (err) => {
                clearTimeout(timeoutId);
                console.error("Firestore snapshot error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            clearTimeout(timeoutId);
            unsubscribe();
        };
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
    
    const displayData = data ?? getInitialState();

    return { data: displayData, loading, error, updateData };
};
