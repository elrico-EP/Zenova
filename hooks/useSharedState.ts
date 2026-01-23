import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppState, Nurse, Agenda, Schedule, Notes, StrasbourgEvent, Wishes, JornadaLaboral, SpecialStrasbourgEvent, ScheduleCell, ManualChangeLogEntry, ShiftRotation, ShiftRotationAssignment } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

// This file is now refactored to use Firebase Firestore for real-time collaboration.
// The logic for initial state and data structure remains the same.

const INITIAL_JORNADAS: JornadaLaboral[] = [
  { id: 'j-tanja-1', nurseId: 'nurse-2', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 3 },
  { id: 'j-virginie-1', nurseId: 'nurse-3', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'LEAVE_EARLY_1H_L_J' },
  { id: 'j-paola-1', nurseId: 'nurse-4', porcentaje: 80, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'FULL_DAY_OFF', reductionDayOfWeek: 1 },
  { id: 'j-elena-1', nurseId: 'nurse-5', porcentaje: 80, fechaInicio: '2026-03-01', fechaFin: '2026-09-30', reductionOption: 'FRIDAY_PLUS_EXTRA', secondaryReductionDayOfWeek: 2 },
  { id: 'j-katelijn-1', nurseId: 'nurse-8', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-06-30', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 1 },
];

const FP_UNIVERSIDAD = { custom: 'Universidad', type: 'FP' as const, time: '08:30 - 17:30' };
const FP_STAGE_PLAIES = { custom: 'Stage plaies', type: 'FP' as const, time: '08:00 - 17:00' };
const FP_MIMMS = { custom: 'MIMMS', type: 'FP' as const, time: '08:00 - 17:00' };
const FP_GORKA = { custom: 'FP', type: 'FP' as const, time: '08:00 - 17:00' };
const FP_BLS = { custom: 'BLS', type: 'FP' as const, time: '08:00 - 14:00' };

const YEAR_2026_FIXED_EVENTS: Schedule = {
  'nurse-1': { '2026-01-05': 'CA', '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS, '2026-03-23': 'CA', '2026-03-24': 'CA', '2026-03-25': 'CA', '2026-03-26': 'CA', '2026-03-27': 'CA', '2026-03-30': 'CA', '2026-03-31': 'CA', '2026-04-01': 'CA', '2026-04-02': 'CA', '2026-04-03': 'CA', '2026-04-06': 'CA', '2026-04-07': 'CA', '2026-04-08': 'CA', '2026-04-09': 'CA', '2026-04-10': 'CA' },
  'nurse-2': { '2026-01-05': 'CA', '2026-01-06': 'CA', '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA' },
  'nurse-3': { '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS },
  'nurse-4': { '2026-01-05': { custom: 'Reducción (80%)' }, '2026-01-12': { custom: 'Reducción (80%)' }, '2026-01-19': { custom: 'Reducción (80%)' }, '2026-01-26': { custom: 'Reducción (80%)' } },
  'nurse-5': { '2026-01-05': 'CA', '2026-01-14': FP_UNIVERSIDAD, '2026-01-15': FP_UNIVERSIDAD, '2026-01-16': FP_UNIVERSIDAD, '2026-02-02': FP_STAGE_PLAIES, '2026-02-09': FP_STAGE_PLAIES, '2026-02-11': FP_UNIVERSIDAD, '2026-02-12': FP_UNIVERSIDAD, '2026-02-13': FP_UNIVERSIDAD, '2026-02-17': FP_BLS, '2026-02-24': FP_STAGE_PLAIES },
  'nurse-6': { '2026-01-05': 'CA', '2026-01-06': 'CA', '2026-02-16': 'CA', '2026-02-17': 'CA' },
  'nurse-7': { '2026-01-28': FP_GORKA, '2026-01-30': 'CA', '2026-02-02': 'CA', '2026-02-17': FP_BLS },
  'nurse-8': { '2026-02-02': 'CA', '2026-02-03': 'CA', '2026-02-04': 'CA', '2026-02-17': FP_BLS, '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA' },
  'nurse-9': { '2026-02-20': 'CA' },
  'nurse-10': { '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS, '2026-02-16': 'CA' },
  'nurse-11': { '2026-09-05': 'CA' },
};

const JANUARY_2026_SHIFTS: Schedule = { 'nurse-1': { '2026-01-06': 'ADMIN', '2026-01-07': 'ADMIN', '2026-01-08': 'ADMIN', '2026-01-09': 'ADMIN', '2026-01-12': 'ADMIN', '2026-01-13': 'ADMIN', '2026-01-14': 'ADMIN', '2026-01-15': 'ADMIN', '2026-01-16': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'ADMIN' }, 'nurse-2': { '2026-01-07': 'URGENCES', '2026-01-08': 'ADMIN', '2026-01-09': 'URGENCES', '2026-01-12': 'TRAVAIL_TARDE', '2026-01-13': 'URGENCES', '2026-01-14': 'URGENCES', '2026-01-15': 'TRAVAIL_TARDE', '2026-01-16': 'TRAVAIL_TARDE', '2026-01-19': 'URGENCES_TARDE', '2026-01-20': 'TRAVAIL_TARDE', '2026-01-21': 'URGENCES', '2026-01-22': 'TRAVAIL', '2026-01-23': 'TRAVAIL', '2026-01-26': 'URGENCES_TARDE', '2026-01-27': 'ADMIN', '2026-01-28': 'TRAVAIL', '2026-01-29': 'ADMIN', '2026-01-30': 'URGENCES' }, 'nurse-3': { '2026-01-05': 'ADMIN', '2026-01-06': 'TRAVAIL', '2026-01-07': 'TRAVAIL', '2026-01-08': 'TW', '2026-01-09': 'URGENCES', '2026-01-12': 'URGENCES', '2026-01-13': 'ADMIN', '2026-01-14': 'TRAVAIL', '2026-01-15': 'URGENCES', '2026-01-16': 'URGENCES', '2026-01-19': 'URGENCES', '2026-01-20': 'URGENCES_TARDE', '2026-01-21': 'TRAVAIL', '2026-01-22': 'URGENCES', '2026-01-23': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'URGENCES' }, 'nurse-4': { '2026-01-06': 'URGENCES_TARDE', '2026-01-07': 'TRAVAIL', '2026-01-08': 'ADMIN', '2026-01-09': 'TRAVAIL', '2026-01-13': 'TW', '2026-01-14': 'TRAVAIL_TARDE', '2026-01-15': 'ADMIN', '2026-01-16': 'URGENCES', '2026-01-27': 'URGENCES', '2026-01-28': 'ADMIN', '2026-01-29': 'URGENCES' }, 'nurse-5': { '2026-01-06': 'ADMIN', '2026-01-07': 'URGENCES', '2026-01-08': 'TRAVAIL_TARDE', '2026-01-09': 'ADMIN', '2026-01-12': 'URGENCES', '2026-01-13': 'TW', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': 'TW', '2026-01-19': 'TRAVAIL', '2026-01-20': 'URGENCES', '2026-01-21': 'URGENCES', '2026-01-22': 'ADMIN', '2026-01-23': 'URGENCES', '2026-01-26': 'TRAVAIL_TARDE', '2026-01-27': 'ADMIN', '2026-01-28': 'URGENCES', '2026-01-29': 'URGENCES_TARDE', '2026-01-30': 'ADMIN' }, 'nurse-6': { '2026-01-07': 'URGENCES_TARDE', '2026-01-08': 'TRAVAIL', '2026-01-09': 'ADMIN', '2026-01-12': 'TRAVAIL', '2026-01-13': 'ADMIN', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': 'TW', '2026-01-19': 'TRAVAIL_TARDE', '2026-01-20': 'TRAVAIL', '2026-01-21': 'TRAVAIL_TARDE', '2026-01-22': 'URGENCES', '2026-01-23': 'URGENCES', '2026-01-26': 'URGENCES', '2026-01-27': 'TRAVAIL', '2026-01-28': 'TRAVAIL_TARDE', '2026-01-29': 'ADMIN', '2026-01-30': 'URGENCES' }, 'nurse-7': { '2026-01-05': 'TRAVAIL_TARDE', '2026-01-06': 'URGENCES', '2026-01-07': 'ADMIN', '2026-01-08': 'URGENCES_TARDE', '2026-01-09': 'URGENCES', '2026-01-12': 'TW', '2026-01-13': 'TRAVAIL_TARDE', '2026-01-14': 'ADMIN', '2026-01-15': 'ADMIN', '2026-01-16': 'URGENCES_TARDE', '2026-01-19': 'TRAVAIL', '2026-01-20': 'URGENCES', '2026-01-21': 'TRAVAIL', '2026-01-22': 'URGENCES_TARDE', '2026-01-23': 'URGENCES', '2026-01-26': 'ADMIN', '2026-01-27': 'TRAVAIL', '2026-01-29': 'TRAVAIL' }, 'nurse-8': { '2026-01-05': 'URGENCES', '2026-01-06': 'URGENCES', '2026-01-07': 'TW', '2026-01-08': 'URGENCES', '2026-01-09': 'TRAVAIL', '2026-01-12': 'ADMIN', '2026-01-13': 'URGENCES', '2026-01-14': 'TW', '2026-01-15': 'ADMIN', '2026-01-16': 'SICK_LEAVE', '2026-01-19': 'URGENCES', '2026-01-20': 'TRAVAIL', '2026-01-21': 'URGENCES_TARDE', '2026-01-22': 'TRAVAIL', '2026-01-23': 'TRAVAIL', '2026-01-26': 'URGENCES', '2026-01-27': 'ADMIN', '2026-01-28': 'URGENCES_TARDE', '2026-01-29': 'URGENCES', '2026-01-30': 'ADMIN' }, 'nurse-9': { '2026-01-05': 'URGENCES', '2026-01-06': 'TRAVAIL_TARDE', '2026-01-07': 'TRAVAIL_TARDE', '2026-01-08': 'TRAVAIL', '2026-01-09': 'TRAVAIL', '2026-01-12': 'ADMIN', '2026-01-13': 'URGENCES_TARDE', '2026-01-14': 'TRAVAIL', '2026-01-15': 'URGENCES_TARDE', '2026-01-16': 'TRAVAIL', '2026-01-26': 'ADMIN', '2026-01-27': 'TRAVAIL_TARDE', '2026-01-28': 'URGENCES', '2026-01-29': 'FP', '2026-01-30': 'TRAVAIL' }, 'nurse-10': { '2026-01-05': 'URGENCES_TARDE', '2026-01-06': 'TRAVAIL', '2026-01-07': 'TRAVAIL_TARDE', '2026-01-08': 'URGENCES', '2026-01-09': 'TW', '2026-01-12': 'URGENCES_TARDE', '2026-01-13': 'TRAVAIL', '2026-01-14': 'ADMIN', '2026-01-15': 'URGENCES', '2026-01-16': 'TRAVAIL', '2026-01-26': 'TRAVAIL', '2026-01-27': 'URGENCES_TARDE', '2026-01-30': 'TRAVAIL' }, 'nurse-11': { '2026-01-12': 'TRAVAIL', '2026-01-13': 'TW', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': { custom: 'LIB', type: 'LIBERO', time: '10:00 - 16:00' }, '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'TRAVAIL_TARDE', '2026-01-23': 'TRAVAIL', '2026-01-26': 'TRAVAIL', '2026-01-27': 'URGENCES', '2026-01-28': 'TRAVAIL', '2026-01-29': 'TRAVAIL_TARDE', '2026-01-30': 'TRAVAIL' } };

function mergeOverrides(base: Schedule, additions: Schedule): Schedule {
    const result = JSON.parse(JSON.stringify(base));
    for (const nurseId in additions) {
        if (!result[nurseId]) result[nurseId] = {};
        Object.assign(result[nurseId], additions[nurseId]);
    }
    return result;
}

const INITIAL_MANUAL_OVERRIDES = mergeOverrides(YEAR_2026_FIXED_EVENTS, JANUARY_2026_SHIFTS);

const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: INITIAL_MANUAL_OVERRIDES,
    notes: { '2026-01-05': { text: 'No PS no VAs', color: 'bg-yellow-100' }, '2026-01-15': { text: 'Training day', color: 'bg-yellow-100' } },
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    jornadasLaborales: INITIAL_JORNADAS,
    manualChangeLog: [],
    shiftRotations: [],
    shiftRotationAssignments: [],
});

// A single document in Firestore will hold our entire app state.
const scheduleDocRef = doc(db, "schedules", "main_schedule_2026");

export const useSharedState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect sets up the real-time listener.
        // It handles both fetching initial data and seeding the database if it's empty.
        let seeded = false; // Prevents multiple seeding attempts on flaky connections

        const unsubscribe = onSnapshot(scheduleDocRef, async (doc) => {
            if (doc.exists()) {
                const firestoreData = doc.data() as AppState;
                
                // To ensure forward compatibility, we merge the fetched data with
                // the default structure. If a new property is added to the app
                // but isn't in Firestore yet, it will get its default value.
                const defaults = getInitialState();
                const finalData = {
                    ...defaults,
                    ...firestoreData,
                    // Explicitly handle potentially missing nested objects/arrays
                    nurses: firestoreData.nurses || defaults.nurses,
                    manualOverrides: firestoreData.manualOverrides || defaults.manualOverrides,
                    notes: firestoreData.notes || defaults.notes,
                    strasbourgAssignments: firestoreData.strasbourgAssignments || defaults.strasbourgAssignments,
                    specialStrasbourgEvents: firestoreData.specialStrasbourgEvents || defaults.specialStrasbourgEvents,
                    jornadasLaborales: firestoreData.jornadasLaborales || defaults.jornadasLaborales,
                    manualChangeLog: firestoreData.manualChangeLog || defaults.manualChangeLog,
                    shiftRotations: firestoreData.shiftRotations || defaults.shiftRotations,
                    shiftRotationAssignments: firestoreData.shiftRotationAssignments || defaults.shiftRotationAssignments,
                };
                setData(finalData);
            } else {
                // Document doesn't exist. This likely means it's the first run.
                // We seed the database once.
                if (!seeded) {
                    seeded = true;
                    console.log("Document not found, seeding database with initial state...");
                    try {
                        await setDoc(scheduleDocRef, getInitialState());
                        // The onSnapshot listener will be triggered again automatically by setDoc,
                        // which will then run the doc.exists() block.
                    } catch (e) {
                        console.error("Error seeding database:", e);
                        // If seeding fails, fallback to the local initial state to keep the app functional.
                        setData(getInitialState());
                    }
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            // If the listener fails (e.g., permissions, network), fallback to local initial state.
            setData(getInitialState());
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this runs only once on mount

    const updateData = useCallback(async (updates: Partial<AppState>) => {
        // This function writes partial updates to Firestore.
        // The `onSnapshot` listener will automatically update the local state for all clients.
        try {
            await updateDoc(scheduleDocRef, updates);
        } catch (e) {
            console.error("Error updating document in Firestore:", e);
        }
    }, []);

    return { data, loading, updateData };
};
