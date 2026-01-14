

import { useState, useEffect, useCallback } from 'react';
import type { Nurse, Agenda, Schedule, Notes, StrasbourgEvent, Wishes, HistoryEntry, ShiftRotation, ShiftRotationAssignment, JornadaLaboral, SpecialStrasbourgEvent, SwapInfo } from '../types';
import { INITIAL_NURSES } from '../constants';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026 } from '../data/agenda2026';

const STORAGE_KEY = 'zenova-schedule-data';

export interface AppState {
    nurses: Nurse[];
    agenda: Agenda;
    manualOverrides: Schedule;
    notes: Notes;
    vaccinationPeriod: { start: string; end: string } | null;
    strasbourgAssignments: Record<string, string[]>;
    strasbourgEvents: StrasbourgEvent[];
    specialStrasbourgEvents: SpecialStrasbourgEvent[];
    closedMonths: Record<string, boolean>;
    wishes: Wishes;
    history: HistoryEntry[];
    shiftRotations: ShiftRotation[];
    shiftRotationAssignments: ShiftRotationAssignment[];
    jornadasLaborales: JornadaLaboral[];
    visualSwaps: Record<string, Record<string, SwapInfo>>;
}

const getInitialState = (): AppState => ({
    nurses: INITIAL_NURSES,
    agenda: agenda2026Data,
    manualOverrides: {},
    notes: {},
    vaccinationPeriod: { start: '2026-10-15', end: '2026-11-30' },
    strasbourgAssignments: INITIAL_STRASBOURG_ASSIGNMENTS_2026,
    strasbourgEvents: [],
    specialStrasbourgEvents: [],
    closedMonths: {},
    wishes: {},
    history: [],
    shiftRotations: [],
    shiftRotationAssignments: [],
    jornadasLaborales: [],
    visualSwaps: {},
});

export const useSharedState = () => {
    const [data, setData] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                // Ensure new properties exist for migration
                if (!parsedData.shiftRotations) parsedData.shiftRotations = [];
                if (!parsedData.shiftRotationAssignments) parsedData.shiftRotationAssignments = [];
                if (!parsedData.jornadasLaborales) parsedData.jornadasLaborales = [];
                if (!parsedData.specialStrasbourgEvents) parsedData.specialStrasbourgEvents = [];
                if (!parsedData.visualSwaps) parsedData.visualSwaps = {};
                setData(parsedData);
            } else {
                const initialState = getInitialState();
                setData(initialState);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
            }
        } catch (error) {
            console.error("Failed to load state from localStorage:", error);
            setData(getInitialState());
        } finally {
            setLoading(false);
        }
    }, []);

    const updateData = useCallback((updates: Partial<AppState>) => {
        setData(prevData => {
            if (!prevData) return null;
            const newData = { ...prevData, ...updates };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            } catch (error) {
                console.error("Failed to save state to localStorage:", error);
            }
            return newData;
        });
    }, []);

    return { data, loading, updateData };
};