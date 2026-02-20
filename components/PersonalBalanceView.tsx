import React from 'react';
import type { BalanceData, ShiftCounts } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface PersonalBalanceViewProps {
  balanceData: BalanceData;
}

const balanceHeaders: { key: keyof ShiftCounts; label: string }[] = [
    { key: 'TRAVAIL', label: SHIFTS['TRAVAIL'].label },
    { key: 'TRAVAIL_TARDE', label: SHIFTS['TRAVAIL_TARDE'].label },
    { key: 'URGENCES', label: SHIFTS['URGENCES'].label },
    { key: 'URGENCES_TARDE', label: SHIFTS['URGENCES_TARDE'].label },
    { key: 'ADMIN', label: SHIFTS['ADMIN'].label },
    { key: 'ADM_TARDE', label: SHIFTS['ADM_TARDE'].label },
    { key: 'TW', label: SHIFTS['TW'].label },
    { key: 'TW_ABROAD', label: SHIFTS['TW_ABROAD'].label },
    { key: 'CA', label: SHIFTS['CA'].label },
    { key: 'FP', label: SHIFTS['FP'].label },
    { key: 'CS', label: SHIFTS['CS'].label },
    { key: 'RECUP', label: SHIFTS['RECUP'].label },
    { key: 'SICK_LEAVE', label: SHIFTS['SICK_LEAVE'].label },
    { key: 'STRASBOURG', label: SHIFTS['STRASBOURG'].label },
    { key: 'LIBERO', label: SHIFTS['LIBERO'].label },
    { key: 'VACCIN_PM_PLUS', label: SHIFTS['VACCIN_PM_PLUS'].label },
];

export const PersonalBalanceView: React.FC<PersonalBalanceViewProps> = ({ balanceData }) => {
  const t = useTranslations();
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold text-gray-700 mb-3">{t.personalBalanceTitle}</h4>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-2 py-2">{t.shift}</th>
            <th scope="col" className="px-2 py-2 text-center">{t.month}</th>
            <th scope="col" className="px-2 py-2 text-center">{t.year}</th>
          </tr>
        </thead>
        <tbody>
          {balanceHeaders.map(({ key, label }) => {
            const shiftInfo = SHIFTS[key];
            if (!shiftInfo) return null;
            const monthlyValue = balanceData.monthlyCounts[key];
            const annualValue = balanceData.annualCounts[key];
            if (monthlyValue === 0 && annualValue === 0) return null;
            return (
              <tr key={key} className="border-b">
                <td className="px-2 py-1.5 font-medium flex items-center">
                   <span className={`w-3 h-3 rounded-full mr-2 ${shiftInfo.color}`}></span>
                   {label}
                </td>
                <td className="px-2 py-1.5 text-center">{monthlyValue}</td>
                <td className="px-2 py-1.5 text-center">{annualValue}</td>
              </tr>
            );
           })}
           <tr className="bg-gray-100 font-bold">
             <td className="px-2 py-2">{t.totalWorkDays}</td>
             <td className="px-2 py-2 text-center">{balanceData.monthlyTotalWorkDays}</td>
             <td className="px-2 py-2 text-center">{balanceData.annualTotalWorkDays}</td>
           </tr>
           <tr className="bg-gray-100 font-bold">
             <td className="px-2 py-2">{t.totalHours}</td>
             <td className="px-2 py-2 text-center">{balanceData.monthlyTotalHours.toFixed(1)}</td>
             <td className="px-2 py-2 text-center">{balanceData.annualTotalHours.toFixed(1)}</td>
           </tr>
        </tbody>
      </table>
    </div>
  );
};