import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import type { Nurse, Wishes, Agenda, ActivityLevel } from '../types';
import { getWeekIdentifier } from '../utils/dateUtils';
import { useUser } from '../contexts/UserContext';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { holidays2026 } from '../data/agenda2026';

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
    const { effectiveUser } = useUser();
    const t = useTranslations();
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkNurseId, setBulkNurseId] = useState<string>('');
    const [bulkStartDate, setBulkStartDate] = useState('');
    const [bulkEndDate, setBulkEndDate] = useState('');
    const [bulkText, setBulkText] = useState('');

    const { months, dayNames } = useMemo(() => {
        const m = [...Array(12).keys()].map(i => new Date(year, i, 1).toLocaleString(language, { month: 'long' }));
        const d = [...Array(7).keys()].map(i => new Date(2023, 0, i + 1).toLocaleString(language, { weekday: 'short' }));
        return { months: m, dayNames: d };
    }, [year, language]);

    const handleBulkApply = () => {
        if (!bulkNurseId || !bulkStartDate || !bulkEndDate || !bulkText.trim()) return;
        
        const start = new Date(bulkStartDate);
        const end = new Date(bulkEndDate);
        
        if (start > end) {
            alert(t.error_dateOrder || 'La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        // Aplicar el deseo a todos los días en el rango, excluyendo fines de semana
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            // Excluir sábados (6) y domingos (0)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const dateKey = d.toISOString().split('T')[0];
                onWishesChange(bulkNurseId, dateKey, bulkText);
            }
        }

        // Resetear formulario
        setBulkText('');
        setBulkStartDate('');
        setBulkEndDate('');
        setShowBulkEdit(false);
    };

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
            {/* Modal de edición múltiple */}
            {showBulkEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBulkEdit(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t.bulkEditWishes || 'Aplicar deseo a varios días'}</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.nurse || 'Enfermera'}</label>
                                <select 
                                    value={bulkNurseId} 
                                    onChange={(e) => setBulkNurseId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-zen-500 focus:border-zen-500"
                                >
                                    <option value="">{t.selectNurse || 'Seleccionar enfermera'}</option>
                                    {nurses.filter(n => effectiveUser?.role === 'admin' || effectiveUser?.id === n.id).map(nurse => (
                                        <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.startDate || 'Fecha inicio'}</label>
                                    <input
                                        type="date"
                                        value={bulkStartDate}
                                        onChange={(e) => setBulkStartDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-zen-500 focus:border-zen-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.endDate || 'Fecha fin'}</label>
                                    <input
                                        type="date"
                                        value={bulkEndDate}
                                        onChange={(e) => setBulkEndDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-zen-500 focus:border-zen-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.wishText || 'Deseo / Turno'}</label>
                                <textarea
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                    placeholder="Ej: CA, FP, Formación..."
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-zen-500 focus:border-zen-500"
                                />
                            </div>

                            <p className="text-xs text-gray-500 italic">
                                {t.bulkEditNote || 'Los fines de semana se excluirán automáticamente'}
                            </p>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowBulkEdit(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleBulkApply}
                                    disabled={!bulkNurseId || !bulkStartDate || !bulkEndDate || !bulkText.trim()}
                                    className="px-4 py-2 bg-zen-600 text-white font-semibold rounded-md hover:bg-zen-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {t.apply || 'Aplicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <table className="border-collapse w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                    <tr>
                        <th className="sticky left-0 bg-slate-100 z-30 p-2 border-b-2 font-normal text-slate-600 w-32 text-left">
                            <div className="flex items-center justify-between gap-2">
                                <span>{t.dayHeader}</span>
                                <button
                                    onClick={() => setShowBulkEdit(true)}
                                    className="px-2 py-1 text-sm bg-zen-600 text-white rounded hover:bg-zen-700 font-bold flex-shrink-0"
                                    title={t.bulkEditWishes || 'Aplicar deseo a varios días'}
                                >
                                    +
                                </button>
                            </div>
                        </th>
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
                        const isHoliday = holidays2026.has(dateKey);
                        const isClosed = activityLevel === 'CLOSED';
                        const isSpecialDay = isHoliday || isClosed;
                        let bgColor = activityStyles[activityLevel];
                        if (isSpecialDay) {
                            bgColor = isHoliday ? 'bg-red-50' : 'bg-gray-100';
                        }

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