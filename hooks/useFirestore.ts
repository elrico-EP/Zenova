
import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
// FIX: Import AppState and other necessary types
import type { AppState, Nurse, Agenda, Schedule, Notes, StrasbourgEvent, Wishes, HistoryEntry, WorkZone, JornadaLaboral, ScheduleCell, CustomShift } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

// FIX: Define a generic useFirestore hook to resolve circular dependency.
const useFirestore = <T extends object>(path: string, initialData: T) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);

    const docRef = useMemo(() => {
        const pathParts = path.split('/');
        return doc(db, pathParts[0], ...pathParts.slice(1));
    }, [path]);

    useEffect(() => {
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data() as T);
            } else {
                console.log("No such document! Seeding initial state.");
                await setDoc(docRef, initialData);
                setData(initialData);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [docRef, initialData]);

    const updateData = useCallback(async (updates: Partial<T>) => {
        // Firestore's updateDoc can handle partial updates on top-level fields.
        await updateDoc(docRef, updates as any);
    }, [docRef]);

    return { data, loading, updateData };
};


// FIX: Copied from useSharedState.ts to support migration logic and initial state.
const STORAGE_KEY = 'zenova-schedule-data';

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
  'nurse-1': { '2026-01-05': 'CA', '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS, '2026-03-23': 'CA', '2026-03-24': 'CA', '2026-03-25': 'CA', '2026-03-26': 'CA', '2026-03-27': 'CA', '2026-03-30': 'CA', '2026-03-31': 'CA', '2026-04-01': 'CA', '2026-04-02': 'CA', '2026-04-03': 'CA', '2026-04-06': 'CA', '2026-04-07': 'CA', '2026-04-08': 'CA', '2026-04-09': 'CA', '2026-04-10': 'CA', },
  'nurse-2': { '2026-01-05': 'CA', '2026-01-06': 'CA', '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA', },
  'nurse-3': { '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS, },
  'nurse-4': { '2026-01-05': { custom: 'Reducción (80%)' }, '2026-01-12': { custom: 'Reducción (80%)' }, '2026-01-19': { custom: 'Reducción (80%)' }, '2026-01-26': { custom: 'Reducción (80%)' }, },
  'nurse-5': { '2026-01-05': 'CA', '2026-01-14': FP_UNIVERSIDAD, '2026-01-15': FP_UNIVERSIDAD, '2026-01-16': FP_UNIVERSIDAD, '2026-02-02': FP_STAGE_PLAIES, '2026-02-09': FP_STAGE_PLAIES, '2026-02-11': FP_UNIVERSIDAD, '2026-02-12': FP_UNIVERSIDAD, '2026-02-13': FP_UNIVERSIDAD, '2026-02-17': FP_BLS, '2026-02-24': FP_STAGE_PLAIES, },
  'nurse-6': { '2026-01-05': 'CA', '2026-01-06': 'CA', '2026-02-16': 'CA', '2026-02-17': 'CA', },
  'nurse-7': { '2026-01-28': FP_GORKA, '2026-01-30': 'CA', '2026-02-02': 'CA', '2026-02-17': FP_BLS, },
  'nurse-8': { '2026-02-02': 'CA', '2026-02-03': 'CA', '2026-02-04': 'CA', '2026-02-17': FP_BLS, '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA', },
  'nurse-9': { '2026-02-20': 'CA' },
  'nurse-10': { '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS, '2026-02-16': 'CA' },
  'nurse-11': { '2026-09-05': 'CA' },
};

const JANUARY_2026_SHIFTS: Schedule = {
    'nurse-1':  { '2026-01-06': 'ADMIN', '2026-01-07': 'ADMIN', '2026-01-08': 'ADMIN', '2026-01-09': 'ADMIN', '2026-01-12': 'ADMIN', '2026-01-13': 'ADMIN', '2026-01-14': 'ADMIN', '2026-01-15': 'ADMIN', '2026-01-16': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'ADMIN' },
    'nurse-2':  { '2026-01-07': 'URGENCES', '2026-01-08': 'ADMIN', '2026-01-09': 'URGENCES', '2026-01-12': 'TRAVAIL_TARDE', '2026-01-13': 'URGENCES', '2026-01-14': 'URGENCES', '2026-01-15': 'TRAVAIL_TARDE', '2026-01-16': 'TRAVAIL_TARDE', '2026-01-19': 'URGENCES_TARDE', '2026-01-20': 'TRAVAIL_TARDE', '2026-01-21': 'URGENCES', '2026-01-22': 'TRAVAIL', '2026-01-23': 'TRAVAIL', '2026-01-26': 'URGENCES_TARDE', '2026-01-27': 'ADMIN', '2026-01-28': 'TRAVAIL', '2026-01-29': 'ADMIN', '2026-01-30': 'URGENCES' },
    'nurse-3':  { '2026-01-05': 'ADMIN', '2026-01-06': 'TRAVAIL', '2026-01-07': 'TRAVAIL', '2026-01-08': 'TW', '2026-01-09': 'URGENCES', '2026-01-12': 'URGENCES', '2026-01-13': 'ADMIN', '2026-01-14': 'TRAVAIL', '2026-01-15': 'URGENCES', '2026-01-16': 'URGENCES', '2026-01-19': 'URGENCES', '2026-01-20': 'URGENCES_TARDE', '2026-01-21': 'TRAVAIL', '2026-01-22': 'URGENCES', '2026-01-23': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'URGENCES' },
    'nurse-4':  { '2026-01-06': 'URGENCES_TARDE', '2026-01-07': 'TRAVAIL', '2026-01-08': 'ADMIN', '2026-01-09': 'TRAVAIL', '2026-01-13': 'TW', '2026-01-14': 'TRAVAIL_TARDE', '2026-01-15': 'ADMIN', '2026-01-16': 'URGENCES', '2026-01-27': 'URGENCES', '2026-01-28': 'ADMIN', '2026-01-29': 'URGENCES' },
    'nurse-5':  { '2026-01-06': 'ADMIN', '2026-01-07': 'URGENCES', '2026-01-08': 'TRAVAIL_TARDE', '2026-01-09': 'ADMIN', '2026-01-12': 'URGENCES', '2026-01-13': 'TW', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': 'TW', '2026-01-19': 'TRAVAIL', '2026-01-20': 'URGENCES', '2026-01-21': 'URGENCES', '2026-01-22': 'ADMIN', '2026-01-23': 'URGENCES', '2026-01-26': 'TRAVAIL_TARDE', '2026-01-27': 'ADMIN', '2026-01-28': 'URGENCES', '2026-01-29': 'URGENCES_TARDE', '2026-01-30': 'ADMIN' },
    'nurse-6':  { '2026-01-07': 'URGENCES_TARDE', '2026-01-08': 'TRAVAIL', '2026-01-09': 'ADMIN', '2026-01-12': 'TRAVAIL', '2026-01-13': 'ADMIN', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': 'TW', '2026-01-19': 'TRAVAIL_TARDE', '2026-01-20': 'TRAVAIL', '2026-01-21': 'TRAVAIL_TARDE', '2026-01-22': 'URGENCES', '2026-01-23': 'URGENCES', '2026-01-26': 'URGENCES', '2026-01-27': 'TRAVAIL', '2026-01-28': 'TRAVAIL_TARDE', '2026-01-29': 'ADMIN', '2026-01-30': 'URGENCES' },
    'nurse-7':  { '2026-01-05': 'TRAVAIL_TARDE', '2026-01-06': 'URGENCES', '2026-01-07': 'ADMIN', '2026-01-08': 'URGENCES_TARDE', '2026-01-09': 'URGENCES', '2026-01-12': 'TW', '2026-01-13': 'TRAVAIL_TARDE', '2026-01-14': 'ADMIN', '2026-01-15': 'ADMIN', '2026-01-16': 'URGENCES_TARDE', '2026-01-19': 'TRAVAIL', '2026-01-20': 'URGENCES', '2026-01-21': 'TRAVAIL', '2026-01-22': 'URGENCES_TARDE', '2026-01-23': 'URGENCES', '2026-01-26': 'ADMIN', '2026-01-27': 'TRAVAIL', '2026-01-29': 'TRAVAIL' },
    'nurse-8':  { '2026-01-05': 'URGENCES', '2026-01-06': 'URGENCES', '2026-01-07': 'TW', '2026-01-08': 'URGENCES', '2026-01-09': 'TRAVAIL', '2026-01-12': 'ADMIN', '2026-01-13': 'URGENCES', '2026-01-14': 'TW', '2026-01-15': 'ADMIN', '2026-01-16': 'SICK_LEAVE', '2026-01-19': 'URGENCES', '2026-01-20': 'TRAVAIL', '2026-01-21': 'URGENCES_TARDE', '2026-01-22': 'TRAVAIL', '2026-01-23': 'TRAVAIL', '2026-01-26': 'URGENCES', '2026-01-27': 'ADMIN', '2026-01-28': 'URGENCES_TARDE', '2026-01-29': 'URGENCES', '2026-01-30': 'ADMIN' },
    'nurse-9':  { '2026-01-05': 'URGENCES', '2026-01-06': 'TRAVAIL_TARDE', '2026-01-07': 'TRAVAIL_TARDE', '2026-01-08': 'TRAVAIL', '2026-01-09': 'TRAVAIL', '2026-01-12': 'ADMIN', '2026-01-13': 'URGENCES_TARDE', '2026-01-14': 'TRAVAIL', '2026-01-15': 'URGENCES_TARDE', '2026-01-16': 'TRAVAIL', '2026-01-26': 'ADMIN', '2026-01-27': 'TRAVAIL_TARDE', '2026-01-28': 'URGENCES', '2026-01-29': 'FP', '2026-01-30': 'TRAVAIL' },
    'nurse-10': { '2026-01-05': 'URGENCES_TARDE', '2026-01-06': 'TRAVAIL', '2026-01-07': 'TRAVAIL_TARDE', '2026-01-08': 'URGENCES', '2026-01-09': 'TW', '2026-01-12': 'URGENCES_TARDE', '2026-01-13': 'TRAVAIL', '2026-01-14': 'ADMIN', '2026-01-15': 'URGENCES', '2026-01-16': 'TRAVAIL', '2026-01-26': 'TRAVAIL', '2026-01-27': 'URGENCES_TARDE', '2026-01-30': 'TRAVAIL' },
    'nurse-11': { '2026-01-12': 'TRAVAIL', '2026-01-13': 'TW', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': { custom: 'LIB', type: 'LIBERO', time: '10:00 - 16:00' }, '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'TRAVAIL_TARDE', '2026-01-23': 'TRAVAIL', '2026-01-26': 'TRAVAIL', '2026-01-27': 'URGENCES', '2026-01-28': 'TRAVAIL', '2026-01-29': 'TRAVAIL_TARDE', '2026-01-30': 'TRAVAIL' },
};

function mergeOverrides(base: Schedule, additions: Schedule): Schedule {
    const result = JSON.parse(JSON.stringify(base));
    for (const nurseId in additions) {
        if (!result[nurseId]) {
            result[nurseId] = {};
        }
        for (const dateKey in additions[nurseId]) {
            if (!result[nurseId][dateKey]) { // Only add if not already present in the base
                result[nurseId][dateKey] = additions[nurseId][dateKey] as ScheduleCell;
            }
        }
    }
    return result;
}

const INITIAL_MANUAL_OVERRIDES = mergeOverrides(YEAR_2026_FIXED_EVENTS, JANUARY_2026_SHIFTS);


// FIX: Update getInitialState to return AppState and include all necessary initial data.
const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: INITIAL_MANUAL_OVERRIDES,
    notes: {
        '2026-01-05': { text: 'No PS no VAs', color: 'bg-yellow-100' },
        '2026-01-15': { text: 'Training day', color: 'bg-yellow-100' },
    },
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    jornadasLaborales: INITIAL_JORNADAS,
    manualChangeLog: [],
});

export const useSharedState = () => {
    // Usar Firebase en lugar de localStorage
    const { data: firestoreData, loading: firestoreLoading, updateData: updateFirestore } = useFirestore<AppState>(
        'sharedState/main',
        getInitialState()
    );
    
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    // Sincronizar Firestore con el estado local
    useEffect(() => {
        if (!firestoreLoading) {
            setData(firestoreData);
            setLoading(false);
        }
    }, [firestoreData, firestoreLoading]);

    // Migrar datos de localStorage a Firebase (solo una vez)
    useEffect(() => {
        if (!firestoreLoading && firestoreData && data) {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                try {
                    const parsedLocalData = JSON.parse(localData);
                    // Si hay datos en localStorage pero no en Firebase, migrar
                    if (Object.keys(firestoreData).length === 0 || 
                        !firestoreData.manualOverrides || 
                        Object.keys(firestoreData.manualOverrides).length === 0) {
                        console.log('Migrando datos de localStorage a Firebase...');
                        updateFirestore(parsedLocalData);
                        // Limpiar localStorage después de migrar
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch (error) {
                    console.error('Error al migrar datos:', error);
                }
            }
        }
    }, [firestoreLoading, firestoreData, data, updateFirestore]);

    const updateData = useCallback((updates: Partial<AppState>) => {
        setData(prevData => {
            if (!prevData) return null;
            const newData = { ...prevData, ...updates };
            
            // Guardar en Firebase
            updateFirestore(newData);
            
            return newData;
        });
    }, [updateFirestore]);

    return { data, loading, updateData };
};
