
import type { Nurse, Schedule, WorkZone, Agenda, ScheduleCell, ActivityLevel, NurseStats, CustomShift, JornadaLaboral } from '../types';
import { getWeekIdentifier } from './dateUtils';
import { holidays2026 } from '../data/agenda2026';
import { getActiveJornada } from './jornadaUtils';
import { SHIFTS } from '../constants';

export const getShiftsFromCell = (cell: ScheduleCell | undefined): WorkZone[] => {
    if (!cell) return [];
    if (typeof cell === 'string') return [cell];
    if (typeof cell === 'object' && 'custom' in cell && cell.type) return [cell.type];
    if (typeof cell === 'object' && 'split' in cell) {
        return cell.split.map(part => {
            if (typeof part === 'string') return part;
            if (typeof part === 'object' && 'custom' in part && part.type) return part.type;
            return null;
        }).filter((s): s is WorkZone => s !== null);
    }
    return [];
}

const formatTime = (date: Date): string => {
    return date.toUTCString().substring(17, 22);
}

const modifyTime = (timeStr: string, hours: number, minutes: number = 0): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(h, m, 0, 0);
    date.setUTCHours(date.getUTCHours() + hours);
    date.setUTCMinutes(date.getUTCMinutes() + minutes);
    return formatTime(date);
}

export const getScheduleCellHours = (
    cell: ScheduleCell | undefined, 
    nurse: Nurse | undefined,
    date: Date, 
    activityLevel: ActivityLevel, 
    agenda: Agenda
): { morning: string; afternoon: string } | string => {
    if (!cell || !nurse) return '';
    if (cell === 'STRASBOURG') return '';
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return '';

    let baseHours: { morning: string; afternoon: string } | string;

    if (typeof cell === 'object' && 'split' in cell) {
        const [morningPart, afternoonPart] = cell.split;
        const shifts = getShiftsFromCell(cell);
        if (shifts.includes('VACCIN_AM') || shifts.includes('VACCIN_PM')) {
            baseHours = { morning: '08:00 - 14:00', afternoon: '14:00 - 17:00' };
        } else {
            baseHours = { morning: '8:00-13:00', afternoon: '13:00-17:00' };
        }
    } else {
        let shiftType: WorkZone | undefined;
        if (typeof cell === 'string') {
            shiftType = cell;
        } else if (typeof cell === 'object' && 'type' in cell) {
            shiftType = cell.type;
        } else if (typeof cell === 'object' && 'custom' in cell && 'time' in cell) {
            return cell.time || '';
        } else {
            return ''; 
        }

        if (shiftType === 'VACCIN') {
            baseHours = '08:00 - 14:00';
        } else {
            const isAfternoonShift = shiftType === 'URGENCES_TARDE' || shiftType === 'TRAVAIL_TARDE';
            const nextMonday = new Date(date);
            nextMonday.setDate(date.getDate() + (8 - dayOfWeek) % 7 || 7);
            const isPreSessionFriday = date.getDay() === 5 && agenda[getWeekIdentifier(nextMonday)] === 'SESSION';

            if (isPreSessionFriday) {
                if (isAfternoonShift) baseHours = '12:00 - 17:45';
                else if (shiftType === 'LIBERO') baseHours = '10:00 - 16:00';
                else baseHours = '08:00 - 14:00';
            } else if (date.getDay() === 5) {
                baseHours = '08:00 - 14:00';
            } else if (isAfternoonShift) {
                baseHours = activityLevel === 'NORMAL' ? '10:00 - 18:30' : '09:00 - 17:45';
            } else {
                baseHours = '8:00 - 17:00';
            }
        }
    }
    
    return baseHours;
};

const findBestCandidate = (candidates: Nurse[], stats: Record<string, NurseStats>, primaryStat: keyof NurseStats, secondaryStat: keyof NurseStats = 'clinicalTotal'): Nurse | undefined => {
    if (candidates.length === 0) return undefined;
    const sorted = [...candidates].sort((a, b) => {
        const statsA = stats[a.id];
        const statsB = stats[b.id];
        if (statsA[primaryStat] !== statsB[primaryStat]) return statsA[primaryStat] - statsB[primaryStat];
        if (statsA[secondaryStat] !== statsB[secondaryStat]) return statsA[secondaryStat] - statsB[secondaryStat];
        return Math.random() - 0.5;
    });
    return sorted[0];
};

const findBestCandidateWithWeeklyEquity = (
    candidates: Nurse[], 
    stats: Record<string, NurseStats>, 
    weeklyShiftStats: Record<string, Record<WorkZone, number>>,
    targetShift: WorkZone,
    primaryStat: keyof NurseStats, 
    secondaryStat: keyof NurseStats = 'clinicalTotal'
): Nurse | undefined => {
    if (candidates.length === 0) return undefined;

    const sorted = [...candidates].sort((a, b) => {
        const statsA = stats[a.id];
        const statsB = stats[b.id];
        const weeklyA = weeklyShiftStats[a.id][targetShift] || 0;
        const weeklyB = weeklyShiftStats[b.id][targetShift] || 0;

        if (statsA[primaryStat] !== statsB[primaryStat]) return statsA[primaryStat] - statsB[primaryStat];
        if (weeklyA !== weeklyB) return weeklyA - weeklyB;
        if (statsA[secondaryStat] !== statsB[secondaryStat]) return statsA[secondaryStat] - statsB[secondaryStat];
        
        return Math.random() - 0.5;
    });
    return sorted[0];
};


const getClinicalNeedsForDay = (date: Date, agenda: Agenda, vaccinationPeriod: { start: string; end: string } | null): Record<string, number> => {
    const dayOfWeek = date.getDay();
    const weekId = getWeekIdentifier(date);
    const activityLevel = agenda[weekId] || 'NORMAL';
    const dateStr = date.toISOString().split('T')[0];

    if (dayOfWeek === 0 || dayOfWeek === 6 || activityLevel === 'CLOSED' || holidays2026.has(dateStr)) return {};
    
    const isVaccinationDay = !!vaccinationPeriod && dateStr >= vaccinationPeriod.start && dateStr <= vaccinationPeriod.end;
    const isPreSessionFriday = dayOfWeek === 5 && agenda[getWeekIdentifier(new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000))] === 'SESSION';
    const isNormalFriday = dayOfWeek === 5 && !isPreSessionFriday;

    if (isNormalFriday) {
        const needs: Record<string, number> = { 'TRAVAIL': 3, 'URGENCES': 3 };
        if (isVaccinationDay) needs['VACCIN'] = 2;
        return needs;
    }

    if (isPreSessionFriday) {
        const needs: Record<string, number> = { 'URGENCES': 2, 'TRAVAIL': 2, 'URGENCES_TARDE': 1, 'TRAVAIL_TARDE': 1, 'LIBERO': 1 };
        if (isVaccinationDay) needs['VACCIN'] = 2;
        return needs;
    }
    
    if (activityLevel === 'REDUCED') return { 'URGENCES': 2, 'TRAVAIL': 2 };
    
    return { 'URGENCES': 2, 'TRAVAIL': 2, 'URGENCES_TARDE': 1, 'TRAVAIL_TARDE': 1 };
};

const applyJornadaModification = (
    cell: ScheduleCell,
    nurse: Nurse,
    date: Date,
    agenda: Agenda,
    jornada: JornadaLaboral
): ScheduleCell => {
    const dayOfWeek = date.getDay(); // Sunday: 0, Monday: 1
    const shifts = getShiftsFromCell(cell);
    const primaryShift = shifts.length > 0 ? shifts[0] : null;

    if (!primaryShift || ['CA', 'SICK_LEAVE', 'FP', 'RECUP'].includes(primaryShift)) {
        return cell;
    }

    const originalHoursStr = getScheduleCellHours(cell, nurse, date, agenda[getWeekIdentifier(date)] || 'NORMAL', agenda);
    if (typeof originalHoursStr !== 'string' || !originalHoursStr.includes(' - ')) {
        return cell;
    }
    const [start, end] = originalHoursStr.split(' - ').map(s => s.trim());

    let newTime: string | null = null;
    let newCell: ScheduleCell = cell;

    // 80% Rules
    if (jornada.porcentaje === 80) {
        if (jornada.reductionOption === 'FULL_DAY_OFF' && dayOfWeek === jornada.reductionDayOfWeek) {
            newCell = { custom: 'Reducción (80%)' };
        } else if (jornada.reductionOption === 'FRIDAY_PLUS_EXTRA') {
            if (dayOfWeek === 5) {
                newCell = { custom: 'Reducción (80%)' };
            } else if (dayOfWeek === jornada.secondaryReductionDayOfWeek) {
                if (primaryShift.includes('_TARDE')) { // Afternoon shift
                    newTime = `${modifyTime(start, 1, 30)} - ${end}`;
                } else { // Morning shift
                    newTime = `${start} - ${modifyTime(end, -1, -30)}`;
                }
            }
        }
    }

    // 90% Rules
    if (jornada.porcentaje === 90) {
        if (jornada.reductionOption === 'LEAVE_EARLY_1H_L_J' && dayOfWeek >= 1 && dayOfWeek <= 4) {
            if (primaryShift.includes('_TARDE')) { // Afternoon shift
                newTime = `${modifyTime(start, 1)} - ${end}`;
            } else { // Morning shift
                newTime = `${start} - ${modifyTime(end, -1)}`;
            }
        } else if (jornada.reductionOption === 'START_SHIFT_4H' && dayOfWeek === jornada.reductionDayOfWeek) {
            newTime = `${modifyTime(start, 3)} - ${end}`;
        } else if (jornada.reductionOption === 'END_SHIFT_4H' && dayOfWeek === jornada.reductionDayOfWeek) {
            newTime = `${start} - ${modifyTime(end, -3)}`;
        }
    }
    
    if (newTime) {
        return {
            custom: `${SHIFTS[primaryShift].label} (R)`,
            type: primaryShift,
            time: newTime
        };
    }

    return newCell;
}

export const recalculateScheduleForMonth = (nurses: Nurse[], date: Date, agenda: Agenda, manualOverrides: Schedule, vaccinationPeriod: { start: string; end: string } | null, strasbourgAssignments: Record<string, string[]>, jornadasLaborales: JornadaLaboral[]): Schedule => {
    const schedule: Schedule = {};
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    nurses.forEach(nurse => { schedule[nurse.id] = {}; });

    const nurseStats: Record<string, NurseStats> = {};
    nurses.forEach(nurse => { nurseStats[nurse.id] = { urgences: 0, travail: 0, admin: 0, tw: 0, clinicalTotal: 0, afternoon: 0, vaccin_am: 0, vaccin_pm: 0, tw_weekly: 0 }; });
    const weeklyStats: Record<string, Record<WorkZone, number>> = {};
    nurses.forEach(nurse => { weeklyStats[nurse.id] = {} as Record<WorkZone, number>; });


    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month, day));
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = currentDate.getUTCDay();
        const weekId = getWeekIdentifier(currentDate);

        if (dayOfWeek === 1) { // Monday
            nurses.forEach(nurse => {
                nurseStats[nurse.id].tw_weekly = 0;
                weeklyStats[nurse.id] = {} as Record<WorkZone, number>;
            });
        }
        
        const activityLevel = agenda[weekId] || 'NORMAL';
        const isWorkday = !(dayOfWeek === 0 || dayOfWeek === 6 || holidays2026.has(dateKey) || activityLevel === 'CLOSED');

        if (isWorkday) {
            const dailyAssignments: Record<string, ScheduleCell> = {};
            let availableForDutyNurses = [...nurses];
            
            availableForDutyNurses.forEach(nurse => {
                const override = manualOverrides[nurse.id]?.[dateKey];
                if (override) { dailyAssignments[nurse.id] = override; }
                const attendees = strasbourgAssignments[weekId] || [];
                if (activityLevel === 'SESSION') {
                    if (dayOfWeek >= 1 && dayOfWeek <= 4 && attendees.includes(nurse.id)) { dailyAssignments[nurse.id] = 'STRASBOURG'; }
                    if (dayOfWeek === 5 && attendees.includes(nurse.id)) { dailyAssignments[nurse.id] = { custom: 'STR-PREP', type: 'STRASBOURG' }; }
                }
            });

            let dutyPool = availableForDutyNurses.filter(n => !dailyAssignments[n.id]);
            
            let internHandledByException = false;
            const intern = dutyPool.find(n => n.id === 'nurse-11');
            if (intern) {
                const isOctober = month === 9;
                const weekOfMonth = Math.ceil(currentDate.getUTCDate() / 7);
                if (isOctober && dayOfWeek >= 1 && dayOfWeek <= 5) {
                    if (weekOfMonth === 1) { dailyAssignments[intern.id] = 'ADMIN'; internHandledByException = true; } 
                    else if (weekOfMonth === 2) { dailyAssignments[intern.id] = 'TRAVAIL'; internHandledByException = true; }
                }
            }
            if (internHandledByException) { dutyPool = dutyPool.filter(n => n.id !== 'nurse-11'); }

            const elvioInPool = dutyPool.find(n => n.id === 'nurse-1');
            if (elvioInPool && activityLevel !== 'SESSION') {
                dailyAssignments[elvioInPool.id] = 'ADMIN';
                dutyPool = dutyPool.filter(n => n.id !== 'nurse-1');
            }

            const ineligibleForAfternoon = new Set<string>();
            dutyPool.forEach(nurse => {
                const activeJornada = getActiveJornada(nurse.id, currentDate, jornadasLaborales);
                if (activeJornada && activeJornada.porcentaje === 90 && (activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && dayOfWeek >= 1 && dayOfWeek <= 4 && dayOfWeek === activeJornada.reductionDayOfWeek) {
                    ineligibleForAfternoon.add(nurse.id);
                }
            });
            
            const previousDate = new Date(currentDate.getTime());
            previousDate.setUTCDate(previousDate.getUTCDate() - 1);
            const previousDateKey = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}-${String(previousDate.getUTCDate()).padStart(2, '0')}`;


            const isVaccinationDay = !!vaccinationPeriod && dateKey >= vaccinationPeriod.start && dateKey <= vaccinationPeriod.end;
            
            if (isVaccinationDay && dayOfWeek >= 1 && dayOfWeek <= 4) {
                let unassignedPool = [...dutyPool];
                const clinicalNeeds = getClinicalNeedsForDay(currentDate, agenda, null);
                if (unassignedPool.length < 7) {
                    if (clinicalNeeds['TRAVAIL']) clinicalNeeds['TRAVAIL'] = 1;
                    if (clinicalNeeds['URGENCES']) clinicalNeeds['URGENCES'] = 1;
                }
                
                const vaccination_group: Nurse[] = [];
                const tempVaccinStat = (id: string) => nurseStats[id].vaccin_am + nurseStats[id].vaccin_pm;
                unassignedPool.sort((a,b) => tempVaccinStat(a.id) - tempVaccinStat(b.id));
                while(vaccination_group.length < 4 && unassignedPool.length > 0) { vaccination_group.push(unassignedPool.shift()!); }
                const clinical_group = unassignedPool;

                const vaccin_am_nurses: Nurse[] = [];
                const vaccin_pm_nurses: Nurse[] = [];
                let tempVaccinPool = [...vaccination_group];
                while(vaccin_am_nurses.length < 2 && tempVaccinPool.length > 0) {
                    const candidate = findBestCandidateWithWeeklyEquity(tempVaccinPool, nurseStats, weeklyStats, 'VACCIN_AM', 'vaccin_am');
                    if(candidate) { vaccin_am_nurses.push(candidate); tempVaccinPool = tempVaccinPool.filter(n => n.id !== candidate.id); } 
                    else { break; }
                }
                const eligibleForPm = tempVaccinPool.filter(n => !ineligibleForAfternoon.has(n.id));
                vaccin_pm_nurses.push(...eligibleForPm);

                for (const nurse of vaccin_pm_nurses) {
                    const wantsTravail = nurseStats[nurse.id].travail <= nurseStats[nurse.id].urgences;
                    let morningShift: WorkZone = 'ADMIN';
                    if (wantsTravail && clinicalNeeds['TRAVAIL'] > 0) {
                        morningShift = 'TRAVAIL';
                    } else if (!wantsTravail && clinicalNeeds['URGENCES'] > 0) {
                        morningShift = 'URGENCES';
                    } else if (clinicalNeeds['TRAVAIL'] > 0) {
                        morningShift = 'TRAVAIL';
                    } else if (clinicalNeeds['URGENCES'] > 0) {
                        morningShift = 'URGENCES';
                    }
                    dailyAssignments[nurse.id] = { split: [morningShift, 'VACCIN_PM'] };
                    if (morningShift !== 'ADMIN' && clinicalNeeds[morningShift] > 0) {
                        clinicalNeeds[morningShift]--;
                    }
                }
                for (const nurse of vaccin_am_nurses) {
                    const wantsTravail = nurseStats[nurse.id].travail <= nurseStats[nurse.id].urgences;
                    const afternoonShift: WorkZone = wantsTravail ? 'TRAVAIL_C' : 'URGENCES_C';
                    dailyAssignments[nurse.id] = { split: ['VACCIN_AM', afternoonShift] };
                }
                
                let clinicalPool = [...clinical_group];
                for (const [shift, count] of Object.entries(clinicalNeeds)) {
                    for (let i = 0; i < count; i++) {
                        let eligiblePool = clinicalPool.filter(n => !(shift.includes('_TARDE') && ineligibleForAfternoon.has(n.id)));
                        if (eligiblePool.length === 0) break;
                        const stat = shift.includes('URGENCES') ? 'urgences' : 'travail';
                        const candidate = findBestCandidateWithWeeklyEquity(eligiblePool, nurseStats, weeklyStats, shift as WorkZone, stat as keyof NurseStats);
                        if(candidate) { dailyAssignments[candidate.id] = shift as WorkZone; clinicalPool = clinicalPool.filter(n => n.id !== candidate.id); }
                    }
                }

                if (Object.values(dailyAssignments).filter(c => getShiftsFromCell(c).includes('VACCIN_AM')).length >= 2 && Object.values(dailyAssignments).filter(c => getShiftsFromCell(c).includes('VACCIN_PM')).length >= 2) {
                    const urgMCount = Object.values(dailyAssignments).filter(c => getShiftsFromCell(c).includes('URGENCES')).length;
                    const urgTCount = Object.values(dailyAssignments).filter(c => getShiftsFromCell(c).includes('URGENCES_TARDE')).length;
                    if (dailyAssignments['nurse-1'] === 'ADMIN') {
                         if (urgMCount < 1) dailyAssignments['nurse-1'] = 'URGENCES';
                         else if (urgTCount < 1) dailyAssignments['nurse-1'] = 'URGENCES_TARDE';
                    }
                }
                
                clinicalPool.forEach(nurse => { if (!dailyAssignments[nurse.id] && nurse.id !== 'nurse-11') dailyAssignments[nurse.id] = 'ADMIN'; });
                
                const adminCount = Object.values(dailyAssignments).filter(c => getShiftsFromCell(c).includes('ADMIN')).length;
                if (adminCount >= 2) {
                    const twCandidates = clinicalPool.filter(n => n.id !== 'nurse-1' && n.id !== 'nurse-2' && n.id !== 'nurse-11' && nurseStats[n.id].tw_weekly < 1 && dailyAssignments[n.id] === 'ADMIN');
                    const priorityCandidates: Nurse[] = [], secondaryCandidates: Nurse[] = [];
                    twCandidates.forEach(n => { (getShiftsFromCell(schedule[n.id]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s))) ? secondaryCandidates.push(n) : priorityCandidates.push(n) });
                    let twRecipient = findBestCandidate(priorityCandidates, nurseStats, 'tw') || findBestCandidate(secondaryCandidates, nurseStats, 'tw');
                    if (twRecipient) {
                        dailyAssignments[twRecipient.id] = 'TW';
                    }
                }

            } else {
                let neededShifts = Object.entries(getClinicalNeedsForDay(currentDate, agenda, vaccinationPeriod)).flatMap(([s, c]) => Array(c).fill(s)) as WorkZone[];
                let localUnassignedPool = [...dutyPool];
                
                const internInPool = localUnassignedPool.find(n => n.id === 'nurse-11');
                if (internInPool) {
                    const internAllowedShifts: WorkZone[] = ['TRAVAIL', 'URGENCES', 'VACCIN'];
                    const internShiftCandidates = neededShifts.filter(s => internAllowedShifts.includes(s));
                    if (internShiftCandidates.length > 0) {
                        const shiftToAssign = internShiftCandidates.sort((a,b) => {
                            const statA = a.includes('URG') ? 'urgences' : 'travail'; const statB = b.includes('URG') ? 'urgences' : 'travail';
                            return nurseStats['nurse-11'][statA as keyof NurseStats] - nurseStats['nurse-11'][statB as keyof NurseStats];
                        })[0];
                        dailyAssignments[internInPool.id] = shiftToAssign;
                        localUnassignedPool = localUnassignedPool.filter(n => n.id !== 'nurse-11');
                        neededShifts.splice(neededShifts.indexOf(shiftToAssign), 1);
                    }
                }
                for (const need of neededShifts) {
                    let eligiblePool = localUnassignedPool.filter(n => !(need.includes('_TARDE') && ineligibleForAfternoon.has(n.id)));
                    const primaryStat = need.includes('URGENCES') ? 'urgences' : 'travail';
                    const candidate = findBestCandidateWithWeeklyEquity(eligiblePool, nurseStats, weeklyStats, need, primaryStat as keyof NurseStats);
                    if (candidate) { dailyAssignments[candidate.id] = need; localUnassignedPool = localUnassignedPool.filter(n => n.id !== candidate.id); }
                }
                
                localUnassignedPool.forEach(nurse => { if (!dailyAssignments[nurse.id] && nurse.id !== 'nurse-11') dailyAssignments[nurse.id] = 'ADMIN'; });

                const adminCount = Object.values(dailyAssignments).filter(c => getShiftsFromCell(c).includes('ADMIN')).length;
                if (adminCount >= 2) {
                    const twCandidates = localUnassignedPool.filter(n => n.id !== 'nurse-1' && n.id !== 'nurse-2' && n.id !== 'nurse-11' && nurseStats[n.id].tw_weekly < 1 && dailyAssignments[n.id] === 'ADMIN');
                    const priorityCandidates: Nurse[] = [], secondaryCandidates: Nurse[] = [];
                    twCandidates.forEach(n => { (getShiftsFromCell(schedule[n.id]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s))) ? secondaryCandidates.push(n) : priorityCandidates.push(n) });
                    let twRecipient = findBestCandidate(priorityCandidates, nurseStats, 'tw') || findBestCandidate(secondaryCandidates, nurseStats, 'tw');
                    if (twRecipient) {
                        dailyAssignments[twRecipient.id] = 'TW';
                    }
                }
            }

            const internIsUnassigned = dutyPool.some(n => n.id === 'nurse-11') && !dailyAssignments['nurse-11'];
            if (internIsUnassigned) {
                const adminNurseId = Object.keys(dailyAssignments).find(id => getShiftsFromCell(dailyAssignments[id]).includes('ADMIN') && id !== 'nurse-1');
                if (adminNurseId) { dailyAssignments['nurse-11'] = 'TRAVAIL'; dailyAssignments[adminNurseId] = 'ADMIN'; } 
                else { dailyAssignments['nurse-11'] = 'TRAVAIL'; }
            }

            nurses.forEach(nurse => {
                if (dailyAssignments[nurse.id]) {
                    const activeJornada = getActiveJornada(nurse.id, currentDate, jornadasLaborales);
                    if (activeJornada && !manualOverrides[nurse.id]?.[dateKey]) { dailyAssignments[nurse.id] = applyJornadaModification(dailyAssignments[nurse.id], nurse, currentDate, agenda, activeJornada); }
                }
            });
            Object.entries(dailyAssignments).forEach(([nurseId, cell]) => { schedule[nurseId][dateKey] = cell; });
        } else {
             nurses.forEach(nurse => {
                const override = manualOverrides[nurse.id]?.[dateKey];
                if (override) { if (!schedule[nurse.id]) schedule[nurse.id] = {}; schedule[nurse.id][dateKey] = override; }
            });
        }
        
        nurses.forEach(nurse => {
            const cell = schedule[nurse.id]?.[dateKey];
            if (!cell) return;
            const shifts = getShiftsFromCell(cell);
            shifts.forEach(shift => {
                 if (shift === 'URGENCES' || shift === 'URGENCES_C') nurseStats[nurse.id].urgences++;
                 if (shift === 'TRAVAIL' || shift === 'TRAVAIL_C') nurseStats[nurse.id].travail++;
                 if (shift.includes('_TARDE')) nurseStats[nurse.id].afternoon++;
                 if (shift === 'ADMIN') nurseStats[nurse.id].admin++;
                 if (shift === 'TW') { nurseStats[nurse.id].tw++; nurseStats[nurse.id].tw_weekly = (nurseStats[nurse.id].tw_weekly || 0) + 1; }
                 if (shift === 'VACCIN' || shift === 'VACCIN_AM') nurseStats[nurse.id].vaccin_am++;
                 if (shift === 'VACCIN_PM') nurseStats[nurse.id].vaccin_pm++;
                 
                 weeklyStats[nurse.id][shift] = (weeklyStats[nurse.id][shift] || 0) + 1;
            });
             if (shifts.length > 0 && !shifts.every(s => ['ADMIN', 'TW', 'CA', 'SICK_LEAVE', 'FP', 'RECUP', 'STRASBOURG', 'F'].includes(s))) { nurseStats[nurse.id].clinicalTotal++; }
        });
    }

    return schedule;
};
