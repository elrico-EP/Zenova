import React, { useState, useEffect, useMemo } from 'react';
import type { Nurse, Schedule, Agenda, ScheduleCell, ManualChangePayload, WorkZone, ChangeScope, Hours, PersonalHoursChangePayload, TimeSegment, CustomShift } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { Locale } from '../translations/locales';
import { getShiftsFromCell } from '../utils/scheduleUtils';

// Shifts for the quick edit palette
const quickShifts: WorkZone[] = [
    'URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE', 
    'ADMIN', 'ADM_PLUS',
    'TW', 'TW_ABROAD', 'CA', 'SICK_LEAVE', 'FP', 'CS', 'RECUP', 'LIBERO'
];

const absenceShifts = new Set<WorkZone>(['CA', 'SICK_LEAVE', 'FP', 'CS', 'RECUP']);


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

    const isOutsideCampaign = useMemo(() => {
        if (!vaccinationPeriod || !startDate) return true;
        return startDate < vaccinationPeriod.start || startDate > vaccinationPeriod.end;
    }, [startDate, vaccinationPeriod]);

    useEffect(() => {
        setSelectedNurseId(initialNurseId || '');
        setStartDate(initialDateKey || '');
        setEndDate(initialDateKey || '');
        setIsManualSplit(false);

        if (initialNurseId && initialDateKey) {
            const existingCell = schedule[initialNurseId]?.[initialDateKey];
            const shifts = getShiftsFromCell(existingCell);
            const primaryShift = shifts.length > 0 ? shifts[0] : 'TRAVAIL';

            if (quickShifts.includes(primaryShift)) {
                setSelectedShift(primaryShift);
            } else {
                setSelectedShift('TRAVAIL'); 
            }
        }
        
        setMorningShift('TRAVAIL');
        setMorningStart('');
        setMorningEnd('');
        setAfternoonShift('TRAVAIL_TARDE');
        setAfternoonStart('');
        setAfternoonEnd('');
        setError('');
    }, [initialNurseId, initialDateKey, schedule]);
    
    // When toggling manual split, reset other modes
    useEffect(() => {
        if(isManualSplit) {
            setSelectedShift('TRAVAIL');
        } else {
            setMorningStart('');
            setMorningEnd('');
            setAfternoonStart('');
            setAfternoonEnd('');
        }
    }, [isManualSplit]);

    const resetForm = () => {
        setSelectedNurseId('');
        setSelectedShift('TRAVAIL');
        setStartDate('');
        setEndDate('');
        setError('');
        setIsManualSplit(false);
        setMorningShift('TRAVAIL');
        setMorningCustom('');
        setMorningStart('');
        setMorningEnd('');
        setAfternoonShift('TRAVAIL_TARDE');
        setAfternoonCustom('');
        setAfternoonStart('');
        setAfternoonEnd('');
    };

    const availableQuickShifts = useMemo(() => {
        const shifts = [...quickShifts];
        const dateToCheck = startDate || initialDateKey;
        if (vaccinationPeriod && dateToCheck && dateToCheck >= vaccinationPeriod.start && dateToCheck <= vaccinationPeriod.end) {
            shifts.push('VACCIN', 'VACCIN_AM', 'VACCIN_PM', 'VACCIN_PM_PLUS');
        }
        return shifts;
    }, [vaccinationPeriod, startDate, initialDateKey]);

    const handleSubmit = async () => {
        if (!selectedNurseId) { setError(t.error_selectNurse); return; }
        if (!startDate || !endDate) { setError(t.error_selectDateRange); return; }

        setError('');
        setIsLoading(true);

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
                    
                    {isOutsideCampaign && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-100">
                                <input type="checkbox" checked={isManualSplit} onChange={(e) => setIsManualSplit(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-zen-600 focus:ring-zen-500"/>
                                <span className="font-semibold text-slate-700">{t.manualSplit_create}</span>
                            </label>
                        </div>
                    )}
                </section>
                
                {isManualSplit ? (
                    <section className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                        <div className="space-y-2">
                           <label className="block text-sm font-semibold text-gray-800">{t.manualSplit_morningShift}</label>
                           <select value={morningShift} onChange={e => { setMorningShift(e.target.value as WorkZone | 'CUSTOM'); if(e.target.value !== 'CUSTOM') setMorningCustom(''); }} className="w-full p-2 border-slate-300 rounded-md bg-white">
                                {availableQuickShifts.map(sId => {
                                    const shiftInfo = SHIFTS[sId];
                                    if (!shiftInfo) return null;
                                    return <option key={sId} value={sId}>{shiftInfo.label}</option>;
                                })}
                                <option value="CUSTOM">{t.manualSplit_other}</option>
                           </select>
                           {morningShift === 'CUSTOM' && (
                                <input type="text" value={morningCustom} onChange={e => setMorningCustom(e.target.value)} placeholder={t.manualSplit_placeholder_morning} className="mt-1 w-full p-2 border-slate-300 rounded-md"/>
                           )}
                           {morningShift !== 'CUSTOM' && !absenceShifts.has(morningShift) && (
                               <div className="flex items-center gap-2">
                                   <input type="time" value={morningStart} onChange={e => setMorningStart(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_startTime}/>
                                   <span>-</span>
                                   <input type="time" value={morningEnd} onChange={e => setMorningEnd(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_endTime}/>
                               </div>
                           )}
                           {morningShift === 'CUSTOM' && (
                               <div className="flex items-center gap-2">
                                  <input type="time" value={morningStart} onChange={e => setMorningStart(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_startTimeOptional}/>
                                  <span>-</span>
                                  <input type="time" value={morningEnd} onChange={e => setMorningEnd(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_endTimeOptional}/>
                               </div>
                           )}
                        </div>
                         <div className="space-y-2">
                           <label className="block text-sm font-semibold text-gray-800">{t.manualSplit_afternoonShift}</label>
                           <select value={afternoonShift} onChange={e => { setAfternoonShift(e.target.value as WorkZone | 'CUSTOM'); if(e.target.value !== 'CUSTOM') setAfternoonCustom(''); }} className="w-full p-2 border-slate-300 rounded-md bg-white">
                                {availableQuickShifts.map(sId => {
                                    const shiftInfo = SHIFTS[sId];
                                    if (!shiftInfo) return null;
                                    return <option key={sId} value={sId}>{shiftInfo.label}</option>;
                                })}
                                <option value="CUSTOM">{t.manualSplit_other}</option>
                           </select>
                            {afternoonShift === 'CUSTOM' && (
                                <input type="text" value={afternoonCustom} onChange={e => setAfternoonCustom(e.target.value)} placeholder={t.manualSplit_placeholder_afternoon} className="mt-1 w-full p-2 border-slate-300 rounded-md"/>
                           )}
                           {afternoonShift !== 'CUSTOM' && !absenceShifts.has(afternoonShift) && (
                               <div className="flex items-center gap-2">
                                   <input type="time" value={afternoonStart} onChange={e => setAfternoonStart(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_startTime}/>
                                   <span>-</span>
                                   <input type="time" value={afternoonEnd} onChange={e => setAfternoonEnd(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_endTime}/>
                               </div>
                           )}
                           {afternoonShift === 'CUSTOM' && (
                               <div className="flex items-center gap-2">
                                  <input type="time" value={afternoonStart} onChange={e => setAfternoonStart(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_startTimeOptional}/>
                                  <span>-</span>
                                  <input type="time" value={afternoonEnd} onChange={e => setAfternoonEnd(e.target.value)} className="w-full p-2 border-slate-300 rounded-md" placeholder={t.manualSplit_endTimeOptional}/>
                               </div>
                           )}
                        </div>
                    </section>
                ) : (
                    <section>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">{t.step2_shift}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {availableQuickShifts.map(shiftId => {
                                const shiftInfo = SHIFTS[shiftId];
                                if (!shiftInfo) return null;
                                const isSelected = selectedShift === shiftId;
                                return (
                                    <button
                                        key={shiftId}
                                        type="button"
                                        onClick={() => setSelectedShift(shiftId)}
                                        className={`p-2 rounded-md text-center transition-all duration-150 ${shiftInfo.color} ${shiftInfo.textColor} ${isSelected ? 'ring-2 ring-offset-1 ring-zen-500 shadow-md' : 'hover:shadow-md'}`}
                                    >
                                        <span className="font-bold text-sm">{shiftInfo.label}</span>
                                    </button>
                                );
                            })}
                             <button
                                type="button"
                                onClick={() => setSelectedShift('DELETE')}
                                className={`col-span-3 p-2 rounded-md text-center transition-all duration-150 bg-red-100 text-red-700 ${selectedShift === 'DELETE' ? 'ring-2 ring-offset-1 ring-zen-500 shadow-md' : 'hover:shadow-md'}`}
                            >
                                <span className="font-bold text-sm">{t.deleteShift}</span>
                            </button>
                        </div>
                    </section>
                )}
                
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