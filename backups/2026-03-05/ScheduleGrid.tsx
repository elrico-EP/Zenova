import React, { useRef, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import type { Nurse, Schedule, WorkZone, RuleViolation, Agenda, ActivityLevel, ScheduleCell, Notes, CustomShift, Hours, JornadaLaboral, SpecialStrasbourgEvent, DailyNote, SwapInfo } from '../types';
import { SHIFTS } from '../constants';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getScheduleCellHours, getShiftsFromCell } from '../utils/scheduleUtils';
import { holidays2026 } from '../data/agenda2026';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTranslations } from '../hooks/useTranslations';
import { supabase } from '../utils/supabase'
import { Locale } from '../translations/locales';
import { guardarTurno, cargarTurnosMes, escucharCambiosTurnos } from '../utils/turnoService'

const activityStyles: Record<ActivityLevel, { bg: string; text: string; weekBg: string; weekText: string }> = {
  NORMAL: { bg: 'bg-slate-50', text: 'text-slate-800', weekBg: 'bg-slate-600', weekText: 'text-white' },
  SESSION: { bg: 'bg-rose-100', text: 'text-rose-900', weekBg: 'bg-rose-700', weekText: 'text-white' },
  WHITE_GREEN: { bg: 'bg-emerald-50', text: 'text-emerald-800', weekBg: 'bg-emerald-600', weekText: 'text-white' },
  REDUCED: { bg: 'bg-amber-50', text: 'text-amber-800', weekBg: 'bg-amber-600', weekText: 'text-white' },
  CLOSED: { bg: 'bg-gray-200', text: 'text-gray-600', weekBg: 'bg-gray-500', weekText: 'text-white' }
};

const DayHeaderCell: React.FC<{ day: number, dayOfWeek: string, isWeekend: boolean, activityLevel: ActivityLevel, isNewWeek: boolean, weekId: string, weekLabel: string }> = ({ day, dayOfWeek, isWeekend, activityLevel, isNewWeek, weekId, weekLabel }) => {
    const style = activityStyles[activityLevel];
    const finalBg = isWeekend ? 'bg-gray-200' : style.bg;
    const textColor = isWeekend ? 'text-gray-700' : style.text;

    return (
        <div className={`w-full h-full flex flex-col ${finalBg}`}>
            {isNewWeek && (
                <div className={`h-5 ${style.weekBg} ${style.weekText} flex items-center justify-center flex-shrink-0`}>
                    <span className="font-bold text-xs tracking-wider">{weekLabel} {weekId.split('-W')[1]}</span>
                </div>
            )}
            <div className={`flex-grow flex items-center justify-center gap-2 ${textColor}`}>
                <span className="text-2xl font-bold">{day}</span>
                <span className="text-xs font-medium uppercase tracking-wider">{dayOfWeek}</span>
            </div>
        </div>
    );
};

export const ShiftCell: React.FC<{
    shiftCell: ScheduleCell | undefined;
    hours: string | { morning: string; afternoon: string } | string[];
    hasManualHours: boolean;
    violation?: RuleViolation;
    isWeekend: boolean;
    isClosingDay: boolean;
    nurseId: string;
    weekId: string;
    activityLevel: ActivityLevel;
    strasbourgAssignments: Record<string, string[]>;
    specialEvent?: SpecialStrasbourgEvent;
    dayOfWeek: number;
    isShortFriday: boolean;
}> = ({ shiftCell, hours, hasManualHours, violation, isWeekend, isClosingDay, nurseId, weekId, activityLevel, strasbourgAssignments, specialEvent, dayOfWeek, isShortFriday }) => {
    const t = useTranslations();
    const attendees = strasbourgAssignments[weekId] || [];
    const title = violation?.message || (typeof shiftCell === 'string' ? t[SHIFTS[shiftCell]?.description as keyof Locale] as string : '');
    const hasMultipleHourLines = Array.isArray(hours) && hours.length > 1;

    if (specialEvent) {
        return (
            <div
                className="w-full h-full p-1 flex items-center justify-center relative"
                title={`${specialEvent.name}${specialEvent.notes ? `\n\nNotas: ${specialEvent.notes}` : ''}`}
            >
                <div className="w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm bg-purple-200 text-purple-800 font-bold text-xs text-center">
                    <span className="truncate px-1">{specialEvent.name}</span>
                </div>
            </div>
        );
    }

    const renderHours = () => {
        if (Array.isArray(hours)) {
            return hours.map((line, index) => (
                <span key={index} className="block text-[10px] leading-tight opacity-90 text-center font-semibold">
                    {line}
                </span>
            ));
        }
        if (typeof hours === 'string' && hours) {
            return <span className={`block text-[10px] leading-tight opacity-90 text-center ${hasManualHours ? 'font-semibold' : ''}`}>{hours}</span>;
        }
        return null;
    }

    if (activityLevel === 'SESSION' && dayOfWeek >= 1 && dayOfWeek <= 4 && attendees.includes(nurseId)) {
        const shift = SHIFTS['STRASBOURG'];
        return (
            <div className={`w-full h-full p-1 flex items-center justify-center relative`} title={t[shift.description as keyof Locale] as string}>
                <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${shift.color} ${shift.textColor}`}>
                    <span className="font-bold text-base">{shift.label}</span>
                </div>
            </div>
        );
    }

    if (!shiftCell) {
        const style = activityStyles[activityLevel] || activityStyles['NORMAL'];
        const bgColor = isClosingDay ? 'bg-emerald-50/50' : isWeekend ? 'bg-slate-100/80' : style.bg;
        return <div className={`w-full h-full ${bgColor} relative`}></div>;
    }
    
    if (typeof shiftCell === 'object' && 'custom' in shiftCell) {
        const customShift = shiftCell as CustomShift;

        // Special rendering for STR-PREP: same background, no text.
        if (customShift.custom === 'STR-PREP') {
            const shift = SHIFTS['STRASBOURG'];
            return (
                <div 
                    className={`w-full h-full p-1 flex items-center justify-center relative rounded-md shadow-sm ${shift.color}`}
                    title={t[shift.description as keyof Locale] as string}
                >
                    {/* No text content rendered here */}
                </div>
            );
        }

        const shiftStyle = customShift.type ? SHIFTS[customShift.type] : null;
        const bgColor = shiftStyle ? shiftStyle.color : 'bg-white';
        const