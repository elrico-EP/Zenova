import React, { useState, useMemo } from 'react';
import type { Nurse, BalanceData, ShiftCounts } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { StackedBar } from './StackedBar';

type SortKey = 'name' | 'monthlyTotalHours' | 'annualTotalHours' | keyof ShiftCounts;
type SortConfig = { key: SortKey; direction: 'ascending' | 'descending' } | null;

interface BalancePageProps {
  nurses: Nurse[];
  balanceData: BalanceData[];
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onOpenAgenda: (nurse: Nurse) => void;
}

const BalanceTableRow: React.FC<{
    nurse: Nurse;
    data: BalanceData;
    isActive: boolean;
    onOpenAgenda: (nurse: Nurse) => void;
}> = ({ nurse, data, isActive, onOpenAgenda }) => {
    const travMonthlyTotal = data.monthlyCounts.TRAVAIL + data.monthlyCounts.TRAVAIL_TARDE;
    const urgMonthlyTotal = data.monthlyCounts.URGENCES + data.monthlyCounts.URGENCES_TARDE;
    
    const inactiveClasses = !isActive ? 'opacity-50 bg-slate-50' : 'hover:bg-blue-50/50';

    return (
        <tr 
            onClick={() => onOpenAgenda(nurse)} 
            className={`cursor-pointer transition-colors ${inactiveClasses} ${data.hasConsecutiveAdmTw ? 'bg-slate-200' : ''}`}
        >
            <td className={`p-2 border-b border-slate-200 font-medium text-slate-800 sticky left-0 z-10 w-40 ${!isActive ? 'bg-slate-100' : 'bg-white group-hover:bg-blue-50/50'}`}>
                {nurse.name}
            </td>
            <td className="p-2 border-b border-slate-200 text-center">
                {isActive ? <StackedBar 
                    values={[
                        { value: data.monthlyCounts.TRAVAIL, color: SHIFTS.TRAVAIL.color },
                        { value: data.monthlyCounts.TRAVAIL_TARDE, color: SHIFTS.TRAVAIL_TARDE.color }
                    ]} 
                    total={travMonthlyTotal}
                /> : '-'}
            </td>
            <td className="p-2 border-b border-slate-200 text-center">
                 {isActive ? <StackedBar 
                    values={[
                        { value: data.monthlyCounts.URGENCES, color: SHIFTS.URGENCES.color },
                        { value: data.monthlyCounts.URGENCES_TARDE, color: SHIFTS.URGENCES_TARDE.color }
                    ]} 
                    total={urgMonthlyTotal}
                /> : '-'}
            </td>
            <td className="p-2 border-b border-slate-200 text-center">{isActive ? data.monthlyCounts.ADMIN || '-' : '-'}</td>
            <td className="p-2 border-b border-slate-200 text-center">{isActive ? data.monthlyCounts.TW || '-' : '-'}</td>
            <td className="p-2 border-b border-slate-200 text-center">{isActive ? data.monthlyCounts.CA || '-' : '-'}</td>
            <td className="p-2 border-b border-slate-200 text-center">{isActive ? data.monthlyCounts.FP || '-' : '-'}</td>
            <td className="p-2 border-b border-slate-200 text-center">{isActive ? data.monthlyCounts.SICK_LEAVE || '-' : '-'}</td>
            <td className={`p-2 border-b border-slate-200 text-center font-bold ${!isActive ? 'text-slate-500' : 'text-slate-700'}`}>
                {isActive ? data.monthlyBalance.toFixed(1) : '-'}
            </td>
            <td className="p-2 border-b border-slate-200 text-center font-bold text-slate-700">
                {data.annualBalance.toFixed(1)}
            </td>
        </tr>
    );
};

export const BalancePage: React.FC<BalancePageProps> = ({ nurses, balanceData, onOpenAgenda, currentDate }) => {
    const t = useTranslations();
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    const enrichedData = useMemo(() => {
        return nurses.map(nurse => {
            const data = balanceData.find(bd => bd.nurseId === nurse.id);
            if (!data) return null;

            let isActive = true;
            if (nurse.id === 'nurse-11') {
                const month = currentDate.getMonth();
                isActive = month >= 9 || month <= 1; // Active from Oct to Feb
            }

            return {
                ...data,
                nurse,
                isActive,
            };
        }).filter((d): d is Exclude<typeof d, null> => d !== null);
    }, [balanceData, nurses, currentDate]);

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 overflow-auto p-4">
             <h2 className="text-2xl font-bold text-slate-800 mb-4">{t.balancePageTitle}</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr>
                            <th className="p-2 border-b-2 border-slate-200 text-left font-semibold text-slate-600 sticky left-0 bg-slate-100 w-40">{t.nurse}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.travMonthHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.urgMonthHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.admMonthHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.twMonthHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.holidaysHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.trainingHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.sickLeaveHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.hoursMonthHeader}</th>
                            <th className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600">{t.hoursYearHeader}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {enrichedData.map(data => (
                            <BalanceTableRow 
                                key={data.nurseId} 
                                nurse={data.nurse} 
                                data={data} 
                                isActive={data.isActive}
                                onOpenAgenda={onOpenAgenda} 
                            />
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};
