import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { Nurse, Schedule, ScheduleCell, WorkZone, CustomShift } from '../types';
import { SHIFTS } from '../constants';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getShiftsFromCell } from '../utils/scheduleUtils';

const EDITABLE_SHIFTS: (WorkZone | 'DELETE')[] = [
    'URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE', 
    'ADMIN', 'TW', 'CA', 'SICK_LEAVE', 'FP', 'STRASBOURG', 'DELETE'
];

const generateDatesForMonths = (year: number, months: number[]): Date[] => {
    const dates: Date[] = [];
    months.forEach(month => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(Date.UTC(year, month, day)));
        }
    });
    return dates;
};

const generateWeeksForMonths = (year: number, months: number[]): { weekId: string; dates: Date[] }[] => {
    if (!months.length) return [];

    const dateSet = new Set<string>();
    months.forEach(month => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            dateSet.add(new Date(Date.UTC(year, month, day)).toISOString().split('T')[0]);
        }
    });

    const weeksMap = new Map<string, Date[]>();

    dateSet.forEach(dateStr => {
        const date = new Date(dateStr + 'T00:00:00Z');
        const weekId = getWeekIdentifier(date);
        if (!weeksMap.has(weekId)) {
            const dayOfWeek = date.getUTCDay();
            const monday = new Date(date);
            monday.setUTCDate(date.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            
            const weekDates: Date[] = [];
            for (let i = 0; i < 7; i++) {
                const dayInWeek = new Date(monday);
                dayInWeek.setUTCDate(monday.getUTCDate() + i);
                weekDates.push(dayInWeek);
            }
            weeksMap.set(weekId, weekDates);
        }
    });
    
    return Array.from(weeksMap.entries())
        .map(([weekId, dates]) => ({ weekId, dates }))
        .sort((a, b) => a.weekId.localeCompare(b.weekId));
};


// --- Sub-componente para la edición detallada ---
interface DetailedEditorProps {
    nurses: Nurse[];
    selectedMonths: number[];
    year: number;
    initialOverrides: Schedule;
    onOverridesChange: (newOverrides: Schedule) => void;
    onBack: () => void;
    onSave: () => void;
    isMaximized: boolean;
    onToggleMaximize: () => void;
}

const ShiftEditorPopover: React.FC<{
    initialCell: ScheduleCell | 'DELETE' | '';
    onSave: (cell: ScheduleCell | 'DELETE' | '') => void;
    onClose: () => void;
}> = ({ initialCell, onSave, onClose }) => {
    const t = useTranslations();
    const popoverRef = useRef<HTMLDivElement>(null); // For click outside
    const [isSplit, setIsSplit] = useState(false);
    
    const [shift1, setShift1] = useState<WorkZone | ''>('');
    const [time1, setTime1] = useState('');
    const [shift2, setShift2] = useState<WorkZone | ''>('');
    const [time2, setTime2] = useState('');

    // Click outside handler to correctly close the popover
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    useEffect(() => {
        if (typeof initialCell === 'object' && 'split' in initialCell) {
            setIsSplit(true);
            const [part1, part2] = initialCell.split;
            const shifts1 = getShiftsFromCell(part1);
            setShift1(shifts1.length > 0 ? shifts1[0] : '');
            setTime1(typeof part1 === 'object' && 'time' in part1 ? part1.time || '' : '');
            const shifts2 = getShiftsFromCell(part2);
            setShift2(shifts2.length > 0 ? shifts2[0] : '');
            setTime2(typeof part2 === 'object' && 'time' in part2 ? part2.time || '' : '');
        } else {
            setIsSplit(false);
            // FIX: Ensure 'initialCell' is a valid 'ScheduleCell' before passing to 'getShiftsFromCell'.
            // 'initialCell' can be '' or 'DELETE', which are not valid ScheduleCell types.
            const shifts = getShiftsFromCell(
                initialCell && initialCell !== 'DELETE' ? (initialCell as ScheduleCell) : undefined
            );
            setShift1(shifts.length > 0 ? shifts[0] : '');
            setTime1(typeof initialCell === 'object' && 'time' in initialCell ? initialCell.time || '' : '');
            setShift2('');
            setTime2('');
        }
    }, [initialCell]);

    const handleSave = () => {
        if (!shift1) {
            onSave('DELETE'); // Or '' to reset to auto
            return;
        }

        const createPart = (shift: WorkZone, time: string): WorkZone | CustomShift => {
            if (time && time.includes(' - ')) {
                return { custom: `${SHIFTS[shift].label} (${time})`, type: shift, time: time };
            }
            return shift;
        };

        if (isSplit && shift2) {
            onSave({ split: [createPart(shift1, time1), createPart(shift2, time2)] });
        } else {
            onSave(createPart(shift1, time1));
        }
    };
    
    return (
        <div ref={popoverRef} className="absolute top-0 left-0 z-20 bg-white shadow-lg rounded-lg border border-slate-300 p-3 w-64" tabIndex={-1}>
            <div className="space-y-2">
                <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">{t['shift.main_shift']}</label>
                    <select value={shift1} onChange={e => setShift1(e.target.value as WorkZone)} className="w-full p-1 border rounded-md text-sm">
                        <option value="">{t['shift.auto_free']}</option>
                        {EDITABLE_SHIFTS.map(id => id !== 'DELETE' && <option key={id} value={id}>{SHIFTS[id]?.label || id}</option>)}
                    </select>
                </div>
                <div className="flex gap-1">
                    <input type="time" value={time1.split(' - ')[0] || ''} onChange={e => setTime1(`${e.target.value} - ${time1.split(' - ')[1] || ''}`)} className="w-1/2 p-1 border rounded-md text-xs" />
                    <input type="time" value={time1.split(' - ')[1] || ''} onChange={e => setTime1(`${time1.split(' - ')[0] || ''} - ${e.target.value}`)} className="w-1/2 p-1 border rounded-md text-xs" />
                </div>
                
                <label className="flex items-center text-xs gap-2 pt-2"><input type="checkbox" checked={isSplit} onChange={e => setIsSplit(e.target.checked)} />{t['shift.add_second_shift']}</label>
                
                {isSplit && (
                    <div className="space-y-1 pt-2 border-t">
                        <label className="block text-xs font-medium text-slate-600">{t['shift.second_shift']}</label>
                        <select value={shift2} onChange={e => setShift2(e.target.value as WorkZone)} className="w-full p-1 border rounded-md text-sm">
                             <option value="">{t['shift.none']}</option>
                             {EDITABLE_SHIFTS.map(id => id !== 'DELETE' && <option key={id} value={id}>{SHIFTS[id]?.label || id}</option>)}
                        </select>
                        <div className="flex gap-1">
                            <input type="time" value={time2.split(' - ')[0] || ''} onChange={e => setTime2(`${e.target.value} - ${time2.split(' - ')[1] || ''}`)} className="w-1/2 p-1 border rounded-md text-xs" />
                            <input type="time" value={time2.split(' - ')[1] || ''} onChange={e => setTime2(`${time2.split(' - ')[0] || ''} - ${e.target.value}`)} className="w-1/2 p-1 border rounded-md text-xs" />
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-2"><button onClick={handleSave} className="px-3 py-1 bg-zen-800 text-white text-xs font-semibold rounded-md">{t.save}</button></div>
        </div>
    );
};

const DetailedEditor: React.FC<DetailedEditorProps> = ({ nurses, selectedMonths, year, initialOverrides, onOverridesChange, onBack, onSave, isMaximized, onToggleMaximize }) => {
    const t = useTranslations();
    const [activeTab, setActiveTab] = useState<'monthly' | 'weekly'>('monthly');
    const [editingCell, setEditingCell] = useState<{ nurseId: string, dateKey: string } | null>(null);
    const monthNames = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1).toLocaleString('es-ES', { month: 'long' })), [year]);
    const [activeMonth, setActiveMonth] = useState(selectedMonths[0]);
    
    const datesForMonth = useMemo(() => generateDatesForMonths(year, [activeMonth]), [year, activeMonth]);

    const weeks = useMemo(() => generateWeeksForMonths(year, selectedMonths), [year, selectedMonths]);
    const [activeWeekIndex, setActiveWeekIndex] = useState(0);

    const activeWeek = weeks.length > 0 ? weeks[activeWeekIndex] : null;

    const isEditingDefinitiveMonth = useMemo(() => {
        if (activeTab === 'monthly') {
            return activeMonth === 0 || activeMonth === 1;
        }
        if (activeTab === 'weekly' && activeWeek) {
            return activeWeek.dates.some(d => d.getUTCMonth() < 2);
        }
        return false;
    }, [activeTab, activeMonth, activeWeek]);

    const handlePrevWeek = () => setActiveWeekIndex(i => Math.max(0, i - 1));
    const handleNextWeek = () => setActiveWeekIndex(i => Math.min(weeks.length - 1, i + 1));
    
    useEffect(() => {
        setActiveWeekIndex(0);
        setEditingCell(null); // Reset editing state when changing tabs or months
    }, [selectedMonths, activeTab]);

    const handleShiftChange = (nurseId: string, dateKey: string, shift: ScheduleCell | 'DELETE' | '') => {
        const newOverrides = JSON.parse(JSON.stringify(initialOverrides));
        if (!newOverrides[nurseId]) newOverrides[nurseId] = {};
        if (shift === '' || shift === 'DELETE') delete newOverrides[nurseId][dateKey];
        else newOverrides[nurseId][dateKey] = shift;
        onOverridesChange(newOverrides);
    };

    const handleSaveShift = (nurseId: string, dateKey: string, cell: ScheduleCell | 'DELETE' | '') => {
        handleShiftChange(nurseId, dateKey, cell);
        setEditingCell(null);
    };

    const getDisplayInfo = (shiftCell: ScheduleCell | 'DELETE' | ''): { label: string; color: string; textColor: string } => {
        if (!shiftCell) return { label: '', color: '', textColor: '' };
        if (shiftCell === 'DELETE') return { label: 'X', color: 'bg-red-200', textColor: 'text-red-800' };

        if (typeof shiftCell === 'object' && 'split' in shiftCell) {
            const part1Label = getDisplayInfo(shiftCell.split[0]).label;
            const part2Label = getDisplayInfo(shiftCell.split[1]).label;
            return { label: `${part1Label} / ${part2Label}`, color: 'bg-purple-200', textColor: 'text-purple-800' };
        }
        if (typeof shiftCell === 'object' && 'custom' in shiftCell) {
            const type = shiftCell.type;
            const style = type && SHIFTS[type] ? SHIFTS[type] : { color: 'bg-slate-200', textColor: 'text-slate-800' };
            const label = shiftCell.custom.includes('(') ? shiftCell.custom.substring(0, shiftCell.custom.indexOf('(')).trim() : shiftCell.custom.split('\n')[0];
            return { label, ...style };
        }

        const shiftInfo = SHIFTS[shiftCell as WorkZone];
        return shiftInfo ? { label: shiftInfo.label, color: shiftInfo.color, textColor: shiftInfo.textColor } : { label: '', color: '', textColor: '' };
    };


    return (
        <>
            <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">{t['planner.edit_manual_selected_months']}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onSave} className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700">{t.saveChanges}</button>
                    <button onClick={onToggleMaximize} className="p-2 text-gray-400 hover:text-gray-600 rounded-full" title={isMaximized ? t['modal.restore'] : t['modal.maximize']}>
                        {isMaximized ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                        )}
                    </button>
                </div>
            </header>
            <main className="flex-grow p-4 overflow-auto flex flex-col">
                <div className="border-b border-slate-200 mb-4 flex-shrink-0">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('monthly')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'monthly' ? 'border-zen-500 text-zen-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>{t.monthlyView}</button>
                        <button onClick={() => setActiveTab('weekly')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'weekly' ? 'border-zen-500 text-zen-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>{t.weeklyView}</button>
                    </nav>
                </div>

                {isEditingDefinitiveMonth && (
                    <div className="p-3 mb-4 bg-amber-100 border-l-4 border-amber-500 text-amber-800 text-sm rounded-r-lg" role="alert">
                        <p className="font-bold">Aviso: Mes Definitivo</p>
                        <p>Enero y Febrero tienen una planificación fija. Los cambios aquí son overrides manuales y deben hacerse con precaución.</p>
                    </div>
                )}

                {activeTab === 'monthly' && (
                    <div className="flex-grow overflow-auto">
                        {selectedMonths.length > 1 && (
                            <div className="mb-4"><select value={activeMonth} onChange={e => setActiveMonth(parseInt(e.target.value))} className="p-2 border rounded-md bg-white">{selectedMonths.map(m => <option key={m} value={m} className="capitalize">{monthNames[m]}</option>)}</select></div>
                        )}
                        <table className="min-w-full text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-100 z-10">
                                <tr>
                                    <th className="p-1 border text-left font-semibold text-slate-600 sticky left-0 bg-slate-100 w-24">{t.day}</th>
                                    {nurses.map(nurse => (
                                        <th key={nurse.id} className="p-1 border font-semibold text-slate-600 truncate min-w-[100px]">{nurse.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {datesForMonth.map(date => {
                                    const dateKey = date.toISOString().split('T')[0];
                                    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
                                    return (
                                        <tr key={dateKey} className={isWeekend ? 'bg-slate-50' : ''}>
                                            <td className="p-1 border font-medium text-slate-700 sticky left-0 bg-white w-24 capitalize">
                                                {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                                            </td>
                                            {nurses.map(nurse => {
                                                const currentShift = initialOverrides[nurse.id]?.[dateKey] || '';
                                                return (
                                                    <td key={nurse.id} className="border p-0 h-10">
                                                        <select
                                                            value={typeof currentShift === 'string' ? currentShift : ''}
                                                            onChange={e => handleShiftChange(nurse.id, dateKey, e.target.value as WorkZone | 'DELETE' | '')}
                                                            className="w-full h-full p-0.5 border-0 bg-transparent focus:ring-1 focus:ring-zen-500 rounded-none text-center"
                                                        >
                                                            <option value="">Auto</option>
                                                            {EDITABLE_SHIFTS.map(shiftId => <option key={shiftId} value={shiftId}>{shiftId === 'DELETE' ? 'X' : SHIFTS[shiftId]?.label || shiftId}</option>)}
                                                        </select>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                 {activeTab === 'weekly' && activeWeek && (
                    <div className="flex-grow overflow-auto flex flex-col">
                        <div className="flex items-center justify-between p-2 mb-2 bg-slate-100 rounded-md flex-shrink-0">
                            <button onClick={handlePrevWeek} disabled={activeWeekIndex === 0} className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="font-semibold text-slate-700 text-center">
                                {t.week} {activeWeek.weekId.split('-W')[1]}
                                <div className="text-xs font-normal text-slate-500">
                                    {activeWeek.dates[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {activeWeek.dates[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                            <button onClick={handleNextWeek} disabled={activeWeekIndex >= weeks.length - 1} className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <div className="overflow-auto">
                            <table className="min-w-full text-xs border-collapse">
                                <thead className="sticky top-0 bg-slate-100 z-10">
                                    <tr>
                                        <th className="p-1 border text-left font-semibold text-slate-600 sticky left-0 bg-slate-100 w-32">{t.nurse}</th>
                                        {activeWeek.dates.map(date => (
                                            <th key={date.toISOString()} className={`p-1 border font-semibold text-slate-600 w-24 text-center ${[0, 6].includes(date.getUTCDay()) ? 'bg-slate-200' : ''}`}>
                                                <span className="font-bold block">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                                <span className="font-normal text-xs">{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {nurses.map(nurse => (
                                        <tr key={nurse.id}>
                                            <td className="p-1 border font-medium text-slate-700 sticky left-0 bg-white w-32 truncate">{nurse.name}</td>
                                            {activeWeek.dates.map(date => {
                                                const dateKey = date.toISOString().split('T')[0];
                                                const currentShift = initialOverrides[nurse.id]?.[dateKey] || '';
                                                const isWeekend = [0, 6].includes(date.getUTCDay());
                                                const isEditing = editingCell?.nurseId === nurse.id && editingCell?.dateKey === dateKey;
                                                const displayInfo = getDisplayInfo(currentShift);

                                                return (
                                                    <td key={dateKey} className="border p-0 h-10 relative" onClick={() => !isEditing && setEditingCell({ nurseId: nurse.id, dateKey })}>
                                                        {isEditing ? (
                                                            <ShiftEditorPopover
                                                                initialCell={currentShift}
                                                                onSave={(cell) => handleSaveShift(nurse.id, dateKey, cell)}
                                                                onClose={() => setEditingCell(null)}
                                                            />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center text-xs font-semibold rounded-none cursor-pointer
                                                                ${displayInfo.label ? `${displayInfo.color} ${displayInfo.textColor}` : isWeekend ? 'bg-slate-100' : 'bg-white'}`}
                                                            >
                                                                {displayInfo.label}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}


interface AnnualPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  monthsWithOverrides: Set<number>;
  onGenerate: () => void;
  // Nuevas props
  nurses: Nurse[];
  initialOverrides: Schedule;
  onSaveOverrides: (updatedOverrides: Schedule) => void;
}

export const AnnualPlannerModal: React.FC<AnnualPlannerModalProps> = ({ isOpen, onClose, year, monthsWithOverrides, onGenerate, nurses, initialOverrides, onSaveOverrides }) => {
    const t = useTranslations();
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
    const [view, setView] = useState<'selection' | 'editing'>('selection');
    const [editedOverrides, setEditedOverrides] = useState<Schedule>({});
    const [isMaximized, setIsMaximized] = useState(false);

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => 
        new Date(year, i, 1).toLocaleString('es-ES', { month: 'long' })
    ), [year]);

    const toggleMonth = (monthIndex: number) => {
        setSelectedMonths(prev => 
            prev.includes(monthIndex) 
                ? prev.filter(m => m !== monthIndex) 
                : [...prev, monthIndex].sort((a,b) => a - b)
        );
    };
    
    const handleStartEditing = () => {
        const relevantOverrides: Schedule = {};
        const allDates = selectedMonths.flatMap(month => generateDatesForMonths(year, [month]));
        const allDateKeys = new Set(allDates.map(d => d.toISOString().split('T')[0]));
        
        nurses.forEach(nurse => {
            relevantOverrides[nurse.id] = {};
            for (const dateKey in initialOverrides[nurse.id]) {
                if (allDateKeys.has(dateKey)) {
                    relevantOverrides[nurse.id][dateKey] = initialOverrides[nurse.id][dateKey];
                }
            }
        });
        setEditedOverrides(relevantOverrides);
        setView('editing');
    };
    
    const handleSave = () => {
        onSaveOverrides(editedOverrides);
        setView('selection'); // Volver a la vista de selección
        // Opcional: cerrar la modal completamente tras guardar
        // onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={view === 'selection' ? onClose : undefined}>
        <div className={`bg-slate-50 rounded-lg shadow-xl relative transform transition-all flex flex-col ${isMaximized ? 'm-auto w-[95vw] h-[95vh]' : 'm-4 max-w-6xl w-full h-[90vh]'}`} onClick={e => e.stopPropagation()}>
            {view === 'selection' ? (
                <>
                    <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-gray-800">{t['planner.annual_planner_title']} {year}</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full" title={isMaximized ? t['modal.restore'] : t['modal.maximize']}>
                                {isMaximized ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                                )}
                            </button>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </header>
                    <main className="flex-grow p-6 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {months.map((monthName, index) => {
                                const hasOverrides = monthsWithOverrides.has(index);
                                const isSelected = selectedMonths.includes(index);
                                return (
                                    <button key={index} onClick={() => toggleMonth(index)} className={`p-4 rounded-lg text-center transition-all duration-200 border-2 ${isSelected ? 'bg-zen-100 border-zen-500 shadow-lg scale-105 ring-2 ring-zen-300' : hasOverrides ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-white border-slate-200 hover:bg-slate-100'}`}>
                                        <span className="font-semibold text-lg text-slate-800 capitalize">{monthName}</span>
                                        {hasOverrides && <div className="text-xs text-green-600 mt-1 font-semibold">{t.editedManually}</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </main>
                    <footer className="p-4 bg-slate-100/80 border-t border-slate-200/80 flex-shrink-0 flex items-center justify-center gap-6">
                        <button onClick={handleStartEditing} disabled={selectedMonths.length === 0} title={t['planner.edit_manual_tooltip']} className="flex items-center gap-3 px-6 py-3 text-base font-semibold text-white bg-zen-800 rounded-lg shadow-md hover:bg-zen-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[200px] justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            {t['planner.edit_manual_selected_months']}
                        </button>
                        <button onClick={() => { onGenerate(); onClose(); }} title={t['planner.generate_remaining_tooltip']} className="flex items-center gap-3 px-6 py-3 text-base font-semibold text-nova-600 rounded-lg shadow-md hover:bg-nova-700 transition-all min-w-[200px] justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                            {t['planner.generate_remaining_months']}
                        </button>
                    </footer>
                </>
            ) : (
                <DetailedEditor
                    nurses={nurses}
                    selectedMonths={selectedMonths}
                    year={year}
                    initialOverrides={editedOverrides}
                    onOverridesChange={setEditedOverrides}
                    onBack={() => setView('selection')}
                    onSave={handleSave}
                    isMaximized={isMaximized}
                    onToggleMaximize={() => setIsMaximized(!isMaximized)}
                />
            )}
        </div>
      </div>
    );
};