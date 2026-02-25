
import React, { useMemo } from 'react';
import { SHIFTS } from '../constants';
import type { Shift, WorkZone } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { calculateHoursDifference } from '../utils/hoursUtils';
import { Locale } from '../translations/locales';

interface ShiftHourData {
  shift: Shift;
  horarioLJ: string;
  horarioV: string;
  horasCalculadasLJ: number;
  horasCalculadasV: number;
  notas: string;
}

const getTheoreticalHours = (shiftId: WorkZone, isFriday: boolean): string => {
    switch (shiftId) {
        case 'URGENCES':
        case 'TRAVAIL':
        case 'ADMIN':
        case 'TW':
        case 'FP':
        case 'SICK_LEAVE':
            return isFriday ? '08:00 - 14:30' : '8:00 - 17:00';
        case 'URGENCES_TARDE':
        case 'TRAVAIL_TARDE':
            return isFriday ? '08:00 - 14:30' : '10:00 - 18:30';
        case 'VACCIN':
            return '08:00 - 14:30';
        case 'VACCIN_AM':
            return '08:00 - 14:00';
        case 'VACCIN_PM':
        case 'TRAVAIL_C':
        case 'URGENCES_C':
            return '14:00 - 17:00';
        case 'LIBERO':
             return '10:00 - 16:30';
        case 'CA':
        case 'RECUP':
        case 'STRASBOURG':
            return 'N/A';
        default:
            return 'N/A';
    }
};

export const ShiftHoursReference: React.FC = () => {
    const t = useTranslations();

    const shiftData = useMemo<ShiftHourData[]>(() => {
        return Object.values(SHIFTS).map(shift => {
            const horarioLJ = getTheoreticalHours(shift.id, false);
            const horarioV = getTheoreticalHours(shift.id, true);
            
            let horasCalculadasLJ = 0;
            let horasCalculadasV = 0;
            let notas = '';

            // Direct assignment based on new rules
            switch (shift.id) {
                case 'URGENCES':
                case 'TRAVAIL':
                case 'ADMIN':
                case 'TW':
                case 'FP':
                case 'SICK_LEAVE':
                    horasCalculadasLJ = 8.5;
                    horasCalculadasV = 6.0;
                    notas = 'Se restan 30 min de pausa en jornadas >= 6h.';
                    break;
                case 'URGENCES_TARDE':
                case 'TRAVAIL_TARDE':
                    horasCalculadasLJ = 8.0;
                    horasCalculadasV = 6.0;
                    notas = 'Se restan 30 min de pausa en jornadas >= 6h.';
                    break;
                case 'VACCIN_AM':
                    horasCalculadasLJ = 5.5; // Same for any day
                    horasCalculadasV = 5.5;
                    notas = 'Valor fijo, sin deducción de pausa.';
                    break;
                case 'VACCIN_PM':
                case 'TRAVAIL_C':
                case 'URGENCES_C':
                    horasCalculadasLJ = 3.0; // Same for any day
                    horasCalculadasV = 3.0;
                    notas = 'Valor fijo, sin deducción de pausa.';
                    break;
                case 'VACCIN':
                case 'LIBERO':
                    horasCalculadasV = 6.0;
                    notas = 'Se restan 30 min de pausa en jornadas >= 6h.';
                    break;
                case 'CA':
                    notas = 'Ausencia. No suma horas.';
                    break;
                case 'RECUP':
                    notas = 'Suma 0h. Solo computa con ajuste manual.';
                    break;
                case 'STRASBOURG':
                    notas = 'Semana de sesión. Suma 10h/día (L-J).';
                    horasCalculadasLJ = 10;
                    horasCalculadasV = 0; // Viernes es libre
                    break;
                default:
                    if (horarioLJ.includes(' - ')) {
                        const [start, end] = horarioLJ.split(' - ');
                        horasCalculadasLJ = calculateHoursDifference(start, end);
                    }
                    if (horarioV.includes(' - ')) {
                        const [start, end] = horarioV.split(' - ');
                        horasCalculadasV = calculateHoursDifference(start, end);
                    }
                    if (horasCalculadasLJ > 0 || horasCalculadasV > 0) {
                        notas = 'Se restan 30 min de pausa en jornadas >= 6h.';
                    } else {
                        notas = 'Turno no computable en horas.';
                    }
            }

            return {
                shift,
                horarioLJ,
                horarioV,
                horasCalculadasLJ,
                horasCalculadasV,
                notas
            };
        });
    }, []);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="p-2 border border-slate-300 font-semibold text-slate-700">Turno</th>
                        <th className="p-2 border border-slate-300 font-semibold text-slate-700">Horario Teórico (L-J)</th>
                        <th className="p-2 border border-slate-300 font-semibold text-slate-700">Horario Teórico (V)</th>
                        <th className="p-2 border border-slate-300 font-semibold text-slate-700 text-center">Horas Calculadas (L-J)</th>
                        <th className="p-2 border border-slate-300 font-semibold text-slate-700 text-center">Horas Calculadas (V)</th>
                        <th className="p-2 border border-slate-300 font-semibold text-slate-700">Notas</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {shiftData.map(data => (
                        <tr key={data.shift.id} className="border-b">
                            <td className="p-2 border border-slate-300 font-medium text-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${data.shift.color} ${data.shift.textColor}`}>{data.shift.label}</span>
                                    <span>{t[data.shift.description as keyof Locale] as string}</span>
                                </div>
                            </td>
                            <td className="p-2 border border-slate-300 text-slate-600 text-center">{data.horarioLJ}</td>
                            <td className="p-2 border border-slate-300 text-slate-600 text-center">{data.horarioV}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">{data.horasCalculadasLJ > 0 ? data.horasCalculadasLJ.toFixed(1) + 'h' : '—'}</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">{data.horasCalculadasV > 0 ? data.horasCalculadasV.toFixed(1) + 'h' : '—'}</td>
                            <td className="p-2 border border-slate-300 text-slate-500 italic">{data.notas}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
