import type { Nurse, Schedule, ScheduleCell, SpecialStrasbourgEvent, Hours, Agenda, JornadaLaboral, CustomShift } from '../types';
import { getShiftsFromCell as getShiftsFromCellUtil } from './scheduleUtils';
import { getWeekIdentifier } from './dateUtils';
import { holidays2026 } from '../data/agenda2026';
import { getActiveJornada } from './jornadaUtils';

// Function to calculate hours between two time strings (e.g., "08:00", "17:00")
export const calculateHoursDifference = (start: string, end: string): number => {
    if (!start || !end) return 0;
    try {
        const startTime = new Date(`1970-01-01T${start}:00Z`);
        const endTime = new Date(`1970-01-01T${end}:00Z`);
        if (endTime <= startTime) return 0;
        const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        // Standard 30 min break for shifts of 6 hours or longer
        return diff >= 6 ? diff - 0.5 : diff;
    } catch (e) {
        return 0;
    }
};

const calculateSimpleHoursDifference = (start: string, end: string): number => {
    if (!start || !end) return 0;
    try {
        const startTime = new Date(`1970-01-01T${start}:00Z`);
        const endTime = new Date(`1970-01-01T${end}:00Z`);
        if (endTime <= startTime) return 0;
        return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    } catch (e) {
        console.error("Error calculating simple time difference:", e);
        return 0;
    }
};

export const calculateHoursForDay = (
    nurse: Nurse,
    scheduleCell: ScheduleCell | undefined,
    date: Date,
    agenda: any, // Is now used to determine activity level
    strasbourgAssignments: any, // No longer used, but kept for signature consistency
    specialEvent: SpecialStrasbourgEvent | undefined,
    jornadasLaborales: JornadaLaboral[]
): number => {
    // ---- Early returns for special cases that are exempt from jornada reductions ----
    if (specialEvent && specialEvent.startTime && specialEvent.endTime) {
        return calculateSimpleHoursDifference(specialEvent.startTime, specialEvent.endTime);
    }
    if (!scheduleCell) return 0;

    // Custom shifts with time are pre-calculated, including reductions via scheduleUtils.
    if (typeof scheduleCell === 'object' && 'custom' in scheduleCell && 'time' in scheduleCell && scheduleCell.time) {
        const [start, end] = scheduleCell.time.split(' - ');
        
        const activeJornada = getActiveJornada(nurse.id, date, jornadasLaborales);
        const is90Percent3hReduction = activeJornada?.porcentaje === 90 &&
            (activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') &&
            date.getUTCDay() === activeJornada.reductionDayOfWeek;
        
        const grossHours = calculateSimpleHoursDifference(start, end);

        if (is90Percent3hReduction && grossHours === 6) {
            return 6.0; // Rule 1: Don't deduct break for this specific case
        }

        return calculateHoursDifference(start, end);
    }
    
    const dayOfWeek = date.getUTCDay(); // Sunday: 0, Monday: 1
    const shifts = getShiftsFromCellUtil(scheduleCell);

    // Absences should count for the theoretical hours for that day.
    if (shifts.length > 0 && ['CA', 'CS', 'SICK_LEAVE', 'FP'].includes(shifts[0])) {
        return calculateNurseTheoreticalHoursForDay(nurse, date, agenda, jornadasLaborales);
    }

    // Strasbourg has fixed hours, exempt from reductions.
    if (shifts.includes('STRASBOURG')) {
        return (dayOfWeek >= 1 && dayOfWeek <= 4) ? 10.0 : 0;
    }

    // Split shifts are handled recursively. Reductions are applied within each recursive call.
    if (typeof scheduleCell === 'object' && 'split' in scheduleCell) {
        const [part1, part2] = scheduleCell.split;
        const isManualSplit = (typeof part1 === 'object' && 'manualSplit' in part1 && (part1 as CustomShift).manualSplit === true);

        if (isManualSplit) {
            const time1 = (part1 as CustomShift).time;
            const time2 = (part2 as CustomShift).time;
            if (!time1 || !time2) return 0;

            const [start1, end1] = time1.split(' - ');
            const [start2, end2] = time2.split(' - ');

            const grossHours1 = calculateSimpleHoursDifference(start1, end1);
            const grossHours2 = calculateSimpleHoursDifference(start2, end2);
            const totalGross = grossHours1 + grossHours2;
            
            return totalGross >= 6 ? totalGross - 0.5 : totalGross;
        }
        
        // Existing logic for other split shifts
        let totalHours = 0;
        for (const part of scheduleCell.split) {
             totalHours += calculateHoursForDay(nurse, part, date, agenda, strasbourgAssignments, undefined, jornadasLaborales);
        }
        return totalHours;
    }
    
    // ---- Unified baseHours calculation for all other simple WORK shifts ----
    let baseHours = 0;
    if (shifts.length > 0) {
        const primaryShift = shifts[0];
        const isFriday = dayOfWeek === 5;
        const nextMonday = new Date(date);
        nextMonday.setDate(date.getDate() + (8 - dayOfWeek) % 7 || 7);
        const isPreSessionFriday = isFriday && agenda[getWeekIdentifier(nextMonday)] === 'SESSION';

        // Standard work shifts (Absences are now handled above)
        if (['URGENCES', 'TRAVAIL', 'ADMIN', 'TW', 'TW_ABROAD'].includes(primaryShift)) {
             if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                baseHours = isFriday ? 6.0 : 8.5;
            }
        }
        // Shifts with specific durations
        else if (['VACCIN', 'LIBERO', 'VACCIN_AM'].includes(primaryShift)) {
            if (primaryShift === 'LIBERO' && isPreSessionFriday) {
                baseHours = 6.0; // Rule 2: Libero pre-session is 6h net.
            } else {
                baseHours = 5.5; // 6h gross -> 5.5h net
            }
        }
        else if (['VACCIN_PM', 'TRAVAIL_C', 'URGENCES_C'].includes(primaryShift)) {
            baseHours = 3.0;
        }
        // Afternoon shifts with complex rules
        else if (['URGENCES_TARDE', 'TRAVAIL_TARDE', 'ADMIN_TARDE'].includes(primaryShift)) {
            const weekId = getWeekIdentifier(date);
            const activityLevel = agenda[weekId] || 'NORMAL';

            if (isPreSessionFriday) {
                baseHours = 6.0; // Rule 2: Tarde pre-session is 6h net.
            } else if (isFriday) {
                baseHours = 6.0;
            } else { // Monday to Thursday
                if (activityLevel === 'NORMAL') {
                    baseHours = 8.0; // 10:00-18:30 is 8.5h gross, minus 0.5h break.
                } else { // Session, White/Green, Reduced
                    baseHours = 8.25; // 09:00-17:45 is 8.75h gross, minus 0.5h break
                }
            }
        }
        // Other non-work shifts that are always 0 hours
        else if (['F', 'RECUP'].includes(primaryShift)) {
            baseHours = 0;
        }
    }

    if (baseHours === 0) {
        return 0;
    }

    // ---- Single point for applying jornada reductions FOR WORK SHIFTS ----
    const activeJornada = getActiveJornada(nurse.id, date, jornadasLaborales);
    if (!activeJornada || activeJornada.porcentaje === 100) {
        return baseHours;
    }

    // FIX: Handle the specific case where a 3h reduction on a full day (8.5h) results in a 6h gross shift, which should count as 6.0 net hours.
    const is90Percent3hReductionOnFullDay = activeJornada.porcentaje === 90 &&
        (activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') &&
        dayOfWeek === activeJornada.reductionDayOfWeek &&
        baseHours === 8.5;

    if (is90Percent3hReductionOnFullDay) {
        return 6.0;
    }

    let adjustedHours = baseHours;

    if (activeJornada.porcentaje === 80) {
        if (activeJornada.reductionOption === 'FULL_DAY_OFF' && dayOfWeek === activeJornada.reductionDayOfWeek) {
            return 0;
        }
        if (activeJornada.reductionOption === 'FRIDAY_PLUS_EXTRA') {
            if (dayOfWeek === 5) {
                return 0;
            }
            if (dayOfWeek === activeJornada.secondaryReductionDayOfWeek) {
                adjustedHours -= 1.5;
            }
        }
    } else if (activeJornada.porcentaje === 90) {
        if (activeJornada.reductionOption === 'LEAVE_EARLY_1H_L_J' && dayOfWeek >= 1 && dayOfWeek <= 4) {
            adjustedHours -= 1;
        }
        if ((activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && dayOfWeek === activeJornada.reductionDayOfWeek) {
            adjustedHours -= 3;
        }
    }

    return Math.max(0, adjustedHours);
};


export const calculateHoursForMonth = (
    nurses: Nurse[],
    currentDate: Date,
    agenda: any,
    schedule: Schedule,
    strasbourgAssignments: any,
    specialStrasbourgEvents: SpecialStrasbourgEvent[],
    jornadasLaborales: JornadaLaboral[]
): Hours => {
    const hours: Hours = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    nurses.forEach(nurse => {
        hours[nurse.id] = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(Date.UTC(year, month, day));
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const scheduleCell = schedule[nurse.id]?.[dateKey];
            const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
            const calculated = calculateHoursForDay(nurse, scheduleCell, date, agenda, strasbourgAssignments, specialEvent, jornadasLaborales);
            hours[nurse.id][dateKey] = { calculated };
        }
    });

    return hours;
};

export const calculateNurseTheoreticalHoursForDay = (
    nurse: Nurse,
    currentDate: Date,
    agenda: Agenda,
    jornadasLaborales: JornadaLaboral[]
): number => {
    const dayOfWeek = currentDate.getUTCDay(); // Sun: 0, Mon: 1
    const dateKey = currentDate.toISOString().split('T')[0];
    const weekId = getWeekIdentifier(currentDate);
    const activityLevel = agenda[weekId] || 'NORMAL';

    // Is it a theoretical workday?
    const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays2026.has(dateKey) && activityLevel !== 'CLOSED';
    
    if (!isWorkday) {
        return 0;
    }

    // Base hours for the app's 40h week logic (8.5h Mon-Thu, 6h Fri)
    let dailyTheoreticalHours = dayOfWeek === 5 ? 6.0 : 8.5;

    // Apply jornada reduction
    const activeJornada = getActiveJornada(nurse.id, currentDate, jornadasLaborales);

    if (activeJornada && activeJornada.porcentaje < 100) {
        if (activeJornada.porcentaje === 80) {
            if (activeJornada.reductionOption === 'FULL_DAY_OFF' && dayOfWeek === activeJornada.reductionDayOfWeek) {
                dailyTheoreticalHours = 0;
            } else if (activeJornada.reductionOption === 'FRIDAY_PLUS_EXTRA') {
                if (dayOfWeek === 5) { // Friday off
                    dailyTheoreticalHours = 0;
                } else if (dayOfWeek === activeJornada.secondaryReductionDayOfWeek) {
                    dailyTheoreticalHours -= 1.5;
                }
            }
        } else if (activeJornada.porcentaje === 90) {
            if (activeJornada.reductionOption === 'LEAVE_EARLY_1H_L_J' && dayOfWeek >= 1 && dayOfWeek <= 4) {
                dailyTheoreticalHours -= 1;
            } else if ((activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && dayOfWeek === activeJornada.reductionDayOfWeek) {
                // This reduction on a normal Mon-Thu day (8.5h net) results in a 6h gross shift (e.g., 8:00-14:00).
                // This should count for 6.0 net hours, not 5.5.
                if (dailyTheoreticalHours === 8.5) {
                    dailyTheoreticalHours = 6.0;
                } else {
                    dailyTheoreticalHours -= 3;
                }
            }
        }
    }
    
    return dailyTheoreticalHours;
};

export const calculateNurseTheoreticalHoursForMonth = (
    nurse: Nurse,
    year: number,
    month: number,
    agenda: Agenda,
    jornadasLaborales: JornadaLaboral[]
): number => {
    let totalMonthHours = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month, day));
        totalMonthHours += calculateNurseTheoreticalHoursForDay(nurse, currentDate, agenda, jornadasLaborales);
    }

    return totalMonthHours;
};
