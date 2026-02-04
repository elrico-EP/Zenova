
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Nurse, Schedule, ScheduleCell, Agenda, Hours, BalanceData, SpecialStrasbourgEvent, HistoryEntry, JornadaLaboral, ManualChangeLogEntry } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { usePersonalLogs } from '../hooks/usePersonalLogs';
import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon, MaximizeIcon, RestoreIcon, PdfIcon } from './Icons';
import { ShiftCell } from './ScheduleGrid'; 
import { PersonalBalanceView } from './PersonalBalanceView';
import { holidays2026 } from '../data/agenda2026';
import { agenda2026Data } from '../data/agenda2026'; 
import { getWeekIdentifier, getDateOfWeek } from '../utils/dateUtils';
import { getScheduleCellHours, recalculateScheduleForMonth, getShiftsFromCell } from '../utils/scheduleUtils';
import { calculateHoursForDay, calculateHoursDifference } from '../utils/hoursUtils';
import { SHIFTS } from '../constants';
import { generateAnnualAgendaPdf } from '../utils/exportUtils';
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-4 m-4 max-sm w-full relative">
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
                    <button onClick={() => onSave(comment)} className="px-4 py-2 text-sm bg-zen-800 text-white rounded-md">{t.save}</button>
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

// FIX: Define missing PersonalAgendaModalProps interface.
interface PersonalAgendaModalProps {
  nurse: Nurse;
  currentDate: Date;
  originalSchedule: Record<string, ScheduleCell>;
  currentSchedule: Record<string, ScheduleCell>;
  manualOverrides: Schedule;
  manualChangeLog: ManualChangeLogEntry[];
  hours: Hours;
  onClose: () => void;
  onNavigate: (date: Date) => void;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  balanceData: BalanceData;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  nurses: Nurse[];
  history: HistoryEntry[];
  onExportAnnual: (nurse: Nurse, useOriginal: boolean) => Promise<void>;
  jornadasLaborales: JornadaLaboral[];
}

export const PersonalAgendaModal: React.FC<PersonalAgendaModalProps> = ({
  nurse, currentDate, originalSchedule, currentSchedule, manualOverrides, manualChangeLog, hours, onClose, onNavigate, agenda, strasbourgAssignments, balanceData, specialStrasbourgEvents, nurses, history, onExportAnnual, jornadasLaborales,
}) => {
  const t = useTranslations();
  const { language } = useLanguage();
  const permissions = usePermissions();
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'original'>('current');
  const [commentModalState, setCommentModalState] = useState<{ dateKey: string } | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const { logs, saveLogs } = usePersonalLogs(nurse.id, monthKey);

  const canEditHours = permissions.canSeePersonalAgendaAsEditable(nurse.id);
  const displayedSchedule = activeTab === 'current' ? currentSchedule : originalSchedule;

  const handleDataChange = (dateKey: string, field: 'startTime' | 'endTime', value: string) => {
    const newLocalData = {
        ...logs.localData,
        [dateKey]: {
            ...(logs.localData[dateKey] || { startTime: '', endTime: '' }),
            [field]: value
        }
    };
    saveLogs({ localData: newLocalData });
  };
  
  const handleSaveComment = (dateKey: string, comment: string) => {
    const newComments = { ...logs.comments };
    if (comment.trim()) newComments[dateKey] = comment.trim();
    else delete newComments[dateKey];
    saveLogs({ comments: newComments });
    setCommentModalState(null);
  };

  const calendarGrid = useMemo(() => {
    const grid: (Date | null)[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    const startOffset = (firstDayOfMonth.getUTCDay() + 6) % 7;
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let d = 1; d <= lastDayOfMonth.getUTCDate(); d++) grid.push(new Date(Date.UTC(year, month, d)));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [currentDate]);

  const weeklyBalances = useMemo(() => {
    if (activeTab !== 'current') return [];
    const balances = [];
    for (let i = 0; i < calendarGrid.length; i += 7) {
        const weekDates = calendarGrid.slice(i, i + 7);
        const firstDay = weekDates.find(d => d);
        if (!firstDay) { balances.push({ theoretical: 0, manual: 0, diff: 0 }); continue; }

        const activeJornada = getActiveJornada(nurse.id, firstDay, jornadasLaborales);
        let weekTheoretical = 40;
        if (activeJornada) {
            if (activeJornada.porcentaje === 90) weekTheoretical = 36;
            else if (activeJornada.porcentaje === 80) weekTheoretical = 32;
        }
        
        let weekManual = 0, weekRealTotal = 0;
        weekDates.forEach(date => {
            if (date) {
                const dateKey = date.toISOString().split('T')[0];
                const dayData = logs.localData[dateKey] || { startTime: '', endTime: ''};
                const dailyManual = calculateHoursDifference(dayData.startTime, dayData.endTime);
                if (dailyManual > 0) { weekManual += dailyManual; weekRealTotal += dailyManual; } 
                else {
                    const shiftCell = displayedSchedule?.[dateKey];
                    const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
                    weekRealTotal += calculateHoursForDay(nurse, shiftCell, date, agenda, strasbourgAssignments, specialEvent, jornadasLaborales);
                }
            }
        });
        balances.push({ theoretical: weekTheoretical, manual: weekManual, diff: weekRealTotal - weekTheoretical });
    }
    return balances;
  }, [calendarGrid, activeTab, logs, nurse, agenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales, displayedSchedule]);

  const differenceBalance = useMemo(() => weeklyBalances.reduce((sum, week) => sum + week.diff, 0), [weeklyBalances]);
  const manualPreviousBalance = parseFloat(logs.previousBalance || '0') || 0;
  const totalMonthlyBalance = differenceBalance + manualPreviousBalance;

  const dayNames = useMemo(() => {
      const formatter = new Intl.DateTimeFormat(language, { weekday: 'long' });
      return [...Array(7).keys()].map(i => formatter.format(new Date(2023, 0, i + 2)));
  }, [language]);

  return (
    <div className={`personal-agenda-modal-wrapper fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
        {commentModalState && canEditHours && (
            <CommentModal
                dateKey={commentModalState.dateKey}
                initialValue={logs.comments[commentModalState.dateKey] || ''}
                onSave={(c) => handleSaveComment(commentModalState.dateKey, c)}
                onClose={() => setCommentModalState(null)}
            />
        )}
        <div className={`bg-white shadow-xl relative transform transition-all flex flex-col ${isMaximized ? 'w-screen h-screen rounded-none p-6' : 'rounded-lg p-6 max-w-7xl w-full h-[95vh]'}`}>
            <header className="flex items-start justify-between pb-4 border-b mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800">{nurse.name}</h2>
                <div className="flex items-center gap-2 no-print">
                    <button onClick={() => onNavigate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <div className="relative" ref={monthPickerRef}>
                        <button onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)} className="text-xl font-semibold text-gray-700 w-64 text-center capitalize border border-gray-300 rounded-md py-2 px-4 bg-white flex items-center justify-between gap-2">
                            <span>{`${currentDate.toLocaleString(language, { month: 'long' })} ${currentDate.getFullYear()}`}</span>
                            <svg className={`w-5 h-5 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {isMonthPickerOpen && <MonthPickerPopover currentDate={currentDate} onSelectDate={(d) => { onNavigate(d); setIsMonthPickerOpen(false); }} />}
                    </div>
                    <button onClick={() => onNavigate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><ArrowRightIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 text-gray-400 hover:text-gray-600">
                        {isMaximized ? <RestoreIcon className="w-6 h-6" /> : <MaximizeIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            </header>
            
            <div className="flex-grow flex gap-6 mt-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="flex border-b border-slate-200 mb-2 sticky top-0 bg-white z-10">
                        <button onClick={() => setActiveTab('current')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'current' ? 'border-b-2 border-zen-800 text-zen-800' : 'text-slate-500'}`}>{t.individual_current_planning}</button>
                        <button onClick={() => setActiveTab('original')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'original' ? 'border-b-2 border-zen-800 text-zen-800' : 'text-slate-500'}`}>{t.individual_original_planning}</button>
                    </div>
                    <div className={`grid ${activeTab === 'current' ? 'grid-cols-8' : 'grid-cols-7'} sticky top-0 bg-slate-100 z-10 border-b-2 border-slate-200`}>
                        {dayNames.map(dayName => <div key={dayName} className="p-2 text-center font-semibold text-slate-600 text-sm capitalize">{dayName}</div>)}
                         {activeTab === 'current' && <div className="p-2 text-center font-semibold text-slate-600 text-sm">{t.nav_balance}</div>}
                    </div>
                    <div className={`grid ${activeTab === 'current' ? 'grid-cols-8' : 'grid-cols-7'} border-l border-t border-slate-200`}>
                        {calendarGrid.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="border-r border-b border-slate-200 bg-slate-50 min-h-[12rem]"></div>;
                            const dateKey = date.toISOString().split('T')[0];
                            const dayData = logs.localData[dateKey] || { startTime: '', endTime: ''};
                            const isCurrentMonth = date.getUTCMonth() === currentDate.getMonth();
                            const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
                            const activeJornada = getActiveJornada(nurse.id, date, jornadasLaborales);

                            return (
                                <div key={dateKey} className={`relative p-1 border-r border-b border-slate-200 min-h-[12rem] flex flex-col ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/70'} hover:bg-zen-50`} onDoubleClick={() => canEditHours && setCommentModalState({ dateKey })}>
                                    <div className="text-xs font-semibold flex justify-between">
                                        {logs.comments[dateKey] && <span className="text-sm">📝</span>}
                                        <span>{date.getUTCDate()}</span>
                                    </div>
                                    <div className="my-1 h-14 relative">
                                        {specialEvent && activeTab === 'current' ? (
                                            <div className="w-full h-full p-1 flex flex-col items-center justify-center rounded-md bg-rose-200 text-rose-800 font-bold text-xs text-center"><span className="truncate w-full">{specialEvent.name}</span></div>
                                        ) : <ShiftCell shiftCell={displayedSchedule?.[dateKey]} hours={getScheduleCellHours(displayedSchedule?.[dateKey], nurse, date, 'NORMAL', agenda, jornadasLaborales)} hasManualHours={!!(dayData.startTime && dayData.endTime)} isWeekend={date.getUTCDay() === 0 || date.getUTCDay() === 6} isClosingDay={holidays2026.has(dateKey)} nurseId={nurse.id} weekId={getWeekIdentifier(date)} activityLevel="NORMAL" strasbourgAssignments={strasbourgAssignments} dayOfWeek={date.getUTCDay()} isShortFriday={false}/>}
                                    </div>
                                    <div className="mt-auto space-y-1 text-xs">
                                        {activeTab === 'current' && isDateInWorkPeriod(nurse, date) && (
                                            <div className="flex gap-1"><input type="time" value={dayData.startTime} onChange={e => handleDataChange(dateKey, 'startTime', e.target.value)} className="w-full text-center p-0.5 border rounded bg-white disabled:bg-slate-100" disabled={!canEditHours} /><input type="time" value={dayData.endTime} onChange={e => handleDataChange(dateKey, 'endTime', e.target.value)} className="w-full text-center p-0.5 border rounded bg-white disabled:bg-slate-100" disabled={!canEditHours} /></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {activeTab === 'current' && (
                            <>
                                <div className="col-span-7 p-2 border-r border-t bg-slate-100 font-semibold text-sm">{t.individual_previous_month}</div>
                                <div className="col-span-1 p-1 border-r border-t bg-slate-100">
                                    <input type="number" step="0.01" value={logs.previousBalance || '0'} onChange={e => saveLogs({ previousBalance: e.target.value })} disabled={!canEditHours} className="w-full text-center p-1 border rounded text-sm font-bold" />
                                </div>
                                <div className="col-span-7 p-2 border-r border-t bg-slate-100 font-semibold text-sm">{t.individual_month_total}</div>
                                <div className={`col-span-1 p-2 border-r border-t bg-slate-100 font-bold text-center text-lg ${totalMonthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalMonthlyBalance.toFixed(2)}h</div>
                            </>
                        )}
                    </div>
                </div>
                <aside className="w-1/4 flex-shrink-0 space-y-6 no-print">
                    <PersonalBalanceView balanceData={balanceData} />
                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
                        <h4 className="font-semibold text-gray-700">{t.individual_manual_changes_month}</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {manualChangeLog.filter(log => log.nurseId === nurse.id && log.dateKey.startsWith(monthKey)).map(change => (
                                <div key={change.id} className="text-xs p-2 bg-slate-100 rounded-md">
                                    <p className="font-bold">{change.dateKey}</p>
                                    <div className="flex items-center gap-2 mt-1"><ShiftDisplay cell={change.originalShift} /><span>&rarr;</span><ShiftDisplay cell={change.newShift} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
  );
};
