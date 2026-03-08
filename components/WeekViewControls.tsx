import React, { useMemo } from 'react';
import { getWeeksForMonth } from '../utils/dateUtils';
import { useTranslations } from '../hooks/useTranslations';

interface WeekViewControlsProps {
    currentDate: Date;
    selectedWeekIndex: number;
    viewMode: 'months' | 'weeks';
    onViewModeChange: (mode: 'months' | 'weeks') => void;
    onWeekSelect: (weekIndex: number) => void;
    onPreviousWeek: () => void;
    onNextWeek: () => void;
}

export const WeekViewControls: React.FC<WeekViewControlsProps> = ({
    currentDate,
    selectedWeekIndex,
    viewMode,
    onViewModeChange,
    onWeekSelect,
    onPreviousWeek,
    onNextWeek,
}) => {
    const t = useTranslations();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get all dates for this month to group by weeks
    const allDates = useMemo(() => getWeeksForMonth(year, month), [year, month]);
    
    // Group dates by week
    const weeks = useMemo(() => {
        const weekMap = new Map<number, Date[]>();
        allDates.forEach(date => {
            const weekNum = Math.floor((date.getUTCDate() - 1) / 7);
            if (!weekMap.has(weekNum)) {
                weekMap.set(weekNum, []);
            }
            weekMap.get(weekNum)!.push(date);
        });
        return Array.from(weekMap.values());
    }, [allDates]);

    // Get week label
    const getWeekLabel = (weekDates: Date[]) => {
        if (weekDates.length === 0) return '';
        const firstDay = weekDates[0].getUTCDate();
        const lastDay = weekDates[weekDates.length - 1].getUTCDate();
        return `${firstDay}-${lastDay}`;
    };

    // If in months view, don't show controls
    if (viewMode === 'months') {
        return (
            <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 rounded-xl mb-4">
                <span className="text-sm font-semibold text-slate-600">📅 {t.view}:</span>
                <button
                    onClick={() => onViewModeChange('months')}
                    className="px-4 py-2 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all"
                >
                    {t.months || 'Meses'}
                </button>
                <button
                    onClick={() => onViewModeChange('weeks')}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-300 transition-all"
                >
                    {t.weeks || 'Semanas'}
                </button>
            </div>
        );
    }

    // Weeks view
    return (
        <div className="space-y-3 p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 rounded-xl mb-4">
            {/* View mode toggle */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">📅 {t.view}:</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewModeChange('months')}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-300 transition-all"
                    >
                        {t.months || 'Meses'}
                    </button>
                    <button
                        onClick={() => onViewModeChange('weeks')}
                        className="px-4 py-2 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all"
                    >
                        {t.weeks || 'Semanas'}
                    </button>
                </div>
            </div>

            {/* Week tabs and navigation */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onPreviousWeek}
                    disabled={selectedWeekIndex === 0}
                    className="px-3 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title={t.previousWeek || 'Semana anterior'}
                >
                    ← {t.previous || 'Anterior'}
                </button>

                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-min pb-2">
                        {weeks.map((weekDates, index) => {
                            const weekLabel = getWeekLabel(weekDates);
                            const weekNum = index + 1;
                            return (
                                <button
                                    key={index}
                                    onClick={() => onWeekSelect(index)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                                        selectedWeekIndex === index
                                            ? 'bg-gradient-to-r from-zen-600 to-zen-700 text-white shadow-md'
                                            : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-zen-500 hover:bg-zen-50'
                                    }`}
                                    title={`Semana ${weekNum}: ${weekLabel}`}
                                >
                                    {t.week} {weekNum} <span className="text-xs opacity-75 ml-1">({weekLabel})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={onNextWeek}
                    disabled={selectedWeekIndex === weeks.length - 1}
                    className="px-3 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title={t.nextWeek || 'Próxima semana'}
                >
                    {t.next || 'Siguiente'} →
                </button>
            </div>

            {/* Info text */}
            <div className="text-xs text-slate-500 text-center">
                📍 {t.week} {selectedWeekIndex + 1} {t.of} {weeks.length}
            </div>
        </div>
    );
};
