
import React, { useState } from 'react';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { Locale } from '../translations/locales';

const assignableShifts = Object.values(SHIFTS).filter(s => 
    [
        'URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE', 
        'ADMIN', 'TW', 'STRASBOURG', 'LIBERO', 'RECUP', 
        'FP', 'SICK_LEAVE', 'CA'
    ].includes(s.id)
);

export const ShiftPalette: React.FC = () => {
  const t = useTranslations();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-slate-200/80 transition-all duration-300">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between font-bold text-lg text-slate-700"
        aria-expanded={!isCollapsed}
        aria-controls="shift-palette-content"
      >
        <span>{t.shiftLegendTitle}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        id="shift-palette-content"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 mt-0' : 'max-h-[1000px] mt-4'}`}
      >
        <div className="space-y-2">
          {assignableShifts.map((shift) => (
            <div
              key={shift.id}
              className="w-full flex items-center p-2.5 rounded-lg"
            >
              <div className={`w-14 h-9 rounded-md flex items-center justify-center font-bold text-sm mr-4 shadow-sm ${shift.color} ${shift.textColor}`}>
                {shift.label}
              </div>
              {/* FIX: Cast translation value to string to satisfy ReactNode type. */}
              <span className="font-medium text-slate-800 text-sm">{t[shift.description as keyof Locale] as string}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
