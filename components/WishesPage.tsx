import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import type { Nurse, Wishes, Agenda, ActivityLevel, Wish, WorkZone } from '../types';
import { getWeekIdentifier } from '../utils/dateUtils';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslations } from '../hooks/useTranslations';
import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon } from './Icons';
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
    onWishesChange: (nurseId: string, dateKey: string, text: string, shiftType?: WorkZone) => void;
    onValidate: (nurseId: string, dateKey: string, isValidated: boolean) => void;
    onDeleteWish: (nurseId: string, dateKey: string) => void;
}> = React.memo(({ nurseId, dateKey, wish, onWishesChange, onValidate, onDeleteWish }) => {
    const { effectiveUser } = useUser();
    const permissions = usePermissions();
    const t = useTranslations();
    const [editText, setEditText] = useState(wish?.text || '');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
            onWishesChange(nurseId, dateKey, editText, wish?.shiftType);
        }
    };

    const handleValidationToggle = () => {
        if (permissions.canValidateWishes) {
            onValidate(nurseId, dateKey, !isValidated);
        }
    };

    const handleShiftSelect = (shiftType: WorkZone | undefined) => {
        onWishesChange(nurseId, dateKey, editText, shiftType);
        setIsMenuOpen(false);
    };

    const wishShifts: { type: WorkZone; label: string; color: string }[] = [
        { type: 'CA', label: 'CA', color: 'bg-emerald-100 text-emerald-800' },
        { type: 'SICK_LEAVE', label: 'CM', color: 'bg-rose-100 text-rose-800' },
        { type: 'FP', label: 'FP', color: 'bg-blue-100 text-blue-800' },
        { type: 'RECUP', label: 'RECUP', color: 'bg-amber-100 text-amber-800' },
        { type: 'TW', label: 'TW', color: 'bg-indigo-100 text-indigo-800' },
        { type: 'TW_ABROAD', label: 'TW Abroad', color: 'bg-violet-100 text-violet-800' },
    ];
    
    return (
        <div className="relative h-full w-full flex flex-col p-1 min-h-[3rem]">
            <div className="flex items-center justify-between mb-1">
                {wish?.shiftType && (
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${wishShifts.find(s => s.type === wish.shiftType)?.color || 'bg-slate-100'}`}>
                        {wishShifts.find(s => s.type === wish.shiftType)?.label || wish.shiftType}
                    </div>
                )}
                {canEdit && (wish?.text || wish?.shiftType) && (
                    <button 
                        onClick={() => onDeleteWish(nurseId, dateKey)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                        title={t.deleteWish}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
                {canEdit && (
                    <div className="relative ml-auto">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 text-slate-400 hover:text-zen-600 rounded hover:bg-slate-100"
                            title="Select Shift"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 w-28">
                                <button onClick={() => handleShiftSelect(undefined)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-500 italic">None</button>
                                {wishShifts.map(s => (
                                    <button 
                                        key={s.type} 
                                        onClick={() => handleShiftSelect(s.type)}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 font-medium"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleBlur}
                readOnly={!canEdit}
                placeholder={canEdit ? '...' : ''}
                rows={1}
                className={`w-full flex-grow bg-transparent border-none resize-none text-sm p-1 leading-snug rounded-md transition-all
                    ${canEdit ? 'cursor-pointer focus:bg-white/50 focus:ring-1 focus:ring-zen-400' : 'cursor-default'}
                    ${!editText ? 'text-slate-400' : 'text-slate-800'}`
                }
            />
            
            {permissions.canValidateWishes && (editText || wish?.shiftType) ? (
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
                        // Is NOT validated -> Show Amber Clock (Pending)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 hover:text-amber-700" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
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
    onWishesChange: (nurseId: string, dateKey: string, text: string, shiftType?: WorkZone) => void;
    onWishValidationChange: (nurseId: string, dateKey: string, isValidated: boolean) => void;
    onDeleteWish: (nurseId: string, dateKey: string) => void;
    agenda: Agenda;
}

export const WishesPage: React.FC<WishesPageProps> = ({ nurses, year, wishes, onWishesChange, onWishValidationChange, onDeleteWish, agenda }) => {
    const t = useTranslations();
    const { language } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
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
            <header className="flex flex-col md:flex-row items-center justify-between pb-4 border-b-2 border-zen-100 mb-6 flex-shrink-0 gap-4">
                <div className="flex flex-col items-center gap-1 order-2 md:order-1">
                    <span className="text-[10px] font-bold text-zen-600 uppercase tracking-widest mb-1">Month of wishes and events</span>
                    <div className="relative flex items-center gap-4 bg-white border-2 border-zen-200 shadow-sm rounded-xl p-1.5">
                        <button 
                            onClick={handlePrevMonth} 
                            className="p-2 rounded-lg hover:bg-zen-50 text-zen-600 transition-colors"
                            title={t.prevMonth}
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setIsMonthPickerOpen(true)} 
                                className="px-4 py-2 rounded-lg hover:bg-zen-50 transition-all group flex items-center gap-3"
                            >
                                <h3 className="text-2xl font-black text-zen-800 min-w-[180px] text-center capitalize">
                                    {monthName} <span className="text-zen-400 font-light">{year}</span>
                                </h3>
                                <svg className="w-5 h-5 text-zen-300 group-hover:text-zen-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4 4 4-4" />
                                </svg>
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
                        
                        <button 
                            onClick={handleNextMonth} 
                            className="p-2 rounded-lg hover:bg-zen-50 text-zen-600 transition-colors"
                            title={t.nextMonth}
                        >
                            <ArrowRightIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 order-1 md:order-2">
                    <div className="p-2 bg-zen-100 rounded-lg text-zen-700">
                        <CalendarDaysIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t.wishesPageTitle}</h2>
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
                            const date = new Date(year, currentMonth, day, 12, 0, 0);
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
                                                onWishesChange={onWishesChange}
                                                onValidate={onWishValidationChange}
                                                onDeleteWish={onDeleteWish}
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