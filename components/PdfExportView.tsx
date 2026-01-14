
import React from 'react';
import type { Nurse, Schedule, Notes, Agenda, ScheduleCell, WorkZone, CustomShift, RuleViolation, ActivityLevel } from '../types';
import { SHIFTS } from '../constants';
import { getWeekIdentifier } from '../utils/dateUtils';
import { holidays2026 } from '../data/agenda2026';
import { useTranslations } from '../hooks/useTranslations';
import { getShiftsFromCell } from '../utils/scheduleUtils';
import { Locale } from '../translations/locales';

// FIX: Change Set<WorkZone> to Set<string> to allow 'DAY_OFF_80' which is not a standard WorkZone.
const EXCLUDED_SHIFTS = new Set(['TW', 'FP', 'SICK_LEAVE', 'RECUP', 'CA', 'STRASBOURG', 'DAY_OFF_80']);

const ShiftCellContent: React.FC<{ shiftCell: ScheduleCell | undefined }> = ({ shiftCell }) => {
    if (!shiftCell) {
        return <div className="w-full h-full"></div>;
    }

    if (typeof shiftCell === 'object' && 'custom' in shiftCell) {
        const customShift = shiftCell as CustomShift;
        const shiftStyle = customShift.type ? SHIFTS[customShift.type] : null;
        const bgColor = shiftStyle ? shiftStyle.color : 'bg-slate-100';
        const textColor = shiftStyle ? shiftStyle.textColor : 'text-slate-500';
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-center p-1 ${bgColor} ${textColor} font-medium text-xs rounded-sm`}>
                <span className="font-semibold">{customShift.custom}</span>
            </div>
        );
    }
    
    if (typeof shiftCell === 'object' && 'split' in shiftCell) {
        const [morning, afternoon] = shiftCell.split;
        const morningShift = typeof morning === 'string' ? SHIFTS[morning] : null;
        const afternoonShift = typeof afternoon === 'string' ? SHIFTS[afternoon] : null;
        return (
            <div className="w-full h-full flex rounded-sm overflow-hidden text-xs">
                <div className={`flex-1 flex items-center justify-center font-semibold ${morningShift ? `${morningShift.color} ${morningShift.textColor}` : 'bg-gray-200'}`}>{morningShift?.label.replace(' M', '')}</div>
                <div className={`flex-1 flex items-center justify-center font-semibold ${afternoonShift ? `${afternoonShift.color} ${afternoonShift.textColor}` : 'bg-gray-200'}`}>{afternoonShift?.label.replace(' T', '')}</div>
            </div>
        );
    }

    const shift = SHIFTS[shiftCell as WorkZone];
    if (!shift) return <div className="w-full h-full"></div>;

    return (
        <div className={`w-full h-full p-1 flex items-center justify-center rounded-sm ${shift.color} ${shift.textColor}`}>
            <span className="font-bold text-base">{shift.label}</span>
        </div>
    );
};


interface PdfExportViewProps {
  nurses: Nurse[];
  schedule: Schedule;
  currentDate: Date;
  notes: Notes;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
}

export const PdfExportView: React.FC<PdfExportViewProps> = ({ nurses, schedule, currentDate, notes, agenda }) => {
    const t = useTranslations();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="bg-white p-4" style={{ width: 'fit-content' }}>
            <h1 className="text-2xl font-bold mb-4 text-center">Plan de Turnos - {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h1>
            <table className="min-w-full border-collapse border border-gray-300 text-xs">
                <thead>
                    <tr className="bg-slate-200">
                        <th className="border border-gray-300 p-2 font-bold text-slate-700 w-28">Día</th>
                        {nurses.map(nurse => (
                            <th key={nurse.id} className="border border-gray-300 p-2 font-bold text-slate-700 w-24">{nurse.name}</th>
                        ))}
                        <th className="border border-gray-300 p-2 font-bold text-slate-700 w-20">Presentes</th>
                        <th className="border border-gray-300 p-2 font-bold text-slate-700 w-40">Notas</th>
                    </tr>
                </thead>
                <tbody>
                    {days.map(day => {
                        const date = new Date(year, month, day);
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayOfWeekStr = date.toLocaleString('es-ES', { weekday: 'short' });
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        let presentCount = 0;
                        nurses.forEach(nurse => {
                            const shiftCell = schedule[nurse.id]?.[dateKey];
                            const shifts = getShiftsFromCell(shiftCell);
                            if (shifts.length > 0 && shifts.some(s => !EXCLUDED_SHIFTS.has(s))) {
                                presentCount++;
                            }
                        });

                        return (
                            <tr key={day} className={isWeekend ? 'bg-slate-100' : 'bg-white'}>
                                <td className="border border-gray-300 p-2 font-semibold text-center">
                                    <div className="text-lg">{day}</div>
                                    <div className="capitalize">{dayOfWeekStr}</div>
                                </td>
                                {nurses.map(nurse => (
                                    <td key={nurse.id} className="border border-gray-300 h-14 p-0">
                                        <ShiftCellContent shiftCell={schedule[nurse.id]?.[dateKey]} />
                                    </td>
                                ))}
                                <td className="border border-gray-300 p-2 text-center font-bold text-lg">
                                    {presentCount > 0 && <span>{presentCount}</span>}
                                </td>
                                <td className="border border-gray-300 p-2 align-top">
                                    {notes[dateKey]?.text}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
