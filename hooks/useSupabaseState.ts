import { useState, useEffect, useCallback, useRef } from 'react';
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
    hours: {},
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
    const channelRef = useRef<any>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>();

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout | undefined;

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

            // Escuchar cambios en tiempo real usando BROADCAST (más confiable)
            console.log("👂 Configurando listener de cambios en tiempo real...");
            
            let isRealtimeWorking = false;
            
            channelRef.current = supabase
                .channel('app_state_changes', {
                    config: {
                        broadcast: { self: false },
                        presence: { key: '' }
                    }
                })
                // Escuchar postgres_changes como respaldo
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'app_state',
                        filter: 'id=eq.1'
                    },
                    (payload) => {
                        console.log("📡 [Real-time PostgreSQL] Cambio detectado");
                        isRealtimeWorking = true;
                        
                        if (payload.new && payload.new.data) {
                            const newData = payload.new.data as AppState;
                            setData(currentData => {
                                const currentStr = JSON.stringify(currentData);
                                const newStr = JSON.stringify(newData);
                                
                                if (currentStr !== newStr) {
                                    console.log("🔄 [Real-time] Actualizando estado local");
                                    const changedKeys = Object.keys(newData).filter(key => 
                                        JSON.stringify((currentData as any)?.[key]) !== JSON.stringify((newData as any)?.[key])
                                    );
                                    console.log("   Campos actualizados:", changedKeys.join(', '));
                                    return newData;
                                }
                                return currentData;
                            });
                        }
                    }
                )
                // También escuchar broadcast messages de otros clientes
                .on('broadcast', { event: 'state_update' }, (payload) => {
                    console.log("📡 [Broadcast] Mensaje recibido de otro cliente");
                    isRealtimeWorking = true;
                    
                    if (payload.payload && payload.payload.data) {
                        const newData = payload.payload.data as AppState;
                        setData(currentData => {
                            const currentStr = JSON.stringify(currentData);
                            const newStr = JSON.stringify(newData);
                            
                            if (currentStr !== newStr) {
                                console.log("🔄 [Broadcast] Actualizando estado local");
                                const changedKeys = Object.keys(newData).filter(key => 
                                    JSON.stringify((currentData as any)?.[key]) !== JSON.stringify((newData as any)?.[key])
                                );
                                console.log("   Campos actualizados:", changedKeys.join(', '));
                                return newData;
                            }
                            return currentData;
                        });
                    }
                })
                .subscribe((status, err) => {
                    console.log("📡 Estado del canal Real-time:", status);
                    
                    if (status === 'SUBSCRIBED') {
                        console.log("✅ Canal Real-time SUSCRITO exitosamente");
                        isRealtimeWorking = true;
                    } else if (status === 'CLOSED') {
                        console.warn("⚠️ Canal Real-time CERRADO");
                        isRealtimeWorking = false;
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error("❌ ERROR en canal Real-time:", err);
                        isRealtimeWorking = false;
                    } else if (status === 'TIMED_OUT') {
                        console.warn("⏱️ Canal Real-time TIMEOUT");
                        isRealtimeWorking = false;
                    }
                    
                    // Fallback: Si Real-time no funciona después de 2 segundos, usar polling agresivo
                    setTimeout(() => {
                        if (!isRealtimeWorking || status !== 'SUBSCRIBED') {
                            console.warn("⚠️ Real-time no funciona, activando POLLING cada 2 segundos...");
                            
                            pollingInterval = setInterval(async () => {
                                try {
                                    const { data: polledData, error } = await supabase
                                        .from('app_state')
                                        .select('data')
                                        .eq('id', 1)
                                        .single();
                                    
                                    if (!error && polledData?.data) {
                                        setData(currentData => {
                                            const currentStr = JSON.stringify(currentData);
                                            const newStr = JSON.stringify(polledData.data);
                                            
                                            if (currentStr !== newStr) {
                                                console.log("🔄 [Polling] Cambios detectados, actualizando...");
                                                return polledData.data as AppState;
                                            }
                                            return currentData;
                                        });
                                    }
                                } catch (e) {
                                    console.error("❌ Error en polling:", e);
                                }
                            }, 2000); // Polling cada 2 segundos (más agresivo que antes)
                            
                            pollingIntervalRef.current = pollingInterval;
                        }
                    }, 2000); // Esperar 2 segundos antes de activar polling
                });
        };

        initData();

        return () => {
            if (pollingInterval) {
                console.log("🔌 Deteniendo polling...");
                clearInterval(pollingInterval);
            }
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (channelRef.current) {
                console.log("🔌 Desconectando canal Real-time...");
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    const updateData = useCallback((updates: Partial<AppState>): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            setData(currentData => {
                const newData = { ...currentData, ...updates };
                if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
                    console.log("📝 Guardando cambios en Supabase...", Object.keys(updates));
                    
                    // Create timeout to detect if save is taking too long
                    const timeoutId = setTimeout(() => {
                        console.warn("⏱️ Guardado a Supabase tardando más de 5 segundos...");
                    }, 5000);
                    
                    // Persist to Supabase - wait for result before resolving
                    (async () => {
                        try {
                            const { error } = await supabase
                                .from('app_state')
                                .update({ data: newData })
                                .eq('id', 1);
                            
                            clearTimeout(timeoutId);
                            
                            if (error) {
                                console.error("❌ Error al guardar en Supabase:", error);
                                reject(new Error(error.message));
                            } else {
                                console.log("✅ Guardado exitoso en Supabase. Datos:", Object.keys(updates));
                                console.log("   Contenido guardado:", updates);
                                
                                // Enviar broadcast a otros clientes también
                                console.log("📡 Enviando notificación Broadcast a otros clientes...");
                                if (channelRef.current) {
                                    await supabase.channel('app_state_changes').send('broadcast', {
                                        event: 'state_update',
                                        data: newData
                                    });
                                } else {
                                    console.warn("⚠️ Canal no disponible para broadcast");
                                }
                                
                                resolve();
                            }
                        } catch (e) {
                            clearTimeout(timeoutId);
                            console.error("❌ Excepción al guardar:", e);
                            reject(e);
                        }
                    })();
                    
                    return newData;
                }
                console.log("📝 Datos sin cambios, no se guarda a Supabase");
                resolve();
                return currentData;
            });
        });
    }, []);

    return { data, loading, updateData };
};