import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from './useFirestore';
import type { AppState, Nurse, Agenda, Schedule, Notes, StrasbourgEvent, Wishes, JornadaLaboral, SpecialStrasbourgEvent, ScheduleCell, ManualChangeLogEntry } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

const STORAGE_KEY = 'zenova-schedule-data';

const INITIAL_JORNADAS: JornadaLaboral[] = [
  // Tanja (nurse-2): 90%, sale 3h antes los miércoles
  { id: 'j-tanja-1', nurseId: 'nurse-2', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 3 },
  // Virginie (nurse-3): 90%, sale 1h antes L-J
  { id: 'j-virginie-1', nurseId: 'nurse-3', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'LEAVE_EARLY_1H_L_J' },
  // Paola (nurse-4): 80%, no trabaja los lunes
  { id: 'j-paola-1', nurseId: 'nurse-4', porcentaje: 80, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'FULL_DAY_OFF', reductionDayOfWeek: 1 },
  // Elena (nurse-5): 80%, no trabaja los viernes y sale 1.5h antes los martes (Mar-Sep)
  { id: 'j-elena-1', nurseId: 'nurse-5', porcentaje: 80, fechaInicio: '2026-03-01', fechaFin: '2026-09-30', reductionOption: 'FRIDAY_PLUS_EXTRA', secondaryReductionDayOfWeek: 2 },
  // Katelijn (nurse-8): 90%, sale 3h antes los lunes (Ene-Jun)
  { id: 'j-katelijn-1', nurseId: 'nurse-8', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-06-30', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 1 },
];

const FP_UNIVERSIDAD = { custom: 'Universidad', type: 'FP' as const, time: '08:30 - 17:30' };
const FP_STAGE_PLAIES = { custom: 'Stage plaies', type: 'FP' as const, time: '08:00 - 17:00' };
const FP_MIMMS = { custom: 'MIMMS', type: 'FP' as const, time: '08:00 - 17:00' };
const FP_GORKA = { custom: 'FP', type: 'FP' as const, time: '08:00 - 17:00' };
const FP_BLS = { custom: 'BLS', type: 'FP' as const, time: '08:00 - 14:00' };

const YEAR_2026_FIXED_EVENTS: Schedule = {
  // Elvio (nurse-1)
  'nurse-1': {
    '2026-01-05': 'CA',
    '2026-01-28': FP_MIMMS,
    '2026-01-29': FP_MIMMS,
    '2026-03-23': 'CA', '2026-03-24': 'CA', '2026-03-25': 'CA', '2026-03-26': 'CA', '2026-03-27': 'CA',
    '2026-03-30': 'CA', '2026-03-31': 'CA', '2026-04-01': 'CA', '2026-04-02': 'CA', '2026-04-03': 'CA',
    '2026-04-06': 'CA', '2026-04-07': 'CA', '2026-04-08': 'CA', '2026-04-09': 'CA', '2026-04-10': 'CA',
  },
  // Tanja (nurse-2)
  'nurse-2': {
    '2026-01-05': 'CA', '2026-01-06': 'CA',
    '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA',
  },
  // Virginie (nurse-3)
  'nurse-3': {
    '2026-01-28': FP_MIMMS,
    '2026-01-29': FP_MIMMS,
  },
   // Paola (nurse-4)
  'nurse-4': {
    '2026-01-05': { custom: 'Reducción (80%)' }, '2026-01-12': { custom: 'Reducción (80%)' },
    '2026-01-19': { custom: 'Reducción (80%)' }, '2026-01-26': { custom: 'Reducción (80%)' },
  },
  // Elena (nurse-5)
  'nurse-5': {
    '2026-01-05': 'CA',
    '2026-01-14': FP_UNIVERSIDAD, '2026-01-15': FP_UNIVERSIDAD, '2026-01-16': FP_UNIVERSIDAD,
    '2026-02-02': FP_STAGE_PLAIES, '2026-02-09': FP_STAGE_PLAIES,
    '2026-02-11': FP_UNIVERSIDAD, '2026-02-12': FP_UNIVERSIDAD, '2026-02-13': FP_UNIVERSIDAD,
    '2026-02-17': FP_BLS, '2026-02-24': FP_STAGE_PLAIES,
  },
  // Miguel (nurse-6)
  'nurse-6': {
    '2026-01-05': 'CA', '2026-01-06': 'CA', '2026-02-16': 'CA', '2026-02-17': 'CA',
  },
  // Gorka (nurse-7)
  'nurse-7': {
    '2026-01-28': FP_GORKA, '2026-01-30': 'CA', '2026-02-02': 'CA', '2026-02-17': FP_BLS,
  },
  // Katelijn (nurse-8)
  'nurse-8': {
    '2026-02-02': 'CA', '2026-02-03': 'CA', '2026-02-04': 'CA', '2026-02-17': FP_BLS,
    '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA',
  },
  // Joseph (nurse-9)
  'nurse-9': { '2026-02-20': 'CA' },
  // Tatiana (nurse-10)
  'nurse-10': { '2026-01-28': FP_MIMMS, '2026-01-29': FP_MIMMS, '2026-02-16': 'CA' },
  // Becario (nurse-11)
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
    // Usar Firebase con el hook genérico
    const { data: firestoreData, loading: firestoreLoading, updateData: updateFirestore } = useFirestore<AppState>(
        'sharedState/main',
        getInitialState()
    );
    
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const [migrationDone, setMigrationDone] = useState(false);

    // Sincronizar datos de Firestore con el estado local
    useEffect(() => {
        if (!firestoreLoading && firestoreData) {
            console.log('🔄 Sincronizando datos desde Firebase...');
            setData(firestoreData);
            setLoading(false);
        }
    }, [firestoreData, firestoreLoading]);

    // Migración única de localStorage a Firebase
    useEffect(() => {
        if (!firestoreLoading && !migrationDone && firestoreData) {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                try {
                    const parsedData = JSON.parse(storedData);
                    
                    // Solo migrar si Firebase está vacío o tiene muy pocos datos
                    const firestoreIsEmpty = !firestoreData.manualOverrides || 
                                            Object.keys(firestoreData.manualOverrides).length === 0;
                    
                    if (firestoreIsEmpty) {
                        console.log('📦 Migrando datos de localStorage a Firebase...');
                        
                        // Limpiar datos antiguos
                        if (parsedData.history) delete parsedData.history;
                        if (parsedData.shiftRotations) delete parsedData.shiftRotations;
                        if (parsedData.shiftRotationAssignments) delete parsedData.shiftRotationAssignments;
                        if (parsedData.visualSwaps) delete parsedData.visualSwaps;
                        
                        // Asegurar datos necesarios
                        if (!parsedData.jornadasLaborales || parsedData.jornadasLaborales.length === 0) {
                            parsedData.jornadasLaborales = INITIAL_JORNADAS;
                        }
                        if (!parsedData.specialStrasbourgEvents) {
                            parsedData.specialStrasbourgEvents = [];
                        }
                        if (!parsedData.manualChangeLog) {
                            parsedData.manualChangeLog = [];
                        }
                        
                        // Seed January 2026 if needed
                        const needsJan2026Seeding = !parsedData.manualOverrides['nurse-1'] || 
                                                    !parsedData.manualOverrides['nurse-1']['2026-01-06'];
                        if (needsJan2026Seeding) {
                            parsedData.manualOverrides = mergeOverrides(parsedData.manualOverrides, JANUARY_2026_SHIFTS);
                        }
                        
                        // Migrar a Firebase
                        updateFirestore(parsedData);
                        console.log('✅ Datos migrados exitosamente a Firebase');
                        
                        // Limpiar localStorage después de migración exitosa
                        localStorage.removeItem(STORAGE_KEY);
                        console.log('🗑️ localStorage limpiado después de migración');
                    }
                } catch (error) {
                    console.error('❌ Error al migrar datos:', error);
                }
            }
            setMigrationDone(true);
        }
    }, [firestoreLoading, firestoreData, migrationDone, updateFirestore]);

    const updateData = useCallback((updates: Partial<AppState>) => {
        setData(prevData => {
            if (!prevData) return null;
            const newData = { ...prevData, ...updates };
            
            // Guardar en Firebase (esto activará la sincronización en tiempo real)
            console.log('💾 Guardando cambios en Firebase...');
            updateFirestore(newData);
            
            return newData;
        });
    }, [updateFirestore]);

    return { data, loading, updateData };
};