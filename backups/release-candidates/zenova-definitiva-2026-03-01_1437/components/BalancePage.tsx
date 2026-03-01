import React, { useMemo, useState } from 'react';
import type { Nurse, BalanceData, ShiftCounts } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { StackedBar } from './StackedBar';

// Grouped columns for combined display
type BalanceColumn = {
    key: string;
    shifts: (keyof ShiftCounts)[];
    label: string;
};

const ALL_SHIFT_COLUMNS: BalanceColumn[] = [
    { key: 'TRAVAIL_COMBINED', shifts: ['TRAVAIL', 'TRAVAIL_TARDE'], label: 'Travail' },
    { key: 'URGENCES_COMBINED', shifts: ['URGENCES', 'URGENCES_TARDE'], label: 'Urgences' },
    { key: 'ADMIN_COMBINED', shifts: ['ADMIN', 'ADM_PLUS'], label: 'Admin' },
    { key: 'TW_COMBINED', shifts: ['TW', 'TW_ABROAD'], label: 'TW' },
    { key: 'LIBERO', shifts: ['LIBERO'], label: 'Libero' },
    { key: 'CM_CS_COMBINED', shifts: ['SICK_LEAVE', 'CS'], label: 'CM/CS' },
    { key: 'STRASBOURG', shifts: ['STRASBOURG'], label: 'Strasbourg' },
    { key: 'RECUP', shifts: ['RECUP'], label: 'Recup' },
    { key: 'CA', shifts: ['CA'], label: 'CA' },
    { key: 'FP', shifts: ['FP'], label: 'FP' },
    { key: 'VACCIN', shifts: ['VACCIN'], label: 'Vaccin' },
    { key: 'VACCIN_AM', shifts: ['VACCIN_AM'], label: 'Vacc AM' },
    { key: 'VACCIN_PM', shifts: ['VACCIN_PM'], label: 'Vacc PM' },
    { key: 'VACCIN_PM_PLUS', shifts: ['VACCIN_PM_PLUS'], label: 'Vacc PM+' }
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
    shiftColumns: BalanceColumn[];
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
            {shiftColumns.map(column => {
                const counts = column.shifts.map(shiftKey => ({
                    shiftKey,
                    count: isActive ? (data.monthlyCounts[shiftKey] || 0) : 0,
                    color: SHIFTS[shiftKey]?.color || 'bg-slate-400'
                }));
                const total = counts.reduce((sum, c) => sum + c.count, 0);
                const values = counts.filter(c => c.count > 0).map(c => ({ value: c.count, color: c.color }));
                
                return (
                    <td key={`${nurse.id}-${column.key}`} className="p-2 border-b border-slate-200 text-center">
                        {total > 0 ? (
                            <StackedBar values={values} total={total} />
                        ) : (
                            <span className="text-slate-400">-</span>
                        )}
                    </td>
                );
            })}
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

    const visibleShiftColumns = useMemo<BalanceColumn[]>(() => {
        if (showAllShifts) return ALL_SHIFT_COLUMNS;
        return ALL_SHIFT_COLUMNS.filter(column =>
            enrichedData.some(data => 
                column.shifts.some(shiftKey => (data.monthlyCounts[shiftKey] || 0) > 0)
            )
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
        <div className="space-y-6">
            {/* Monthly Balance Table */}
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
                                {visibleShiftColumns.map(column => {
                                    const primaryShift = SHIFTS[column.shifts[0]];
                                    return (
                                        <th key={column.key} className="p-2 border-b-2 border-slate-200 text-center font-semibold text-slate-600 whitespace-nowrap">
                                            <div className={`w-16 h-6 mx-auto rounded flex items-center justify-center font-bold text-xs ${primaryShift?.color || 'bg-slate-400'} ${primaryShift?.textColor || 'text-white'}`}>
                                                {column.label}
                                            </div>
                                        </th>
                                    );
                                })}
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

            {/* Annual Balance Summary */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border border-orange-200/80 overflow-auto p-4">
                <h3 className="text-xl font-bold text-orange-900 mb-4">📊 {t.annual || 'Annual'} Summary</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                        <thead className="sticky top-0 bg-orange-100 z-10">
                            <tr>
                                <th className="p-2 border-b-2 border-orange-300 text-left font-semibold text-orange-900 sticky left-0 bg-orange-100 w-40">{t.nurse}</th>
                                {visibleShiftColumns.map(column => {
                                    const primaryShift = SHIFTS[column.shifts[0]];
                                    return (
                                        <th key={`annual-${column.key}`} className="p-2 border-b-2 border-orange-300 text-center font-semibold text-orange-900 whitespace-nowrap">
                                            <div className={`w-16 h-6 mx-auto rounded flex items-center justify-center font-bold text-xs opacity-80 ${primaryShift?.color || 'bg-slate-400'} ${primaryShift?.textColor || 'text-white'}`}>
                                                {column.label}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white/60">
                            {enrichedData.map(data => (
                                <tr key={`annual-${data.nurseId}`} className="border-b border-orange-200/50 hover:bg-orange-100/20 transition-colors">
                                    <td className="p-2 border-r border-orange-200/50 font-medium text-orange-900 sticky left-0 bg-white/60">
                                        {data.nurse.name}
                                    </td>
                                    {visibleShiftColumns.map(column => {
                                        const counts = column.shifts.map(shiftKey => ({
                                            shiftKey,
                                            count: data.annualCounts[shiftKey] || 0,
                                            color: SHIFTS[shiftKey]?.color || 'bg-slate-400'
                                        }));
                                        const total = counts.reduce((sum, c) => sum + c.count, 0);
                                        const values = counts.filter(c => c.count > 0).map(c => ({ value: c.count, color: c.color }));
                                        
                                        return (
                                            <td key={`annual-${data.nurseId}-${column.key}`} className="p-2 border-r border-orange-200/50 text-center text-orange-900 font-semibold">
                                                {total > 0 ? (
                                                    <StackedBar values={values} total={total} />
                                                ) : (
                                                    <span className="text-orange-300">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};