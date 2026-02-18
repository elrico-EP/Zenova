import React, { useMemo } from 'react';
import type { Nurse, Schedule, Agenda, SpecialStrasbourgEvent, JornadaLaboral } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ShiftCell } from './ScheduleGrid';
import { getScheduleCellHours } from '../utils/scheduleUtils';
import { holidays2026 } from '../data/agenda2026';
import { getWeekIdentifier } from '../utils/dateUtils';
import { SHIFTS } from '../constants';

interface MonthViewProps {
  year: number;
  month: number;
  nurse: Nurse;
  schedule: Schedule[string];
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  jornadasLaborales: JornadaLaboral[];
}

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

const MonthView: React.FC<MonthViewProps> = ({ year, month, nurse, schedule, agenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales }) => {
  const { language } = useLanguage();

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
    const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
    return [...Array(7).keys()].map(i => formatter.format(new Date(2023, 0, i + 2)));
  }, [language]);

  const monthName = new Date(year, month, 1).toLocaleString(language, { month: 'long' });

  return (
    <div className="mb-4">
      <h3 className="text-xl font-semibold text-gray-800 text-center capitalize mb-2">{monthName}</h3>
      <div className="grid grid-cols-7 bg-slate-100 border-b-2 border-slate-200">
        {dayNames.map(dayName => <div key={dayName} className="p-1 text-center font-semibold text-slate-600 text-xs capitalize">{dayName}</div>)}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-slate-200">
        {calendarGrid.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="border-r border-b border-slate-200 bg-slate-50 min-h-[6rem]"></div>;
          const dateKey = date.toISOString().split('T')[0];
          const dayOfWeek = date.getUTCDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const weekId = getWeekIdentifier(date);
          const activityLevel = agenda[weekId] || 'NORMAL';
          const isHoliday = holidays2026.has(dateKey);
          const shiftCell = schedule?.[dateKey];
          const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
          const bgColor = isWeekend ? 'bg-slate-50' : 'bg-white';
          
          return (
            <div key={dateKey} className={`relative p-1 border-r border-b border-slate-200 min-h-[6rem] flex flex-col ${bgColor}`}>
              <div className="text-right text-[10px] font-semibold text-slate-500">{date.getUTCDate()}</div>
              <div className="my-1 flex-grow">
                {specialEvent ? (
                    <div className="w-full h-full p-1 flex items-center justify-center relative" title={`${specialEvent.name}${specialEvent.notes ? `\n\nNotas: ${specialEvent.notes}` : ''}`}>
                        <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${SHIFTS.STRASBOURG.color} ${SHIFTS.STRASBOURG.textColor} font-bold text-xs text-center`}>
                            <span className="truncate px-1">{specialEvent.name}</span>
                            {specialEvent.startTime && specialEvent.endTime && <span className="text-[10px] opacity-80 mt-1">{calculateEventHours(specialEvent.startTime, specialEvent.endTime).toFixed(1)}h</span>}
                        </div>
                    </div>
                ) : (
                    <ShiftCell
                      shiftCell={shiftCell}
                      hours={getScheduleCellHours(shiftCell, nurse, date, activityLevel, agenda, jornadasLaborales)}
                      hasManualHours={false}
                      isWeekend={isWeekend}
                      isClosingDay={isHoliday || activityLevel === 'CLOSED'}
                      nurseId={nurse.id}
                      dateKey={dateKey}
                      weekId={weekId}
                      activityLevel={activityLevel}
                      strasbourgAssignments={strasbourgAssignments}
                      dayOfWeek={dayOfWeek}
                      isShortFriday={false}
                      isMonthClosed={true}
                      onOpenHoursEdit={() => {}}
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

interface AnnualAgendaPdfViewProps {
    nurse: Nurse;
    year: number;
    allSchedules: Record<number, Schedule[string]>;
    agenda: Agenda;
    strasbourgAssignments: Record<string, string[]>;
    specialStrasbourgEvents: SpecialStrasbourgEvent[];
    jornadasLaborales: JornadaLaboral[];
}

export const AnnualAgendaPdfView: React.FC<AnnualAgendaPdfViewProps> = ({ nurse, year, allSchedules, agenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales }) => {
    const { language } = useLanguage();
    const months = [...Array(12).keys()]; // Array [0, 1, ..., 11]

    return (
        <div className="bg-white" style={{ width: '1200px' }}>
            {months.map(month => {
                const monthName = new Date(year, month, 1).toLocaleString(language, { month: 'long' });
                return (
                    <div
                        key={month}
                        className="month-pdf-container"
                        data-month-name={monthName}
                        style={{ padding: '1rem' }}
                    >
                        <MonthView
                            year={year}
                            month={month}
                            nurse={nurse}
                            schedule={allSchedules[month] || {}}
                            agenda={agenda}
                            strasbourgAssignments={strasbourgAssignments}
                            specialStrasbourgEvents={specialStrasbourgEvents}
                            jornadasLaborales={jornadasLaborales}
                        />
                    </div>
                );
            })}
        </div>
    );
};