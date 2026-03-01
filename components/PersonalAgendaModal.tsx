import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Nurse, Schedule, ScheduleCell, Agenda, Hours, BalanceData, SpecialStrasbourgEvent, HistoryEntry, JornadaLaboral, ManualChangeLogEntry, PersonalHoursChangePayload } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon, MaximizeIcon, RestoreIcon, PdfIcon } from './Icons';
import { ShiftCell } from './ScheduleGrid'; // Re-use for consistent shift display
import { PersonalBalanceView } from './PersonalBalanceView';
import { holidays2026 } from '../data/agenda2026';
import { agenda2026Data } from '../data/agenda2026'; // To get activity level
import { getWeekIdentifier, getDateOfWeek } from '../utils/dateUtils';
import { getScheduleCellHours, recalculateScheduleForMonth, getShiftsFromCell } from '../utils/scheduleUtils';
import { calculateHoursForDay, calculateHoursDifference } from '../utils/hoursUtils';
import { SHIFTS } from '../constants';
import { generatePersonalAgendaPdf } from '../utils/exportUtils';
import { getActiveJornada } from '../utils/jornadaUtils';
import { Locale } from '../translations/locales';

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

interface LocalDayData {
    segments: [
        { startTime: string; endTime: string },
        { startTime: string; endTime: string }
    ];
    note: string;
}

interface LocalMonthData {
  [dateKey: string]: LocalDayData;
}

const isDateInWorkPeriod = (nurse: Nurse, date: Date): boolean => {
    if (nurse.id === 'nurse-11') {
        const month = date.getUTCMonth();
        return month >= 9 || month <= 1;
    }
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
  originalSchedule: Schedule[string];
  currentSchedule: Schedule[string];
  manualOverrides: Schedule;
  manualChangeLog: ManualChangeLogEntry[];
  hours: Hours;
  onClose: () => void;
  onNavigate: (newDate: Date) => void;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  balanceData: BalanceData;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  nurses: Nurse[];
  history: HistoryEntry[];
  onExportAnnual: (nurse: Nurse, useOriginal: boolean) => Promise<void>;
    onSavePersonalHours: (payload: PersonalHoursChangePayload) => Promise<void>;
  jornadasLaborales: JornadaLaboral[];
}

const CommentModal: React.FC<{
    dateKey: string;
    initialValue: string;
    onSave: (comment: string) => void;
    onClose: () => void;
}> = ({ dateKey, initialValue, onSave, onClose }) => {
    const t = useTranslations();
    const [comment, setComment] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSave = () => {
        onSave(comment);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-4 m-4 max-w-sm w-full relative">
                <h3 className="text-lg font-semibold mb-2">{t['comment.add_for_day']}</h3>
                <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full p-2 border rounded-md"
                />
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-200 rounded-md">{t.cancel}</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-zen-800 text-white rounded-md">{t.save}</button>
                </div>
            </div>
        </div>
    );
};

const ShiftDisplay: React.FC<{ cell: ScheduleCell | 'DELETE' | undefined }> = ({ cell }) => {
    const t = useTranslations();
    if (!cell) return <span className="text-slate-500 italic">{t.shift_free}</span>;
    if (cell === 'DELETE') return <span className="text-red-500 italic">{t.deleteShift}</span>;
    
    let shiftId;
    if (typeof cell === 'string') shiftId = cell;
    else if (typeof cell === 'object' && 'type' in cell && cell.type) shiftId = cell.type;

    const shiftInfo = shiftId ? SHIFTS[shiftId] : null;
    if (shiftInfo) return <div className={`px-1.5 py-0.5 text-xs font-semibold rounded ${shiftInfo.color} ${shiftInfo.textColor}`}>{shiftInfo.label}</div>
    if (typeof cell === 'object' && 'custom' in cell) return <div className="px-1.5 py-0.5 text-xs font-semibold rounded bg-slate-200 text-slate-700">{cell.custom.split('\n')[0]}</div>
    return <span className="text-slate-500 italic">{t.shift_complex}</span>;
}

const getDayName = (dayOfWeek: number, t: Locale) => {
    const dayMap: Record<number, string> = { 1: t.day_monday, 2: t.day_tuesday, 3: t.day_wednesday, 4: t.day_thursday, 5: t.day_friday };
    return dayMap[dayOfWeek] || '';
};

const getRuleDescription = (jornada: JornadaLaboral, t: Locale): string => {
    if (jornada.porcentaje === 100 || !jornada.reductionOption) return '';
    const descriptionKey = `jornada_summary_${jornada.reductionOption}` as keyof Locale;
    let description = t[descriptionKey] as string;
    if (description) {
        if (jornada.reductionDayOfWeek) description = description.replace('{day}', getDayName(jornada.reductionDayOfWeek, t));
        if (jornada.secondaryReductionDayOfWeek) description = description.replace('{day}', getDayName(jornada.secondaryReductionDayOfWeek, t));
        return `${t.reduction} ${jornada.porcentaje}%: ${description}`;
    }
    return `${t.reduction} ${jornada.porcentaje}%`;
};

export const PersonalAgendaModal: React.FC<PersonalAgendaModalProps> = ({
  nurse,
  currentDate,
  originalSchedule,
  currentSchedule,
  manualOverrides,
  manualChangeLog,
  hours,
  onClose,
  onNavigate,
  agenda,
  strasbourgAssignments,
  balanceData,
  specialStrasbourgEvents,
  nurses,
  history,
  onExportAnnual,
    onSavePersonalHours,
  jornadasLaborales,
}) => {
  const t = useTranslations();
  const { language } = useLanguage();
  const { user: authUser } = useUser();
  const permissions = usePermissions();
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'original'>('current');

  const displayedSchedule = activeTab === 'current' ? currentSchedule : originalSchedule;

  const monthKey = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  }, [currentDate]);

  const [localData, setLocalData] = useState<LocalMonthData>({});
  const [manualPreviousBalanceInput, setManualPreviousBalanceInput] = useState<string>('0');
  const [commentModalState, setCommentModalState] = useState<{ dateKey: string } | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [isExportingMonth, setIsExportingMonth] = useState(false);
  const [isExportingYear, setIsExportingYear] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  const canEditHours = permissions.canSeePersonalAgendaAsEditable(nurse.id);

    const getDefaultDayData = (): LocalDayData => ({
        segments: [
            { startTime: '', endTime: '' },
            { startTime: '', endTime: '' }
        ],
        note: ''
    });

    const getEffectiveDayData = (dateKey: string): LocalDayData => {
        const local = localData[dateKey];
        if (local) return local;

        const fromHours = hours[nurse.id]?.[dateKey];
        if (!fromHours) return getDefaultDayData();

        const sourceSegments = fromHours.segments || [];
        return {
            segments: [
                { startTime: sourceSegments[0]?.startTime || '', endTime: sourceSegments[0]?.endTime || '' },
                { startTime: sourceSegments[1]?.startTime || '', endTime: sourceSegments[1]?.endTime || '' }
            ],
            note: fromHours.note || ''
        };
    };

    const calculateManualHoursFromSegments = (dayData: LocalDayData): number => {
        return dayData.segments.reduce((sum, segment) => {
            if (!segment.startTime || !segment.endTime) return sum;
            return sum + Math.max(0, calculateHoursDifference(segment.startTime, segment.endTime));
        }, 0);
    };
  
  useEffect(() => {
    try {
            setLocalData({});

      // Automatically load the previous month's total balance as the default value.
      const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
      const prevBalanceCacheKey = `totalBalanceCache-${nurse.id}-${prevMonthKey}`;
      
      const storedPrevBalance = localStorage.getItem(prevBalanceCacheKey);
      if (storedPrevBalance) {
          try {
              const prevBalance = JSON.parse(storedPrevBalance);
              setManualPreviousBalanceInput(Number(prevBalance).toFixed(2));
          } catch {
              setManualPreviousBalanceInput('0.00');
          }
      } else {
          setManualPreviousBalanceInput('0.00');
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      setLocalData({});
      setManualPreviousBalanceInput('0.00'); // Fallback in case of error
    }
  }, [nurse.id, monthKey, currentDate]);

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

    const handleDataChange = (
        dateKey: string,
        segmentIndex: 0 | 1,
        field: 'startTime' | 'endTime',
        value: string
    ) => {
    setLocalData(prev => ({
      ...prev,
      [dateKey]: {
                ...(prev[dateKey] || getEffectiveDayData(dateKey)),
                segments: (prev[dateKey]?.segments || getEffectiveDayData(dateKey).segments).map((segment, index) => {
                    if (index !== segmentIndex) return segment;
                    return { ...segment, [field]: value };
                }) as LocalDayData['segments']
      }
    }));
  };

    const persistDayData = async (dateKey: string, explicitData?: LocalDayData) => {
        if (!canEditHours || authUser?.role === 'admin') return;
        const dayData = explicitData || getEffectiveDayData(dateKey);
        const segmentsToSave = dayData.segments.filter(segment => segment.startTime && segment.endTime);
        await onSavePersonalHours({
            nurseId: nurse.id,
            dateKey,
            segments: segmentsToSave,
            reason: dayData.note?.trim() || undefined
        });
    };

  const handleSaveComment = (dateKey: string, comment: string) => {
        const updatedDayData: LocalDayData = {
            ...getEffectiveDayData(dateKey),
            note: comment.trim()
        };
        setLocalData(prev => ({ ...prev, [dateKey]: updatedDayData }));
        persistDayData(dateKey, updatedDayData);
    setCommentModalState(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    const grid: (Date | null)[] = [];
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    const firstDayOfWeek_MonIsZero = (firstDayOfMonth.getUTCDay() + 6) % 7;
    const loopStartDate = new Date(firstDayOfMonth);
    loopStartDate.setUTCDate(firstDayOfMonth.getUTCDate() - firstDayOfWeek_MonIsZero);
    
    let renderStartDate = new Date(loopStartDate);
    if (renderStartDate.getUTCMonth() !== month) {
        renderStartDate.setUTCDate(renderStartDate.getUTCDate() + 7);
    }
    
    const lastDayOfWeek_MonIsZero = (lastDayOfMonth.getUTCDay() + 6) % 7;
    const loopEndDate = new Date(lastDayOfMonth);
    loopEndDate.setUTCDate(loopEndDate.getUTCDate() + (6 - lastDayOfWeek_MonIsZero));
    
    for (let d = new Date(loopStartDate); d <= loopEndDate; d.setUTCDate(d.getUTCDate() + 1)) {
        if (d < renderStartDate) {
            grid.push(null);
        } else {
            grid.push(new Date(d));
        }
    }

    return grid;
}, [year, month]);

  const weeklyBalances = useMemo(() => {
    const balances: { theoretical: number; manual: number; diff: number }[] = [];
    
    for (let i = 0; i < calendarGrid.length; i += 7) {
        const weekDates = calendarGrid.slice(i, i + 7);
        const firstDayOfWeek = weekDates.find(d => d);

        if (!firstDayOfWeek) {
            balances.push({ theoretical: 0, manual: 0, diff: 0 });
            continue;
        }

        const activeJornada = getActiveJornada(nurse.id, firstDayOfWeek, jornadasLaborales);
        let weekTheoreticalFixed = 40;
        if (activeJornada) {
            if (activeJornada.porcentaje === 90) weekTheoreticalFixed = 36;
            else if (activeJornada.porcentaje === 80) weekTheoreticalFixed = 32;
        }
        
        let weekManual = 0;
        let weekRealTotal = 0;

        weekDates.forEach(date => {
            if (date) {
                const dateKey = date.toISOString().split('T')[0];
                
                // In original mode, don't use manual hours
                const dailyManual = activeTab === 'current' ? calculateManualHoursFromSegments(getEffectiveDayData(dateKey)) : 0;

                if (dailyManual > 0 && activeTab === 'current') {
                    weekManual += dailyManual;
                    weekRealTotal += dailyManual;
                } else {
                    const dayOfWeek = date.getUTCDay();
                    const weekId = getWeekIdentifier(date);
                    const activityLevel = agenda[weekId] || 'NORMAL';
                    const isHoliday = holidays2026.has(dateKey);
                    const shiftCell = displayedSchedule?.[dateKey];
                    const shifts = getShiftsFromCell(shiftCell);
                    const isSickDay = shifts.includes('SICK_LEAVE');

                    let dailyHours = 0;
                    if (activityLevel === 'CLOSED' || isHoliday || isSickDay) {
                        if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Mon-Thu
                            dailyHours = 8.5;
                        } else if (dayOfWeek === 5) { // Fri
                            dailyHours = 6.0;
                        }
                    } else {
                        const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
                        dailyHours = calculateHoursForDay(nurse, shiftCell, date, agenda, strasbourgAssignments, specialEvent, jornadasLaborales);
                    }
                    weekRealTotal += dailyHours;
                }
            }
        });

        if (weekRealTotal > 0 || weekManual > 0) {
             balances.push({
                theoretical: weekTheoreticalFixed,
                manual: weekManual,
                diff: weekRealTotal - weekTheoreticalFixed,
            });
        } else {
            balances.push({ theoretical: 0, manual: 0, diff: 0});
        }
    }
    return balances;
}, [calendarGrid, activeTab, displayedSchedule, localData, nurse, agenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales, hours]);

    const differenceBalance = useMemo(() => {
        if (activeTab !== 'current') return 0;
        return weeklyBalances.reduce((sum, week) => sum + week.diff, 0);
    }, [weeklyBalances, activeTab]);
    
    const manualPreviousBalance = parseFloat(manualPreviousBalanceInput) || 0;
    
    const totalMonthlyBalance = differenceBalance + manualPreviousBalance;
  
  useEffect(() => {
    if (activeTab === 'current') {
      const balanceCacheKey = `totalBalanceCache-${nurse.id}-${monthKey}`;
      const valueToPersist = totalMonthlyBalance;
      localStorage.setItem(balanceCacheKey, JSON.stringify(valueToPersist));
    }
  }, [totalMonthlyBalance, nurse.id, monthKey, activeTab]);

  const dayNames = useMemo(() => {
      const formatter = new Intl.DateTimeFormat(language, { weekday: 'long' });
      return [...Array(7).keys()].map(i => formatter.format(new Date(2023, 0, i + 2)));
  }, [language]);

  const handlePrevMonth = () => onNavigate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => onNavigate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const manualChangesForMonth = useMemo(() => {
    const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    return manualChangeLog
      .filter(log => log.nurseId === nurse.id && log.dateKey.startsWith(monthPrefix))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [manualChangeLog, nurse.id, currentDate]);
  
  const handleExportMonthPdf = async () => {
    setIsExportingMonth(true);
    document.body.classList.add('print-active');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('print-active');
        setIsExportingMonth(false);
    }, 500);
  };

  const handleExportYearPdf = async () => {
    setIsExportingYear(true);
    try {
      await onExportAnnual(nurse, activeTab === 'original');
    } catch (e) {
      console.error("Yearly PDF export failed", e);
    } finally {
      setIsExportingYear(false);
    }
  };

  return (
    <div className={`personal-agenda-modal-wrapper fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${!isMaximized ? 'p-4' : ''}`}>
        {commentModalState && canEditHours && (
            <CommentModal
                dateKey={commentModalState.dateKey}
                initialValue={getEffectiveDayData(commentModalState.dateKey).note || ''}
                onSave={(comment) => handleSaveComment(commentModalState.dateKey, comment)}
                onClose={() => setCommentModalState(null)}
            />
        )}
        <div ref={modalContentRef} className={`personal-agenda-modal-content bg-white shadow-xl relative transform transition-all flex flex-col ${isMaximized ? 'w-screen h-screen rounded-none p-6' : 'rounded-lg p-6 m-4 max-w-7xl w-full h-[95vh]'}`}>
            <header className="flex items-start justify-between pb-4 border-b mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">{nurse.name}</h2>
                <div className="flex items-center gap-2 no-print">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <div className="relative" ref={monthPickerRef}>
                        <button onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)} className="text-xl font-semibold text-gray-700 w-64 text-center capitalize border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-zen-500 focus:border-zen-500 py-2 px-4 bg-white hover:bg-gray-50 flex items-center justify-between gap-2">
                            <span>{`${currentDate.toLocaleString(language, { month: 'long' })} ${currentDate.getFullYear()}`}</span>
                            <svg className={`w-5 h-5 text-gray-500 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isMonthPickerOpen && <MonthPickerPopover currentDate={currentDate} onSelectDate={(newDate) => { onNavigate(newDate); setIsMonthPickerOpen(false); }} />}
                    </div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800"><ArrowRightIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1 border border-slate-200">
                        <button onClick={handleExportMonthPdf} disabled={isExportingMonth} title={t.exportPDFMonth} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md disabled:opacity-50 flex items-center gap-1.5">
                            {isExportingMonth ? '...' : <PdfIcon className="w-4 h-4" />} {t.month}
                        </button>
                        <button onClick={handleExportYearPdf} disabled={isExportingYear} title={t.exportPDFYear} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md disabled:opacity-50 flex items-center gap-1.5">
                            {isExportingYear ? '...' : <PdfIcon className="w-4 h-4" />} {t.year}
                        </button>
                    </div>
                    <button onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? t.restore : t.maximize} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                        {isMaximized ? <RestoreIcon className="w-6 h-6" /> : <MaximizeIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            </header>
            
            <div className="flex-grow flex gap-6 mt-4 overflow-hidden">
                <div className="personal-agenda-modal-main-content flex-1 overflow-y-auto pr-2">
                    <div className="flex border-b border-slate-200 mb-2 sticky top-0 bg-white z-10">
                        <button onClick={() => setActiveTab('current')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'current' ? 'border-b-2 border-zen-800 text-zen-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                            {t.individual_current_planning}
                        </button>
                        <button onClick={() => setActiveTab('original')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'original' ? 'border-b-2 border-zen-800 text-zen-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                            {t.individual_original_planning}
                        </button>
                    </div>
                    <div className="grid grid-cols-8 sticky top-0 bg-slate-100 z-10 border-b-2 border-slate-200">
                        {dayNames.map(dayName => <div key={dayName} className="p-2 text-center font-semibold text-slate-600 text-sm capitalize">{dayName}</div>)}
                        <div className="p-2 text-center font-semibold text-slate-600 text-sm">{t.nav_balance}</div>
                    </div>
                    <div className="grid grid-cols-8 border-l border-t border-slate-200">
                        {calendarGrid.flatMap((date, index) => {
                            const dayCell = date ? (
                                (() => {
                                    const isCurrentMonth = date.getUTCMonth() === month;
                                    const dateKey = date.toISOString().split('T')[0];
                                    const dayOfWeek = date.getUTCDay();
                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                    const weekId = getWeekIdentifier(date);
                                    const activityLevel = agenda[weekId] || 'NORMAL';
                                    const isHoliday = holidays2026.has(dateKey);
                                    const shiftCell = displayedSchedule?.[dateKey];
                                    const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
                                    const isDayActive = isDateInWorkPeriod(nurse, date);
                                    const bgColor = isWeekend ? 'bg-slate-50' : isCurrentMonth ? 'bg-white' : 'bg-slate-50/70';
                                    const inactiveClasses = !isDayActive ? 'bg-slate-100 text-slate-400' : 'hover:bg-zen-50';
                                    
                                    const activeJornada = getActiveJornada(nurse.id, date, jornadasLaborales);
                                    const reductionTooltip = activeJornada && activeJornada.porcentaje < 100 && (shiftCell || specialEvent) ? getRuleDescription(activeJornada, t) : '';

                                    return (
                                        <div 
                                          key={dateKey} 
                                          className={`relative p-1 border-r border-b border-slate-200 min-h-[12rem] flex flex-col ${inactiveClasses} ${bgColor}`}
                                          onDoubleClick={() => {
                                              if (activeTab === 'current' && isDayActive && canEditHours) {
                                                  setCommentModalState({ dateKey });
                                              }
                                          }}
                                        title={getEffectiveDayData(dateKey).note ? `${t['comment.hover']} ${getEffectiveDayData(dateKey).note}`: ''}
                                        >
                                            <div className={`text-xs font-semibold flex justify-between items-center ${isCurrentMonth ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {activeTab === 'current' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCommentModalState({ dateKey })}
                                                        disabled={!canEditHours || !isDayActive}
                                                        className="text-sm disabled:opacity-40"
                                                        title={t['comment.add_for_day']}
                                                    >
                                                        📝
                                                    </button>
                                                )}
                                                <span>{date.getUTCDate()}</span>
                                            </div>
                                            <div className="my-1 h-14 relative">
                                                {specialEvent && activeTab === 'current' ? (
                                                    <div className="w-full h-full p-1 flex items-center justify-center relative" title={`${specialEvent.name}${specialEvent.notes ? `\n\nNotas: ${specialEvent.notes}` : ''}`}>
                                                        <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${SHIFTS.STRASBOURG.color} ${SHIFTS.STRASBOURG.textColor} font-bold text-xs text-center`}><span className="truncate px-1">{specialEvent.name}</span>{specialEvent.startTime && specialEvent.endTime && <span className="text-[10px] opacity-80 mt-1">{calculateEventHours(specialEvent.startTime, specialEvent.endTime).toFixed(1)}h</span>}</div>
                                                    </div>
                                                ) : (() => {
                                                    const dailyHoursData = hours[nurse.id]?.[dateKey];
                                                    const hasManualHours = activeTab === 'current' && !!dailyHoursData?.segments?.some(s => s.startTime || s.endTime);
                                                    let displayHours: string | { morning: string; afternoon: string } | string[];
                                                    
                                                    if (hasManualHours) {
                                                        displayHours = dailyHoursData!.segments!.filter(s => s.startTime && s.endTime).map(s => `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`);
                                                    } else {
                                                        displayHours = getScheduleCellHours(shiftCell, nurse, date, activityLevel, agenda, jornadasLaborales);
                                                    }
                                                    
                                                    return <div className="h-full"><ShiftCell shiftCell={shiftCell} hours={displayHours} hasManualHours={!!hasManualHours} isWeekend={isWeekend} isClosingDay={isHoliday || activityLevel === 'CLOSED'} nurseId={nurse.id} weekId={weekId} activityLevel={activityLevel} strasbourgAssignments={strasbourgAssignments} dayOfWeek={dayOfWeek} isShortFriday={false} manualNote={activeTab === 'current' ? dailyHoursData?.note : undefined}/></div>;
                                                })()}
                                                {reductionTooltip && (
                                                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-1 ring-white" title={reductionTooltip}>
                                                        R
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow"></div>
                                            <div className="space-y-1 text-xs mt-auto">
                                                {(() => {
                                                    const dayData = getEffectiveDayData(dateKey);
                                                    const isSplitShift = typeof shiftCell === 'object' && shiftCell !== null && 'split' in shiftCell;
                                                    const segmentsToRender: Array<0 | 1> = isSplitShift ? [0, 1] : [0];

                                                    if (!isDayActive || activeTab !== 'current') {
                                                        return <div className="h-7"></div>;
                                                    }

                                                    return (
                                                        <>
                                                            {segmentsToRender.map(segmentIndex => (
                                                                <div key={`${dateKey}-seg-${segmentIndex}`} className="flex items-center gap-1">
                                                                    <input
                                                                        type="time"
                                                                        value={dayData.segments[segmentIndex].startTime}
                                                                        onChange={e => handleDataChange(dateKey, segmentIndex, 'startTime', e.target.value)}
                                                                        onBlur={() => persistDayData(dateKey)}
                                                                        className="w-full text-center p-0.5 border rounded-md text-xs bg-white disabled:bg-slate-200/50 disabled:cursor-not-allowed"
                                                                        disabled={!canEditHours}
                                                                    />
                                                                    <span className="text-slate-400">-</span>
                                                                    <input
                                                                        type="time"
                                                                        value={dayData.segments[segmentIndex].endTime}
                                                                        onChange={e => handleDataChange(dateKey, segmentIndex, 'endTime', e.target.value)}
                                                                        onBlur={() => persistDayData(dateKey)}
                                                                        className="w-full text-center p-0.5 border rounded-md text-xs bg-white disabled:bg-slate-200/50 disabled:cursor-not-allowed"
                                                                        disabled={!canEditHours}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div key={`empty-${index}`} className="border-r border-b border-slate-200 bg-slate-50 min-h-[12rem]"></div>
                            );

                            if ((index + 1) % 7 === 0) {
                                const weekIndex = Math.floor(index / 7);
                                const balance = weeklyBalances[weekIndex];
                                
                                const summaryCell = (
                                    <div key={`summary-${index}`} className="border-r border-b border-slate-200 bg-slate-100/70 min-h-[12rem] flex flex-col justify-center p-1 text-[11px]">
                                        {balance && (balance.theoretical > 0 || balance.manual > 0) ? (
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-slate-500">{t.balance_planned}:</span>
                                                    <span className="font-semibold text-slate-700">{balance.theoretical.toFixed(2)}h</span>
                                                </div>
                                                {activeTab === 'current' && (
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-slate-500">{t.balance_manual}:</span>
                                                        <span className="font-semibold text-slate-700">{balance.manual > 0 ? balance.manual.toFixed(2) + 'h' : '-'}</span>
                                                    </div>
                                                )}
                                                <div className={`pt-1 mt-1 border-t font-bold flex justify-between items-center px-1 text-xs ${balance.diff > 0.01 ? 'text-green-600' : balance.diff < -0.01 ? 'text-red-600' : 'text-slate-800'}`}>
                                                    <span className="">{t.balance_weekly}:</span>
                                                    <span className="">{balance.diff > 0.01 ? '+' : ''}{balance.diff.toFixed(2)}h</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                                return [dayCell, summaryCell];
                            }
                            return [dayCell];
                        })}
                        
                        {activeTab === 'current' && (
                            <>
                                <div className="col-span-7 p-2 border-r border-t bg-slate-100 font-semibold text-slate-700 text-sm flex items-center">
                                    {t.individual_previous_month}
                                </div>
                                <div className="col-span-1 p-1 border-r border-t bg-slate-100 flex items-center justify-center">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={manualPreviousBalanceInput}
                                        onChange={e => setManualPreviousBalanceInput(e.target.value)}
                                        disabled={!canEditHours}
                                        className={`w-full text-center p-1 border rounded-md text-sm font-bold ${
                                            manualPreviousBalance > 0.01 ? 'text-green-600' : 
                                            manualPreviousBalance < -0.01 ? 'text-red-600' : 
                                            'text-slate-800'}
                                            disabled:bg-slate-200/50 disabled:cursor-not-allowed disabled:text-slate-500`}
                                    />
                                </div>
                            </>
                        )}
                        
                        {activeTab === 'current' && (
                            <>
                                <div className="col-span-7 p-2 border-r border-t bg-slate-100 font-semibold text-slate-700 text-sm flex items-center">{t.individual_difference}</div>
                                <div className={`col-span-1 p-2 border-r border-t bg-slate-100 font-bold text-center flex items-center justify-center text-lg ${
                                    differenceBalance > 0.01 ? 'text-green-600' :
                                    differenceBalance < -0.01 ? 'text-red-600' :
                                    'text-slate-800'
                                }`}>
                                    {differenceBalance > 0.01 ? '+' : ''}{differenceBalance.toFixed(2)}h
                                </div>
                            </>
                        )}
                        
                        {activeTab === 'current' && (
                            <>
                                <div className="col-span-7 p-2 border-r border-t bg-slate-100 font-semibold text-slate-700 text-sm flex items-center">{t.individual_month_total}</div>
                                <div className={`col-span-1 p-2 border-r border-t bg-slate-100 font-bold text-center flex items-center justify-center text-lg ${
                                    totalMonthlyBalance > 0.01 ? 'text-green-600' :
                                    totalMonthlyBalance < -0.01 ? 'text-red-600' :
                                    'text-slate-800'
                                }`}>
                                    {totalMonthlyBalance > 0.01 ? '+' : ''}{totalMonthlyBalance.toFixed(2)}h
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <aside className="w-1/3 lg:w-1/4 flex-shrink-0 overflow-y-auto space-y-6 bg-slate-50/70 p-4 rounded-lg no-print">
                    <h4 className="font-bold text-lg text-slate-800">{t.summaryAndBalance}</h4>
                    <div><PersonalBalanceView balanceData={balanceData} /></div>
                    <div className="bg-white p-4 rounded-lg text-sm space-y-2 shadow-sm border">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-gray-700">{t.individual_manual_changes_month}</h4>
                        </div>
                        {manualChangesForMonth.length === 0 ? (
                            <p className="text-xs text-slate-500 italic text-center py-2">{t.individual_no_manual_changes}</p>
                        ) : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {manualChangesForMonth.map(change => (
                                    <div key={change.id} className="text-xs p-2 bg-slate-100 rounded-md">
                                        <p className="font-bold text-slate-800">{new Date(change.dateKey + 'T12:00:00').toLocaleDateString(language, { day: '2-digit', month: '2-digit' })}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <ShiftDisplay cell={change.originalShift} />
                                            <span>&rarr;</span>
                                            <ShiftDisplay cell={change.newShift} />
                                        </div>
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