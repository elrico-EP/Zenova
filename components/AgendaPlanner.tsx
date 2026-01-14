import React from 'react';
import type { Agenda, ActivityLevel } from '../types';
import { getWeeksOfYear, getDateOfWeek } from '../utils/dateUtils';
import { agenda2026Data } from '../data/agenda2026';
import { useTranslations } from '../hooks/useTranslations';

interface AgendaPlannerProps {
  currentDate: Date;
  agenda: Agenda;
  onAgendaChange: React.Dispatch<React.SetStateAction<Agenda>>;
  onWeekSelect: (date: Date) => void;
}

const allActivityLevels: ActivityLevel[] = ['NORMAL', 'SESSION', 'WHITE_GREEN', 'REDUCED'];

export const AgendaPlanner: React.FC<AgendaPlannerProps> = ({ currentDate, agenda, onAgendaChange, onWeekSelect }) => {
  const t = useTranslations();
  const year = currentDate.getFullYear();
  const weeks = getWeeksOfYear(year);
  const is2026 = year === 2026;

  const activityConfig: Record<ActivityLevel, { label: string; color: string; textColor: string; }> = {
    NORMAL: { label: t.activity_NORMAL, color: 'bg-zen-200', textColor: 'text-zen-800' },
    SESSION: { label: t.activity_SESSION, color: 'bg-red-300', textColor: 'text-red-900' },
    WHITE_GREEN: { label: t.activity_WHITE_GREEN, color: 'bg-green-200', textColor: 'text-green-800' },
    REDUCED: { label: t.activity_REDUCED, color: 'bg-yellow-200', textColor: 'text-yellow-800' },
    CLOSED: { label: t.activity_CLOSED, color: 'bg-gray-400', textColor: 'text-gray-800' },
  };

  const handleWeekSelect = (weekId: string) => {
    const date = getDateOfWeek(weekId);
    onWeekSelect(date);
  };
  
  const effectiveAgenda = is2026 ? agenda2026Data : agenda;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4 text-gray-700">{t.agendaPlanner}</h3>
      {is2026 && <p className="text-sm text-gray-600 mb-4">{t.agenda2026Warning}</p>}
      <div className="overflow-x-auto pb-3 -mb-3">
        <div className="flex space-x-3">
          {weeks.map(week => {
            const level = effectiveAgenda[week.id] || 'NORMAL';
            const config = activityConfig[level];
            return (
              <button
                key={week.id}
                onClick={() => handleWeekSelect(week.id)}
                className={`p-2 rounded-lg text-center transition-all duration-200 ${config.color} ${config.textColor} cursor-pointer hover:shadow-lg hover:-translate-y-0.5 w-32 flex-shrink-0 flex flex-col justify-between h-24`}
              >
                <div>
                  <div className="font-bold text-sm">{t.week} {week.id.split('-W')[1]}</div>
                  <div className="text-xs mt-1">{week.label}</div>
                </div>
                <div className="text-sm mt-1 font-medium bg-white/20 rounded-full px-2 py-0.5 self-center">{config.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};