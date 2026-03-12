
import type { Schedule, Nurse, RuleViolation, WorkZone, Agenda, ScheduleCell } from '../types';
import { getWeekIdentifier, getWeeksInMonth } from './dateUtils';
import { holidays2026 } from '../data/agenda2026';
import { Locale } from '../translations/locales';
import { getClinicalNeedsForDay, getShiftsFromCell } from './scheduleUtils';

export const validateSchedule = (schedule: Schedule, nurses: Nurse[], currentDate: Date, agenda: Agenda, t: Locale): RuleViolation[] => {
    let violations: RuleViolation[] = [];
    if (!nurses || nurses.length === 0) return violations;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const is2026 = year === 2026;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Daily Validations
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = date.getDay();
        const weekId = getWeekIdentifier(date);
        const activityLevel = agenda[weekId] || 'NORMAL';
        const isHoliday = is2026 && holidays2026.has(dateKey);

        if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday || activityLevel === 'CLOSED') continue;
        
        const dailyCounts: { [key in WorkZone]?: number } = {};
        
        nurses.forEach(nurse => {
            const cell = schedule[nurse.id]?.[dateKey];
            const shifts = getShiftsFromCell(cell);
            shifts.forEach(zone => {
                dailyCounts[zone] = (dailyCounts[zone] || 0) + 1;
            });
            // Rule: Check for incomplete split shifts on vaccination days
            if (shifts.includes('VACCIN_AM') || shifts.includes('VACCIN_PM')) {
                if (!(typeof cell === 'object' && 'split' in cell && cell.split.length === 2)) {
                    violations.push({ nurseId: nurse.id, dateKey, message: t.violation_incompleteVaccination, severity: 'error'});
                }
            }
        });

        const isVaccinationDay = (dailyCounts['VACCIN_AM'] || 0) > 0 || (dailyCounts['VACCIN_PM'] || 0) > 0;
        const mandatoryNeeds = getClinicalNeedsForDay(date, agenda, null);

        const requiredUrgT = mandatoryNeeds['URGENCES_TARDE'] || 0;
        const requiredTravT = mandatoryNeeds['TRAVAIL_TARDE'] || 0;
        const requiredUrg = mandatoryNeeds['URGENCES'] || 0;
        const requiredTrav = mandatoryNeeds['TRAVAIL'] || 0;

        const currentUrgT = dailyCounts['URGENCES_TARDE'] || 0;
        const currentTravT = dailyCounts['TRAVAIL_TARDE'] || 0;
        const currentUrg = dailyCounts['URGENCES'] || 0;
        const currentTrav = dailyCounts['TRAVAIL'] || 0;

        if (requiredUrgT > 0 && currentUrgT < requiredUrgT) {
            violations.push({
                nurseId: 'global',
                dateKey,
                message: `${t.violation_missingUrgT} (${currentUrgT}/${requiredUrgT})`,
                severity: 'error'
            });
        }

        if (requiredTravT > 0 && currentTravT < requiredTravT) {
            violations.push({
                nurseId: 'global',
                dateKey,
                message: `${t.violation_missingTravT} (${currentTravT}/${requiredTravT})`,
                severity: 'error'
            });
        }

        if (requiredUrg > 0 && currentUrg < requiredUrg) {
            violations.push({
                nurseId: 'global',
                dateKey,
                message: `${t.violation_urgCoverage.replace('{count}', currentUrg.toString())} (${currentUrg}/${requiredUrg})`,
                severity: 'error'
            });
        }

        if (requiredTrav > 0 && currentTrav < requiredTrav) {
            violations.push({
                nurseId: 'global',
                dateKey,
                message: `${t.violation_travCoverage.replace('{count}', currentTrav.toString())} (${currentTrav}/${requiredTrav})`,
                severity: 'error'
            });
        }

        if (isVaccinationDay) {
            // Vaccination Period Rules
            if((dailyCounts['VACCIN_AM'] || 0) < 2) violations.push({ nurseId: 'global', dateKey, message: t.violation_missingVacM, severity: 'warning'});
            if((dailyCounts['VACCIN_PM'] || 0) < 2) violations.push({ nurseId: 'global', dateKey, message: t.violation_missingVacT, severity: 'warning'});
        }
    }

    // Weekly Validations
    const weeksInMonth = getWeeksInMonth(currentDate);
    for (const week of weeksInMonth) {
      for (const nurse of nurses) {
        let afternoonCount = 0;
        for (let day = week.startDay; day <= week.endDay; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const shifts = getShiftsFromCell(schedule[nurse.id]?.[dateKey]);
            if (shifts.some(s => s.includes('_TARDE') || s === 'VACCIN_PM')) {
                afternoonCount++;
            }
        }
        if (afternoonCount > 2) {
             violations.push({ nurseId: nurse.id, weekId: week.id, message: t.violation_exceedsAfternoon.replace('{count}', afternoonCount.toString()), severity: 'error'});
        }
      }
    }
    
    return violations.filter((v, i, a) => a.findIndex(t => (t.message === v.message && t.nurseId === v.nurseId && (t.dateKey === v.dateKey || t.weekId === v.weekId))) === i);
};