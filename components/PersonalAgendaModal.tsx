import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Nurse, Schedule, ScheduleCell, Agenda, Hours, BalanceData, SpecialStrasbourgEvent, SwapInfo, HistoryEntry } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon } from './Icons';
import { ShiftCell } from './ScheduleGrid'; // Re-use for consistent shift display
import { PersonalBalanceView } from './PersonalBalanceView';
import { holidays2026 } from '../data/agenda2026';
import { agenda2026Data } from '../data/agenda2026'; // To get activity level
import { getWeekIdentifier } from '../utils/dateUtils';
import { getScheduleCellHours } from '../utils/scheduleUtils';
import { calculateHoursDifference } from '../utils/hoursUtils';
import { SHIFTS } from '../constants';
import { generatePersonalAgendaPdf } from '../utils/exportUtils';

const MonthPickerPopover: React.FC<{
    currentDate: Date;
    onSelectDate: (date: Date) => void;
}> = ({ currentDate, onSelectDate }) => {
    const [viewYear, setViewYear] = useState(currentDate.getFullYear());
    const { language } = useLanguage();

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => 
        new Date(viewYear, i, 1).toLocaleString(language, { month: 'short' })
    ), [viewYear, language]);

    return (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-64 text-gray-800">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setViewYear(y => y - 1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"><ArrowLeftIcon className="w-5 h-5" /></button>
                <span className="font-semibold text-lg text-gray-700">{viewYear}</span>
                <button onClick={() => setViewYear(y => y + 1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"><ArrowRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {months.map((monthName, index) => (
                    <button
                        key={monthName}
                        onClick={() => onSelectDate(new Date(viewYear, index, 1))}
                        className={`p-2 rounded-md text-sm font-medium transition-colors capitalize ${
                            currentDate.getFullYear() === viewYear && currentDate.getMonth() === index
                                ? 'bg-zen-800 text-white shadow-sm'
                                : 'hover:bg-gray-100 text-gray-700'
                        }`}
                    >
                        {monthName}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Define the shape for local storage data
interface LocalDayData {
  startTime: string;
  endTime: string;
  note: string;
}

interface LocalMonthData {
  [dateKey: string]: LocalDayData;
}

const isDateInWorkPeriod = (nurse: Nurse, date: Date): boolean => {
    // Specific logic for the intern
    if (nurse.id === 'nurse-11') {
        const month = date.getUTCMonth(); // 0-11 for Jan-Dec, use UTC month
        // Active from October (month 9) to February (month 1)
        return month >= 9 || month <= 1;
    }

    // Restore original behavior: all other nurses are considered active for the whole year.
    // This decouples the view from the workConditions data to ensure stability.
    return true;
};

const calculateEventHours = (start?: string, end?: string): number => {
    if (!start || !end) return 0;
    try {
        const startTime = new Date(`1970-01-01T${start}:00Z`);
        const endTime = new Date(`1970-01-01T${end}:00Z`);
        if (endTime <= startTime) return 0;
        return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    } catch (e) {
        console.error("Error calculating event hours:", e);
        return 0;
    }
};


interface PersonalAgendaModalProps {
  nurse: Nurse;
  currentDate: Date;
  schedule: Schedule[string]; // The generated schedule for the nurse for the month
  hours: Hours;
  onClose: () => void;
  onNavigate: (newDate: Date) => void;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  balanceData: BalanceData;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  visualSwaps: Record<string, Record<string, SwapInfo>>;
  nurses: Nurse[];
  history: HistoryEntry[];
  onExportAnnual: (nurse: Nurse) => Promise<void>;
}

const ShiftDisplay: React.FC<{ cell: ScheduleCell | undefined }> = ({ cell }) => {
    if (!cell) return <span className="text-slate-500 italic">Libre</span>;
    let shiftId;
    if (typeof cell === 'string') shiftId = cell;
    else if (typeof cell === 'object' && 'type' in cell && cell.type) shiftId = cell.type;

    const shiftInfo = shiftId ? SHIFTS[shiftId] : null;
    if (shiftInfo) return <div className={`px-1.5 py-0.5 text-xs font-semibold rounded ${shiftInfo.color} ${shiftInfo.textColor}`}>{shiftInfo.label}</div>
    if (typeof cell === 'object' && 'custom' in cell) return <div className="px-1.5 py-0.5 text-xs font-semibold rounded bg-slate-200 text-slate-700">{cell.custom.split('\n')[0]}</div>
    return <span className="text-slate-500 italic">Complejo</span>;
}

export const PersonalAgendaModal: React.FC<PersonalAgendaModalProps> = ({
  nurse,
  currentDate,
  schedule,
  hours,
  onClose,
  onNavigate,
  agenda,
  strasbourgAssignments,
  balanceData,
  specialStrasbourgEvents,
  visualSwaps,
  nurses,
  history,
  onExportAnnual
}) => {
  const t = useTranslations();
  const { language } = useLanguage();
  const { user: authUser } = useUser();
  const permissions = usePermissions();
  const [isMaximized, setIsMaximized] = useState(false);

  const monthKey = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  }, [currentDate]);

  const [localData, setLocalData] = useState<LocalMonthData>({});
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingYear, setIsExportingYear] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  const canEditHours = permissions.canSeePersonalAgendaAsEditable(nurse.id);
  
  useEffect(() => {
    try {
      const storageKey = `individualSchedule-${nurse.id}-${monthKey}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        setLocalData(JSON.parse(storedData));
      } else {
        setLocalData({});
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      setLocalData({});
    }
  }, [nurse.id, monthKey]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
            setIsMonthPickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // SECURITY GUARD: Prevent admin from saving changes while impersonating.
    // This enforces the "action authorization" rule based on the real user (authUser).
    if (authUser?.role === 'admin') {
        return;
    }
    
    if (Object.keys(localData).length > 0) {
        try {
            const storageKey = `individualSchedule-${nurse.id}-${monthKey}`;
            localStorage.setItem(storageKey, JSON.stringify(localData));
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
        }
    }
  }, [localData, nurse.id, monthKey, authUser]);

  const handleDataChange = (dateKey: string, field: keyof LocalDayData, value: string) => {
    setLocalData(prev => ({
      ...prev,
      [dateKey]: {
        startTime: prev[dateKey]?.startTime || '',
        endTime: prev[dateKey]?.endTime || '',
        note: prev[dateKey]?.note || '',
        [field]: value
      }
    }));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    const grid = [];
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday as 0, Sunday as 6
    const startDayOfWeek = (firstDayOfMonth.getUTCDay() + 6) % 7;

    for (let i = 0; i < startDayOfWeek; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(new Date(Date.UTC(year, month, day)));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [year, month]);

  const dayNames = useMemo(() => {
      const formatter = new Intl.DateTimeFormat(language, { weekday: 'long' });
      // 2023-01-02 is a Monday
      return [...Array(7).keys()].map(i => formatter.format(new Date(2023, 0, i + 2)));
  }, [language]);
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalMonthlyHours = useMemo(() => {
    const nurseHoursForMonth = hours[nurse.id];
    return daysArray.reduce((total: number, day: number) => {
        const date = new Date(Date.UTC(year, month, day));
        if (!isDateInWorkPeriod(nurse, date)) return total;

        const dateKey = date.toISOString().split('T')[0];
        const dayData = localData[dateKey];

        // Priority 1: Manual override from local storage
        if (dayData && dayData.startTime && dayData.endTime) {
            return total + calculateHoursDifference(dayData.startTime, dayData.endTime);
        }

        // Priority 2: Check for holidays and closed days on weekdays
        const dayOfWeek = date.getUTCDay(); // Sunday is 0, Monday is 1, etc.
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Is it a weekday?
            const weekId = getWeekIdentifier(date);
            const isHoliday = holidays2026.has(dateKey);
            const isClosedDay = agenda[weekId] === 'CLOSED';

            if (isHoliday || isClosedDay) {
                return total + 8.5; // Add 8.5 hours for holidays/closed days
            }
        }
        
        // Priority 3: Standard calculated hours for all other cases
        const hourData = nurseHoursForMonth?.[dateKey];
        return total + (hourData?.calculated || 0);
    }, 0);
  }, [localData, nurse, year, month, daysArray, hours, agenda]);

  const theoreticalHoursData = useMemo(() => {
    let normalWorkDays = 0;
    let specialDays = 0; // Holidays or closed days
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dayOfWeek = date.getUTCDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            const dateKey = date.toISOString().split('T')[0];
            const weekId = getWeekIdentifier(date);
            const isHoliday = holidays2026.has(dateKey);
            const isClosedDay = agenda[weekId] === 'CLOSED';

            if (isHoliday || isClosedDay) {
                specialDays++;
            } else {
                normalWorkDays++;
            }
        }
    }
    return {
        normalWorkDays,
        specialDays,
        theoreticalHours: (normalWorkDays * 8) + (specialDays * 8.5),
    };
  }, [year, month, agenda]);
  
  const difference = totalMonthlyHours - theoreticalHoursData.theoreticalHours;
  
  const handlePrevMonth = () => onNavigate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => onNavigate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const swapHistoryForMonth = useMemo(() => {
    const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const swaps = Object.entries(visualSwaps)
        .filter(([dateKey, dailySwaps]) => dateKey.startsWith(monthPrefix) && dailySwaps[nurse.id])
        .map(([dateKey, dailySwaps]) => {
            const swapInfo = dailySwaps[nurse.id];
            const swappedWithNurse = nurses.find(n => n.id === swapInfo.swappedWithNurseId);
            const nurse1Name = nurse.name;
            const nurse2Name = swappedWithNurse?.name;
            
            const historyEntry = history.find(entry => 
                entry.action === t.history_swapShifts && 
                entry.details.includes(dateKey) &&
                ((entry.details.includes(nurse1Name) && entry.details.includes(nurse2Name || '')) || (entry.details.includes(nurse2Name || '') && entry.details.includes(nurse1Name)))
            );

            return {
                dateKey,
                ...swapInfo,
                swappedWithNurseName: swappedWithNurse?.name || t.unknown,
                adminUser: historyEntry?.user || 'N/A'
            };
        })
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        
    return swaps;
  }, [visualSwaps, nurse, nurses, history, currentDate, t]);
  
  const handleExportPdf = async () => {
    if (isExporting || isExportingYear || !modalContentRef.current) return;
    setIsExporting(true);

    const clonedNode = modalContentRef.current.cloneNode(true) as HTMLElement;

    // Prepare the clone for capturing
    clonedNode.querySelector('aside')?.remove();
    clonedNode.querySelectorAll('.no-print')?.forEach(el => el.remove());

    const mainContent = clonedNode.querySelector('.personal-agenda-modal-main-content');
    if (mainContent) {
        mainContent.classList.remove('overflow-y-auto', 'pr-2');
        (mainContent as HTMLElement).style.height = 'auto';
        (mainContent as HTMLElement).style.maxHeight = 'none';
    }
    
    clonedNode.style.width = '1200px';
    clonedNode.style.height = 'auto';
    clonedNode.style.maxHeight = 'none';
    clonedNode.style.margin = '0';
    clonedNode.style.transform = 'none';
    clonedNode.classList.remove('max-w-7xl', 'h-[95vh]');

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0px';
    wrapper.appendChild(clonedNode);
    document.body.appendChild(wrapper);
    
    try {
        await generatePersonalAgendaPdf({ element: clonedNode, nurse, currentDate });
    } catch (error) {
        console.error("Failed to generate personal agenda PDF:", error);
    } finally {
        document.body.removeChild(wrapper);
        setIsExporting(false);
    }
  };

  const handleExportYearPdf = async () => {
    if (isExporting || isExportingYear) return;
    setIsExportingYear(true);
    try {
        await onExportAnnual(nurse);
    } catch (error) {
        console.error("Failed to generate annual agenda PDF:", error);
    } finally {
        setIsExportingYear(false);
    }
  };

  return (
    <div className={`personal-agenda-modal-wrapper fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${!isMaximized ? 'p-4' : ''}`}>
        <div ref={modalContentRef} className={`personal-agenda-modal-content bg-white shadow-xl relative transform transition-all flex flex-col ${isMaximized ? 'w-screen h-screen rounded-none p-6' : 'rounded-lg p-6 m-4 max-w-7xl w-full h-[95vh]'}`}>
            <div className="flex items-start justify-between pb-4 border-b mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">{nurse.name}</h2>
                <div className="flex items-center gap-2 no-print">
                     <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <div className="relative" ref={monthPickerRef}>
                        <button
                            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                            className="text-xl font-semibold text-gray-700 w-64 text-center capitalize border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-zen-500 focus:border-zen-500 py-2 px-4 bg-white hover:bg-gray-50 flex items-center justify-between gap-2"
                        >
                            <span>
                                {`${currentDate.toLocaleString(language, { month: 'long' })} ${currentDate.getFullYear()}`}
                            </span>
                            <svg className={`w-5 h-5 text-gray-500 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isMonthPickerOpen && (
                            <MonthPickerPopover
                                currentDate={currentDate}
                                onSelectDate={(newDate) => {
                                    onNavigate(newDate);
                                    setIsMonthPickerOpen(false);
                                }}
                            />
                        )}
                    </div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"><ArrowRightIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <button onClick={handleExportPdf} disabled={isExporting || isExportingYear} className="p-2 text-gray-400 hover:text-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" title="Exportar PDF (Mes)">
                        {isExporting ? (
                            <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                    <button onClick={handleExportYearPdf} disabled={isExporting || isExportingYear} className="p-2 text-gray-400 hover:text-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" title="Exportar PDF (Año)">
                        {isExportingYear ? (
                            <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                           <CalendarDaysIcon className="h-5 w-5" />
                        )}
                    </button>
                    <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full" title={isMaximized ? "Restaurar" : "Maximizar"}>
                        {isMaximized ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m-2-2V3a1 1 0 00-1-1H5a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5M14 3v4a1 1 0 001 1h4" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5v4m0 0h-4" /></svg>
                        )}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            </div>
            
            <div className="flex-grow flex gap-6 mt-4 overflow-hidden">
                {/* Main Calendar Area */}
                <div className="personal-agenda-modal-main-content flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-7 sticky top-0 bg-slate-100 z-10 border-b-2 border-slate-200">
                        {dayNames.map(dayName => <div key={dayName} className="p-2 text-center font-semibold text-slate-600 text-sm capitalize">{dayName}</div>)}
                    </div>
                    <div className="grid grid-cols-7 border-l border-t border-slate-200">
                        {calendarGrid.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="border-r border-b border-slate-200 bg-slate-50 min-h-[12rem]"></div>;
                            const dateKey = date.toISOString().split('T')[0];
                            const dayOfWeek = date.getUTCDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const weekId = getWeekIdentifier(date);
                            const activityLevel = agenda2026Data[weekId] || 'NORMAL';
                            const isHoliday = holidays2026.has(dateKey);
                            const shiftCell = schedule?.[dateKey];
                            const dayData = localData[dateKey] || { startTime: '', endTime: '', note: '' };
                            const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
                            const dailyHours = calculateHoursDifference(dayData.startTime, dayData.endTime);
                            const isDayActive = isDateInWorkPeriod(nurse, date);
                            const bgColor = isWeekend ? 'bg-slate-50' : 'bg-white';
                            const inactiveClasses = !isDayActive ? 'bg-slate-100 text-slate-400' : 'hover:bg-zen-50';
                            const hasManualHours = !!(dayData.startTime && dayData.endTime);
                            return (
                                <div key={dateKey} className={`relative p-1 border-r border-b border-slate-200 min-h-[12rem] flex flex-col ${inactiveClasses} ${bgColor}`}>
                                    <div className="text-right text-xs font-semibold text-slate-500">{date.getUTCDate()}</div>
                                    <div className="my-1 h-14">
                                        {specialEvent ? (
                                            <div className="w-full h-full p-1 flex items-center justify-center relative" title={`${specialEvent.name}${specialEvent.notes ? `\n\nNotas: ${specialEvent.notes}` : ''}`}>
                                                <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${SHIFTS.STRASBOURG.color} ${SHIFTS.STRASBOURG.textColor} font-bold text-xs text-center`}><span className="truncate px-1">{specialEvent.name}</span>{specialEvent.startTime && specialEvent.endTime && <span className="text-[10px] opacity-80 mt-1">{calculateEventHours(specialEvent.startTime, specialEvent.endTime).toFixed(1)}h</span>}</div>
                                            </div>
                                        ) : <div className="h-full"><ShiftCell shiftCell={shiftCell} hours={getScheduleCellHours(shiftCell, nurse, date, activityLevel, agenda2026Data)} hasManualHours={hasManualHours} isWeekend={isWeekend} isClosingDay={isHoliday || activityLevel === 'CLOSED'} nurseId={nurse.id} weekId={weekId} activityLevel={activityLevel} strasbourgAssignments={strasbourgAssignments} dayOfWeek={dayOfWeek} isShortFriday={false}/></div>}
                                    </div>
                                    <div className="space-y-1 text-xs mt-auto">
                                        {isDayActive ? (<>
                                            <div className="flex items-center gap-1"><input type="time" value={dayData.startTime} onChange={e => handleDataChange(dateKey, 'startTime', e.target.value)} className="w-full text-center p-0.5 border rounded-md text-xs bg-white disabled:bg-slate-200/50 disabled:cursor-not-allowed" disabled={!canEditHours} /><span className="text-slate-400">-</span><input type="time" value={dayData.endTime} onChange={e => handleDataChange(dateKey, 'endTime', e.target.value)} className="w-full text-center p-0.5 border rounded-md text-xs bg-white disabled:bg-slate-200/50 disabled:cursor-not-allowed" disabled={!canEditHours} /></div>
                                            <div className="text-center font-bold text-slate-700 h-4">{dailyHours > 0 ? `${dailyHours.toFixed(2)}h` : ''}</div>
                                            <input type="text" placeholder={canEditHours ? "Nota..." : ""} value={dayData.note} onChange={e => handleDataChange(dateKey, 'note', e.target.value)} className="w-full text-xs p-1 border rounded-md bg-white disabled:bg-slate-200/50 disabled:cursor-not-allowed" disabled={!canEditHours} />
                                        </>) : <div className="h-16"></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                 {/* Balance Sidebar */}
                <aside className="w-1/3 lg:w-1/4 flex-shrink-0 overflow-y-auto space-y-6 bg-slate-50/70 p-4 rounded-lg no-print">
                    <h4 className="font-bold text-lg text-slate-800">Resumen y Balance</h4>
                    <div>
                        <PersonalBalanceView balanceData={balanceData} />
                    </div>
                    <div className="bg-white p-4 rounded-lg text-sm space-y-1 shadow-sm border">
                        <h4 className="font-semibold text-gray-700">Resumen de Horas (Mes)</h4>
                        <p className="font-bold text-lg text-slate-800">
                            Total Horas: {totalMonthlyHours.toFixed(2)}h
                        </p>
                        <div className="pt-2 mt-2 border-t border-slate-200">
                            <p className="text-slate-600">
                                {t.theoreticalHoursMonth}: <span className="font-bold">{theoreticalHoursData.theoreticalHours.toFixed(1)}h</span>
                            </p>
                            <p className="text-xs text-slate-500 italic">
                                {t.theoreticalHoursCalculation
                                    .replace('{normalDays}', theoreticalHoursData.normalWorkDays.toString())
                                    .replace('{specialDays}', theoreticalHoursData.specialDays.toString())}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg text-sm space-y-2 shadow-sm border">
                        <h4 className="font-semibold text-gray-700">{t.balance_info_title}</h4>
                        <div className="flex justify-between items-center">
                            <span>{t.balance_info_realizadas}:</span>
                            <span className="font-bold text-slate-800">{totalMonthlyHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>{t.balance_info_teoricas}:</span>
                            <span className="font-bold text-slate-800">{theoreticalHoursData.theoreticalHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                            <span className="font-semibold">{t.balance_info_diferencia}:</span>
                            <span className={`font-bold text-lg ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {difference > 0 ? '+' : ''}{difference.toFixed(1)}h
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg text-sm space-y-2 shadow-sm border">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                            Historial de intercambios de turnos
                        </h4>
                        {swapHistoryForMonth.length === 0 ? (
                            <p className="text-xs text-slate-500 italic text-center py-2">No hay intercambios este mes.</p>
                        ) : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {swapHistoryForMonth.map(swap => (
                                    <div key={swap.dateKey} className="text-xs p-2 bg-slate-100 rounded-md">
                                        <p className="font-bold text-slate-800">{new Date(swap.dateKey + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                        <p className="text-slate-600">Intercambio de turnos (solo visual)</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <ShiftDisplay cell={swap.originalShift} />
                                            <span>&rarr;</span>
                                            <ShiftDisplay cell={swap.shownShift} />
                                        </div>
                                        <p className="text-slate-500 mt-1">Con: <span className="font-medium text-slate-600">{swap.swappedWithNurseName}</span></p>
                                        <p className="text-slate-400 text-right text-[10px] mt-1">Por: {swap.adminUser}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    </div>
  );
};