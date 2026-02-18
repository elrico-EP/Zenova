import React, { useState, useEffect, useMemo } from 'react';
import type { Nurse, Schedule, Agenda, ScheduleCell, ManualChangePayload, WorkZone, ChangeScope, Hours, PersonalHoursChangePayload, TimeSegment, CustomShift } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { Locale } from '../translations/locales';
import { getShiftsFromCell } from '../utils/scheduleUtils';

const absenceShifts = new Set<WorkZone>(['CA', 'SICK_LEAVE', 'FP', 'CS', 'RECUP']);

const shiftGroups: { group: string, main: WorkZone, subs: WorkZone[] }[] = [
    { group: 'Urgencias', main: 'URGENCES', subs: ['URGENCES_TARDE'] },
    { group: 'Trabajo', main: 'TRAVAIL', subs: ['TRAVAIL_TARDE'] },
    { group: 'Admin', main: 'ADMIN', subs: ['ADMIN_TARDE'] },
    { group: 'Teletrabajo', main: 'TW', subs: ['TW_ABROAD'] },
    { group: 'Ausencias', main: 'CA', subs: ['CS', 'SICK_LEAVE', 'RECUP'] },
    { group: 'Formación', main: 'FP', subs: [] },
    { group: 'Sesión', main: 'STRASBOURG', subs: ['LIBERO'] },
];

const splitShiftOptions = ['CUSTOM', ...Object.keys(SHIFTS).filter(s => !['DELETE'].includes(s))] as ('CUSTOM' | WorkZone)[];


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
  vaccinationPeriod: { start: string; end: string } | null;
}

export const ManualChangeModal: React.FC<ManualChangeModalProps> = ({ nurses, schedule, onManualChange, initialNurseId, initialDateKey, vaccinationPeriod }) => {
    const t = useTranslations();
    const { user } = useUser();
    
    // State for the new form structure
    const [isManualSplit, setIsManualSplit] = useState(false);
    const [selectedNurseId, setSelectedNurseId] = useState<string>('');
    const [selectedShift, setSelectedShift] = useState<WorkZone | 'DELETE'>('TRAVAIL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State for manual split
    const [morningShift, setMorningShift] = useState<WorkZone | 'CUSTOM'>('TRAVAIL');
    const [morningCustom, setMorningCustom] = useState('');
    const [morningStart, setMorningStart] = useState('');
    const [morningEnd, setMorningEnd] = useState('');
    const [afternoonShift, setAfternoonShift] = useState<WorkZone | 'CUSTOM'>('TRAVAIL_TARDE');
    const [afternoonCustom, setAfternoonCustom] = useState('');
    const [afternoonStart, setAfternoonStart] = useState('');
    const [afternoonEnd, setAfternoonEnd] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSelectedNurseId(initialNurseId || '');
        setStartDate(initialDateKey || '');
        setEndDate(initialDateKey || '');
        setIsManualSplit(false);

        if (initialNurseId && initialDateKey) {
            const existingCell = schedule[initialNurseId]?.[initialDateKey];
            const shifts = getShiftsFromCell(existingCell);
            setSelectedShift(shifts.length > 0 ? shifts[0] : 'TRAVAIL');
        }
        
        setMorningShift('TRAVAIL');
        setMorningStart('');
        setMorningEnd('');
        setAfternoonShift('TRAVAIL_TARDE');
        setAfternoonStart('');
        setAfternoonEnd('');
        setError('');
    }, [initialNurseId, initialDateKey, schedule]);
    
    useEffect(() => {
        if(isManualSplit) {
            setSelectedShift('TRAVAIL');
        } else {
            setMorningStart(''); setMorningEnd('');
            setAfternoonStart(''); setAfternoonEnd('');
        }
    }, [isManualSplit]);

    const resetForm = () => {
        setSelectedNurseId(''); setSelectedShift('TRAVAIL');
        setStartDate(''); setEndDate(''); setError('');
        setIsManualSplit(false); setMorningShift('TRAVAIL');
        setMorningCustom(''); setMorningStart(''); setMorningEnd('');
        setAfternoonShift('TRAVAIL_TARDE'); setAfternoonCustom('');
        setAfternoonStart(''); setAfternoonEnd('');
    };

    const handleSubmit = async () => {
        if (!selectedNurseId) { setError(t.error_selectNurse); return; }
        if (!startDate || !endDate) { setError(t.error_selectDateRange); return; }

        setError(''); setIsLoading(true);

        let shiftPayload: ScheduleCell | 'DELETE';

        if (isManualSplit) {
             let part1: WorkZone | CustomShift;
             if (morningShift === 'CUSTOM') {
                 if (!morningCustom.trim()) { setError(t.error_morningCustomEmpty); setIsLoading(false); return; }
                 part1 = { custom: morningCustom.trim(), time: (morningStart && morningEnd) ? `${morningStart} - ${morningEnd}` : undefined, manualSplit: true };
             } else {
                 const isMorningWork = !absenceShifts.has(morningShift);
                 if (isMorningWork && (!morningStart || !morningEnd)) { setError(t.error_morningTimeRequired); setIsLoading(false); return; }
                 part1 = isMorningWork ? { custom: SHIFTS[morningShift].label, type: morningShift, time: `${morningStart} - ${morningEnd}`, manualSplit: true } : morningShift;
             }

             let part2: WorkZone | CustomShift;
             if (afternoonShift === 'CUSTOM') {
                 if (!afternoonCustom.trim()) { setError(t.error_afternoonCustomEmpty); setIsLoading(false); return; }
                 part2 = { custom: afternoonCustom.trim(), time: (afternoonStart && afternoonEnd) ? `${afternoonStart} - ${afternoonEnd}` : undefined, manualSplit: true };
             } else {
                 const isAfternoonWork = !absenceShifts.has(afternoonShift);
                 if (isAfternoonWork && (!afternoonStart || !afternoonEnd)) { setError(t.error_afternoonTimeRequired); setIsLoading(false); return; }
                 part2 = isAfternoonWork ? { custom: SHIFTS[afternoonShift].label, type: afternoonShift, time: `${afternoonStart} - ${afternoonEnd}`, manualSplit: true } : afternoonShift;
             }
             
            shiftPayload = { split: [part1, part2] };

        } else if (selectedShift === 'DELETE') {
            shiftPayload = 'DELETE';
        } else {
             shiftPayload = selectedShift as WorkZone;
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
                    <label htmlFor="nurse-select" className="block text-sm font-semibold text-gray-800 mb-2">{t.step1_nurses}</label>
                    <select id="nurse-select" value={selectedNurseId} onChange={e => setSelectedNurseId(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-zen-500 focus:border-zen-500">
                        <option value="" disabled>{t.selectNursePrompt}</option>
                        {nurses.map(nurse => (
                            <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                        ))}
                    </select>
                </section>

                <section>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">{t.step2_shift}</label>
                    
                    {!isManualSplit ? (
                        <div className="space-y-3">
                            {shiftGroups.map(({ group, main, subs }) => (
                                <div key={group} className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedShift(main)}
                                        className={`flex-1 p-2 rounded-md text-center transition-all duration-150 ${SHIFTS[main].color} ${SHIFTS[main].textColor} ${selectedShift === main ? 'ring-2 ring-offset-1 ring-zen-500 shadow-md' : 'hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">{SHIFTS[main].label}</span>
                                    </button>
                                    {subs.map(subShift => (
                                        <button
                                            key={subShift}
                                            type="button"
                                            onClick={() => setSelectedShift(subShift)}
                                            className={`px-3 py-2 rounded-md text-center transition-all duration-150 ${SHIFTS[subShift].color} ${SHIFTS[subShift].textColor} ${selectedShift === subShift ? 'ring-2 ring-offset-1 ring-zen-500 shadow-md' : 'hover:shadow-md'}`}
                                        >
                                            <span className="font-bold text-xs">{SHIFTS[subShift].label}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setSelectedShift('DELETE')}
                                className={`w-full p-2 rounded-md text-center transition-all duration-150 bg-red-100 text-red-700 ${selectedShift === 'DELETE' ? 'ring-2 ring-offset-1 ring-zen-500 shadow-md' : 'hover:shadow-md'}`}
                            >
                                <span className="font-bold text-sm">{t.deleteShift}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 p-3 border rounded-md bg-slate-50 text-xs">
                            {/* Morning Part */}
                            <div className="space-y-2">
                                <label className="font-semibold text-slate-600">{t.manualSplit_morningShift}</label>
                                <select value={morningShift} onChange={e => setMorningShift(e.target.value as WorkZone | 'CUSTOM')} className="w-full p-1.5 border rounded-md bg-white">
                                    {splitShiftOptions.map(id => <option key={`m-${id}`} value={id}>{id === 'CUSTOM' ? t.manualSplit_other : SHIFTS[id].label}</option>)}
                                </select>
                                {morningShift === 'CUSTOM' && <input type="text" value={morningCustom} onChange={e => setMorningCustom(e.target.value)} placeholder={t.manualSplit_placeholder_morning} className="w-full p-1.5 border rounded-md" />}
                                <div className="flex gap-2">
                                    <input type="time" value={morningStart} onChange={e => setMorningStart(e.target.value)} className="w-1/2 p-1.5 border rounded-md" placeholder={t.manualSplit_startTimeOptional}/>
                                    <input type="time" value={morningEnd} onChange={e => setMorningEnd(e.target.value)} className="w-1/2 p-1.5 border rounded-md" placeholder={t.manualSplit_endTimeOptional}/>
                                </div>
                            </div>
                             {/* Afternoon Part */}
                             <div className="space-y-2 pt-3 border-t">
                                <label className="font-semibold text-slate-600">{t.manualSplit_afternoonShift}</label>
                                <select value={afternoonShift} onChange={e => setAfternoonShift(e.target.value as WorkZone | 'CUSTOM')} className="w-full p-1.5 border rounded-md bg-white">
                                    {splitShiftOptions.map(id => <option key={`a-${id}`} value={id}>{id === 'CUSTOM' ? t.manualSplit_other : SHIFTS[id].label}</option>)}
                                </select>
                                {afternoonShift === 'CUSTOM' && <input type="text" value={afternoonCustom} onChange={e => setAfternoonCustom(e.target.value)} placeholder={t.manualSplit_placeholder_afternoon} className="w-full p-1.5 border rounded-md" />}
                                <div className="flex gap-2">
                                    <input type="time" value={afternoonStart} onChange={e => setAfternoonStart(e.target.value)} className="w-1/2 p-1.5 border rounded-md" placeholder={t.manualSplit_startTimeOptional}/>
                                    <input type="time" value={afternoonEnd} onChange={e => setAfternoonEnd(e.target.value)} className="w-1/2 p-1.5 border rounded-md" placeholder={t.manualSplit_endTimeOptional}/>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-4 text-center">
                        <button type="button" onClick={() => setIsManualSplit(prev => !prev)} className="text-sm font-semibold text-zen-600 hover:text-zen-800 transition-colors">
                            {isManualSplit ? `← ${t.quickEdit}` : `${t.manualSplit_create} →`}
                        </button>
                    </div>
                </section>
                
                <section>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">{t.step3_dates}</label>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="start-date" className="text-xs text-gray-600">{t.startDate}</label>
                            <input type="date" id="start-date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-zen-500 sm:text-sm"/>
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
                {isLoading ? t.applyingChanges : t.applyChanges}
            </button>
        </footer>
      </div>
  );
};