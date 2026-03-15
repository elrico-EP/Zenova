import React, { useMemo } from 'react';
import { getWeeksForMonth, getWeekIdentifier, getFullWeekDates } from '../utils/dateUtils';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';

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
    const { language } = useLanguage();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get all dates for this month to group by weeks
    const allDates = useMemo(() => getWeeksForMonth(year, month), [year, month]);
    
    // Group dates by ISO week (Monday-Sunday) and get week IDs
    const weekIds = useMemo(() => {
        const weekMap = new Map<string, Date[]>();
        allDates.forEach(date => {
            const weekId = getWeekIdentifier(date);
            if (!weekMap.has(weekId)) {
                weekMap.set(weekId, []);
            }
            weekMap.get(weekId)!.push(date);
        });
        return Array.from(weekMap.keys());
    }, [allDates]);

    // Get week label with full week range
    const getWeekLabel = (weekId: string) => {
        const weekDates = getFullWeekDates(weekId);
        if (weekDates.length === 0) return '';
        
        const firstDate = weekDates[0];
        const lastDate = weekDates[6];
        
        const firstDay = firstDate.getUTCDate();
        const lastDay = lastDate.getUTCDate();
        const firstMonth = firstDate.getUTCMonth();
        const lastMonth = lastDate.getUTCMonth();
        
        // Same month
        if (firstMonth === lastMonth) {
            return `${firstDay}-${lastDay}`;
        }
        
        // Different months - show abbreviated month names
        const monthFormatter = new Intl.DateTimeFormat(language, { month: 'short' });
        const firstMonthName = monthFormatter.format(firstDate).replace('.', '');
        const lastMonthName = monthFormatter.format(lastDate).replace('.', '');
        
        return `${firstDay} ${firstMonthName} - ${lastDay} ${lastMonthName}`;
    };

    // If in months view, show compact toggle
    if (viewMode === 'months') {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">{t.view}:</span>
                <button
                    onClick={() => onViewModeChange('months')}
                    className="px-3 py-1 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-md font-semibold text-xs hover:shadow-md transition-all"
                >
                    {t.months || 'Meses'}
                </button>
                <button
                    onClick={() => onViewModeChange('weeks')}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-300 transition-all"
                >
                    {t.weeks || 'Semanas'}
                </button>
            </div>
        );
    }

    // Weeks view - compact
    return (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* View mode toggle */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">{t.view}:</span>
                <button
                    onClick={() => onViewModeChange('months')}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-300 transition-all"
                >
                    {t.months || 'Meses'}
                </button>
                <button
                    onClick={() => onViewModeChange('weeks')}
                    className="px-3 py-1 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-md font-semibold text-xs hover:shadow-md transition-all"
                >
                    {t.weeks || 'Semanas'}
                </button>
            </div>

            {/* Week navigation */}
            <button
                onClick={onPreviousWeek}
                disabled={selectedWeekIndex === 0}
                className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={t.previousWeek || 'Semana anterior'}
            >
                ←
            </button>

            {/* Week tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide max-w-full">
                {weekIds.map((weekId, index) => {
                    const weekLabel = getWeekLabel(weekId);
                    const weekNum = index + 1;
                    return (
                        <button
                            key={weekId}
                            onClick={() => onWeekSelect(index)}
                            className={`px-2 py-1 rounded-md font-semibold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                                selectedWeekIndex === index
                                    ? 'bg-gradient-to-r from-zen-600 to-zen-700 text-white shadow-sm'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:border-zen-500 hover:bg-zen-50'
                            }`}
                            title={`${t.week} ${weekNum}: ${weekLabel}`}
                        >
                            S{weekNum}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={onNextWeek}
                disabled={selectedWeekIndex === weekIds.length - 1}
                className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={t.nextWeek || 'Próxima semana'}
            >
                →
            </button>

            {/* Info text */}
            <span className="hidden sm:inline text-xs text-slate-500 whitespace-nowrap">
                {t.week} {selectedWeekIndex + 1}/{weekIds.length}
            </span>
        </div>
    );
};
