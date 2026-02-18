import { useState, useEffect, useCallback } from 'react';
// FIX: Import the supabase client
import { supabase } from '../firebase/supabase-config';
import type { AppState, JornadaLaboral } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

const INITIAL_JORNADAS: JornadaLaboral[] = [
  { id: 'j-tanja-1', nurseId: 'nurse-2', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 3 },
  { id: 'j-virginie-1', nurseId: 'nurse-3', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'LEAVE_EARLY_1H_L_J' },
  { id: 'j-paola-1', nurseId: 'nurse-4', porcentaje: 80, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'FULL_DAY_OFF', reductionDayOfWeek: 1 },
  { id: 'j-elena-1', nurseId: 'nurse-5', porcentaje: 80, fechaInicio: '2026-03-01', fechaFin: '2026-09-30', reductionOption: 'FRIDAY_PLUS_EXTRA', secondaryReductionDayOfWeek: 2 },
  { id: 'j-katelijn-1', nurseId: 'nurse-8', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-06-30', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 1 },
];

const JANUARY_2026_SHIFTS = {
    // ELVIO (nurse-1)
    'nurse-1': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
        '2026-01-12': 'ADMIN', '2026-01-13': 'ADMIN', '2026-01-14': 'ADMIN', '2026-01-15': 'ADMIN', '2026-01-16': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'ADMIN'
    },
    // TANJA (nurse-2)
    'nurse-2': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-14:00' },
        '2026-01-08': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-12': 'TRAVAIL_TARDE', '2026-01-13': 'URGENCES', '2026-01-14': 'URGENCES', '2026-01-15': 'TRAVAIL_TARDE', '2026-01-16': 'TRAVAIL_TARDE', '2026-01-19': 'URGENCES_TARDE', '2026-01-20': 'TRAVAIL_TARDE', '2026-01-21': 'URGENCES', '2026-01-22': 'TRAVAIL', '2026-01-23': 'TRAVAIL', '2026-01-26': 'URGENCES_TARDE', '2026-01-27': 'ADMIN', '2026-01-28': 'TRAVAIL', '2026-01-29': 'ADMIN', '2026-01-30': 'URGENCES'
    },
    // VIRGINIE (nurse-3)
    'nurse-3': {
        '2026-01-05': { custom: 'Adm (R)', type: 'ADMIN', time: '8:00-16:00' },
        '2026-01-06': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-07': { custom: 'Trav M (R)', type: 'TRAVAIL', time: '8:00-16:00' },
        '2026-01-08': { custom: 'TW (R)', type: 'TW', time: '8:00-16:00' },
        '2026-01-09': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
        '2026-01-12': 'URGENCES', '2026-01-13': 'ADMIN', '2026-01-14': 'TRAVAIL', '2026-01-15': 'URGENCES', '2026-01-16': 'URGENCES', '2026-01-19': 'URGENCES', '2026-01-20': 'URGENCES_TARDE', '2026-01-21': 'TRAVAIL', '2026-01-22': 'URGENCES', '2026-01-23': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'URGENCES'
    },
    // PAOLA (nurse-4)
    'nurse-4': {
        '2026-01-05': { custom: 'Reducción (80%)', type: 'CA' },
        '2026-01-06': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-07': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-12:30' },
    },
    // ELENA (nurse-5)
    'nurse-5': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-09': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
    // MIGUEL (nurse-6)
    'nurse-6': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-08': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Adm', type: 'ADMIN', time: '08:00-14:00' },
    },
    // GORKA (nurse-7)
    'nurse-7': {
        '2026-01-05': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-06': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Adm', type: 'ADMIN', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-09': { custom: 'Urg M', type: 'URGENCES', time: '08:00-14:00' },
    },
    // KATELIJN (nurse-8)
    'nurse-8': {
        '2026-01-05': { custom: 'Urg M (R)', type: 'URGENCES', time: '8:00-14:00' },
        '2026-01-06': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-07': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // JOSEPH (nurse-9)
    'nurse-9': {
        '2026-01-05': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-06': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-07': { custom: 'TW', type: 'TW', time: '8:00-17:00' },
        '2026-01-08': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-09': { custom: 'Trav M', type: 'TRAVAIL', time: '08:00-14:00' },
    },
    // TATIANA (nurse-10)
    'nurse-10': {
        '2026-01-05': { custom: 'Urg T', type: 'URGENCES_TARDE', time: '09:00-17:45' },
        '2026-01-06': { custom: 'Trav M', type: 'TRAVAIL', time: '8:00-17:00' },
        '2026-01-07': { custom: 'Trav T', type: 'TRAVAIL_TARDE', time: '09:00-17:45' },
        '2026-01-08': { custom: 'Urg M', type: 'URGENCES', time: '8:00-17:00' },
        '2026-01-09': { custom: 'TW', type: 'TW', time: '08:00-12:30' },
    },
    // BECARIO (nurse-11)
    'nurse-11': {
        '2026-01-05': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-06': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-07': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-08': { custom: 'CA', type: 'CA', time: '8:00-17:00' },
        '2026-01-09': { custom: 'CA', type: 'CA', time: '08:00-14:00' },
        '2026-01-12': 'TRAVAIL', '2026-01-13': 'TW', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': { custom: 'LIB', type: 'LIBERO', time: '10:00 - 16:00' }, '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'TRAVAIL_TARDE', '2026-01-23': 'TRAVAIL', '2026-01-26': 'TRAVAIL', '2026-01-27': 'URGENCES', '2026-01-28': 'TRAVAIL', '2026-01-29': 'TRAVAIL_TARDE', '2026-01-30': 'TRAVAIL'
    },
};

const FEBRUARY_2026_SHIFTS: any = {
    // Elvio (nurse-1)
    'nurse-1': {
        '2026-02-02': 'ADMIN', '2026-02-03': 'ADMIN', '2026-02-04': 'ADMIN', '2026-02-05': 'ADMIN', '2026-02-06': 'ADMIN',
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': 'URGENCES', '2026-02-17': 'URGENCES', '2026-02-18': 'ADMIN', '2026-02-19': 'URGENCES_TARDE', '2026-02-20': 'ADMIN',
        '2026-02-23': 'ADMIN', '2026-02-24': 'ADMIN', '2026-02-25': 'URGENCES', '2026-02-26': 'ADMIN', '2026-02-27': 'ADMIN',
    },
    // Tanja (nurse-2)
    'nurse-2': {
        '2026-02-02': 'TRAVAIL', '2026-02-03': 'URGENCES', '2026-02-04': 'URGENCES_TARDE', '2026-02-06': 'TRAVAIL',
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': 'TRAVAIL_TARDE', '2026-02-17': 'TRAVAIL', '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA',
        '2026-02-23': 'URGENCES', '2026-02-24': 'TRAVAIL_TARDE', '2026-02-25': 'TRAVAIL', '2026-02-26': 'ADMIN', '2026-02-27': 'TRAVAIL',
    },
    // Virginie (nurse-3)
    'nurse-3': {
        '2026-02-02': 'TRAVAIL_TARDE', '2026-02-03': 'TRAVAIL', '2026-02-04': { split: ['RECUP', 'ADMIN'] }, '2026-02-06': 'URGENCES',
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': 'URGENCES_TARDE', '2026-02-17': 'URGENCES', '2026-02-18': 'TRAVAIL', '2026-02-19': 'URGENCES', '2026-02-20': 'TRAVAIL',
        '2026-02-23': 'TRAVAIL', '2026-02-24': 'ADMIN', '2026-02-25': 'TRAVAIL', '2026-02-26': 'TW', '2026-02-27': 'ADMIN',
    },
    // Paola (nurse-4)
    'nurse-4': { 
        '2026-02-02': 'CA', '2026-02-03': 'TRAVAIL_TARDE', '2026-02-04': 'URGENCES', '2026-02-06': 'CA',
        '2026-02-09': 'CA', '2026-02-10': 'TRAVAIL', '2026-02-11': 'URGENCES_TARDE', '2026-02-12': 'SICK_LEAVE', '2026-02-13': 'SICK_LEAVE',
        '2026-02-16': 'CA', '2026-02-17': 'SICK_LEAVE', '2026-02-18': 'SICK_LEAVE', '2026-02-19': 'SICK_LEAVE', '2026-02-20': 'SICK_LEAVE',
        '2026-02-23': 'CA', '2026-02-24': 'URGENCES', '2026-02-25': 'TW', '2026-02-26': 'URGENCES', '2026-02-27': 'TRAVAIL',
    },
    // Elena (nurse-5)
    'nurse-5': {
        '2026-02-02': 'URGENCES_TARDE', '2026-02-03': 'FP', '2026-02-04': 'TW', '2026-02-06': 'TRAVAIL',
        '2026-02-09': { custom: 'Stage plaies', type: 'FP' }, '2026-02-10': 'URGENCES', '2026-02-11': { custom: 'Universidad', type: 'FP' }, '2026-02-12': { custom: 'Universidad', type: 'FP' }, '2026-02-13': { custom: 'Universidad', type: 'FP' },
        '2026-02-16': 'TRAVAIL', '2026-02-17': { custom: 'BLS', type: 'FP' }, '2026-02-18': 'URGENCES', '2026-02-19': 'TRAVAIL_TARDE', '2026-02-20': 'TRAVAIL',
        '2026-02-23': 'URGENCES', '2026-02-24': { custom: 'Stage plaies', type: 'FP' }, '2026-02-25': 'ADMIN', '2026-02-26': 'URGENCES', '2026-02-27': 'TW',
    },
    // Miguel (nurse-6)
    'nurse-6': {
        '2026-02-02': 'URGENCES', '2026-02-03': 'TRAVAIL', '2026-02-04': 'TRAVAIL', '2026-02-05': 'CS', '2026-02-06': 'TRAVAIL_TARDE',
        '2026-02-09': 'STRASBOURG', '2026-02-10': 'STRASBOURG', '2026-02-11': 'STRASBOURG', '2026-02-12': 'STRASBOURG',
        '2026-02-16': 'CA', '2026-02-17': 'CA', '2026-02-18': 'TRAVAIL', '2026-02-19': 'TW', '2026-02-20': 'URGENCES',
        '2026-02-23': 'URGENCES_TARDE', '2026-02-24': 'URGENCES', '2026-02-25': 'ADMIN', '2026-02-26': 'TRAVAIL', '2026-02-27': 'TW',
    },
    // Gorka (nurse-7)
    'nurse-7': {
        '2026-02-02': 'CA', '2026-02-03': 'ADMIN', '2026-02-04': 'URGENCES_TARDE', '2026-02-05': { custom: 'STR travel', type: 'ADMIN' }, '2026-02-06': { custom: 'Euroscola', type: 'STRASBOURG'},
        '2026-02-09': 'TRAVAIL_TARDE', '2026-02-10': 'TRAVAIL_TARDE', '2026-02-11': 'TRAVAIL_TARDE', '2026-02-12': 'URGENCES', '2026-02-13': { custom: 'Euroscola', type: 'STRASBOURG'},
        '2026-02-16': 'ADMIN', '2026-02-17': { custom: 'BLS', type: 'FP' }, '2026-02-18': 'URGENCES_TARDE', '2026-02-19': 'TW', '2026-02-20': 'URGENCES',
        '2026-02-23': 'TRAVAIL_TARDE', '2026-02-24': 'TW', '2026-02-25': 'ADMIN', '2026-02-26': 'TRAVAIL_TARDE', '2026-02-27': 'TRAVAIL',
    },
    // Katelijn (nurse-8)
    'nurse-8': {
        '2026-02-02': 'CA', '2026-02-03': 'CA', '2026-02-04': 'CA', '2026-02-05': 'TRAVAIL', '2026-02-06': 'URGENCES',
        '2026-02-09': 'TRAVAIL', '2026-02-10': 'CS', '2026-02-11': 'URGENCES_TARDE', '2026-02-12': 'URGENCES_TARDE', '2026-02-13': 'TRAVAIL',
        '2026-02-16': 'TW', '2026-02-17': { custom: 'BLS', type: 'FP' }, '2026-02-18': 'CA', '2026-02-19': 'CA', '2026-02-20': 'CA',
        '2026-02-23': 'RECUP', '2026-02-24': 'TRAVAIL', '2026-02-25': 'TRAVAIL_TARDE', '2026-02-26': 'URGENCES', '2026-02-27': 'URGENCES',
    },
    // Joseph (nurse-9)
    'nurse-9': {
        '2026-02-02': 'URGENCES', '2026-02-03': 'URGENCES_TARDE', '2026-02-04': 'TRAVAIL', '2026-02-06': 'ADMIN',
        '2026-02-09': 'URGENCES_TARDE', '2026-02-10': 'URGENCES', '2026-02-11': 'TRAVAIL', '2026-02-12': 'TRAVAIL', '2026-02-13': 'URGENCES',
        '2026-02-16': 'TRAVAIL', '2026-02-17': 'TRAVAIL', '2026-02-18': 'ADMIN', '2026-02-19': 'URGENCES', '2026-02-20': 'CA',
        '2026-02-23': 'TW', '2026-02-24': 'CS', '2026-02-25': 'ADMIN', '2026-02-26': 'TRAVAIL', '2026-02-27': 'URGENCES',
    },
    // Tatiana (nurse-10)
    'nurse-10': {
        '2026-02-02': 'URGENCES', '2026-02-03': 'URGENCES_TARDE', '2026-02-04': 'TRAVAIL', '2026-02-06': 'URGENCES_TARDE',
        '2026-02-09': 'TRAVAIL', '2026-02-10': 'URGENCES', '2026-02-11': 'TRAVAIL_TARDE', '2026-02-12': 'TRAVAIL', '2026-02-13': 'TRAVAIL',
        '2026-02-16': 'ADMIN', '2026-02-17': 'TRAVAIL', '2026-02-18': 'URGENCES_TARDE', '2026-02-19': 'CA', '2026-02-20': 'URGENCES',
        '2026-02-23': 'TRAVAIL_TARDE', '2026-02-24': 'TRAVAIL', '2026-02-25': 'TRAVAIL_TARDE', '2026-02-26': 'URGENCES', '2026-02-27': 'TRAVAIL',
    },
    // Becario (nurse-11)
    'nurse-11': {
        '2026-02-02': 'URGENCES', '2026-02-04': 'TRAVAIL', '2026-02-05': 'TRAVAIL', '2026-02-06': 'ADMIN',
        '2026-02-09': 'URGENCES_TARDE', '2026-02-10': 'URGENCES', '2026-02-11': 'TRAVAIL', '2026-02-12': 'TRAVAIL', '2026-02-13': 'TRAVAIL',
        '2026-02-16': 'TRAVAIL', '2026-02-17': 'TRAVAIL', '2026-02-18': 'ADMIN', '2026-02-19': 'URGENCES', '2026-02-20': 'CA',
        '2026-02-23': 'TW', '2026-02-24': 'ADMIN', '2026-02-25': 'ADMIN', '2026-02-26': 'TRAVAIL', '2026-02-27': 'URGENCES',
    }
};

const mergeSchedules = (...schedules: any[]) => {
    const merged: any = {};
    for (const schedule of schedules) {
        for (const nurseId in schedule) {
            if (!merged[nurseId]) {
                merged[nurseId] = {};
            }
            Object.assign(merged[nurseId], schedule[nurseId]);
        }
    }
    return merged;
};

const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: mergeSchedules(JANUARY_2026_SHIFTS, FEBRUARY_2026_SHIFTS),
    notes: {
        '2026-01-05': { text: 'No PS no VAs', color: 'bg-yellow-100' },
        '2026-01-15': { text: 'Training day', color: 'bg-blue-100' },
    },
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    jornadasLaborales: INITIAL_JORNADAS,
    manualChangeLog: [],
    manualHours: {},
});

export const useSupabaseState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let channel: any;

        const initData = async () => {
            console.log("🔥 Supabase: Cargando datos...");
            
            // Leer datos iniciales
            const { data: existingData, error } = await supabase
                .from('app_state')
                .select('data')
                .eq('id', 1)
                .single();

            if (error) {
                console.error("❌ Error al leer:", error);
                return;
            }

            if (!existingData?.data || Object.keys(existingData.data).length === 0) {
                console.log("💾 Inicializando datos...");
                const initialState = getInitialState();
                
                const { error: updateError } = await supabase
                    .from('app_state')
                    .update({ data: initialState })
                    .eq('id', 1);

                if (updateError) {
                    console.error("❌ Error al inicializar:", updateError);
                } else {
                    console.log("✅ Datos inicializados");
                    setData(initialState);
                }
            } else {
                console.log("✅ Datos cargados:", existingData.data);
                setData(existingData.data as AppState);
            }

            setLoading(false);

            // Escuchar cambios en tiempo real
            console.log("👂 Escuchando cambios en tiempo real...");
            channel = supabase
                .channel('app_state_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'app_state',
                        filter: 'id=eq.1'
                    },
                    (payload) => {
                        console.log("📡 Cambio detectado:", payload);
                        if (payload.new && payload.new.data) {
                            setData(payload.new.data as AppState);
                        }
                    }
                )
                .subscribe();
        };

        initData();

        return () => {
            if (channel) {
                console.log("🔌 Desconectando listener...");
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const updateData = useCallback(async (updates: Partial<AppState>) => {
        if (!data) return;

        const newData = { ...data, ...updates };
        console.log("💾 Guardando cambios...", updates);

        const { error } = await supabase
            .from('app_state')
            .update({ data: newData })
            .eq('id', 1);

        if (error) {
            console.error("❌ Error al guardar:", error);
        } else {
            console.log("✅ Guardado exitoso");
        }
    }, [data]);

    return { data, loading, updateData };
};