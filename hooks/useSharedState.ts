import { useState, useEffect, useCallback } from 'react';
// FIX: Remove Firebase imports as they are causing errors and the project uses localStorage for persistence.
// import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
// import { db } from '../firebase/config';
import type { AppState, Nurse, Agenda, Schedule, Notes, StrasbourgEvent, Wishes, JornadaLaboral, SpecialStrasbourgEvent, ScheduleCell, ManualChangeLogEntry, ShiftRotation, ShiftRotationAssignment } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

// This file is now refactored to use localStorage for state management instead of Firebase Firestore.
// This aligns with how `userService.ts` handles user data and resolves the build errors.

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

// A single key in localStorage will hold our entire app state.
const STATE_STORAGE_KEY = "main_schedule_2026";

export const useSharedState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect reads from localStorage instead of Firestore.
        // It handles both fetching initial data and seeding localStorage if it's empty.
        try {
            const storedJson = localStorage.getItem(STATE_STORAGE_KEY);
            if (storedJson) {
                const storedData = JSON.parse(storedJson) as AppState;
                
                // To ensure forward compatibility, merge the fetched data with the default structure.
                const defaults = getInitialState();
                const finalData = {
                    ...defaults,
                    ...storedData,
                    nurses: storedData.nurses || defaults.nurses,
                    manualOverrides: storedData.manualOverrides || defaults.manualOverrides,
                    notes: storedData.notes || defaults.notes,
                    strasbourgAssignments: storedData.strasbourgAssignments || defaults.strasbourgAssignments,
                    specialStrasbourgEvents: storedData.specialStrasbourgEvents || defaults.specialStrasbourgEvents,
                    jornadasLaborales: storedData.jornadasLaborales || defaults.jornadasLaborales,
                    manualChangeLog: storedData.manualChangeLog || defaults.manualChangeLog,
                    shiftRotations: storedData.shiftRotations || defaults.shiftRotations,
                    shiftRotationAssignments: storedData.shiftRotationAssignments || defaults.shiftRotationAssignments,
                };
                setData(finalData);
            } else {
                // localStorage is empty. This is likely the first run.
                // We seed the storage once.
                console.log("No data in localStorage, seeding with initial state...");
                const initialState = getInitialState();
                localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(initialState));
                setData(initialState);
            }
        } catch (error) {
            console.error("Error reading from localStorage, seeding with initial state:", error);
            // If parsing fails, fallback to a fresh initial state.
            const initialState = getInitialState();
            localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(initialState));
            setData(initialState);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    const updateData = useCallback((updates: Partial<AppState>) => {
        // This function updates the state and writes the new state to localStorage.
        setData(currentData => {
            if (!currentData) return null;
            const updatedData = { ...currentData, ...updates };
            try {
                localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(updatedData));
            } catch (e) {
                console.error("Error updating localStorage:", e);
            }
            return updatedData;
        });
    }, []);

    return { data, loading, updateData };
};
