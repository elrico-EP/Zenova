
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface PersonalLogData {
    localData: Record<string, { startTime: string; endTime: string }>;
    comments: Record<string, string>;
    previousBalance?: string;
}

export const usePersonalLogs = (nurseId: string, monthKey: string) => {
    const [logs, setLogs] = useState<PersonalLogData>({ localData: {}, comments: {} });
    const [loading, setLoading] = useState(true);

    const docId = `${nurseId}_${monthKey}`;
    const docRef = doc(db, 'personalLogs', docId);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setLogs(snapshot.data() as PersonalLogData);
            } else {
                setLogs({ localData: {}, comments: {} });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [nurseId, monthKey]);

    const saveLogs = useCallback(async (updates: Partial<PersonalLogData>) => {
        try {
            const currentData = (await setDoc(docRef, updates, { merge: true }));
        } catch (error) {
            console.error("Error saving personal logs to Firestore:", error);
        }
    }, [docRef]);

    return { logs, loading, saveLogs };
};