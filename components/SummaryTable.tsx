
import React, { useMemo } from 'react';
import type { Nurse, Schedule, WorkZone } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { Locale } from '../translations/locales';

interface SummaryTableProps {
  nurses: Nurse[];
  schedule: Schedule;
  currentDate: Date;
}

const shiftTypesToCount: WorkZone[] = ['URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE', 'ADMIN', 'TW', 'STRASBOURG', 'LIBERO', 'F', 'RECUP', 'FP', 'CA', 'SICK_LEAVE', 'VACCIN', 'VACCIN_AM', 'VACCIN_PM'];
const workShiftTypes: WorkZone[] = ['URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE', 'ADMIN', 'TW', 'STRASBOURG', 'LIBERO', 'RECUP', 'FP', 'VACCIN', 'VACCIN_AM', 'VACCIN_PM'];

export const SummaryTable: React.FC<SummaryTableProps> = ({ nurses, schedule, currentDate }) => {
  const t = useTranslations();
  
  const summaryData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return nurses.map(nurse => {
      const counts: Record<string, number> = {};
      shiftTypesToCount.forEach(st => counts[st] = 0);
      let workDays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const scheduleCell = schedule[nurse.id]?.[dateKey];

        const shiftsToday: WorkZone[] = [];
        let isWorkingDay = false;

        if (scheduleCell) {
            if (typeof scheduleCell === 'string') {
                shiftsToday.push(scheduleCell as WorkZone);
            } else if (typeof scheduleCell === 'object' && 'split' in scheduleCell && Array.isArray(scheduleCell.split)) {
                scheduleCell.split.forEach(part => {
                    if (typeof part === 'string') {
                        shiftsToday.push(part as WorkZone);
                    }
                })
            }
        }
        
        shiftsToday.forEach(shiftType => {
            if (shiftTypesToCount.includes(shiftType)) {
                counts[shiftType] = (counts[shiftType] || 0) + 1;
            }
            if (workShiftTypes.includes(shiftType)) {
                isWorkingDay = true;
            }
        });
        
        if (isWorkingDay) {
            workDays++;
        }
      }
      return { nurseId: nurse.id, name: nurse.name, counts, workDays };
    });
  }, [nurses, schedule, currentDate]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4 text-gray-700">{t.monthlySummary}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                {t.nurse}
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.total}
              </th>
              {/* FIX: Do not call translation string as a function */}
              {shiftTypesToCount.map(st => SHIFTS[st] && (
                <th key={st} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title={t[SHIFTS[st].description as keyof Locale] as string}>
                  <div className={`w-10 h-6 mx-auto rounded flex items-center justify-center font-bold text-xs ${SHIFTS[st].color} ${SHIFTS[st].textColor}`}>
                    {SHIFTS[st].label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summaryData.map(({ nurseId, name, counts, workDays }) => (
              <tr key={nurseId}>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">{name}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center font-bold">{workDays}</td>
                {shiftTypesToCount.map(st => SHIFTS[st] && (
                  <td key={st} className="px-2 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{counts[st] > 0 ? counts[st] : '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
