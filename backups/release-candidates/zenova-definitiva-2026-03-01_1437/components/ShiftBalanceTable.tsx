import React, { useMemo, useState } from 'react';
import type { Nurse, WorkZone, BalanceData, ShiftCounts } from '../types';
import { SHIFTS } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

type SortKey = keyof ShiftCounts | 'name' | 'totalWorkDays';
type SortConfig = {
    key: SortKey;
    period: 'monthly' | 'annual';
    direction: 'ascending' | 'descending';
} | null;

const headers: { key: keyof ShiftCounts | 'totalWorkDays', shiftId: WorkZone | 'TOTAL' }[] = [
    { key: 'TRAVAIL', shiftId: 'TRAVAIL' },
    { key: 'TRAVAIL_TARDE', shiftId: 'TRAVAIL_TARDE' },
    { key: 'URGENCES', shiftId: 'URGENCES' },
    { key: 'URGENCES_TARDE', shiftId: 'URGENCES_TARDE' },
    { key: 'ADMIN', shiftId: 'ADMIN' },
    { key: 'ADM_PLUS', shiftId: 'ADM_PLUS' },
    { key: 'TW', shiftId: 'TW' },
    { key: 'TW_ABROAD', shiftId: 'TW_ABROAD' },
    { key: 'CA', shiftId: 'CA' },
    { key: 'FP', shiftId: 'FP' },
    { key: 'CS', shiftId: 'CS' },
    { key: 'RECUP', shiftId: 'RECUP' },
    { key: 'SICK_LEAVE', shiftId: 'SICK_LEAVE' },
    { key: 'STRASBOURG', shiftId: 'STRASBOURG' },
    { key: 'LIBERO', shiftId: 'LIBERO' },
    { key: 'VACCIN_PM_PLUS', shiftId: 'VACCIN_PM_PLUS' },
    { key: 'totalWorkDays', shiftId: 'TOTAL' as any },
];

interface ShiftBalanceTableProps {
  nurses: Nurse[];
  balanceData: BalanceData[];
  onOpenAgenda: (nurse: Nurse) => void;
}

export const ShiftBalanceTable: React.FC<ShiftBalanceTableProps> = ({ nurses, balanceData, onOpenAgenda }) => {
  const t = useTranslations();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const enrichedData = useMemo(() => {
      return balanceData.map(bd => ({
          ...bd,
          nurse: nurses.find(n => n.id === bd.nurseId)!,
      }));
  }, [balanceData, nurses]);

  const sortedData = useMemo(() => {
    let sortableData = [...enrichedData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        if (sortConfig.key === 'name') {
            aValue = a.nurse.name;
            bValue = b.nurse.name;
        } else if (sortConfig.key === 'totalWorkDays') {
            aValue = sortConfig.period === 'monthly' ? a.monthlyTotalWorkDays : a.annualTotalWorkDays;
            bValue = sortConfig.period === 'monthly' ? b.monthlyTotalWorkDays : b.annualTotalWorkDays;
        } else {
            const countsA = sortConfig.period === 'monthly' ? a.monthlyCounts : a.annualCounts;
            const countsB = sortConfig.period === 'monthly' ? b.monthlyCounts : b.annualCounts;
            aValue = countsA[sortConfig.key as keyof ShiftCounts];
            bValue = countsB[sortConfig.key as keyof ShiftCounts];
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [enrichedData, sortConfig]);
  
  const requestSort = (key: SortKey, period: 'monthly' | 'annual') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.period === period && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction, period });
  };
  
  return (
    <div className="overflow-x-auto">
      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr>
              <th rowSpan={2} onClick={() => requestSort('name', 'monthly')} className="p-2 border-b-2 border-slate-200 text-left font-semibold text-slate-600 cursor-pointer sticky left-0 bg-slate-50 w-28">
                {t.nurse}
              </th>
              <th colSpan={headers.length} className="p-1 border-b-2 border-l border-slate-200 text-center font-bold text-slate-700 bg-slate-200/70">
                Balance Mensual
              </th>
              <th colSpan={headers.length} className="p-1 border-b-2 border-l border-slate-200 text-center font-bold text-slate-700 bg-slate-200/70">
                Balance Anual
              </th>
            </tr>
            <tr>
                {/* Monthly Headers */}
                {headers.map(({ key, shiftId }) => {
                    const shift = shiftId === 'TOTAL' ? null : SHIFTS[shiftId];
                    return <th key={`month-${key}`} onClick={() => requestSort(key, 'monthly')} className="p-1 border-b-2 border-slate-200 cursor-pointer border-l" title={shift?.label || t.total}><div className={`w-9 h-6 mx-auto rounded flex items-center justify-center font-bold text-xs ${shift ? `${shift.color} ${shift.textColor}` : 'bg-slate-600 text-white'}`}>{shift ? shift.label.replace(' M', '').replace(' T', '') : 'Total'}</div></th>
                })}
                {/* Annual Headers */}
                {headers.map(({ key, shiftId }) => {
                    const shift = shiftId === 'TOTAL' ? null : SHIFTS[shiftId];
                    return <th key={`year-${key}`} onClick={() => requestSort(key, 'annual')} className="p-1 border-b-2 border-slate-200 cursor-pointer border-l" title={shift?.label || t.total}><div className={`w-9 h-6 mx-auto rounded flex items-center justify-center font-bold text-xs ${shift ? `${shift.color} ${shift.textColor}` : 'bg-slate-600 text-white'}`}>{shift ? shift.label.replace(' M', '').replace(' T', '') : 'Total'}</div></th>
                })}
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedData.map((data) => (
              <tr key={data.nurseId} onClick={() => onOpenAgenda(data.nurse)} className={`hover:bg-blue-50/50 cursor-pointer ${data.hasConsecutiveAdmTw ? 'bg-slate-200' : ''}`}>
                <td className="p-2 border-b border-slate-200 font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10">
                    {data.nurse.name}
                </td>
                {/* Monthly Data */}
                {headers.map(({ key, shiftId }) => (
                    <td key={`month-data-${key}`} className="p-2 border-b border-l border-slate-200 text-center text-slate-700">
                        {key === 'totalWorkDays' ? <strong>{data.monthlyTotalWorkDays}</strong> : (data.monthlyCounts[shiftId as keyof ShiftCounts] || 0)}
                    </td>
                ))}
                {/* Annual Data */}
                {headers.map(({ key, shiftId }) => (
                     <td key={`year-data-${key}`} className="p-2 border-b border-l border-slate-200 text-center text-slate-700">
                        {key === 'totalWorkDays' ? <strong>{data.annualTotalWorkDays}</strong> : (data.annualCounts[shiftId as keyof ShiftCounts] || 0)}
                    </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};