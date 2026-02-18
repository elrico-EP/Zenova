import React, { useState, useEffect, useMemo } from 'react';
import type { Nurse, Schedule, WorkZone, ScheduleCell } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

const EDITABLE_SHIFTS: (WorkZone | 'DELETE')[] = [
    'URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE', 
    'ADMIN', 'TW', 'CA', 'SICK_LEAVE', 'FP', 'DELETE'
];

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    nurses: Nurse[];
    initialOverrides: Schedule;
    onSave: (updatedOverrides: Schedule) => void;
    months: number[];
}

const generateDates = (year: number, months: number[]): Date[] => {
    const dates: Date[] = [];
    months.sort((a,b) => a - b).forEach(month => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(Date.UTC(year, month, day)));
        }
    });
    return dates;
};

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, nurses, initialOverrides, onSave, months }) => {
    const t = useTranslations();
    const [editedOverrides, setEditedOverrides] = useState<Schedule>({});
    const [isLoading, setIsLoading] = useState(false);

    const year = 2026;
    const dates = useMemo(() => generateDates(year, months), [year, months]);

    useEffect(() => {
        if (isOpen) {
            const relevantOverrides: Schedule = {};
            nurses.forEach(nurse => {
                relevantOverrides[nurse.id] = {};
                dates.forEach(date => {
                    const dateKey = date.toISOString().split('T')[0];
                    if (initialOverrides[nurse.id]?.[dateKey]) {
                        relevantOverrides[nurse.id][dateKey] = initialOverrides[nurse.id][dateKey];
                    }
                });
            });
            setEditedOverrides(relevantOverrides);
        }
    }, [isOpen, initialOverrides, nurses, dates]);

    const handleShiftChange = (nurseId: string, dateKey: string, shift: WorkZone | 'DELETE' | '') => {
        setEditedOverrides(prev => {
            const newOverrides = JSON.parse(JSON.stringify(prev));
            if (!newOverrides[nurseId]) {
                newOverrides[nurseId] = {};
            }
            if (shift === '' || shift === 'DELETE') {
                delete newOverrides[nurseId][dateKey];
            } else {
                newOverrides[nurseId][dateKey] = shift;
            }
            return newOverrides;
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        // We only want to save changes for the selected months.
        const updatedOverridesForSelectedMonths: Schedule = {};
        const dateKeysForMonths = new Set(dates.map(d => d.toISOString().split('T')[0]));

        for (const nurseId in editedOverrides) {
            updatedOverridesForSelectedMonths[nurseId] = {};
            for (const dateKey in editedOverrides[nurseId]) {
                if (dateKeysForMonths.has(dateKey)) {
                     updatedOverridesForSelectedMonths[nurseId][dateKey] = editedOverrides[nurseId][dateKey];
                }
            }
        }

        await onSave(updatedOverridesForSelectedMonths);
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-7xl w-full relative transform transition-all flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between pb-4 border-b mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">{t['planner.edit_manual_selected_months']}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="overflow-auto flex-grow">
                    <table className="min-w-full text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-100 z-10">
                            <tr>
                                <th className="p-1 border text-left font-semibold text-slate-600 sticky left-0 bg-slate-100 w-24">Date</th>
                                {nurses.map(nurse => (
                                    <th key={nurse.id} className="p-1 border font-semibold text-slate-600 truncate min-w-[100px]">{nurse.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dates.map(date => {
                                const dateKey = date.toISOString().split('T')[0];
                                const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
                                return (
                                    <tr key={dateKey} className={isWeekend ? 'bg-slate-50' : ''}>
                                        <td className="p-1 border font-medium text-slate-700 sticky left-0 bg-white w-24">{date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', weekday: 'short' })}</td>
                                        {nurses.map(nurse => {
                                            const currentShift = editedOverrides[nurse.id]?.[dateKey] || '';
                                            return (
                                                <td key={nurse.id} className="border p-0">
                                                    <select
                                                        value={typeof currentShift === 'string' ? currentShift : ''} // Only handle simple strings
                                                        onChange={e => handleShiftChange(nurse.id, dateKey, e.target.value as WorkZone | 'DELETE' | '')}
                                                        className="w-full h-full p-1 border-0 bg-transparent focus:ring-1 focus:ring-zen-500 rounded-none"
                                                    >
                                                        <option value="">Auto</option>
                                                        {EDITABLE_SHIFTS.map(shiftId => {
                                                            const label = shiftId === 'DELETE' ? t.deleteShift : SHIFTS[shiftId]?.label || shiftId;
                                                            return <option key={shiftId} value={shiftId}>{label}</option>;
                                                        })}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </main>
                <footer className="pt-4 border-t mt-4 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">{t.cancel}</button>
                    <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700 disabled:opacity-50">{isLoading ? t.saving : t.saveChanges}</button>
                </footer>
            </div>
        </div>
    );
};