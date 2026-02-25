import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import type { Nurse, Wishes, Agenda, ActivityLevel } from '../types';
import { getWeekIdentifier } from '../utils/dateUtils';
import { useUser } from '../contexts/UserContext';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';

const activityStyles: Record<ActivityLevel, string> = {
  NORMAL: 'bg-white',
  SESSION: 'bg-rose-50',
  WHITE_GREEN: 'bg-emerald-50',
  REDUCED: 'bg-amber-50',
  CLOSED: 'bg-gray-100'
};

interface DayCellProps {
    nurseId: string;
    dateKey: string;
    text: string;
    onTextChange: (nurseId: string, dateKey: string, text: string) => void;
    isWeekend: boolean;
    bgColor: string;
}

const DayCell: React.FC<DayCellProps> = React.memo(({ nurseId, dateKey, text, onTextChange, isWeekend, bgColor }) => {
    // FIX: Use effectiveUser for permission checks to handle impersonation.
    const { effectiveUser } = useUser();
    const [editText, setEditText] = useState(text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const canEdit = effectiveUser?.id === nurseId || effectiveUser?.role === 'admin';
    const effectiveBg = isWeekend ? 'bg-slate-50' : bgColor;
    
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [editText]);

    const handleBlur = () => {
        if (editText !== text) {
            onTextChange(nurseId, dateKey, editText);
        }
    };
    
    return (
        <td className={`p-2 align-top ${effectiveBg}`}>
            <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleBlur}
                readOnly={!canEdit}
                placeholder={canEdit ? '...' : ''}
                rows={1}
                className={`w-full h-auto bg-transparent border-none resize-none text-sm p-1 leading-snug rounded-md transition-all
                    ${canEdit ? 'cursor-pointer focus:bg-white focus:ring-1 focus:ring-zen-400' : 'cursor-default'}
                    ${!editText ? 'text-slate-400' : 'text-slate-800'}`
                }
            />
        </td>
    );
});


interface WishesCalendarProps {
    nurses: Nurse[];
    year: number;
    wishes: Wishes;
    onWishesChange: (nurseId: string, dateKey: string, text: string) => void;
    agenda: Agenda;
}

export const WishesCalendar: React.FC<WishesCalendarProps> = ({ nurses, year, wishes, onWishesChange, agenda }) => {
    const { language } = useLanguage();
    const t = useTranslations();

    const { months, dayNames } = useMemo(() => {
        const m = [...Array(12).keys()].map(i => new Date(year, i, 1).toLocaleString(language, { month: 'long' }));
        const d = [...Array(7).keys()].map(i => new Date(2023, 0, i + 1).toLocaleString(language, { weekday: 'short' }));
        return { months: m, dayNames: d };
    }, [year, language]);

    const calendarDays = useMemo(() => {
        const days = [];
        for (let m = 0; m < 12; m++) {
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            days.push({ monthName: months[m], isMonth: true });
            for (let d = 1; d <= daysInMonth; d++) {
                days.push({ date: new Date(year, m, d), isMonth: false });
            }
        }
        return days;
    }, [year, months]);

    return (
        <div className="overflow-auto h-full">
            <table className="border-collapse w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                    <tr>
                        <th className="sticky left-0 bg-slate-100 z-30 p-2 border-b-2 font-normal text-slate-600 w-32 text-left">{t.dayHeader}</th>
                        {nurses.map(nurse => (
                            <th key={nurse.id} className="p-2 border-b-2 font-normal text-slate-600 min-w-[12rem] text-left">{nurse.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {calendarDays.map((item, index) => {
                        if (item.isMonth) {
                            return (
                                <tr key={`month-${item.monthName}`}>
                                    <td colSpan={nurses.length + 1} className="sticky left-0 bg-white p-2 border-b-2 border-zen-200 font-semibold text-zen-700 z-10 capitalize">
                                        {item.monthName}
                                    </td>
                                </tr>
                            );
                        }
                        const date = item.date as Date;
                        const dateKey = date.toISOString().split('T')[0];
                        const dayOfWeek = date.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const weekId = getWeekIdentifier(date);
                        const activityLevel = agenda[weekId] || 'NORMAL';
                        const bgColor = activityStyles[activityLevel];

                        return (
                            <tr key={dateKey} className="hover:bg-zen-50/50">
                                <td className={`sticky left-0 z-10 p-2 border-b font-medium w-32 ${isWeekend ? 'bg-slate-50' : 'bg-white'}`}>
                                    <span className={`capitalize ${isWeekend ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {dayNames[dayOfWeek]} {date.getDate()}
                                    </span>
                                </td>
                                {nurses.map(nurse => (
                                    <td key={nurse.id} className={`border-b ${isWeekend ? 'bg-slate-50/70' : ''}`}>
                                        <DayCell
                                            nurseId={nurse.id}
                                            dateKey={dateKey}
                                            text={wishes[nurse.id]?.[dateKey]?.text || ''}
                                            onTextChange={onWishesChange}
                                            isWeekend={isWeekend}
                                            bgColor={bgColor}
                                        />
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};