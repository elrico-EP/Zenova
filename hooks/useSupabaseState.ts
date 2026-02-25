import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../firebase/supabase-config';
import type { AppState } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

const INITIAL_JORNADAS: any[] = [
  { id: 'j-tanja-1', nurseId: 'nurse-2', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 3 },
  { id: 'j-virginie-1', nurseId: 'nurse-3', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'LEAVE_EARLY_1H_L_J' },
  { id: 'j-paola-1', nurseId: 'nurse-4', porcentaje: 80, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', reductionOption: 'FULL_DAY_OFF', reductionDayOfWeek: 1 },
  { id: 'j-elena-1', nurseId: 'nurse-5', porcentaje: 80, fechaInicio: '2026-03-01', fechaFin: '2026-09-30', reductionOption: 'FRIDAY_PLUS_EXTRA', secondaryReductionDayOfWeek: 2 },
  { id: 'j-katelijn-1', nurseId: 'nurse-8', porcentaje: 90, fechaInicio: '2026-01-01', fechaFin: '2026-06-30', reductionOption: 'END_SHIFT_4H', reductionDayOfWeek: 1 },
];

const JANUARY_2026_SHIFTS: any = {
    'nurse-1':  { '2026-01-06': 'ADMIN', '2026-01-07': 'ADMIN', '2026-01-08': 'ADMIN', '2026-01-09': 'ADMIN', '2026-01-12': 'ADMIN', '2026-01-13': 'ADMIN', '2026-01-14': 'ADMIN', '2026-01-15': 'ADMIN', '2026-01-16': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'ADMIN' },
    'nurse-2':  { '2026-01-07': 'URGENCES', '2026-01-08': 'ADMIN', '2026-01-09': 'URGENCES', '2026-01-12': 'TRAVAIL_TARDE', '2026-01-13': 'URGENCES', '2026-01-14': 'URGENCES', '2026-01-15': 'TRAVAIL_TARDE', '2026-01-16': 'TRAVAIL_TARDE', '2026-01-19': 'URGENCES_TARDE', '2026-01-20': 'TRAVAIL_TARDE', '2026-01-21': 'URGENCES', '2026-01-22': 'TRAVAIL', '2026-01-23': 'TRAVAIL', '2026-01-26': 'URGENCES_TARDE', '2026-01-27': 'ADMIN', '2026-01-28': 'TRAVAIL', '2026-01-29': 'ADMIN', '2026-01-30': 'URGENCES' },
    'nurse-3':  { '2026-01-05': 'ADMIN', '2026-01-06': 'TRAVAIL', '2026-01-07': 'TRAVAIL', '2026-01-08': 'TW', '2026-01-09': 'URGENCES', '2026-01-12': 'URGENCES', '2026-01-13': 'ADMIN', '2026-01-14': 'TRAVAIL', '2026-01-15': 'URGENCES', '2026-01-16': 'URGENCES', '2026-01-19': 'URGENCES', '2026-01-20': 'URGENCES_TARDE', '2026-01-21': 'TRAVAIL', '2026-01-22': 'URGENCES', '2026-01-23': 'ADMIN', '2026-01-26': 'ADMIN', '2026-01-27': 'ADMIN', '2026-01-30': 'URGENCES' },
    'nurse-11': { '2026-01-12': 'TRAVAIL', '2026-01-13': 'TW', '2026-01-14': 'URGENCES', '2026-01-15': 'ADMIN', '2026-01-16': { custom: 'LIB', type: 'LIBERO', time: '10:00 - 16:00' }, '2026-01-19': 'STRASBOURG', '2026-01-20': 'STRASBOURG', '2026-01-21': 'STRASBOURG', '2026-01-22': 'TRAVAIL_TARDE', '2026-01-23': 'TRAVAIL', '2026-01-26': 'TRAVAIL', '2026-01-27': 'URGENCES', '2026-01-28': 'TRAVAIL', '2026-01-29': 'TRAVAIL_TARDE', '2026-01-30': 'TRAVAIL' },
};

const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: JANUARY_2026_SHIFTS,
    notes: {
        '2026-01-05': { text: 'No PS no VAs', color: 'bg-yellow-100' },
    },
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: { '2026-00': true, '2026-01': true }, // January and February 2026
    wishes: {},
    jornadasLaborales: INITIAL_JORNADAS,
    manualChangeLog: [],
    specialStrasbourgEventsLog: [],
});

export const useSupabaseState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let channel: any;

        const initData = async () => {
            console.log("🔥 Supabase: Cargando datos...");
            
            try {
                // Leer datos iniciales
                const { data: existingData, error } = await supabase
                    .from('app_state')
                    .select('data')
                    .eq('id', 1)
                    .single();

                if (error) {
                    console.error("❌ Error al leer app_state:", error);
                    
                    // Si el error es que no existe la fila, intentamos crearla
                    if (error.code === 'PGRST116' || error.message?.includes('JSON object requested, but 0 rows were returned')) {
                        console.log("💾 Fila no encontrada, intentando inicializar...");
                        const initialState = getInitialState();
                        const { error: insertError } = await supabase
                            .from('app_state')
                            .insert([{ id: 1, data: initialState }]);
                        
                        if (insertError) {
                            console.error("❌ Error al insertar fila inicial:", insertError);
                        } else {
                            setData(initialState);
                        }
                    }
                } else if (!existingData?.data || Object.keys(existingData.data).length === 0) {
                    console.log("💾 Datos vacíos, inicializando...");
                    const initialState = getInitialState();
                    
                    const { error: updateError } = await supabase
                        .from('app_state')
                        .update({ data: initialState })
                        .eq('id', 1);

                    if (updateError) {
                        console.error("❌ Error al inicializar datos vacíos:", updateError);
                    } else {
                        console.log("✅ Datos inicializados");
                        setData(initialState);
                    }
                } else {
                    console.log("✅ Datos cargados:", existingData.data);
                    let loadedData = existingData.data as AppState;
                    
                    // RECOVERY LOGIC: Ensure 2026 agenda and closed months are present if they were "lost"
                    let needsPatch = false;
                    if (!loadedData.agenda || Object.keys(loadedData.agenda).length < 10) {
                        console.log("🩹 Patching missing agenda...");
                        loadedData.agenda = { ...agenda2026Data, ...(loadedData.agenda || {}) };
                        needsPatch = true;
                    }
                    if (!loadedData.closedMonths || Object.keys(loadedData.closedMonths).length === 0) {
                        console.log("🩹 Patching missing closed months...");
                        loadedData.closedMonths = { '2026-00': true, '2026-01': true };
                        needsPatch = true;
                    }
                    
                    if (needsPatch) {
                        await supabase.from('app_state').update({ data: loadedData }).eq('id', 1);
                    }
                    
                    setData(loadedData);
                }
            } catch (err) {
                console.error("❌ Error inesperado en initData:", err);
            } finally {
                setLoading(false);
            }

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
                            setData(currentData => {
                                if (JSON.stringify(currentData) !== JSON.stringify(payload.new.data)) {
                                    return payload.new.data as AppState;
                                }
                                return currentData;
                            });
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

    const updateData = useCallback((updates: Partial<AppState>) => {
        // Use functional update for setData to get the latest state without 'data' in dependency array
        setData(currentData => {
            const newData = { ...currentData, ...updates };
            if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
                // Perform optimistic update
                // Then, persist to Supabase
                supabase
                    .from('app_state')
                    .update({ data: newData })
                    .eq('id', 1)
                    .then(({ error }) => {
                        if (error) {
                            console.error("❌ Error al guardar:", error);
                            // Revert optimistic update if there's an error, or let real-time listener handle it
                        } else {
                            console.log("✅ Guardado exitoso");
                        }
                    });
                return newData;
            }
            return currentData;
        });
    }, []);

    return { data, loading, updateData };
};