import type { Nurse, Schedule, ScheduleCell, SpecialStrasbourgEvent, Hours, Agenda, JornadaLaboral } from '../types';
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
    agenda: any, // No longer used, but kept for signature consistency
    strasbourgAssignments: any, // No longer used, but kept for signature consistency
    specialEvent: SpecialStrasbourgEvent | undefined,
    jornadasLaborales: JornadaLaboral[]
): number => {
    if (specialEvent && specialEvent.startTime && specialEvent.endTime) {
        return calculateSimpleHoursDifference(specialEvent.startTime, specialEvent.endTime);
    }
    if (!scheduleCell) return 0;

    const dayOfWeek = date.getUTCDay(); // Sunday: 0, Monday: 1
    const isFriday = dayOfWeek === 5;
    const shifts = getShiftsFromCellUtil(scheduleCell);
    const isNonWorkAbsence = shifts.some(s => ['CA', 'SICK_LEAVE', 'F'].includes(s));
    
    // If it's a non-working absence, it's always 0 hours, regardless of jornada.
    if (isNonWorkAbsence) {
        return 0;
    }
    
    let baseHours = 0;

    // Handle CustomShift with time
    if (typeof scheduleCell === 'object' && 'custom' in scheduleCell && 'time' in scheduleCell && scheduleCell.time) {
        const [start, end] = scheduleCell.time.split(' - ');
        baseHours = calculateHoursDifference(start, end);
    }
    // Handle Split Shifts
    else if (typeof scheduleCell === 'object' && 'split' in scheduleCell) {
        let totalHours = 0;
        for (const part of scheduleCell.split) {
             totalHours += calculateHoursForDay(nurse, part, date, agenda, strasbourgAssignments, undefined, jornadasLaborales);
        }
        // For split shifts, the reduction is applied to each part individually, so we return the sum.
        return totalHours;
    }
    // Handle simple shifts
    else {
        if (shifts.length === 0) return 0;
        const primaryShift = shifts[0];

        switch (primaryShift) {
            case 'URGENCES': case 'TRAVAIL': case 'ADMIN': case 'TW': case 'FP': case 'RECUP':
                baseHours = isFriday ? 6.0 : 8.5; break;
            case 'URGENCES_TARDE': case 'TRAVAIL_TARDE':
                baseHours = isFriday ? 6.0 : 8.0; break;
            case 'STRASBOURG':
                baseHours = (dayOfWeek >= 1 && dayOfWeek <= 4) ? 10.0 : 0; break;
            case 'VACCIN': case 'LIBERO':
                baseHours = 6.0; break;
            case 'VACCIN_AM':
                baseHours = 5.5; // 6h duration - 30min break
                break;
            case 'VACCIN_PM':
            case 'TRAVAIL_C':
            case 'URGENCES_C':
                baseHours = 3.0; // 3h duration, no break
                break;
            default: baseHours = 0;
        }
    }
    
    // Now, apply jornada reduction to the calculated baseHours
    const activeJornada = getActiveJornada(nurse.id, date, jornadasLaborales);

    if (!activeJornada || activeJornada.porcentaje === 100 || baseHours === 0) {
        return baseHours;
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
        } else if ((activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && dayOfWeek === activeJornada.reductionDayOfWeek) {
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
        const dayOfWeek = currentDate.getUTCDay(); // Sun: 0, Mon: 1
        const dateKey = currentDate.toISOString().split('T')[0];
        const weekId = getWeekIdentifier(currentDate);

        const activityLevel = agenda[weekId] || 'NORMAL';

        // Is it a theoretical workday?
        const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays2026.has(dateKey) && activityLevel !== 'CLOSED';
        
        if (!isWorkday) {
            continue;
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
                    dailyTheoreticalHours -= 3;
                }
            }
        }
        
        totalMonthHours += dailyTheoreticalHours;
    }

    return totalMonthHours;
};