import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import type { Nurse, Wishes, Agenda, ActivityLevel, Wish } from '../types';
import { getWeekIdentifier } from '../utils/dateUtils';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslations } from '../hooks/useTranslations';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { MonthPicker } from './MonthPicker';

const activityStyles: Record<ActivityLevel, { bg: string }> = {
  NORMAL: { bg: 'bg-slate-50' },
  SESSION: { bg: 'bg-rose-100' },
  WHITE_GREEN: { bg: 'bg-emerald-50' },
  REDUCED: { bg: 'bg-amber-50' },
  CLOSED: { bg: 'bg-gray-200' }
};

// Sub-componente para cada celda de día/enfermero
const DayCell: React.FC<{
    nurseId: string;
    dateKey: string;
    wish: Wish | undefined;
    onTextChange: (nurseId: string, dateKey: string, text: string) => void;
    onValidate: (nurseId: string, dateKey: string, isValidated: boolean) => void;
}> = React.memo(({ nurseId, dateKey, wish, onTextChange, onValidate }) => {
    const { effectiveUser } = useUser();
    const permissions = usePermissions();
    const t = useTranslations();
    const [editText, setEditText] = useState(wish?.text || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isOwner = effectiveUser?.id === nurseId;
    const isValidated = wish?.validated || false;
    
    const canEdit = (permissions.canEditOwnWishes && isOwner && !isValidated) || permissions.isViewingAsAdmin;
    
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [editText]);

    const handleBlur = () => {
        if (editText !== (wish?.text || '')) {
            onTextChange(nurseId, dateKey, editText);
        }
    };

    const handleValidationToggle = () => {
        if (permissions.canValidateWishes) {
            onValidate(nurseId, dateKey, !isValidated);
        }
    };
    
    return (
        <div className="relative h-full w-full flex items-start p-1">
            <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleBlur}
                readOnly={!canEdit}
                placeholder={canEdit ? '...' : ''}
                rows={1}
                className={`w-full h-full bg-transparent border-none resize-none text-sm p-1 leading-snug rounded-md transition-all
                    ${canEdit ? 'cursor-pointer focus:bg-white/50 focus:ring-1 focus:ring-zen-400' : 'cursor-default'}
                    ${!editText ? 'text-slate-400' : 'text-slate-800'}`
                }
            />
            
            {permissions.canValidateWishes && editText ? (
                // Admin sees a button that shows the STATE and can be clicked to toggle
                <button 
                    onClick={handleValidationToggle}
                    className="absolute bottom-1 right-1 p-1 rounded-full"
                    title={isValidated ? t.wishValidated : t.wishPending}
                >
                    {isValidated ? 
                        // Is validated -> Show Green Check
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 hover:text-green-700" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        : 
                        // Is NOT validated -> Show Red Cross
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 hover:text-red-700" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    }
                </button>
            ) : (
                // Non-admin just sees the static status icon if validated
                isValidated && (
                    <span className="absolute top-1 right-1 text-green-500" title={t.validatedByAdmin}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                   </span>
                )
            )}
        </div>
    );
});


interface WishesPageProps {
    nurses: Nurse[];
    year: number;
    wishes: Wishes;
    onWishesChange: (nurseId: string, dateKey: string, text: string) => void;
    onWishValidationChange: (nurseId: string, dateKey: string, isValidated: boolean) => void;
    agenda: Agenda;
}

export const WishesPage: React.FC<WishesPageProps> = ({ nurses, year, wishes, onWishesChange, onWishValidationChange, agenda }) => {
    const t = useTranslations();
    const { language } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

    const dayNames = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(language, { weekday: 'narrow' });
        // 2023-01-01 is a Sunday. Create an array starting with Sunday.
        return [...Array(7).keys()].map(i => formatter.format(new Date(2023, 0, i + 1)));
    }, [language]);

    const { daysInMonth, monthName } = useMemo(() => {
        const date = new Date(year, currentMonth, 1);
        return {
            daysInMonth: new Date(year, currentMonth + 1, 0).getDate(),
            monthName: date.toLocaleString(language, { month: 'long' })
        };
    }, [year, currentMonth, language]);

    const handlePrevMonth = () => setCurrentMonth(m => (m === 0 ? 11 : m - 1));
    const handleNextMonth = () => setCurrentMonth(m => (m === 11 ? 0 : m + 1));

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 p-4 h-full flex flex-col">
            <header className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-800">{t.wishesPageTitle}</h2>
                <div className="relative flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-slate-200 text-slate-600"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <div className="relative">
                        <button onClick={() => setIsMonthPickerOpen(true)} className="px-2 py-1 rounded-md hover:bg-slate-200 transition-colors">
                            <h3 className="text-xl font-semibold text-slate-700 w-48 text-center capitalize">{monthName} {year}</h3>
                        </button>
                        {isMonthPickerOpen && (
                            <MonthPicker
                                currentDate={new Date(year, currentMonth, 1)}
                                onSelectDate={(date) => {
                                    setCurrentMonth(date.getMonth());
                                    setIsMonthPickerOpen(false);
                                }}
                                onClose={() => setIsMonthPickerOpen(false)}
                            />
                        )}
                    </div>
                    <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-slate-200 text-slate-600"><ArrowRightIcon className="w-6 h-6" /></button>
                </div>
            </header>
            
            <div className="flex-grow overflow-auto">
                <table className="border-collapse w-full text-sm border-separate" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className="sticky left-0 bg-slate-100 z-30 p-2 border-b-2 font-semibold text-slate-600 text-left" style={{width: '6rem'}}>{t.dayHeader}</th>
                            {nurses.map(nurse => (
                                <th key={nurse.id} className="p-2 border-b-2 font-semibold text-slate-600 text-left bg-slate-100 truncate">{nurse.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const date = new Date(year, currentMonth, day);
                            const dateKey = date.toISOString().split('T')[0];
                            const dayOfWeek = date.getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const weekId = getWeekIdentifier(date);
                            const activityLevel = agenda[weekId] || 'NORMAL';
                            const activityStyle = activityStyles[activityLevel];
                            const dayRowBg = isWeekend ? 'bg-slate-100' : activityStyle.bg;

                            return (
                                <tr key={dateKey}>
                                    <td className={`sticky left-0 z-10 p-2 border-b font-medium ${dayRowBg}`} style={{width: '6rem'}}>
                                        <span className={`capitalize ${isWeekend ? 'text-slate-500' : 'text-slate-800'}`}>
                                            {dayNames[dayOfWeek]} {date.getDate()}
                                        </span>
                                    </td>
                                    {nurses.map(nurse => {
                                        const wish = wishes[nurse.id]?.[dateKey];
                                        const isValidated = wish?.validated || false;
                                        return (
                                        <td key={nurse.id} className={`border-b p-0 ${dayRowBg} ${isValidated ? 'bg-green-50/50' : ''}`}>
                                            <DayCell
                                                nurseId={nurse.id}
                                                dateKey={dateKey}
                                                wish={wish}
                                                onTextChange={onWishesChange}
                                                onValidate={onWishValidationChange}
                                            />
                                        </td>
                                    )})}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};