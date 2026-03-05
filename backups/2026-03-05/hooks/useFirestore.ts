
import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppState } from '../types';

/**
 * Hook genérico para sincronizar un documento de Firestore con el estado de React.
 */
export const useFirestore = <T extends object>(path: string, initialData: T) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);

    const docRef = useMemo(() => {
        const pathParts = path.split('/');
        return doc(db, pathParts[0], ...pathParts.slice(1));
    }, [path]);

    useEffect(() => {
        setLoading(true);
        // El listener de Firebase
        const unsubscribe = onSnapshot(docRef, 
            async (docSnap) => {
                if (docSnap.exists()) {
                    setData(docSnap.data() as T);
                } else {
                    console.log("Documento no encontrado. Sembrando datos iniciales...");
                    try {
                        await setDoc(docRef, initialData);
                        setData(initialData);
                    } catch (err) {
                        console.error("Error al sembrar datos iniciales:", err);
                    }
                }
                setLoading(false);
            }, 
            (error) => {
                console.error("Firestore onSnapshot error:", error);
                // IMPORTANTE: Si hay error (ej: permisos), liberamos el loading para no bloquear la UI
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [docRef, initialData]);

    const updateData = useCallback(async (updates: Partial<T>) => {
        try {
            await updateDoc(docRef, updates as any);
        } catch (error) {
            console.error("Error al actualizar Firestore:", error);
            throw error;
        }
    }, [docRef]);

    return { data, loading, updateData };
};