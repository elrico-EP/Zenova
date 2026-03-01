import React, { useRef, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import type { Nurse, Schedule, WorkZone, RuleViolation, Agenda, ActivityLevel, ScheduleCell, Notes, CustomShift, Hours, JornadaLaboral, SpecialStrasbourgEvent, DailyNote } from '../types';
import { SHIFTS } from '../constants';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getScheduleCellHours, getShiftsFromCell } from '../utils/scheduleUtils';
import { holidays2026 } from '../data/agenda2026';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslations } from '../hooks/useTranslations';
import { Locale } from '../translations/locales';

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

export const ShiftCell: React.FC<{
    shiftCell: ScheduleCell | undefined;
    hours: string | { morning: string; afternoon: string } | string[];
    hasManualHours: boolean;
    violation?: RuleViolation;
    isWeekend: boolean;
    isClosingDay: boolean;
    nurseId: string;
    weekId: string;
    activityLevel: ActivityLevel;
    strasbourgAssignments: Record<string, string[]>;
    dayOfWeek: number;
    isShortFriday: boolean;
    onOpenManualHoursModal?: (dateKey: string, nurseId: string) => void;
    dateKey: string;
    manualNote?: string;
}> = ({ shiftCell, hours, hasManualHours, violation, isWeekend, isClosingDay, nurseId, weekId, activityLevel, strasbourgAssignments, dayOfWeek, isShortFriday, onOpenManualHoursModal, dateKey, manualNote }) => {
    const t = useTranslations();
    const permissions = usePermissions();
    const attendees = strasbourgAssignments[weekId] || [];
    const title = violation?.message || (typeof shiftCell === 'string' ? t[SHIFTS[shiftCell]?.description as keyof Locale] as string : '');
    const hasMultipleHourLines = Array.isArray(hours) && hours.length > 1;

    const renderHours = () => {
        if (Array.isArray(hours)) {
            return hours.map((line, index) => (
                <span key={index} className="block text-[10px] leading-tight opacity-90 text-center font-semibold">
                    ({line})
                </span>
            ));
        }
        if (typeof hours === 'string' && hours) {
            return <span className={`block text-[10px] leading-tight opacity-90 text-center ${hasManualHours ? 'font-semibold' : 'font-mono'}`}>({hours})</span>;
        }
        return null;
    }

    if (activityLevel === 'SESSION' && dayOfWeek >= 1 && dayOfWeek <= 4 && attendees.includes(nurseId)) {
        const shift = SHIFTS['STRASBOURG'];
        return (
            <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={t[shift.description as keyof Locale] as string}>
                <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${shift.color} ${shift.textColor}`}>
                    <span className="font-bold text-base">{shift.label}</span>
                </div>
            </div>
        );
    }

    if (!shiftCell) {
        const style = activityStyles[activityLevel] || activityStyles['NORMAL'];
        const bgColor = isClosingDay ? 'bg-emerald-50/50' : isWeekend ? 'bg-slate-100/80' : style.bg;
        return <div className={`w-full h-full ${bgColor} relative`}></div>;
    }
    
    if (typeof shiftCell === 'object' && 'custom' in shiftCell) {
        const customShift = shiftCell as CustomShift;

        // Special rendering for STR-PREP: same background, no text.
        if (customShift.custom === 'STR-PREP') {
            const shift = SHIFTS['STRASBOURG'];
            return (
                <div 
                    className={`w-full h-full p-1 flex items-center justify-center relative rounded-md shadow-sm ${shift.color}`}
                    title={t[shift.description as keyof Locale] as string}
                >
                    {/* No text content rendered here */}
                </div>
            );
        }
        
        let bgColor = 'bg-slate-200';
        let textColor = 'text-slate-800';

        if (customShift.type && SHIFTS[customShift.type]) {
            bgColor = SHIFTS[customShift.type].color;
            textColor = SHIFTS[customShift.type].textColor;
        }
        
        const [mainLabel, ...notes] = customShift.custom.split('\n');

        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-center p-1 ${bgColor} ${textColor} font-medium text-xs rounded-md shadow-sm relative`} title={customShift.custom}>
                {permissions.isViewingAsAdmin && onOpenManualHoursModal && customShift.type === 'ADMIN' && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenManualHoursModal(dateKey, nurseId);
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 text-slate-400 hover:text-zen-600 z-10 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t.changeShiftHours}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}
                <span className="font-semibold">{mainLabel}</span>
                {customShift.time && <span className="text-[11px] opacity-80 font-mono">({customShift.time})</span>}
                {notes.length > 0 && <p className="text-[9px] leading-tight opacity-70 mt-0.5 truncate">{notes.join(' ')}</p>}
            </div>
        );
    }

    if (typeof shiftCell === 'object' && 'split' in shiftCell) {
        if (typeof hours === 'string' || Array.isArray(hours)) { 
             return (
                <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={title}>
                    <div className={`w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 rounded-md shadow-sm bg-purple-200 text-purple-800 ${violation ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                        <span className="font-bold text-base">Split</span>
                        {renderHours()}
                    </div>
                </div>
             )
        }
        
        const [morningPart, afternoonPart] = shiftCell.split;
        
        const getPartDisplayInfo = (part: ScheduleCell | null) => {
            if (!part) return null;
            if (typeof part === 'string' && SHIFTS[part]) {
                return { label: SHIFTS[part].label, color: SHIFTS[part].color, textColor: SHIFTS[part].textColor };
            }
            if (typeof part === 'object' && 'custom' in part) {
                if (part.type && SHIFTS[part.type]) {
                    return { label: part.custom.split('\n')[0], color: SHIFTS[part.type].color, textColor: SHIFTS[part.type].textColor };
                }
                return { label: part.custom.split('\n')[0], color: 'bg-slate-200', textColor: 'text-slate-800' };
            }
            return null;
        };

        const morningDisplayInfo = getPartDisplayInfo(morningPart);
        const afternoonDisplayInfo = getPartDisplayInfo(afternoonPart);


        return (
            <div className="w-full h-full flex flex-col gap-0.5 p-0.5 relative" title={title}>
                {morningDisplayInfo && (
                    <div className={`flex-grow min-h-0 flex flex-col items-center justify-center rounded-sm text-center p-1 ${morningDisplayInfo.color} ${morningDisplayInfo.textColor}`}>
                        <span className="font-semibold text-xs leading-tight">{morningDisplayInfo.label}</span>
                        {hours.morning && <span className="text-[10px] leading-tight opacity-90">({hours.morning})</span>}
                    </div>
                )}
                {afternoonDisplayInfo && (
                    <div className={`flex-grow min-h-0 flex flex-col items-center justify-center rounded-sm text-center p-1 ${afternoonDisplayInfo.color} ${afternoonDisplayInfo.textColor}`}>
                        <span className="font-semibold text-xs leading-tight">{afternoonDisplayInfo.label}</span>
                        {hours.afternoon && <span className="text-[10px] leading-tight opacity-90">({hours.afternoon})</span>}
                    </div>
                )}
            </div>
        );
    }
    
    const shift = SHIFTS[shiftCell as WorkZone];
    if (!shift) return <div className="w-full h-full bg-white/80 relative"></div>;

    let displayLabel = shift.label;
    if (isShortFriday && (shift.id === 'URGENCES' || shift.id === 'TRAVAIL')) {
      displayLabel = displayLabel.replace(' AM', '');
    }

    return (
        <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={title}>
            {permissions.isViewingAsAdmin && onOpenManualHoursModal && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenManualHoursModal(dateKey, nurseId);
                    }}
                    className="absolute top-0.5 right-0.5 p-0.5 text-slate-400 hover:text-zen-600 z-10 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t.changeShiftHours}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            )}
            <div className={`w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 rounded-md shadow-sm ${shift.color} ${shift.textColor} ${violation ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                <span className={`font-bold ${hasMultipleHourLines ? 'text-sm' : 'text-base'}`}>{displayLabel}</span>
                {renderHours()}
            </div>
            {manualNote && (
                <div className="absolute bottom-0.5 right-0.5 group/note" title={manualNote}>
                    <div className="w-2 h-2 bg-red-500 rounded-full cursor-help"></div>
                    <div className="absolute bottom-full right-0 mb-1 hidden group-hover/note:block bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                        {manualNote}
                    </div>
                </div>
            )}
        </div>
    );
};

const NOTE_COLORS = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100', 'bg-gray-100', 'bg-white'];

const EditableNoteCell: React.FC<{
  note: DailyNote | undefined;
  dateKey: string;
  isWeekend: boolean;
  canEdit: boolean;
  onNoteChange: (dateKey: string, text: string, color: string) => void;
}> = ({ note, dateKey, isWeekend, canEdit, onNoteChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note?.text || '');
  const [color, setColor] = useState(note?.color || (isWeekend ? 'bg-slate-100' : 'bg-white'));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  useEffect(() => {
    setText(note?.text || '');
    setColor(note?.color || (isWeekend ? 'bg-slate-100' : 'bg-white'));
  }, [note, isWeekend]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
    const handleSave = () => {
        if (isEditing) {
            onNoteChange(dateKey, textareaRef.current?.value || '', color);
            setIsEditing(false);
        }
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, dateKey, color, onNoteChange]);
  
  const handleSave = () => {
    onNoteChange(dateKey, text, color);
    setIsEditing(false);
  };
  
  if (isEditing) {
      return (
          <div ref={wrapperRef} className={`w-full h-full flex flex-col ${color} ring-2 ring-nova-400 rounded-md`}>
              <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.addNotePlaceholder}
                  className="w-full flex-grow bg-transparent border-none resize-none text-xs p-1 focus:outline-none"
              />
              <div className="flex justify-between items-center p-1">
                  <div className="flex gap-1">
                      {NOTE_COLORS.map(c => (
                          <button
                              key={c}
                              onClick={() => setColor(c)}
                              className={`w-4 h-4 rounded-full ${c} border ${color === c ? 'ring-2 ring-offset-1 ring-zen-500' : 'border-slate-300'} hover:border-gray-400`}
                          />
                      ))}
                  </div>
                  <button onClick={handleSave} className="px-2 py-0.5 bg-zen-800 text-white font-semibold rounded hover:bg-zen-700 text-xs">
                    {t.save}
                  </button>
              </div>
          </div>
      );
  }

  return (
      <div onClick={() => canEdit && setIsEditing(true)} className={`w-full h-full text-xs p-1 ${color} ${canEdit ? 'cursor-pointer' : ''} hover:ring-2 hover:ring-nova-400/50 rounded-md flex items-center justify-start`}>
          {text ? (
              <p className="line-clamp-3 text-slate-700 whitespace-pre-wrap">{text}</p>
          ) : (
              canEdit && <div className="text-slate-400 italic self-start">{t.addNotePlaceholder}</div>
          )}
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
  onOpenManualHoursModal?: (dateKey: string, nurseId: string) => void;
}

const EXCLUDED_SHIFTS: Set<WorkZone> = new Set<WorkZone>(['TW', 'FP', 'SICK_LEAVE', 'RECUP', 'CA', 'STRASBOURG']);

export const BASE_CELL_WIDTH = 140;
export const DAY_COL_WIDTH = 70;  // Reduced from 100 for more space to shifts
export const PRESENT_COL_WIDTH = 56;
export const NOTES_COL_WIDTH = 96;

export const ScheduleGrid = React.forwardRef<HTMLDivElement, ScheduleGridProps>(({ nurses, schedule, currentDate, violations, agenda, notes, hours, onNoteChange, zoomLevel, strasbourgAssignments, isMonthClosed, jornadasLaborales, onCellDoubleClick, onOpenManualHoursModal }, ref) => {
    const { language } = useLanguage();
    const permissions = usePermissions();
    const t = useTranslations();

    const dayFormatter = useMemo(() => {
        // Consistent day names, removing potential inconsistencies from toLocaleString on single dates.
        const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
        // JS getUTCDay() is Sun=0, Mon=1...
        const daysOfWeek = [
            formatter.format(new Date(Date.UTC(2023, 0, 1))), // Sun
            formatter.format(new Date(Date.UTC(2023, 0, 2))), // Mon
            formatter.format(new Date(Date.UTC(2023, 0, 3))), // Tue
            formatter.format(new Date(Date.UTC(2023, 0, 4))), // Wed
            formatter.format(new Date(Date.UTC(2023, 0, 5))), // Thu
            formatter.format(new Date(Date.UTC(2023, 0, 6))), // Fri
            formatter.format(new Date(Date.UTC(2023, 0, 7))), // Sat
        ].map(d => d.replace(/\./g, '')); // Remove all dots for consistency, e.g., "mié." -> "mié"
        return daysOfWeek;
    }, [language]);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    let lastWeekId: string | null = null;
    
    return (
        <div ref={ref} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 overflow-auto print-grid-container" style={{ maxHeight: 'calc(100vh - 270px)' }}>
            <table className="min-w-full border-collapse table-auto">
                <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm">
                    <tr>
                        <th className="sticky top-0 left-0 z-30 bg-slate-50 border-b-2 border-slate-200 p-px" style={{ width: `${DAY_COL_WIDTH * zoomLevel}px` }}>
                            <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-zen-50 to-white border-r border-slate-200">
                                <span className="text-[10px] font-black text-zen-800 uppercase tracking-[0.1em] leading-none mb-0.5">
                                    {currentDate.toLocaleString(language, { month: 'short' })}
                                </span>
                                <div className="h-[0.5px] w-3 bg-nova-400 mb-0.5"></div>
                                <span className="text-[8px] font-bold text-slate-400 tracking-wider">
                                    {year}
                                </span>
                            </div>
                        </th>
                        {nurses.map(nurse => {
                            return (
                                <th key={nurse.id} className="h-16 text-center border-b-2 border-slate-200 px-1" style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px`, minWidth: `${BASE_CELL_WIDTH * zoomLevel}px`, maxWidth: `${BASE_CELL_WIDTH * zoomLevel}px` }}>
                                    <span className="font-semibold text-slate-700 truncate text-sm block">{nurse.name}</span>
                                </th>
                            );
                        })}
                        <th className="h-16 text-center border-b-2 border-slate-200 no-print" style={{ width: '1%', minWidth: `${PRESENT_COL_WIDTH * zoomLevel}px` }}><span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">{t.present}</span></th>
                        <th className="h-16 text-center border-b-2 border-slate-200 no-print" style={{ width: '1%', minWidth: `${NOTES_COL_WIDTH * zoomLevel}px` }}><span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">{t.notes}</span></th>
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
                            if (shiftCell && !((typeof shiftCell === 'string') && EXCLUDED_SHIFTS.has(shiftCell as WorkZone))) presentCount++;
                        });

                        const dayHeader = <td className="sticky left-0 z-10 border-r border-b border-gray-200/80" style={{ width: `${DAY_COL_WIDTH * zoomLevel}px`}}><DayHeaderCell day={day} dayOfWeek={dayOfWeekStr} isWeekend={isWeekend} activityLevel={activityLevel} isNewWeek={isNewWeek} weekId={weekId} weekLabel={t.week} /></td>;
                        const presentCell = <td className={`h-16 border-b border-r border-gray-200/80 text-center ${isWeekend ? 'bg-slate-100/80' : 'bg-white/80'} no-print`} style={{ width: '1%', minWidth: `${PRESENT_COL_WIDTH * zoomLevel}px` }}>{presentCount > 0 && <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shadow-inner ${presentCount < 6 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{presentCount}</div>}</td>;
                        
                        const notesCell = (
                          <td className={`h-16 border-b border-r border-gray-200/80 p-0 no-print`} style={{ width: '1%', minWidth: `${NOTES_COL_WIDTH * zoomLevel}px` }}>
                            <EditableNoteCell
                              note={notes[dateKey]}
                              dateKey={dateKey}
                              isWeekend={isWeekend}
                              canEdit={!isMonthClosed && permissions.canEditGeneralNotes}
                              onNoteChange={onNoteChange}
                            />
                          </td>
                        );

                        if (activityLevel === 'CLOSED' && !isWeekend) {
                            return (
                                <tr key={day} className="group relative">
                                    {dayHeader}
                                    {nurses.map((nurse, nurseIndex) => <td key={nurse.id} className="border-r border-b border-gray-200/80 h-16 bg-gray-200 text-center" style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px` }}>{nurseIndex === Math.floor(nurses.length / 2) && <span className="text-xl font-bold text-gray-500 tracking-wider uppercase select-none">{t.closed}</span>}</td>)}
                                    {presentCell}{notesCell}
                                </tr>
                            );
                        }

                        const nurseCells = nurses.map(nurse => {
                            const isClosingDay = isHoliday || activityLevel === 'CLOSED';
                            const shiftCell = schedule[nurse.id]?.[dateKey];
                            
                            const violation = violations.find(v => (v.nurseId === nurse.id || v.nurseId === 'global') && (v.dateKey === dateKey || (v.weekId === weekId && !v.dateKey)));
                            const isShortFriday = dayOfWeek === 5 && agenda[getWeekIdentifier(new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000))] !== 'SESSION';

                            let displayHours: string | { morning: string; afternoon: string } | string[];
                            const dailyHoursData = hours[nurse.id]?.[dateKey];
                            const hasManualHours = dailyHoursData?.segments?.some(s => s.startTime || s.endTime);

                            if (hasManualHours) {
                                displayHours = dailyHoursData!.segments!.filter(s => s.startTime && s.endTime).map(s => `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`);
                            } else {
                                displayHours = getScheduleCellHours(shiftCell, nurse, date, activityLevel, agenda, jornadasLaborales);
                            }
                            
                            return (
                                <td 
                                    key={nurse.id} 
                                    className={`relative border-r border-b border-gray-200/80 h-16 hover:bg-nova-50/50 transition-colors ${permissions.canManageSwaps && !isMonthClosed ? 'cursor-pointer' : ''}`}
                                    style={{ width: `${BASE_CELL_WIDTH * zoomLevel}px`, minWidth: `${BASE_CELL_WIDTH * zoomLevel}px`, maxWidth: `${BASE_CELL_WIDTH * zoomLevel}px` }}
                                    onDoubleClick={(e) => {
                                        if (permissions.canManageSwaps && !isMonthClosed) {
                                            e.preventDefault();
                                            onCellDoubleClick(dateKey, nurse.id);
                                        }
                                    }}
                                >
                                    <ShiftCell 
                                        shiftCell={shiftCell} 
                                        hours={displayHours} 
                                        hasManualHours={!!hasManualHours} 
                                        violation={violation} 
                                        isWeekend={isWeekend} 
                                        isClosingDay={isClosingDay} 
                                        nurseId={nurse.id} 
                                        weekId={weekId} 
                                        activityLevel={activityLevel} 
                                        strasbourgAssignments={strasbourgAssignments} 
                                        dayOfWeek={dayOfWeek} 
                                        isShortFriday={isShortFriday} 
                                        onOpenManualHoursModal={onOpenManualHoursModal}
                                        dateKey={dateKey}
                                        manualNote={dailyHoursData?.note}
                                    />
                                </td>
                            );
                        });

                        return <tr key={day} className="group relative">{dayHeader}{nurseCells}{presentCell}{notesCell}</tr>;
                    })}
                </tbody>
            </table>
        </div>
    );
});
ScheduleGrid.displayName = 'ScheduleGrid';