
import React, { useState, useEffect, useMemo } from 'react';
import type { Nurse, Schedule, Agenda, ScheduleCell, ManualChangePayload, WorkZone, ChangeScope, Hours, PersonalHoursChangePayload, TimeSegment, CustomShift } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { Locale } from '../translations/locales';
import { getShiftsFromCell } from '../utils/scheduleUtils';

// New, complete list of shifts as requested by the user
const editableShifts: (WorkZone)[] = [
    'URGENCES', 'URGENCES_TARDE', 'TRAVAIL', 'TRAVAIL_TARDE', 'ADMIN', 'TW', 
    'STRASBOURG', 'LIBERO', 'RECUP', 'FP', 'SICK_LEAVE', 'CA', 'VACCIN_AM', 'VACCIN_PM'
];

interface ManualChangeModalProps {
  nurses: Nurse[];
  schedule: Schedule;
  agenda: Agenda;
  hours: Hours;
  onManualChange: (payload: ManualChangePayload) => Promise<void>;
  onSwapShifts: (payload: { nurse1Id: string, nurse2Id: string, startDate: string, endDate: string }) => Promise<void>;
  onSetPersonalHours: (payload: PersonalHoursChangePayload) => Promise<void>;
  initialNurseId: string | null;
  initialDateKey: string | null;
}

export const ManualChangeModal: React.FC<ManualChangeModalProps> = ({ nurses, schedule, onManualChange, initialNurseId, initialDateKey }) => {
    const t = useTranslations();
    const { user } = useUser();
    
    // State for the new form structure
    const [selectedNurseId, setSelectedNurseId] = useState<string>('');
    const [selectedShift, setSelectedShift] = useState<WorkZone>('TRAVAIL');
    const [startTime1, setStartTime1] = useState('');
    const [endTime1, setEndTime1] = useState('');
    const [note1, setNote1] = useState('');
    const [startTime2, setStartTime2] = useState('');
    const [endTime2, setEndTime2] = useState('');
    const [note2, setNote2] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSelectedNurseId(initialNurseId || '');
        setStartDate(initialDateKey || '');
        setEndDate(initialDateKey || '');

        if (initialNurseId && initialDateKey) {
            const existingCell = schedule[initialNurseId]?.[initialDateKey];
            const shifts = getShiftsFromCell(existingCell);
            setSelectedShift(shifts.length > 0 ? shifts[0] : 'TRAVAIL');

            if (typeof existingCell === 'object' && 'time' in existingCell && existingCell.time) {
                const [start, end] = existingCell.time.split(' - ');
                setStartTime1(start || '');
                setEndTime1(end || '');
            } else {
                setStartTime1('');
                setEndTime1('');
            }
            setStartTime2('');
            setEndTime2('');
            setNote1('');
            setNote2('');

        }
         setError('');
    }, [initialNurseId, initialDateKey, schedule]);

    const resetForm = () => {
        setSelectedNurseId('');
        setSelectedShift('TRAVAIL');
        setStartTime1('');
        setEndTime1('');
        setNote1('');
        setStartTime2('');
        setEndTime2('');
        setNote2('');
        setStartDate('');
        setEndDate('');
        setError('');
    };

    const handleSubmit = async () => {
        if (!selectedNurseId) { setError("Debes seleccionar un enfermero/a."); return; }
        if (!startDate || !endDate) { setError("Debes seleccionar un rango de fechas."); return; }

        setError('');
        setIsLoading(true);

        let shiftPayload: ScheduleCell;
        const shiftInfo = SHIFTS[selectedShift];
        
        const isCustomTime = startTime1 && endTime1;
        const hasNotes = note1 || (startTime2 && endTime2) || note2;

        if (isCustomTime || hasNotes) {
            let customLabel = isCustomTime ? `${shiftInfo.label} (H)` : shiftInfo.label;
            const allNotes: string[] = [];
            if (note1) allNotes.push(note1);
            if (startTime2 && endTime2) allNotes.push(`Interrupción: ${startTime2} - ${endTime2}`);
            if (note2) allNotes.push(note2);

            if (allNotes.length > 0) {
                customLabel += `\n${allNotes.join(' | ')}`;
            }

            shiftPayload = {
                custom: customLabel,
                type: selectedShift,
                time: isCustomTime ? `${startTime1} - ${endTime1}` : undefined
            };
        } else {
            shiftPayload = selectedShift;
        }

        await onManualChange({ 
            nurseIds: [selectedNurseId], 
            shift: shiftPayload, 
            startDate, 
            endDate, 
            scope: 'single' 
        });

        setIsLoading(false);
        resetForm();
    };
    
    if (user?.role !== 'admin') return null;

  return (
    <div className="flex flex-col">
        <main className="overflow-y-auto flex-grow">
            <div className="space-y-6">
                
                <section>
                    <label htmlFor="nurse-select" className="block text-sm font-semibold text-gray-800 mb-2">1. Seleccionar enfermero</label>
                    <select id="nurse-select" value={selectedNurseId} onChange={e => setSelectedNurseId(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-zen-500 focus:border-zen-500">
                        <option value="" disabled>Selecciona un/a enfermero/a...</option>
                        {nurses.map(nurse => (
                            <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                        ))}
                    </select>
                </section>

                <section>
                    <label htmlFor="shift-select" className="block text-sm font-semibold text-gray-800 mb-2">2. Seleccionar turno o incidencia</label>
                    <select id="shift-select" value={selectedShift} onChange={e => setSelectedShift(e.target.value as WorkZone)} className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-zen-500 focus:border-zen-500">
                        {editableShifts.map(shiftId => {
                            const shiftInfo = SHIFTS[shiftId];
                            return <option key={shiftId} value={shiftId}>{shiftInfo.label} - {t[shiftInfo.description as keyof Locale] as string}</option>
                        })}
                    </select>
                </section>
                
                <section>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">3. Horario principal</label>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label htmlFor="start-time-1" className="text-xs text-gray-600">Hora Inicio</label>
                            <input type="time" id="start-time-1" value={startTime1} onChange={e => setStartTime1(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="end-time-1" className="text-xs text-gray-600">Hora Fin</label>
                            <input type="time" id="end-time-1" value={endTime1} onChange={e => setEndTime1(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
                        </div>
                    </div>
                    <div className="mt-2">
                        <label htmlFor="note-1" className="text-xs text-gray-600">Notas (ajuste de jornada)</label>
                        <textarea id="note-1" value={note1} onChange={e => setNote1(e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"></textarea>
                    </div>
                </section>

                <section>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">4. Ausencia / interrupción intermedia (opcional)</label>
                     <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label htmlFor="start-time-2" className="text-xs text-gray-600">Hora Inicio</label>
                            <input type="time" id="start-time-2" value={startTime2} onChange={e => setStartTime2(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="end-time-2" className="text-xs text-gray-600">Hora Fin</label>
                            <input type="time" id="end-time-2" value={endTime2} onChange={e => setEndTime2(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
                        </div>
                    </div>
                    <div className="mt-2">
                        <label htmlFor="note-2" className="text-xs text-gray-600">Notas (interrupción / ausencia intermedia)</label>
                        <textarea id="note-2" value={note2} onChange={e => setNote2(e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"></textarea>
                    </div>
                </section>

                <section>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">5. Rango de fechas</label>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="start-date" className="text-xs text-gray-600">{t.startDate}</label>
                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="end-date" className="text-xs text-gray-600">{t.endDate}</label>
                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
                        </div>
                    </div>
                </section>
                
                {error && <p className="text-sm text-red-600 p-2 bg-red-100 rounded-md">{error}</p>}
                
            </div>
        </main>
        
        <footer className="p-4 bg-white border-t flex-shrink-0">
             <button onClick={handleSubmit} disabled={isLoading} className="w-full px-4 py-3 bg-zen-800 text-white font-bold rounded-md hover:bg-zen-700 disabled:bg-zen-500 transition-colors">
                {isLoading ? 'Aplicando...' : 'Aplicar cambios'}
            </button>
        </footer>
      </div>
  );
};
