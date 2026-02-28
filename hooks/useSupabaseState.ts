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
    closedMonths: { '2026-00': true, '2026-01': true },
    wishes: {},
    jornadasLaborales: INITIAL_JORNADAS,
    manualChangeLog: [],
    specialStrasbourgEventsLog: [],
    updatedAt: Date.now(),
});

export const useSupabaseState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<any>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>();
    const lastRealtimeEventRef = useRef<number>(0);
    const lastLocalSaveRef = useRef<number>(0);
    const isSavingRef = useRef<boolean>(false);

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout | undefined;

        const initData = async () => {
            console.log("🔥 Supabase: Cargando datos...");
            
            try {
                const { data: existingData, error } = await supabase
                    .from('app_state')
                    .select('data')
                    .eq('id', 1)
                    .single();

                if (error) {
                    console.error("❌ Error al leer app_state:", error);
                    
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
                    console.log("✅ Datos cargados");
                    let loadedData = existingData.data as AppState;
                    
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
                    if (!loadedData.updatedAt) {
                        loadedData.updatedAt = Date.now();
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

            console.log("👂 Configurando listener de cambios en tiempo real...");
            
            let isRealtimeWorking = false;
            
            channelRef.current = supabase
                .channel('app_state_changes', {
                    config: {
                        broadcast: { self: false },
                        presence: { key: '' }
                    }
                })
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
                        lastRealtimeEventRef.current = Date.now();
                        
                        if (payload.new && payload.new.data) {
                            const newData = payload.new.data as AppState;
                            setData(currentData => {
                                if (!currentData) return newData;
                                
                                const currentVersion = currentData.updatedAt ?? 0;
                                const newVersion = newData.updatedAt ?? 0;

                                if (newVersion < currentVersion) {
                                    console.warn("⏭️ [Real-time] Ignorando actualización antigua");
                                    return currentData;
                                }

                                if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
                                    console.log("🔄 [Real-time] Actualizando estado local");
                                    return newData;
                                }
                                return currentData;
                            });
                        }
                    }
                )
                .on('broadcast', { event: 'state_update' }, (payload) => {
                    console.log("📡 [Broadcast] Mensaje recibido");
                    isRealtimeWorking = true;
                    lastRealtimeEventRef.current = Date.now();
                    
                    if (payload.payload && (payload.payload as any).data) {
                        const newData = (payload.payload as any).data as AppState;
                        setData(currentData => {
                            if (!currentData) return newData;
                            
                            const currentVersion = currentData.updatedAt ?? 0;
                            const newVersion = newData.updatedAt ?? 0;

                            if (newVersion < currentVersion) {
                                console.warn("⏭️ [Broadcast] Ignorando actualización antigua");
                                return currentData;
                            }

                            if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
                                console.log("🔄 [Broadcast] Actualizando estado local");
                                return newData;
                            }
                            return currentData;
                        });
                    }
                })
                .subscribe((status, err) => {
                    console.log("📡 Estado del canal Real-time:", status);
                    
                    if (status === 'SUBSCRIBED') {
                        console.log("✅ Canal Real-time SUSCRITO");
                        isRealtimeWorking = true;
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error("❌ ERROR en canal Real-time:", err);
                        isRealtimeWorking = false;
                    }
                    
                    setTimeout(() => {
                        const now = Date.now();
                        const lastEvent = lastRealtimeEventRef.current;
                        const noRealtimeEvents = !lastEvent || now - lastEvent > 5000;

                        if ((!isRealtimeWorking || status !== 'SUBSCRIBED' || noRealtimeEvents) && !pollingIntervalRef.current) {
                            console.warn("⚠️ Activando POLLING cada 5 segundos...");
                            
                            pollingInterval = setInterval(async () => {
                                try {
                                    if (isSavingRef.current) {
                                        console.log("⏸️ [Polling] Guardado en progreso, saltando...");
                                        return;
                                    }

                                    const timeSinceLastSave = Date.now() - lastLocalSaveRef.current;
                                    if (timeSinceLastSave < 5000) {
                                        console.log(`⏸️ [Polling] Esperando después de guardado (${Math.round(timeSinceLastSave/1000)}s)`);
                                        return;
                                    }

                                    const { data: polledData, error } = await supabase
                                        .from('app_state')
                                        .select('data')
                                        .eq('id', 1)
                                        .single();
                                    
                                    if (error || !polledData?.data) return;

                                    const remoteData = polledData.data as AppState;
                                    const remoteVersion = remoteData.updatedAt || 0;
                                    
                                    setData(currentData => {
                                        if (!currentData) return remoteData;
                                        
                                        const localVersion = currentData.updatedAt || 0;
                                        
                                        if (remoteVersion > localVersion) {
                                            console.log(`🔄 [Polling] Remoto (${remoteVersion}) > Local (${localVersion})`);
                                            return remoteData;
                                        } else if (remoteVersion === localVersion) {
                                            return currentData;
                                        } else {
                                            console.log(`⏭️ [Polling] Local más reciente, ignorando`);
                                            return currentData;
                                        }
                                    });
                                } catch (e) {
                                    console.error("❌ Error en polling:", e);
                                }
                            }, 5000);
                            
                            pollingIntervalRef.current = pollingInterval;
                        }
                    }, 5000);
                });
        };

        initData();

        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, []);

    const updateData = useCallback((updates: Partial<AppState>): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            setData(currentData => {
                if (!currentData) {
                    console.warn("⚠️ Estado no disponible");
                    resolve();
                    return currentData;
                }

                const now = Date.now();
                const newData = { 
                    ...currentData, 
                    ...updates, 
                    updatedAt: now,
                    manualOverrides: updates.manualOverrides ?? currentData.manualOverrides ?? {},
                    specialStrasbourgEvents: updates.specialStrasbourgEvents ?? currentData.specialStrasbourgEvents ?? [],
                    specialStrasbourgEventsLog: updates.specialStrasbourgEventsLog ?? currentData.specialStrasbourgEventsLog ?? []
                };
                
                const hasChanges = JSON.stringify(currentData) !== JSON.stringify(newData);
                
                if (hasChanges) {
                    console.log("📝 Guardando cambios...", Object.keys(updates));
                    lastLocalSaveRef.current = now;
                    isSavingRef.current = true;
                    
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = undefined;
                        console.log("⏸️ Polling pausado");
                    }
                    
                    (async () => {
                        try {
                            const { error } = await supabase
                                .from('app_state')
                                .update({ data: newData })
                                .eq('id', 1);
                            
                            if (error) {
                                console.error("❌ Error al guardar:", error);
                                isSavingRef.current = false;
                                reject(error);
                            } else {
                                console.log("✅ Guardado exitoso. Timestamp:", now);
                                
                                if (channelRef.current) {
                                    await channelRef.current.send({
                                        type: 'broadcast',
                                        event: 'state_update',
                                        payload: { data: newData, timestamp: now }
                                    });
                                }
                                
                                setTimeout(() => {
                                    isSavingRef.current = false;
                                    console.log("▶️ Guardado completado");
                                }, 1000);
                                
                                resolve();
                            }
                        } catch (e) {
                            isSavingRef.current = false;
                            console.error("❌ Error:", e);
                            reject(e);
                        }
                    })();
                    
                    return newData;
                }
                
                resolve();
                return currentData;
            });
        });
    }, []);

    return { data, loading, updateData };
};

