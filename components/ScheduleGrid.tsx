import React, { useMemo } from 'react';
import type { Nurse, Schedule, RuleViolation, Agenda, ActivityLevel, ScheduleCell, Notes, Hours, JornadaLaboral } from '../types';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getScheduleCellHours, getShiftsFromCell } from '../utils/scheduleUtils';
import { holidays2026 } from '../data/agenda2026';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslations } from '../hooks/useTranslations';
import { ShiftCell } from './ShiftCell';
import { EditableNoteCell } from './EditableNoteCell';

const activityStyles: Record<ActivityLevel, { bg: string; text: string; weekBg: string; weekText: string }> = {
  NORMAL: { bg: 'bg-slate-50', text: 'text-slate-800', weekBg: 'bg-slate-600', weekText: 'text-white' },
  SESSION: { bg: 'bg-rose-100', text: 'text-rose-900', weekBg: 'bg-rose-700', weekText: 'text-white' },
  WHITE_GREEN: { bg: 'bg-emerald-50', text: 'text-emerald-800', weekBg: 'bg-emerald-600', weekText: 'text-white' },
  REDUCED: { bg: 'bg-amber-50', text: 'text-amber-800', weekBg: 'bg-amber-600', weekText: 'text-white' },
  CLOSED: { bg: 'bg-gray-200', text: 'text-gray-600', weekBg: 'bg-gray-500', weekText: 'text-white' }
};

const DayHeaderCell: React.FC<{ day: number, dayOfWeek: string, isWeekend: boolean, activityLevel: ActivityLevel, isNewWeek: boolean, weekId: string, weekLabel: string }> = ({ day, dayOfWeek, isWeekend, activityLevel, isNewWeek, weekId, weekLabel }) => {
    const style = activityStyles[activityLevel];
    const finalBg = isWeekend ? 'bg-gray-200' : style.bg;
    const textColor = isWeekend ? 'text-gray-700' : style.text;

    return (
        <div className={`w-full h-full flex flex-col ${finalBg}`}>
            {isNewWeek && (
                <div className={`h-5 ${style.weekBg} ${style.weekText} flex items-center justify-center flex-shrink-0`}>
                    <span className="font-bold text-xs tracking-wider">{weekLabel} {weekId.split('-W')[1]}</span>
                </div>
            )}
            <div className={`flex-grow flex items-center justify-center gap-2 ${textColor}`}>
                <span className="text-2xl font-bold">{day}</span>
                <span className="text-xs font-medium uppercase tracking-wider">{dayOfWeek}</span>
            </div>
        </div>
    );
};

interface ScheduleGridProps {
  nurses: Nurse[];
  schedule: Schedule;
  currentDate: Date;
  violations: RuleViolation[];
  agenda: Agenda;
  notes: Notes;
  hours: Hours;
  onNoteChange: (dateKey: string, text: string, color: string) => void;
  vaccinationPeriod: { start: string; end: string } | null;
  zoomLevel: number;
  strasbourgAssignments: Record<string, string[]>;
  isMonthClosed: boolean;
  jornadasLaborales: JornadaLaboral[];
  onCellDoubleClick: (dateKey: string, nurseId: string) => void;
  onOpenHoursEdit: (nurseId: string, dateKey: string, anchorEl: HTMLElement) => void;
  onCellClick?: (nurseId: string, dateKey: string, shift: ScheduleCell) => void;
}

const EXCLUDED_SHIFTS: Set<string> = new Set(['TW', 'FP', 'SICK_LEAVE', 'RECUP', 'CA', 'CS', 'STRASBOURG']);

export const BASE_CELL_WIDTH = 140;
export const DAY_COL_WIDTH = 140;
export const PRESENT_COL_WIDTH = 70;
export const NOTES_COL_WIDTH = 140;

export const ScheduleGrid = React.forwardRef<HTMLDivElement, ScheduleGridProps>((props, ref) => {
    const { nurses, schedule, currentDate, violations, agenda, notes, hours, onNoteChange, zoomLevel, strasbourgAssignments, isMonthClosed, jornadasLaborales, onCellDoubleClick, onOpenHoursEdit, onCellClick } = props;
    const { language } = useLanguage();
    const permissions = usePermissions();
    const t = useTranslations();
    
    const dayFormatter = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
        return [0, 1, 2, 3, 4, 5, 6].map(d => formatter.format(new Date(Date.UTC(2023, 0, d + 1))).replace(/\./g, ''));
    }, [language]);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    let lastWeekId: string | null = null;
    
    return (
        <div ref={ref} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 overflow-auto print-grid-container" style={{ maxHeight: 'calc(100vh - 270px)' }}>
            <table className="min-w-full border-collapse table-fixed">
                <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm">
                    <tr>
                        <th className="sticky top-0 left-0 z-30 bg-white/80 backdrop-blur-sm border-b-2 border-slate-200" style={{ width: `${DAY_COL_WIDTH * zoomLevel}px` }}>
                            <div className="w-full h-16 flex flex-col items-center justify-center p-1">
                                <span className="text-lg font-bold text-zen-800 capitalize">{currentDate.toLocaleString(language, { month: 'long' })}</span>
                                <span className="text-sm font-semibold text-slate-500">{year}</span>
                            </div>
                        </th>
                        {nurses.map(nurse => (
                            <th key={nurse.id} className="h-16 text-center border-b-2 border-slate-200 px-1" style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px` }}>
                                <span className="font-semibold text-slate-700 truncate text-sm block">{nurse.name}</span>
                            </th>
                        ))}
                        <th className="h-16 text-center border-b-2 border-slate-200 no-print" style={{ width: `${PRESENT_COL_WIDTH * zoomLevel}px`}}><span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">{t.present}</span></th>
                        <th className="h-16 text-center border-b-2 border-slate-200 no-print" style={{ width: `${NOTES_COL_WIDTH * zoomLevel}px` }}><span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">{t.notes}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {days.map(day => {
                        const date = new Date(Date.UTC(year, month, day));
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayOfWeek = date.getUTCDay();
                        const dayOfWeekStr = dayFormatter[dayOfWeek];
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const weekId = getWeekIdentifier(date);
                        const isHoliday = year === 2026 && holidays2026.has(dateKey);
                        const activityLevel = agenda[weekId] || 'NORMAL';
                        const isNewWeek = weekId !== lastWeekId;
                        lastWeekId = weekId;

                        let presentCount = 0;
                        nurses.forEach(nurse => {
                            const shiftCell = schedule[nurse.id]?.[dateKey];
                            const shifts = getShiftsFromCell(shiftCell);
                            if (shifts.length > 0 && !shifts.some(s => EXCLUDED_SHIFTS.has(s))) {
                                presentCount++;
                            }
                        });

                        const presentCountClass = presentCount < 6 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700';
                        const presentCellBg = isWeekend ? 'bg-slate-100/80' : 'bg-white/80';

                        return (
                            <tr key={day} className="group relative">
                                <td className="sticky left-0 z-10 border-r border-b border-gray-200/80" style={{ width: `${DAY_COL_WIDTH * zoomLevel}px`}}>
                                    <DayHeaderCell day={day} dayOfWeek={dayOfWeekStr} isWeekend={isWeekend} activityLevel={activityLevel} isNewWeek={isNewWeek} weekId={weekId} weekLabel={t.week} />
                                </td>
                                {nurses.map(nurse => {
                                    const isClosingDay = isHoliday || activityLevel === 'CLOSED';
                                    const shiftCell = schedule[nurse.id]?.[dateKey];
                                    const violation = violations.find(v => (v.nurseId === nurse.id || v.nurseId === 'global') && (v.dateKey === dateKey || (v.weekId === weekId && !v.dateKey)));
                                    const isShortFriday = dayOfWeek === 5 && agenda[getWeekIdentifier(new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000))] !== 'SESSION';
                                    
                                    let displayHours: string | { morning: string; afternoon: string } | string[];
                                    const dailyHoursData = hours[nurse.id]?.[dateKey];
                                    const hasManualHours = dailyHoursData?.segments?.some(s => s.startTime || s.endTime);

                                    if (hasManualHours) {
                                        displayHours = dailyHoursData!.segments!.filter(s => s.startTime && s.endTime).map(s => `${s.startTime.substring(0, 5)}-${s.endTime.substring(0, 5)}`);
                                    } else {
                                        displayHours = getScheduleCellHours(shiftCell, nurse, date, activityLevel, agenda, jornadasLaborales);
                                    }
                                    
                                    return (
                                        <td 
                                            key={nurse.id} 
                                            className={`relative border-r border-b border-gray-200/80 h-16 hover:bg-nova-50/50 transition-colors ${permissions.canManageSwaps && !isMonthClosed ? 'cursor-pointer' : ''}`}
                                            style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px` }}
                                            onClick={() => onCellClick && shiftCell && onCellClick(nurse.id, dateKey, shiftCell)}
                                            onDoubleClick={(e) => {
                                                if (permissions.canManageSwaps && !isMonthClosed) {
                                                    e.preventDefault();
                                                    onCellDoubleClick(dateKey, nurse.id);
                                                }
                                            }}
                                        >
                                            <ShiftCell shiftCell={shiftCell} hours={displayHours} hasManualHours={!!hasManualHours} violation={violation} isWeekend={isWeekend} isClosingDay={isClosingDay} nurseId={nurse.id} dateKey={dateKey} weekId={weekId} activityLevel={activityLevel} strasbourgAssignments={strasbourgAssignments} dayOfWeek={dayOfWeek} isShortFriday={isShortFriday} isMonthClosed={isMonthClosed} onOpenHoursEdit={onOpenHoursEdit} />
                                        </td>
                                    );
                                })}
                                <td className={`h-16 border-b border-r border-gray-200/80 text-center ${presentCellBg} no-print`} style={{ width: `${PRESENT_COL_WIDTH * zoomLevel}px`}}>
                                    {presentCount > 0 && (
                                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm shadow-inner ${presentCountClass}`}>
                                            {presentCount}
                                        </div>
                                    )}
                                </td>
                                <td className={`h-16 border-b border-r border-gray-200/80 p-0 no-print`} style={{ width: `${NOTES_COL_WIDTH * zoomLevel}px` }}>
                                    <EditableNoteCell note={notes[dateKey]} dateKey={dateKey} isWeekend={isWeekend} canEdit={!isMonthClosed && permissions.canEditGeneralNotes} onNoteChange={onNoteChange} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});
ScheduleGrid.displayName = 'ScheduleGrid';
