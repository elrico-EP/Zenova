import React from 'react';
import type { ScheduleCell, RuleViolation, ActivityLevel, CustomShift, WorkZone } from '../types';
import { SHIFTS } from '../constants';
import { Locale } from '../translations/locales';
import { useTranslations } from '../hooks/useTranslations';
import { usePermissions } from '../hooks/usePermissions';
import { ClockIcon } from './Icons';

const activityStyles: Record<ActivityLevel, { bg: string; text: string; weekBg: string; weekText: string }> = {
  NORMAL: { bg: 'bg-slate-50', text: 'text-slate-800', weekBg: 'bg-slate-600', weekText: 'text-white' },
  SESSION: { bg: 'bg-rose-100', text: 'text-rose-900', weekBg: 'bg-rose-700', weekText: 'text-white' },
  WHITE_GREEN: { bg: 'bg-emerald-50', text: 'text-emerald-800', weekBg: 'bg-emerald-600', weekText: 'text-white' },
  REDUCED: { bg: 'bg-amber-50', text: 'text-amber-800', weekBg: 'bg-amber-600', weekText: 'text-white' },
  CLOSED: { bg: 'bg-gray-200', text: 'text-gray-600', weekBg: 'bg-gray-500', weekText: 'text-white' }
};

interface ShiftCellProps {
    shiftCell: ScheduleCell | undefined;
    hours: string | { morning: string; afternoon: string } | string[];
    hasManualHours: boolean;
    violation?: RuleViolation;
    isWeekend: boolean;
    isClosingDay: boolean;
    nurseId: string;
    dateKey: string;
    weekId: string;
    activityLevel: ActivityLevel;
    strasbourgAssignments: Record<string, string[]>;
    dayOfWeek: number;
    isShortFriday: boolean;
    isMonthClosed: boolean;
    onOpenHoursEdit: (nurseId: string, dateKey: string, anchorEl: HTMLElement) => void;
}

export const ShiftCell: React.FC<ShiftCellProps> = (props) => {
    const { shiftCell, hours, hasManualHours, violation, isWeekend, isClosingDay, nurseId, dateKey, weekId, activityLevel, strasbourgAssignments, dayOfWeek, isShortFriday, isMonthClosed, onOpenHoursEdit } = props;
    const t = useTranslations();
    const permissions = usePermissions();
    const attendees = strasbourgAssignments[weekId] || [];
    const title = violation?.message || (typeof shiftCell === 'string' ? t[SHIFTS[shiftCell]?.description as keyof Locale] as string : '');
    const hasMultipleHourLines = Array.isArray(hours) && hours.length > 1;

    const renderHours = () => {
        if (Array.isArray(hours) && hours.length > 0) {
            return hours.map((line, index) => (
                <span key={index} className="block text-[10px] leading-tight text-center font-semibold">
                    ({line})
                </span>
            ));
        }
        if (typeof hours === 'string' && hours) {
            return <span className={`block text-[10px] leading-tight text-center ${hasManualHours ? 'font-semibold' : 'font-mono'}`}>({hours})</span>;
        }
        return null;
    }

    const canEditHours = permissions.isViewingAsAdmin && !isMonthClosed;
    const showClockIcon = canEditHours && !!shiftCell;

    if (activityLevel === 'SESSION' && dayOfWeek >= 1 && dayOfWeek <= 4 && attendees.includes(nurseId) && !shiftCell) {
        const shift = SHIFTS['STRASBOURG'];
        return (
            <div className={`w-full h-full p-1 flex items-center justify-center relative group`} title={t[shift.description as keyof Locale] as string}>
                <div className={`w-full h-full p-1 flex flex-col items-center justify-center rounded-md shadow-sm ${shift.color} ${shift.textColor}`}>
                    <span className="font-bold text-base">{shift.label}</span>
                </div>
                 {showClockIcon && (
                    <ClockIcon onClick={(e) => { e.stopPropagation(); onOpenHoursEdit(nurseId, dateKey, e.currentTarget); }} className="absolute top-1 right-1 w-4 h-4 text-slate-400 hover:text-slate-800 cursor-pointer hidden group-hover:block transition-colors" />
                )}
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

        if (customShift.custom === 'STR-PREP') {
            const shift = SHIFTS['STRASBOURG'];
            return (
                <div 
                    className={`w-full h-full p-1 flex items-center justify-center relative rounded-md shadow-sm ${shift.color}`}
                    title={t[shift.description as keyof Locale] as string}
                ></div>
            );
        }
        
        let bgColor = 'bg-slate-200';
        let textColor = 'text-slate-800';

        if (customShift.type && SHIFTS[customShift.type]) {
            bgColor = SHIFTS[customShift.type].color;
            textColor = SHIFTS[customShift.type].textColor;
        }
        
        const [mainLabel, ...customNotes] = customShift.custom.split('\n');

        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-center p-1 ${bgColor} ${textColor} font-medium text-xs rounded-md shadow-sm relative group`} title={customShift.custom}>
                <span className="font-semibold">{mainLabel}</span>
                {customShift.time && <span className="text-[11px] opacity-80 font-mono">({customShift.time})</span>}
                {customNotes.length > 0 && <p className="text-[9px] leading-tight opacity-70 mt-0.5 truncate">{customNotes.join(' ')}</p>}
                {showClockIcon && (
                    <ClockIcon onClick={(e) => { e.stopPropagation(); onOpenHoursEdit(nurseId, dateKey, e.currentTarget); }} className="absolute top-1 right-1 w-4 h-4 text-slate-400 hover:text-slate-800 cursor-pointer hidden group-hover:block transition-colors" />
                )}
            </div>
        );
    }

    if (typeof shiftCell === 'object' && 'split' in shiftCell) {
        if (typeof hours === 'string' || Array.isArray(hours)) { 
             return (
                <div className={`w-full h-full p-1 flex items-center justify-center relative group`} title={title}>
                    <div className={`w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 rounded-md shadow-sm bg-purple-200 text-purple-800 ${violation ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                        <span className="font-bold text-base">Split</span>
                        {renderHours()}
                    </div>
                    {showClockIcon && (
                        <ClockIcon onClick={(e) => { e.stopPropagation(); onOpenHoursEdit(nurseId, dateKey, e.currentTarget); }} className="absolute top-1 right-1 w-4 h-4 text-slate-400 hover:text-slate-800 cursor-pointer hidden group-hover:block transition-colors" />
                    )}
                </div>
             );
        }
        
        const [morningPart, afternoonPart] = shiftCell.split;
        
        const getPartDisplayInfo = (part: ScheduleCell | null) => {
            if (!part) return null;
            if (typeof part === 'string' && SHIFTS[part]) {
                return { label: SHIFTS[part].label, color: SHIFTS[part].color, textColor: SHIFTS[part].textColor };
            }
            if (typeof part === 'object' && 'custom' in part) {
                if (part.type && SHIFTS[part.type]) {
                    return { label: part.custom.split('\n')[0], color: SHIFTS[part.type].color, textColor: SHIFTS[part.type].textColor };
                }
                return { label: part.custom.split('\n')[0], color: 'bg-slate-200', textColor: 'text-slate-800' };
            }
            return null;
        };

        const morningDisplayInfo = getPartDisplayInfo(morningPart);
        const afternoonDisplayInfo = getPartDisplayInfo(afternoonPart);


        return (
            <div className="w-full h-full flex flex-col gap-0.5 p-0.5 relative group" title={title}>
                {morningDisplayInfo && (
                    <div className={`flex-grow min-h-0 flex flex-col items-center justify-center rounded-sm text-center p-1 ${morningDisplayInfo.color} ${morningDisplayInfo.textColor}`}>
                        <span className="font-semibold text-xs leading-tight">{morningDisplayInfo.label}</span>
                        {typeof hours === 'object' && 'morning' in hours && hours.morning && <span className="text-[10px] leading-tight opacity-90">({hours.morning})</span>}
                    </div>
                )}
                {afternoonDisplayInfo && (
                    <div className={`flex-grow min-h-0 flex flex-col items-center justify-center rounded-sm text-center p-1 ${afternoonDisplayInfo.color} ${afternoonDisplayInfo.textColor}`}>
                        <span className="font-semibold text-xs leading-tight">{afternoonDisplayInfo.label}</span>
                        {typeof hours === 'object' && 'afternoon' in hours && hours.afternoon && <span className="text-[10px] leading-tight opacity-90">({hours.afternoon})</span>}
                    </div>
                )}
                 {showClockIcon && (
                    <ClockIcon onClick={(e) => { e.stopPropagation(); onOpenHoursEdit(nurseId, dateKey, e.currentTarget); }} className="absolute top-1 right-1 w-4 h-4 text-slate-400 hover:text-slate-800 cursor-pointer hidden group-hover:block transition-colors" />
                )}
            </div>
        );
    }
    
    const shift = SHIFTS[shiftCell as WorkZone];
    if (!shift) return <div className="w-full h-full bg-white/80 relative"></div>;

    let displayLabel = shift.label;
    if (isShortFriday && (shift.id === 'URGENCES' || shift.id === 'TRAVAIL')) {
      displayLabel = displayLabel.replace(' AM', '');
    }

    return (
        <div className={`w-full h-full p-1 flex items-center justify-center relative group`} title={title}>
            <div className={`w-full h-full p-1 flex flex-col items-center justify-center gap-0.5 rounded-md shadow-sm ${shift.color} ${shift.textColor} ${violation ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                <span className={`font-bold ${hasMultipleHourLines ? 'text-sm' : 'text-base'}`}>{displayLabel}</span>
                <div className={`${hasMultipleHourLines ? 'opacity-90' : ''}`}>{renderHours()}</div>
            </div>
            {showClockIcon && (
                <ClockIcon onClick={(e) => { e.stopPropagation(); onOpenHoursEdit(nurseId, dateKey, e.currentTarget); }} className="absolute top-1 right-1 w-4 h-4 text-slate-400 hover:text-slate-800 cursor-pointer hidden group-hover:block transition-colors" />
            )}
        </div>
    );
};
