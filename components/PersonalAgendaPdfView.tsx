
import React, { useMemo } from 'react';
import type { Nurse, Schedule, ScheduleCell, Agenda, Hours, SpecialStrasbourgEvent } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ShiftCell } from './ScheduleGrid';
import { holidays2026 } from '../data/agenda2026';
import { agenda2026Data } from '../data/agenda2026';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getScheduleCellHours } from '../utils/scheduleUtils';

interface PersonalAgendaPdfViewProps {
  nurse: Nurse;
  currentDate: Date;
  schedule: Schedule[string];
  hours: Hours;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
}

const isDateInWorkPeriod = (nurse: Nurse, date: Date): boolean => {
    if (nurse.id === 'nurse-11') {
        const month = date.getUTCMonth();
        return month >= 9 || month <= 1;
    }
    return true;
};

export const PersonalAgendaPdfView: React.FC<PersonalAgendaPdfViewProps> = ({
  nurse,
  currentDate,
  schedule,
  agenda,
  strasbourgAssignments,
  specialStrasbourgEvents
}) => {
  const { language } = useLanguage();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    const grid = [];
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = (firstDayOfMonth.getUTCDay() + 6) % 7;
    for (let i = 0; i < startDayOfWeek; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(new Date(Date.UTC(year, month, day)));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [year, month]);

  const dayNames = useMemo(() => {
      const formatter = new Intl.DateTimeFormat(language, { weekday: 'long' });
      return [...Array(7).keys()].map(i => formatter.format(new Date(2023, 0, i + 2)));
  }, [language]);

  return (
    <div className="bg-white p-4" style={{ width: '1200px' }}>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">{nurse.name}</h2>
        <h3 className="text-xl font-semibold text-gray-700 text-center capitalize mb-4">
            {`${currentDate.toLocaleString(language, { month: 'long' })} ${currentDate.getFullYear()}`}
        </h3>
        <div className="grid grid-cols-7 sticky top-0 bg-slate-100 z-10 border-b-2 border-slate-200">
            {dayNames.map(dayName => <div key={dayName} className="p-2 text-center font-semibold text-slate-600 text-sm capitalize">{dayName}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-slate-200">
            {calendarGrid.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="border-r border-b border-slate-200 bg-slate-50 min-h-[10rem]"></div>;
                const dateKey = date.toISOString().split('T')[0];
                const dayOfWeek = date.getUTCDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const weekId = getWeekIdentifier(date);
                const activityLevel = agenda2026Data[weekId] || 'NORMAL';
                const isHoliday = holidays2026.has(dateKey);
                const shiftCell = schedule?.[dateKey];
                const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
                const isDayActive = isDateInWorkPeriod(nurse, date);
                const bgColor = isWeekend ? 'bg-slate-50' : 'bg-white';
                const inactiveClasses = !isDayActive ? 'bg-slate-100 text-slate-400' : '';

                return (
                    <div key={dateKey} className={`relative p-1 border-r border-b border-slate-200 min-h-[10rem] flex flex-col ${inactiveClasses} ${bgColor}`}>
                        <div className="text-right text-xs font-semibold text-slate-500">{date.getUTCDate()}</div>
                        <div className="my-1 h-14 flex-grow">
                            {specialEvent ? (
                                <div className="w-full h-full p-1 flex items-center justify-center relative">
                                    <div className="w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm bg-purple-200 text-purple-800 font-bold text-xs text-center"><span className="truncate px-1">{specialEvent.name}</span></div>
                                </div>
                            ) : (
                                <ShiftCell 
                                  shiftCell={shiftCell} 
                                  hours={getScheduleCellHours(shiftCell, nurse, date, activityLevel, agenda2026Data)} 
                                  hasManualHours={false}
                                  isWeekend={isWeekend} 
                                  isClosingDay={isHoliday || activityLevel === 'CLOSED'} 
                                  nurseId={nurse.id} 
                                  weekId={weekId} 
                                  activityLevel={activityLevel} 
                                  strasbourgAssignments={strasbourgAssignments} 
                                  dayOfWeek={dayOfWeek} 
                                  isShortFriday={false}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
