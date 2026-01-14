
import type { Nurse, Schedule, ScheduleCell, SpecialStrasbourgEvent, Hours } from '../types';
import { getShiftsFromCell as getShiftsFromCellUtil } from './scheduleUtils';

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
    specialEvent?: SpecialStrasbourgEvent
): number => {
    if (specialEvent && specialEvent.startTime && specialEvent.endTime) {
        return calculateSimpleHoursDifference(specialEvent.startTime, specialEvent.endTime);
    }
    if (!scheduleCell) return 0;

    // CRITICAL FIX: A CustomShift's time property (including interruptions) is for display only.
    // The calculation MUST ALWAYS be based on the shift's base type to ensure balance integrity.
    // This isolates visual interruptions from any hour calculation.

    const dayOfWeek = date.getUTCDay(); // Sunday: 0, Monday: 1
    const isFriday = dayOfWeek === 5;
    
    // Handle Split Shifts
    if (typeof scheduleCell === 'object' && 'split' in scheduleCell) {
        let totalHours = 0;
        for (const part of scheduleCell.split) {
            const shiftId = typeof part === 'string' ? part : (part as any).type;
            switch (shiftId) {
                case 'VACCIN_AM': totalHours += 5.5; break;
                case 'VACCIN_PM': totalHours += 3.0; break;
                case 'TRAVAIL_C': totalHours += 3.0; break;
                case 'URGENCES_C': totalHours += 3.0; break;
                // Add hours for the other part of the split if it's a standard shift
                case 'URGENCES':
                case 'TRAVAIL':
                case 'ADMIN':
                    totalHours += 4.5; // Assuming split morning shifts are half of 8.5h + pause logic
                    break;
                default: break;
            }
        }
        return totalHours;
    }

    const shifts = getShiftsFromCellUtil(scheduleCell);
    if (shifts.length === 0) return 0;
    const primaryShift = shifts[0];

    switch (primaryShift) {
        case 'URGENCES':
        case 'TRAVAIL':
        case 'ADMIN':
        case 'TW':
        case 'FP':
        case 'SICK_LEAVE':
            return isFriday ? 6.0 : 8.5;
        
        case 'URGENCES_TARDE':
        case 'TRAVAIL_TARDE':
            return isFriday ? 6.0 : 8.0;

        case 'STRASBOURG':
            return (dayOfWeek >= 1 && dayOfWeek <= 4) ? 10.0 : 0;

        case 'VACCIN': // Only on Fridays
        case 'LIBERO': // Only on pre-session Fridays
            return 6.0;

        case 'CA':
        case 'RECUP':
        case 'F':
            return 0;

        default:
            return 0;
    }
};


export const calculateHoursForMonth = (
    nurses: Nurse[],
    currentDate: Date,
    agenda: any,
    schedule: Schedule,
    strasbourgAssignments: any,
    specialStrasbourgEvents: SpecialStrasbourgEvent[]
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
            const calculated = calculateHoursForDay(nurse, scheduleCell, date, agenda, strasbourgAssignments, specialEvent);
            hours[nurse.id][dateKey] = { calculated };
        }
    });

    return hours;
};
