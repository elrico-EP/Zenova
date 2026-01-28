import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook genérico para sincronizar cualquier tipo de datos con Firestore en tiempo real
 * @param path - Ruta del documento en Firestore (ej: 'sharedState/main')
 * @param initialData - Datos iniciales si el documento no existe
 */
export function useFirestore<T>(path: string, initialData: T) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        console.log(`🔌 Conectando a Firebase: ${path}`);
        const docRef = doc(db, path);

        // Suscribirse a cambios en tiempo real con onSnapshot
        const unsubscribe = onSnapshot(
            docRef,
            async (docSnap) => {
                if (docSnap.exists()) {
                    // Documento existe, cargar datos
                    console.log('✅ Datos sincronizados desde Firebase en tiempo real');
                    setData(docSnap.data() as T);
                    setLoading(false);
                } else {
                    // Documento no existe, crear con datos iniciales
                    console.log(`📝 Documento ${path} no existe. Creando con datos iniciales...`);
                    try {
                        await setDoc(docRef, initialData as any);
                        setData(initialData);
                        console.log('✅ Datos iniciales creados en Firebase');
                    } catch (err) {
                        console.error('❌ Error creando documento inicial:', err);
                        setError(err as Error);
                    }
                    setLoading(false);
                }
            },
            (err) => {
                console.error('❌ Error en sincronización en tiempo real:', err);
                console.error('Detalles del error:', err.message);
                setError(err);
                setLoading(false);
            }
        );

        // Cleanup: cancelar suscripción cuando el componente se desmonte
        return () => {
            console.log(`🔌 Desconectando de Firebase: ${path}`);
            unsubscribe();
        };
    }, [path]); // Solo re-suscribir si cambia la ruta

    const updateData = async (updates: Partial<T> | T) => {
        const docRef = doc(db, path);
        console.log('📤 Guardando cambios en Firebase...');
        console.log('📍 Path:', path);
        console.log('🔑 DB object:', db ? 'OK' : 'UNDEFINED');
        console.log('📦 Updates size:', JSON.stringify(updates).length, 'chars');
        
        try {
            // Usar setDoc con merge para actualizar campos sin borrar el resto
            const result = await setDoc(docRef, updates as any, { merge: true });
            console.log('✅ Cambios guardados exitosamente en Firebase');
            console.log('📊 Result:', result);
        } catch (err: any) {
            console.error('❌ ERROR COMPLETO:', err);
            console.error('❌ Código de error:', err.code);
            console.error('❌ Mensaje:', err.message);
            console.error('❌ Stack:', err.stack);
            setError(err as Error);
            throw err; // Re-lanzar para que el componente pueda manejarlo
        }
    };

    return { data, loading, error, updateData };
}
