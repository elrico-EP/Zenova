import React from 'react';
import type { Agenda, ActivityLevel } from '../types';
import { getWeeksOfYear, getDateOfWeek } from '../utils/dateUtils';
import { agenda2026Data } from '../data/agenda2026';
import { useTranslations } from '../hooks/useTranslations';

interface AgendaPlannerProps {
  currentDate: Date;
  agenda: Agenda;
  onAgendaChange: (newAgenda: Agenda) => void;
  onWeekSelect: (date: Date) => void;
  vertical?: boolean;
}

const allActivityLevels: ActivityLevel[] = ['NORMAL', 'SESSION', 'WHITE_GREEN', 'REDUCED'];

export const AgendaPlanner: React.FC<AgendaPlannerProps> = ({ currentDate, agenda, onAgendaChange, onWeekSelect, vertical = false }) => {
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

  if (vertical) {
    return (
      <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 title={is2026 ? t.agenda2026Warning : undefined} className="font-bold text-xs text-slate-700 flex items-center gap-1 cursor-help">
            <span className="w-1 h-1 rounded-full bg-zen-500"></span>
            {t.agendaPlanner}
          </h3>
        </div>

        <div className="overflow-y-auto pr-1 custom-scrollbar flex-1" style={{ minHeight: 0 }}>
          <div className="flex flex-col space-y-1.5">
            {weeks.map(week => {
              const level = effectiveAgenda[week.id] || 'NORMAL';
              const config = activityConfig[level];
              return (
                <button
                  key={week.id}
                  onClick={() => handleWeekSelect(week.id)}
                  className={`p-1.5 rounded-md text-center transition-all duration-200 ${config.color} ${config.textColor} cursor-pointer hover:shadow-md hover:-translate-x-0.5 flex flex-col justify-between h-14 border border-black/5`}
                >
                  <div className="text-left">
                    <div className="font-bold text-[9px] opacity-80">{t.week} {week.id.split('-W')[1]}</div>
                    <div className="text-[8px] font-medium truncate">{week.label}</div>
                  </div>
                  <div className="text-[9px] font-bold bg-white/30 rounded px-1 py-0.5 self-center truncate w-full">
                    {config.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 title={is2026 ? t.agenda2026Warning : undefined} className="font-bold text-sm text-slate-700 flex items-center gap-2 cursor-help">
          <span className="w-1.5 h-1.5 rounded-full bg-zen-500"></span>
          {t.agendaPlanner}
        </h3>
      </div>

      <div className="overflow-x-auto pb-2 -mb-2 custom-scrollbar">
        <div className="flex space-x-2">
          {weeks.map(week => {
            const level = effectiveAgenda[week.id] || 'NORMAL';
            const config = activityConfig[level];
            return (
              <button
                key={week.id}
                onClick={() => handleWeekSelect(week.id)}
                className={`p-1.5 rounded-md text-center transition-all duration-200 ${config.color} ${config.textColor} cursor-pointer hover:shadow-md hover:-translate-y-0.5 w-24 flex-shrink-0 flex flex-col justify-between h-16 border border-black/5`}
              >
                <div>
                  <div className="font-bold text-[10px] opacity-80">{t.week} {week.id.split('-W')[1]}</div>
                  <div className="text-[9px] font-medium truncate">{week.label}</div>
                </div>
                <div className="text-[10px] font-bold bg-white/30 rounded px-1.5 py-0.5 self-center truncate w-full">
                  {config.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
