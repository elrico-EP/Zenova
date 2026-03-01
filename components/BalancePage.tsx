import React, { useMemo, useState } from 'react';
import type { Nurse, BalanceData, ShiftCounts } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

const ALL_SHIFT_COLUMNS: (keyof ShiftCounts)[] = [
    'TRAVAIL',
    'TRAVAIL_TARDE',
    'URGENCES',
    'URGENCES_TARDE',
    'ADMIN',
    'ADM_PLUS',
    'TW',
    'TW_ABROAD',
    'LIBERO',
    'CS',
    'STRASBOURG',
    'RECUP',
    'CA',
    'FP',
    'SICK_LEAVE',
    'VACCIN',
    'VACCIN_AM',
    'VACCIN_PM',
    'VACCIN_PM_PLUS',
    'URGENCES_TARDE_PLUS',
    'TRAVAIL_TARDE_PLUS'
];

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
    shiftColumns: (keyof ShiftCounts)[];
    onOpenAgenda: (nurse: Nurse) => void;
}> = ({ nurse, data, isActive, shiftColumns, onOpenAgenda }) => {
    const inactiveClasses = !isActive ? 'opacity-50 bg-slate-50' : 'hover:bg-blue-50/50';

    return (
        <tr 
            onClick={() => onOpenAgenda(nurse)} 
            className={`cursor-pointer transition-colors ${inactiveClasses} ${data.hasConsecutiveAdmTw ? 'bg-slate-200' : ''}`}
        >
            <td className={`p-2 border-b border-slate-200 font-medium text-slate-800 sticky left-0 z-10 w-40 ${!isActive ? 'bg-slate-100' : 'bg-white group-hover:bg-blue-50/50'}`}>
                {nurse.name}
            </td>
            {shiftColumns.map(shiftKey => (
                <td key={`${nurse.id}-${shiftKey}`} className="p-2 border-b border-slate-200 text-center">
                    {isActive ? (data.monthlyCounts[shiftKey] || '-') : '-'}
                </td>
            ))}
            <td className={`p-2 border-b border-slate-200 text-center font-bold ${!isActive ? 'text-slate-500' : 'text-slate-700'}`}>
                {isActive ? data.monthlyBalance.toFixed(1) : '-'}
            </td>
            <td className="p-2 border-b border-slate-200 text-center font-bold text-slate-700">
                {data.annualBalance.toFixed(1)}
            </td>
        </tr>
    );
};

export const BalancePage: React.FC<BalancePageProps> = ({ nurses, balanceData, onOpenAgenda, currentDate, onDateChange }) => {
    const t = useTranslations();
    const { language } = useLanguage();
    const [showAllShifts, setShowAllShifts] = useState(false);

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

    const visibleShiftColumns = useMemo<(keyof ShiftCounts)[]>(() => {
        if (showAllShifts) return ALL_SHIFT_COLUMNS;
        return ALL_SHIFT_COLUMNS.filter(shiftKey =>
            enrichedData.some(data => (data.monthlyCounts[shiftKey] || 0) > 0)
        );
    }, [showAllShifts, enrichedData]);

    const monthLabel = currentDate.toLocaleString(language, { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 overflow-auto p-4">
             <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-slate-800">{t.balancePageTitle}</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        title={t.previousMonth}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 capitalize min-w-[180px] text-center">{monthLabel}</span>
                    <button
                        onClick={handleNextMonth}
                        title={t.nextMonth}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowAllShifts(prev => !prev)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md border border-slate-300"
                    >
                        {showAllShifts ? t.balance_show_only_active_shifts : t.balance_show_all_shifts}
                    </button>
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr>
                            <th className="p-2 border-b-2 border-slate-200 text-left font-semibold text-slate-600 sticky left-0 bg-slate-100 w-40">{t.nurse}</th>
                            {visibleShiftColumns.map(shiftKey => (
                                <th key={shiftKey} className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600 whitespace-nowrap">
                                    {SHIFTS[shiftKey]?.label || shiftKey}
                                </th>
                            ))}
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
                                shiftColumns={visibleShiftColumns}
                                onOpenAgenda={onOpenAgenda} 
                            />
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};