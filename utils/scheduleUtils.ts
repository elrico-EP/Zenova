import type { Nurse, Schedule, WorkZone, Agenda, ScheduleCell, ActivityLevel, NurseStats, CustomShift, JornadaLaboral, SpecialStrasbourgEvent, CoverageDiagnostic, CoverageDiscardEntry } from '../types';
import { getWeekIdentifier } from './dateUtils';
import { holidays2026 } from '../data/agenda2026';
import { getActiveJornada } from './jornadaUtils';
import { SHIFTS } from '../constants';

const COVERAGE_DEBUG_STORAGE_KEY = 'zenova_debug_coverage';

const isCoverageDebugEnabled = (): boolean => {
    try {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem(COVERAGE_DEBUG_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

const logCoverageDiagnostic = (diagnostic: CoverageDiagnostic): void => {
    if (!isCoverageDebugEnabled()) return;
    console.debug('📊 [CoverageDiag]', diagnostic);
};

const pickReplacementCandidate = (
    orderedNurseIds: string[],
    getCell: (nurseId: string) => ScheduleCell | undefined,
    mandatoryShift: WorkZone,
    ineligibleForAfternoon: Set<string>,
    excludedNurseIds: Set<string>,
    weeklyAdminTWCount?: Record<string, number>,
    weeklyStats?: Record<string, Record<WorkZone, number>>
): { candidateId?: string; discardedCandidates: CoverageDiscardEntry[] } => {
    const discardedCandidates: CoverageDiscardEntry[] = [];
    const eligibleCandidates: string[] = [];

    // First pass: collect eligible candidates
    for (const nurseId of orderedNurseIds) {
        const cell = getCell(nurseId);
        if (!cell) {
            discardedCandidates.push({ nurseId, reason: 'no_cell' });
            continue;
        }

        const shifts = getShiftsFromCell(cell);
        const isReassignable = shifts.length > 0 && shifts.every(s => s === 'ADMIN' || s === 'TW');
        if (!isReassignable) {
            discardedCandidates.push({ nurseId, reason: 'not_admin_or_tw' });
            continue;
        }

        const isAfternoonEligible = !mandatoryShift.includes('_TARDE') || !ineligibleForAfternoon.has(nurseId);
        if (!isAfternoonEligible) {
            discardedCandidates.push({ nurseId, reason: 'afternoon_ineligible' });
            continue;
        }

        if (excludedNurseIds.has(nurseId)) {
            discardedCandidates.push({ nurseId, reason: 'excluded_nurse' });
            continue;
        }

        eligibleCandidates.push(nurseId);
    }

    // Second pass: sort eligible candidates by weekly equity, then deterministically
    if (eligibleCandidates.length === 0) {
        return { candidateId: undefined, discardedCandidates };
    }

    const sorted = eligibleCandidates.sort((a, b) => {
        // PRIORITY 1: Weekly ADMIN+TW equity
        if (weeklyAdminTWCount) {
            const countA = weeklyAdminTWCount[a] || 0;
            const countB = weeklyAdminTWCount[b] || 0;
            // Prefer nurses with less ADMIN/TW this week
            if (countA !== countB) return countA - countB;
        }
        
        // PRIORITY 2: Weekly stats for the mandatory shift
        if (weeklyStats) {
            const statA = weeklyStats[a]?.[mandatoryShift] || 0;
            const statB = weeklyStats[b]?.[mandatoryShift] || 0;
            if (statA !== statB) return statA - statB;
        }
        
        // PRIORITY 3: Deterministic tiebreaker by ID
        return a.localeCompare(b);
    });

    return { candidateId: sorted[0], discardedCandidates };
};

// Función para verificar si un turno es manual (desde la tabla 'turnos')
// Por ahora usamos manualOverrides como fuente de verdad
export const isManualTurno = (
  nurseId: string,
  dateKey: string,
  manualOverrides: Schedule
): boolean => {
  return !!manualOverrides[nurseId]?.[dateKey];
};

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
    agenda: Agenda,
    jornadasLaborales: JornadaLaboral[]
): { morning: string; afternoon: string } | string => {
    if (!cell || !nurse) return '';

    // Priority 1: If it's a custom shift with a pre-calculated time, just return it.
    if (typeof cell === 'object' && 'custom' in cell && 'time' in cell && cell.time) {
        return cell.time;
    }

    if (typeof cell === 'object' && 'split' in cell) {
        const [morningPart, afternoonPart] = cell.split;
        // Recursive call to resolve parts. We pass jornadasLaborales through.
        const getPartHours = (part: ScheduleCell): string => {
            const hours = getScheduleCellHours(part, nurse, date, activityLevel, agenda, jornadasLaborales); 
            return typeof hours === 'string' ? hours : '';
        };
        return { morning: getPartHours(morningPart), afternoon: getPartHours(afternoonPart) };
    }
    
    if (cell === 'STRASBOURG') return '';
    
    const dayOfWeek = date.getUTCDay(); // Correctly getUTCDay
    if (dayOfWeek === 0 || dayOfWeek === 6) return '';

    let shiftType: WorkZone | undefined;
    if (typeof cell === 'string') {
        shiftType = cell;
    } else if (typeof cell === 'object' && 'type' in cell) {
        shiftType = cell.type;
    } else {
        return ''; 
    }

    const isAfternoonShiftType = shiftType.includes('_TARDE') || shiftType.includes('_PM') || shiftType === 'ADM_PLUS';

    // BASE HOUR CALCULATION
    let baseHours: string;
    switch (shiftType) {
        case 'VACCIN_AM': baseHours = '08:00 - 14:00'; break;
        case 'VACCIN_PM': baseHours = '14:00 - 17:00'; break;
        case 'VACCIN_PM_PLUS': baseHours = '14:00 - 18:00'; break;
        case 'URGENCES_C': baseHours = '14:00 - 17:00'; break;
        case 'TRAVAIL_C': baseHours = '14:00 - 17:00'; break;
        case 'VACCIN': baseHours = '08:00 - 14:00'; break;
        default:
            const nextMonday = new Date(date);
            nextMonday.setUTCDate(date.getUTCDate() + (8 - dayOfWeek) % 7 || 7);
            const isPreSessionFriday = date.getUTCDay() === 5 && agenda[getWeekIdentifier(nextMonday)] === 'SESSION';

            if (isPreSessionFriday) {
                if (isAfternoonShiftType) baseHours = '12:00 - 17:45';
                else if (shiftType === 'LIBERO') baseHours = '10:00 - 16:00';
                else baseHours = '08:00 - 14:00';
            } else if (date.getUTCDay() === 5) {
                baseHours = '08:00 - 14:00';
            } else if (isAfternoonShiftType) {
                const isPlus = shiftType.endsWith('_PLUS') && shiftType !== 'ADM_PLUS';
                if (activityLevel === 'NORMAL') {
                    baseHours = isPlus ? '10:00 - 19:00' : '10:00 - 18:30';
                } else {
                    baseHours = isPlus ? '09:00 - 18:15' : '09:00 - 17:45';
                }
            } else {
                baseHours = '08:00 - 17:00';
            }
    }
    
    if (!baseHours.includes(' - ')) {
        return baseHours;
    }

    // Apply jornada reduction to the time string
    const activeJornada = getActiveJornada(nurse.id, date, jornadasLaborales);

    if (!activeJornada || activeJornada.porcentaje === 100) {
        return baseHours;
    }
    
    let [start, end] = baseHours.split(' - ');
    const isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;
    
    if (activeJornada.porcentaje === 90) {
        if (activeJornada.reductionOption === 'LEAVE_EARLY_1H_L_J' && isMonToThu) {
               if (isAfternoonShiftType) start = modifyTime(start, 1);
             else end = modifyTime(end, -1);
        }
        if ((activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && dayOfWeek === activeJornada.reductionDayOfWeek) {
             if (activeJornada.reductionOption === 'START_SHIFT_4H') start = modifyTime(start, 3);
             else end = modifyTime(end, -3);
        }
    } else if (activeJornada.porcentaje === 80) {
        if (activeJornada.reductionOption === 'FRIDAY_PLUS_EXTRA' && dayOfWeek === activeJornada.secondaryReductionDayOfWeek) {
               if (isAfternoonShiftType) start = modifyTime(start, 1, 30);
             else end = modifyTime(end, -1, -30);
        }
    }

    return `${start} - ${end}`;
};

const findBestCandidate = (candidates: Nurse[], stats: Record<string, NurseStats>, primaryStat: keyof NurseStats, secondaryStat: keyof NurseStats = 'clinicalTotal'): Nurse | undefined => {
    if (candidates.length === 0) return undefined;
    const sorted = [...candidates].sort((a, b) => {
        const statsA = stats[a.id];
        const statsB = stats[b.id];
        if (statsA[primaryStat] !== statsB[primaryStat]) return statsA[primaryStat] - statsB[primaryStat];
        if (statsA[secondaryStat] !== statsB[secondaryStat]) return statsA[secondaryStat] - statsB[secondaryStat];
        // Deterministic tiebreaker: compare IDs lexicographically
        return a.id.localeCompare(b.id);
    });
    return sorted[0];
};

/**
 * Calculate total clinical shifts for a nurse this week (all shift types combined)
 */
const calculateWeeklyClinicTotal = (weeklyShiftStats: Record<WorkZone, number>): number => {
    return (weeklyShiftStats['URGENCES'] || 0) +
           (weeklyShiftStats['TRAVAIL'] || 0) +
           (weeklyShiftStats['URGENCES_TARDE'] || 0) +
           (weeklyShiftStats['TRAVAIL_TARDE'] || 0) +
           (weeklyShiftStats['ADMIN'] || 0) +
           (weeklyShiftStats['STRASBOURG'] || 0) +
           (weeklyShiftStats['VACCIN'] || 0) +
           (weeklyShiftStats['VACCIN_AM'] || 0) +
           (weeklyShiftStats['VACCIN_PM'] || 0) +
           (weeklyShiftStats['TW'] || 0);  // TW cuenta también en el total semanal
};

const findBestCandidateWithWeeklyEquity = (
    candidates: Nurse[], 
    stats: Record<string, NurseStats>, 
    weeklyShiftStats: Record<string, Record<WorkZone, number>>,
    targetShift: WorkZone,
    primaryStat: keyof NurseStats, 
    secondaryStat: keyof NurseStats = 'clinicalTotal',
    annualStats?: Record<string, NurseStats>,
    currentDay?: number,
    lastAssignmentDate?: Record<string, Record<WorkZone, number>>
): Nurse | undefined => {
    if (candidates.length === 0) return undefined;

    // Apply tw_weekly restriction BEFORE sorting
    let filteredCandidates = candidates;
    if (targetShift === 'TW') {
        filteredCandidates = candidates.filter(nurse => stats[nurse.id].tw_weekly < 1);
        if (filteredCandidates.length === 0) return undefined; // No eligible nurses for TW this week
    }

    const sorted = [...filteredCandidates].sort((a, b) => {
        const statsA = stats[a.id];
        const statsB = stats[b.id];
        const weeklyA = weeklyShiftStats[a.id][targetShift] || 0;
        const weeklyB = weeklyShiftStats[b.id][targetShift] || 0;
        const weeklyTotalA = calculateWeeklyClinicTotal(weeklyShiftStats[a.id]);
        const weeklyTotalB = calculateWeeklyClinicTotal(weeklyShiftStats[b.id]);

        // CRITERIO 1: Stat semanal del turno específico (quien menos tenga esta semana)
        if (weeklyA !== weeklyB) return weeklyA - weeklyB;
        
        // CRITERIO 2: Total clínico semanal (quien menos días trabajó esta semana)
        if (weeklyTotalA !== weeklyTotalB) return weeklyTotalA - weeklyTotalB;

        // CRITERIO 2.5: Rest-day enforcement — nurses who have ≥4 pure clinical days
        // this week with 0 ADMIN/TW are soft-blocked from further clinical selection.
        // This prevents 5-clinical weeks while colleagues have 2 non-clinical days.
        const weeklyAdminTwA2 = (weeklyShiftStats[a.id]?.['ADMIN'] || 0) + (weeklyShiftStats[a.id]?.['TW'] || 0);
        const weeklyAdminTwB2 = (weeklyShiftStats[b.id]?.['ADMIN'] || 0) + (weeklyShiftStats[b.id]?.['TW'] || 0);
        const pureClinA = weeklyTotalA - weeklyAdminTwA2;
        const pureClinB = weeklyTotalB - weeklyAdminTwB2;
        const needsRestA = pureClinA >= 4 && weeklyAdminTwA2 === 0 ? 1 : 0;
        const needsRestB = pureClinB >= 4 && weeklyAdminTwB2 === 0 ? 1 : 0;
        if (needsRestA !== needsRestB) return needsRestA - needsRestB;

        // CRITERIO 3: Stat mensual del turno específico (quien menos tenga este mes)
        if (statsA[primaryStat] !== statsB[primaryStat]) return statsA[primaryStat] - statsB[primaryStat];
        
        // CRITERIO 4: Total clínico mensual (quien menos turnos clínicos tenga este mes)
        if (statsA[secondaryStat] !== statsB[secondaryStat]) return statsA[secondaryStat] - statsB[secondaryStat];
        
        // CRITERIO 5: Stat anual del turno específico (quien menos tenga este año)
        if (annualStats) {
            const annualA = annualStats[a.id]?.[primaryStat] || 0;
            const annualB = annualStats[b.id]?.[primaryStat] || 0;
            if (annualA !== annualB) return annualA - annualB;
        }
        
        // CRITERIO 6: Penalización por consecutividad (si trabajó este turno hace <3 días)
        if (currentDay !== undefined && lastAssignmentDate) {
            const lastDayA = lastAssignmentDate[a.id]?.[targetShift] || 0;
            const lastDayB = lastAssignmentDate[b.id]?.[targetShift] || 0;
            const daysAgoA = currentDay - lastDayA;
            const daysAgoB = currentDay - lastDayB;
            const penaltyA = (lastDayA > 0 && daysAgoA < 3) ? 100 : 0;
            const penaltyB = (lastDayB > 0 && daysAgoB < 3) ? 100 : 0;
            if (penaltyA !== penaltyB) return penaltyA - penaltyB;
        }
        
        // CRITERIO 7: Deterministic tiebreaker by ID
        return a.id.localeCompare(b.id);
    });
    return sorted[0];
};

const enforceAdminOverflowToTW = (
    dailyAssignments: Record<string, ScheduleCell>,
    nurseStats: Record<string, NurseStats>,
    weeklyStats: Record<string, Record<WorkZone, number>>,
    schedule: Schedule,
    previousDateKey: string
): void => {
    const adminNurseIds = Object.keys(dailyAssignments).filter(nurseId =>
        getShiftsFromCell(dailyAssignments[nurseId]).includes('ADMIN')
    );

    if (adminNurseIds.length <= 2) return;

    const overflowAdminIds = adminNurseIds.slice(2);
    overflowAdminIds.forEach(nurseId => {
        const weeklyAdminTw = (weeklyStats[nurseId]?.['ADMIN'] || 0) + (weeklyStats[nurseId]?.['TW'] || 0);
        const canGetTW = nurseId !== 'nurse-1' && nurseId !== 'nurse-2' && nurseId !== 'nurse-11' &&
            nurseStats[nurseId].tw_weekly < 1 &&
            weeklyAdminTw < 2 &&
            !getShiftsFromCell(schedule[nurseId]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s));

        if (canGetTW) {
            dailyAssignments[nurseId] = 'TW';
        }
    });
};

const assignAdminAndTWToRemainingNurses = (
    remainingNurses: Nurse[],
    dailyAssignments: Record<string, ScheduleCell>,
    nursesOnMandatoryShifts: number,
    nurseStats: Record<string, NurseStats>,
    weeklyStats: Record<string, Record<WorkZone, number>>,
    schedule: Schedule,
    previousDateKey: string,
    annualStats?: Record<string, NurseStats>,
    weeklyAdminTWCount?: Record<string, number>,
    isWeeklyCoordinated?: boolean
): void => {
    if (nursesOnMandatoryShifts < 6) return;

    const hasPrevAdminOrTW = (nurseId: string) =>
        getShiftsFromCell(schedule[nurseId]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s));

    const sortForAdmin = (pool: Nurse[]): Nurse[] => {
        return [...pool].sort((a, b) => {
            // PRIORITY 1: Weekly equity - prefer nurses with fewer ADMIN/TW this week
            const countA = weeklyAdminTWCount ? (weeklyAdminTWCount[a.id] || 0) : 0;
            const countB = weeklyAdminTWCount ? (weeklyAdminTWCount[b.id] || 0) : 0;
            // Prefer 0, then 1, exclude if 2+
            if ((countA > 1) !== (countB > 1)) {
                return (countA > 1 ? 1 : 0) - (countB > 1 ? 1 : 0);
            }
            if (countA !== countB && countA <= 1 && countB <= 1) return countA - countB;

            // PRIORITY 2: Avoid consecutive assignments
            const prevA = hasPrevAdminOrTW(a.id) ? 1 : 0;
            const prevB = hasPrevAdminOrTW(b.id) ? 1 : 0;
            if (prevA !== prevB) return prevA - prevB;

            // PRIORITY 3: Weekly ADMIN+TW count
            const weeklyAdminTwA = (weeklyStats[a.id]?.['ADMIN'] || 0) + (weeklyStats[a.id]?.['TW'] || 0);
            const weeklyAdminTwB = (weeklyStats[b.id]?.['ADMIN'] || 0) + (weeklyStats[b.id]?.['TW'] || 0);
            if (weeklyAdminTwA !== weeklyAdminTwB) return weeklyAdminTwA - weeklyAdminTwB;

            // PRIORITY 4: Monthly ADMIN
            const monthlyAdminA = nurseStats[a.id]?.admin || 0;
            const monthlyAdminB = nurseStats[b.id]?.admin || 0;
            if (monthlyAdminA !== monthlyAdminB) return monthlyAdminA - monthlyAdminB;

            // PRIORITY 5: Annual ADMIN
            if (annualStats) {
                const annualAdminA = annualStats[a.id]?.admin || 0;
                const annualAdminB = annualStats[b.id]?.admin || 0;
                if (annualAdminA !== annualAdminB) return annualAdminA - annualAdminB;
            }

            // PRIORITY 6: Deterministic tiebreaker by ID
            return a.id.localeCompare(b.id);
        });
    };
        const sortForTW = (pool: Nurse[]): Nurse[] => {
            return [...pool].sort((a, b) => {
                // PRIORITY 1: Weekly equity — prefer nurses with fewer ADMIN/TW this week
                const countA = weeklyAdminTWCount ? (weeklyAdminTWCount[a.id] || 0) : 0;
                const countB = weeklyAdminTWCount ? (weeklyAdminTWCount[b.id] || 0) : 0;
                if ((countA > 1) !== (countB > 1)) {
                    return (countA > 1 ? 1 : 0) - (countB > 1 ? 1 : 0);
                }
                if (countA !== countB && countA <= 1 && countB <= 1) return countA - countB;

                // PRIORITY 2: Soft consecutive preference — prefer nurse who didn't have ADMIN/TW yesterday
                const prevA = hasPrevAdminOrTW(a.id) ? 1 : 0;
                const prevB = hasPrevAdminOrTW(b.id) ? 1 : 0;
                if (prevA !== prevB) return prevA - prevB;

                // PRIORITY 3: Weekly TW count
                const weeklyTwA = weeklyStats[a.id]?.['TW'] || 0;
                const weeklyTwB = weeklyStats[b.id]?.['TW'] || 0;
                if (weeklyTwA !== weeklyTwB) return weeklyTwA - weeklyTwB;

                // PRIORITY 4: Monthly TW
                const monthlyTwA = nurseStats[a.id]?.tw || 0;
                const monthlyTwB = nurseStats[b.id]?.tw || 0;
                if (monthlyTwA !== monthlyTwB) return monthlyTwA - monthlyTwB;

                // PRIORITY 5: Annual TW
                if (annualStats) {
                    const annualTwA = annualStats[a.id]?.tw || 0;
                    const annualTwB = annualStats[b.id]?.tw || 0;
                    if (annualTwA !== annualTwB) return annualTwA - annualTwB;
                }

                // PRIORITY 6: Weekly ADMIN+TW count
                const weeklyAdminTwA = (weeklyStats[a.id]?.['ADMIN'] || 0) + (weeklyStats[a.id]?.['TW'] || 0);
                const weeklyAdminTwB = (weeklyStats[b.id]?.['ADMIN'] || 0) + (weeklyStats[b.id]?.['TW'] || 0);
                if (weeklyAdminTwA !== weeklyAdminTwB) return weeklyAdminTwA - weeklyAdminTwB;

                // PRIORITY 7: Deterministic tiebreaker by ID
                return a.id.localeCompare(b.id);
            });
        };

    let available = [...remainingNurses];

    // Posición 7: ADMIN (equidad semanal/mensual/anual + no consecutivo)
    if (available.length > 0) {
        const selected = sortForAdmin(available)[0];
        dailyAssignments[selected.id] = 'ADMIN';
        available = available.filter(n => n.id !== selected.id);
    }

    // Posición 8: ADMIN (equidad semanal/mensual/anual + no consecutivo)
    if (available.length > 0) {
        const selected = sortForAdmin(available)[0];
        dailyAssignments[selected.id] = 'ADMIN';
        available = available.filter(n => n.id !== selected.id);
    }

    // Posiciones 9+: TW (si cumple restricciones y <2 ADMIN/TW esa semana), si no -> ADMIN
    while (available.length > 0) {
        const canAdd = (nurse: Nurse): boolean => {
            if (isWeeklyCoordinated && weeklyAdminTWCount && weeklyAdminTWCount[nurse.id] >= 2) {
                // Si ya tiene 2 ADMIN/TW en la semana, no asignarle más
                return false;
            }
            return true;
        };

        const availableCanAdd = available.filter(canAdd);
        const fallbackPool = availableCanAdd.length > 0 ? availableCanAdd : available;

        // Hard filter: structural rules only (identity + weekly TW limit)
        // hasPrevAdminOrTW is a soft preference (handled in sortForTW),
        // NOT a hard block — otherwise small pools never get TW because
        // all remaining nurses always had ADMIN/TW the previous day.
        const eligibleTW = fallbackPool.filter(nurse =>
            nurse.id !== 'nurse-1' &&
            nurse.id !== 'nurse-2' &&
            nurse.id !== 'nurse-11' &&
            nurseStats[nurse.id].tw_weekly < 1
        );

        if (eligibleTW.length > 0) {
            const selectedTW = sortForTW(eligibleTW)[0];
            dailyAssignments[selectedTW.id] = 'TW';
            available = available.filter(n => n.id !== selectedTW.id);
            continue;
        }

        const selectedAdmin = sortForAdmin(fallbackPool)[0];
        dailyAssignments[selectedAdmin.id] = 'ADMIN';
        available = available.filter(n => n.id !== selectedAdmin.id);
    }
};


export const getClinicalNeedsForDay = (date: Date, agenda: Agenda, vaccinationPeriod: { start: string; end: string } | null): Record<string, number> => {
    const dayOfWeek = date.getUTCDay();
    const weekId = getWeekIdentifier(date);
    const activityLevel = agenda[weekId] || 'NORMAL';
    const dateStr = date.toISOString().split('T')[0];

    if (dayOfWeek === 0 || dayOfWeek === 6 || activityLevel === 'CLOSED' || holidays2026.has(dateStr)) return {};
    
    const isVaccinationDay = !!vaccinationPeriod && dateStr >= vaccinationPeriod.start && dateStr <= vaccinationPeriod.end;
    const nextMonday = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);
    const isPreSessionFriday = dayOfWeek === 5 && agenda[getWeekIdentifier(nextMonday)] === 'SESSION';
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

/**
 * Converts clinical needs to an array of shifts in PRIORITY ORDER.
 * Nueva regla: turnos de tarde (PM) tienen prioridad sobre turnos de mañana (AM)
 * cuando hay enfermeros limitados.
 * Priority: URGENCES_TARDE > TRAVAIL_TARDE > URGENCES > TRAVAIL > others
 */
const getNeededShiftsInPriorityOrder = (needs: Record<string, number>): WorkZone[] => {
    const priorityOrder: WorkZone[] = ['URGENCES_TARDE', 'TRAVAIL_TARDE', 'URGENCES', 'TRAVAIL', 'VACCIN', 'LIBERO'];
    const result: WorkZone[] = [];
    
    priorityOrder.forEach(shift => {
        const count = needs[shift] || 0;
        for (let i = 0; i < count; i++) {
            result.push(shift);
        }
    });
    
    // Add any remaining shifts not in priority order
    Object.entries(needs).forEach(([shift, count]) => {
        if (!priorityOrder.includes(shift as WorkZone)) {
            for (let i = 0; i < count; i++) {
                result.push(shift as WorkZone);
            }
        }
    });
    
    return result;
};

export const ensureMandatoryCoverage = (
    schedule: Schedule,
    nurses: Nurse[],
    year: number,
    month: number,
    agenda: Agenda,
    vaccinationPeriod: { start: string; end: string } | null,
    jornadasLaborales: JornadaLaboral[]
): Schedule => {
    const result: Schedule = JSON.parse(JSON.stringify(schedule));
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    nurses.forEach(nurse => {
        if (!result[nurse.id]) {
            result[nurse.id] = {};
        }
    });

    const countWeeklyTWForNurse = (nurseId: string, currentDateKey: string, currentWeekId: string): number => {
        const nurseSchedule = result[nurseId] || {};
        return Object.entries(nurseSchedule).reduce((count, [dateKey, cell]) => {
            if (dateKey > currentDateKey) return count;
            if (getWeekIdentifier(new Date(`${dateKey}T12:00:00Z`)) !== currentWeekId) return count;
            return count + (getShiftsFromCell(cell).includes('TW') ? 1 : 0);
        }, 0);
    };

    const clinicalShifts = new Set<WorkZone>([
        'URGENCES',
        'TRAVAIL',
        'URGENCES_TARDE',
        'TRAVAIL_TARDE',
        'URGENCES_C',
        'TRAVAIL_C',
        'VACCIN',
        'VACCIN_AM',
        'VACCIN_PM',
        'VACCIN_PM_PLUS',
        'LIBERO',
    ]);

    const isClinicalCell = (cell: ScheduleCell | undefined): boolean => {
        const shifts = getShiftsFromCell(cell);
        return shifts.some(shift => clinicalShifts.has(shift));
    };

    const isAdminOnlyCell = (cell: ScheduleCell | undefined): boolean => {
        const shifts = getShiftsFromCell(cell);
        return shifts.length === 1 && shifts[0] === 'ADMIN';
    };

    const canTakeClinicalCell = (nurseId: string, cell: ScheduleCell | undefined, date: Date): boolean => {
        if (!cell) return false;
        const shifts = getShiftsFromCell(cell);
        const needsAfternoonEligibility = shifts.some(shift =>
            shift.includes('_TARDE') || shift.includes('_PM') || shift === 'ADM_PLUS'
        );

        if (!needsAfternoonEligibility) return true;

        const activeJornada = getActiveJornada(nurseId, date, jornadasLaborales);
        const dayOfWeek = date.getUTCDay();
        const isAfternoonRestricted = !!activeJornada &&
            activeJornada.porcentaje === 90 &&
            (activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') &&
            dayOfWeek >= 1 &&
            dayOfWeek <= 4 &&
            dayOfWeek === activeJornada.reductionDayOfWeek;

        return !isAfternoonRestricted;
    };

    const createsConsecutiveAdminOrTW = (nurseId: string, dateKey: string): boolean => {
        const baseDate = new Date(`${dateKey}T12:00:00Z`);
        const prevDate = new Date(baseDate);
        prevDate.setUTCDate(prevDate.getUTCDate() - 1);
        const nextDate = new Date(baseDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        const prevKey = prevDate.toISOString().split('T')[0];
        const nextKey = nextDate.toISOString().split('T')[0];

        const hasPrevAdminOrTW = getShiftsFromCell(result[nurseId]?.[prevKey]).some(shift => ['ADMIN', 'TW'].includes(shift));
        const hasNextAdminOrTW = getShiftsFromCell(result[nurseId]?.[nextKey]).some(shift => ['ADMIN', 'TW'].includes(shift));
        return hasPrevAdminOrTW || hasNextAdminOrTW;
    };

    const rebalanceWeekClinicalLoad = (weekDateKeys: string[]): void => {
        const MAX_SWAPS_PER_WEEK = 2;

        const buildCounts = () => {
            const clinicalCount: Record<string, number> = {};
            nurses.forEach(nurse => {
                clinicalCount[nurse.id] = weekDateKeys.reduce((count, dateKey) => {
                    return count + (isClinicalCell(result[nurse.id]?.[dateKey]) ? 1 : 0);
                }, 0);
            });
            return clinicalCount;
        };

        for (let swapIndex = 0; swapIndex < MAX_SWAPS_PER_WEEK; swapIndex++) {
            const clinicalCount = buildCounts();
            const sortedByClinicalAsc = [...nurses].sort((a, b) => {
                if (clinicalCount[a.id] !== clinicalCount[b.id]) return clinicalCount[a.id] - clinicalCount[b.id];
                return a.id.localeCompare(b.id);
            });
            const sortedByClinicalDesc = [...nurses].sort((a, b) => {
                if (clinicalCount[a.id] !== clinicalCount[b.id]) return clinicalCount[b.id] - clinicalCount[a.id];
                return a.id.localeCompare(b.id);
            });

            const minClinical = clinicalCount[sortedByClinicalAsc[0].id] || 0;
            const maxClinical = clinicalCount[sortedByClinicalDesc[0].id] || 0;
            if (maxClinical - minClinical < 2) {
                break;
            }

            let swapped = false;

            for (const receiver of sortedByClinicalAsc) {
                for (const donor of sortedByClinicalDesc) {
                    if (receiver.id === donor.id) continue;
                    if ((clinicalCount[donor.id] || 0) - (clinicalCount[receiver.id] || 0) < 2) continue;

                    const candidateDateKey = weekDateKeys.find(dateKey => {
                        const date = new Date(`${dateKey}T12:00:00Z`);
                        const donorCell = result[donor.id]?.[dateKey];
                        const receiverCell = result[receiver.id]?.[dateKey];

                        if (!isClinicalCell(donorCell)) return false;
                        if (!isAdminOnlyCell(receiverCell)) return false;
                        if (!canTakeClinicalCell(receiver.id, donorCell, date)) return false;
                        if (createsConsecutiveAdminOrTW(donor.id, dateKey)) return false;

                        return true;
                    });

                    if (!candidateDateKey) continue;

                    const donorCell = result[donor.id]?.[candidateDateKey];
                    if (!donorCell) continue;

                    result[receiver.id][candidateDateKey] = donorCell;
                    result[donor.id][candidateDateKey] = 'ADMIN';
                    swapped = true;
                    break;
                }

                if (swapped) break;
            }

            if (!swapped) {
                break;
            }
        }
    };

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month, day));
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = currentDate.getUTCDay();
        const isWorkday = !(dayOfWeek === 0 || dayOfWeek === 6 || holidays2026.has(dateKey));

        if (!isWorkday) continue;

        // Get mandatory shift requirements
        const mandatoryNeeds = getClinicalNeedsForDay(currentDate, agenda, vaccinationPeriod);
        const mandatoryShiftTypes: WorkZone[] = ['URGENCES_TARDE', 'TRAVAIL_TARDE', 'URGENCES', 'TRAVAIL'];

        // Build ineligibleForAfternoon set
        const ineligibleForAfternoon = new Set<string>();
        nurses.forEach(nurse => {
            const activeJornada = getActiveJornada(nurse.id, currentDate, jornadasLaborales);
            if (activeJornada && activeJornada.porcentaje === 90 && 
                (activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && 
                dayOfWeek >= 1 && dayOfWeek <= 4 && dayOfWeek === activeJornada.reductionDayOfWeek) {
                ineligibleForAfternoon.add(nurse.id);
            }
        });

        // Check each mandatory shift
        for (const mandatoryShift of mandatoryShiftTypes) {
            const requiredCount = mandatoryNeeds[mandatoryShift] || 0;
            if (requiredCount <= 0) continue;

            let currentCount = 0;
            nurses.forEach(nurse => {
                const cell = result[nurse.id]?.[dateKey];
                if (cell && getShiftsFromCell(cell).includes(mandatoryShift)) {
                    currentCount++;
                }
            });

            // If not enough coverage, reassign from ADMIN/TW
            while (currentCount < requiredCount) {
                const currentWeekId = getWeekIdentifier(currentDate);
                const weeklyAdminTWCount: Record<string, number> = {};
                
                // Calculate weekly ADMIN+TW count for all nurses up to this date
                nurses.forEach(nurse => {
                    const nurseSchedule = result[nurse.id] || {};
                    weeklyAdminTWCount[nurse.id] = Object.entries(nurseSchedule).reduce((count, [dk, cell]) => {
                        if (dk > dateKey) return count;
                        if (getWeekIdentifier(new Date(`${dk}T12:00:00Z`)) !== currentWeekId) return count;
                        return count + (getShiftsFromCell(cell).some(s => ['ADMIN', 'TW'].includes(s)) ? 1 : 0);
                    }, 0);
                });

                const primaryAttempt = pickReplacementCandidate(
                    nurses.map(n => n.id),
                    (nurseId) => result[nurseId]?.[dateKey],
                    mandatoryShift,
                    ineligibleForAfternoon,
                    new Set<string>(['nurse-1']),
                    weeklyAdminTWCount,
                    undefined
                );

                const fallbackAttempt = !primaryAttempt.candidateId
                    ? pickReplacementCandidate(
                        nurses.map(n => n.id),
                        (nurseId) => result[nurseId]?.[dateKey],
                        mandatoryShift,
                        ineligibleForAfternoon,
                        new Set<string>(),
                        weeklyAdminTWCount,
                        undefined
                    )
                    : undefined;

                const candidateId = primaryAttempt.candidateId || fallbackAttempt?.candidateId;
                const discardedCandidates = primaryAttempt.candidateId
                    ? primaryAttempt.discardedCandidates
                    : [...primaryAttempt.discardedCandidates, ...(fallbackAttempt?.discardedCandidates || [])];

                if (!candidateId) {
                    logCoverageDiagnostic({
                        source: 'ensureMandatoryCoverage',
                        dateKey,
                        mandatoryShift,
                        requiredCount,
                        currentCount,
                        missingCount: requiredCount - currentCount,
                        discardedCandidates,
                    });
                    break;
                }

                // Reassign this nurse to the mandatory shift
                if (!result[candidateId]) {
                    result[candidateId] = {};
                }
                result[candidateId][dateKey] = mandatoryShift;
                currentCount++;
            }

            if (currentCount < requiredCount) {
                logCoverageDiagnostic({
                    source: 'ensureMandatoryCoverage',
                    dateKey,
                    mandatoryShift,
                    requiredCount,
                    currentCount,
                    missingCount: requiredCount - currentCount,
                    discardedCandidates: [],
                });
            }
        }

        // Regla de negocio final del día:
        // 1) obligatorios cubiertos (arriba),
        // 2) si hay más de 2 ADMIN, el 3º+ pasa a TW si cumple exclusiones.
        const adminNurseIds = nurses
            .map(nurse => nurse.id)
            .filter(nurseId => {
                const cell = result[nurseId]?.[dateKey];
                return !!cell && getShiftsFromCell(cell).includes('ADMIN');
            });

        if (adminNurseIds.length > 2) {
            const previousDate = new Date(currentDate);
            previousDate.setUTCDate(previousDate.getUTCDate() - 1);
            const previousDateKey = previousDate.toISOString().split('T')[0];
            const currentWeekId = getWeekIdentifier(currentDate);

            adminNurseIds.slice(2).forEach(nurseId => {
                const hasPrevAdminOrTW = getShiftsFromCell(result[nurseId]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s));
                const weeklyTW = countWeeklyTWForNurse(nurseId, dateKey, currentWeekId);
                const canGetTW = nurseId !== 'nurse-1' && nurseId !== 'nurse-2' && nurseId !== 'nurse-11' && !hasPrevAdminOrTW && weeklyTW < 1;

                if (canGetTW) {
                    result[nurseId][dateKey] = 'TW';
                }
            });
        }

        // Catchall: asegurar que todos los enfermeros tienen un turno ese día (solo ADMIN/TW)
        nurses.forEach(nurse => {
            if (!result[nurse.id][dateKey]) {
                const currentWeekId = getWeekIdentifier(currentDate);
                const previousDate = new Date(currentDate);
                previousDate.setUTCDate(previousDate.getUTCDate() - 1);
                const previousDateKey = previousDate.toISOString().split('T')[0];
                const hasPrevAdminOrTW = getShiftsFromCell(result[nurse.id]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s));
                const weeklyTW = countWeeklyTWForNurse(nurse.id, dateKey, currentWeekId);
                const canGetTW = nurse.id !== 'nurse-1' && nurse.id !== 'nurse-2' && nurse.id !== 'nurse-11' && !hasPrevAdminOrTW && weeklyTW < 1;
                if (!result[nurse.id]) {
                    result[nurse.id] = {};
                }
                result[nurse.id][dateKey] = canGetTW ? 'TW' : 'ADMIN';
            }
        });
    }

    if (year === 2026 && month >= 3) {
        const weekMap = new Map<string, string[]>();

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(Date.UTC(year, month, day));
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasAnyAssignment = nurses.some(nurse => !!result[nurse.id]?.[dateKey]);
            if (!hasAnyAssignment) continue;

            const weekId = getWeekIdentifier(currentDate);
            if (!weekMap.has(weekId)) {
                weekMap.set(weekId, []);
            }
            weekMap.get(weekId)!.push(dateKey);
        }

        weekMap.forEach(weekDateKeys => {
            rebalanceWeekClinicalLoad(weekDateKeys.sort());
        });
    }

    return result;
};

const applyJornadaModification = (
    cell: ScheduleCell | undefined,
    nurse: Nurse,
    date: Date,
    jornadas: JornadaLaboral[],
    agenda: Agenda
): ScheduleCell | undefined => {
    if (!cell) return cell;
    
    const activeJornada = getActiveJornada(nurse.id, date, jornadas);
    if (!activeJornada || activeJornada.porcentaje === 100) {
        return cell;
    }

    const dayOfWeek = date.getUTCDay();
    const shifts = getShiftsFromCell(cell);
    const isWorkShift = shifts.length > 0 && !shifts.some(s => ['CA', 'SICK_LEAVE', 'F', 'STRASBOURG', 'FP', 'RECUP'].includes(s));

    if (!isWorkShift) {
        return cell;
    }
    
    const primaryShift = shifts[0];
    const activityLevel = agenda[getWeekIdentifier(date)] || 'NORMAL';
    
    let hoursStr = getScheduleCellHours(cell, nurse, date, activityLevel, agenda, []); 
    if (typeof hoursStr !== 'string' || !hoursStr.includes(' - ')) {
        return cell;
    }

    let [start, end] = hoursStr.split(' - ');
    let modified = false;

    if (activeJornada.porcentaje === 80) {
        if (activeJornada.reductionOption === 'FULL_DAY_OFF' && dayOfWeek === activeJornada.reductionDayOfWeek) {
            return { custom: `Red. 80%`, type: 'CA' };
        }
        if (activeJornada.reductionOption === 'FRIDAY_PLUS_EXTRA') {
            if (dayOfWeek === 5) {
                return { custom: `Red. 80%`, type: 'CA' };
            }
            if (dayOfWeek === activeJornada.secondaryReductionDayOfWeek) {
                if (primaryShift.includes('_TARDE') || primaryShift.includes('_PM') || primaryShift === 'ADM_PLUS') start = modifyTime(start, 1, 30);
                else end = modifyTime(end, -1, -30);
                modified = true;
            }
        }
    } else if (activeJornada.porcentaje === 90) {
        if (activeJornada.reductionOption === 'LEAVE_EARLY_1H_L_J' && dayOfWeek >= 1 && dayOfWeek <= 4) {
             if (primaryShift.includes('_TARDE') || primaryShift.includes('_PM') || primaryShift === 'ADM_PLUS') start = modifyTime(start, 1);
             else end = modifyTime(end, -1);
             modified = true;
        }
        if ((activeJornada.reductionOption === 'START_SHIFT_4H' || activeJornada.reductionOption === 'END_SHIFT_4H') && dayOfWeek === activeJornada.reductionDayOfWeek) {
             if (activeJornada.reductionOption === 'START_SHIFT_4H') start = modifyTime(start, 3);
             else end = modifyTime(end, -3);
             modified = true;
        }
    }
    
    if (modified) {
        const baseShiftLabel = (typeof cell === 'string' ? SHIFTS[cell]?.label : 'Shift') || 'Shift';
        return {
            custom: baseShiftLabel,
            type: primaryShift,
            time: `${start} - ${end}`
        };
    }
    
    return cell;
};

const isJornadaFullDayOff = (
    nurseId: string,
    date: Date,
    jornadas: JornadaLaboral[]
): boolean => {
    const activeJornada = getActiveJornada(nurseId, date, jornadas);
    if (!activeJornada || activeJornada.porcentaje !== 80) return false;

    const dayOfWeek = date.getUTCDay();

    if (activeJornada.reductionOption === 'FULL_DAY_OFF') {
        return dayOfWeek === activeJornada.reductionDayOfWeek;
    }

    if (activeJornada.reductionOption === 'FRIDAY_PLUS_EXTRA') {
        return dayOfWeek === 5;
    }

    return false;
};

export const recalculateScheduleForMonth = (nurses: Nurse[], date: Date, agenda: Agenda, manualOverrides: Schedule, vaccinationPeriod: { start: string; end: string } | null, strasbourgAssignments: Record<string, string[]>, jornadasLaborales: JornadaLaboral[], annualStatsBase?: Record<string, NurseStats>): Schedule => {
    const schedule: Schedule = {};
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    nurses.forEach(nurse => { schedule[nurse.id] = {}; });

    const nurseStats: Record<string, NurseStats> = {};
    nurses.forEach(nurse => { nurseStats[nurse.id] = { urgences: 0, travail: 0, admin: 0, tw: 0, clinicalTotal: 0, afternoon: 0, vaccin_am: 0, vaccin_pm: 0, tw_weekly: 0 }; });
    const weeklyStats: Record<string, Record<WorkZone, number>> = {};
    nurses.forEach(nurse => { weeklyStats[nurse.id] = {} as Record<WorkZone, number>; });
    
    // Track last assignment date for each shift type (for consecutiveness penalty)
    const lastAssignmentDate: Record<string, Record<WorkZone, number>> = {};
    nurses.forEach(nurse => { lastAssignmentDate[nurse.id] = {} as Record<WorkZone, number>; });
    
    // Track ADMIN+TW count per week (for new weekly distribution rule, April onwards)
    const weeklyAdminTWCount: Record<string, number> = {};
    nurses.forEach(nurse => { weeklyAdminTWCount[nurse.id] = 0; });
    
    const annualStats: Record<string, NurseStats> | undefined = annualStatsBase;
    
    // New weekly distribution rule for April onwards: track if we're applying coordinated ADMIN/TW
    const isApplyingWeeklyCoordination = year === 2026 && month >= 3;


    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month, day));
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = currentDate.getUTCDay();
        const weekId = getWeekIdentifier(currentDate);

        if (dayOfWeek === 1) { // Monday
            nurses.forEach(nurse => {
                nurseStats[nurse.id].tw_weekly = 0;
                weeklyStats[nurse.id] = {} as Record<WorkZone, number>;
                weeklyAdminTWCount[nurse.id] = 0; // Reset weekly ADMIN+TW count
            });
        }
        
        const activityLevel = agenda[weekId] || 'NORMAL';
        const isWorkday = !(dayOfWeek === 0 || dayOfWeek === 6 || holidays2026.has(dateKey) || activityLevel === 'CLOSED');

        if (isWorkday) {
            const dailyAssignments: Record<string, ScheduleCell> = {};
            let availableForDutyNurses = [...nurses];
            
            // Jornada full-day reductions (must be applied before coverage assignment)
            availableForDutyNurses.forEach(nurse => {
                if (isJornadaFullDayOff(nurse.id, currentDate, jornadasLaborales)) {
                    dailyAssignments[nurse.id] = { custom: `Red. 80%`, type: 'CA' };
                }
            });

            // System-determined assignments (Strasbourg is part of the system)
            availableForDutyNurses.forEach(nurse => {
                if (dailyAssignments[nurse.id]) return;
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
                // Intern logic: Present Oct-Feb. March starts new cycle.
                // Manual presence allowed Mar-Sep, then Oct starts new cycle.
                const isInternSeason = month >= 9 || month <= 1; // Oct (9) to Feb (1)
                
                // Check if intern is manually assigned in manualOverrides for this month
                const isManuallyPresent = Object.values(manualOverrides[intern.id] || {}).length > 0;
                
                if (isInternSeason || isManuallyPresent) {
                    // Calculate week of the current "cycle"
                    // Cycle 1: Oct - Feb (Starts in Oct)
                    // Cycle 2: Mar - Sep (Starts in Mar if manually added)
                    let cycleStartMonth = isInternSeason ? 9 : 2; // Oct or March
                    if (month < 9 && month > 1 && isManuallyPresent) cycleStartMonth = 2;
                    
                    // If we are in the Jan/Feb part of the Oct-Feb cycle, the cycle started last year
                    const cycleYear = (month <= 1) ? year - 1 : year;
                    const cycleStartDate = new Date(Date.UTC(cycleYear, cycleStartMonth, 1));
                    
                    // Calculate weeks since cycle start
                    const diffTime = Math.abs(currentDate.getTime() - cycleStartDate.getTime());
                    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
                    const weekOfCycle = (diffWeeks % 4) + 1; // 4-week rotation

                    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                        if (weekOfCycle === 1) dailyAssignments[intern.id] = 'ADMIN';
                        else if (weekOfCycle === 2) dailyAssignments[intern.id] = 'TRAVAIL';
                        else if (weekOfCycle === 3) dailyAssignments[intern.id] = 'URGENCES';
                        else dailyAssignments[intern.id] = 'TRAVAIL'; // Default for week 4
                        
                        internHandledByException = true;
                    }
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
                    const candidate = findBestCandidateWithWeeklyEquity(tempVaccinPool, nurseStats, weeklyStats, 'VACCIN_AM', 'vaccin_am', annualStats, day, lastAssignmentDate);
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
                        const candidate = findBestCandidateWithWeeklyEquity(eligiblePool, nurseStats, weeklyStats, shift as WorkZone, stat as keyof NurseStats, annualStats, day, lastAssignmentDate);
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
                
                // Contar enfermeros cubriendo turnos obligatorios
                const mandatoryShiftTypes = ['URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE'];
                const nursesOnMandatoryShifts = Object.values(dailyAssignments).filter(cell => {
                    const shifts = getShiftsFromCell(cell);
                    return shifts.some(s => mandatoryShiftTypes.includes(s));
                }).length;
                
                // Solo asignar ADMIN si ya hay 6+ enfermeros cubriendo turnos obligatorios
                const remainingNurses = clinicalPool.filter(n => !dailyAssignments[n.id] && n.id !== 'nurse-11');
                assignAdminAndTWToRemainingNurses(
                    remainingNurses,
                    dailyAssignments,
                    nursesOnMandatoryShifts,
                    nurseStats,
                    weeklyStats,
                    schedule,
                    previousDateKey,
                    annualStats,
                    isApplyingWeeklyCoordination ? weeklyAdminTWCount : undefined,
                    isApplyingWeeklyCoordination
                );

            } else {
                let neededShifts = getNeededShiftsInPriorityOrder(getClinicalNeedsForDay(currentDate, agenda, vaccinationPeriod));
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
                    const candidate = findBestCandidateWithWeeklyEquity(eligiblePool, nurseStats, weeklyStats, need, primaryStat as keyof NurseStats, annualStats, day, lastAssignmentDate);
                    if (candidate) { dailyAssignments[candidate.id] = need; localUnassignedPool = localUnassignedPool.filter(n => n.id !== candidate.id); }
                }
                
                // Contar enfermeros cubriendo turnos obligatorios
                const mandatoryShiftTypes = ['URGENCES', 'TRAVAIL', 'URGENCES_TARDE', 'TRAVAIL_TARDE'];
                const nursesOnMandatoryShifts = Object.values(dailyAssignments).filter(cell => {
                    const shifts = getShiftsFromCell(cell);
                    return shifts.some(s => mandatoryShiftTypes.includes(s));
                }).length;
                
                // Solo asignar ADMIN si ya hay 6+ enfermeros cubriendo turnos obligatorios
                const remainingNurses = localUnassignedPool.filter(n => !dailyAssignments[n.id] && n.id !== 'nurse-11');
                assignAdminAndTWToRemainingNurses(
                    remainingNurses,
                    dailyAssignments,
                    nursesOnMandatoryShifts,
                    nurseStats,
                    weeklyStats,
                    schedule,
                    previousDateKey,
                    annualStats,
                    isApplyingWeeklyCoordination ? weeklyAdminTWCount : undefined,
                    isApplyingWeeklyCoordination
                );
            }

            const mandatoryShiftNeeds = getClinicalNeedsForDay(currentDate, agenda, vaccinationPeriod);
            // Nueva regla: turnos de tarde tienen prioridad sobre mañana cuando faltan enfermeros
            const mandatoryShiftKeys: WorkZone[] = ['URGENCES_TARDE', 'TRAVAIL_TARDE', 'URGENCES', 'TRAVAIL'];

            mandatoryShiftKeys.forEach((mandatoryShift) => {
                const requiredCount = mandatoryShiftNeeds[mandatoryShift] || 0;
                if (requiredCount <= 0) return;

                let currentCount = Object.values(dailyAssignments).reduce((count, cell) => {
                    return count + (getShiftsFromCell(cell).includes(mandatoryShift) ? 1 : 0);
                }, 0);

                while (currentCount < requiredCount) {
                    const { candidateId, discardedCandidates } = pickReplacementCandidate(
                        Object.keys(dailyAssignments),
                        (nurseId) => dailyAssignments[nurseId],
                        mandatoryShift,
                        ineligibleForAfternoon,
                        new Set<string>()
                    );

                    if (!candidateId) {
                        logCoverageDiagnostic({
                            source: 'recalculateScheduleForMonth',
                            dateKey,
                            mandatoryShift,
                            requiredCount,
                            currentCount,
                            missingCount: requiredCount - currentCount,
                            discardedCandidates,
                        });
                        break;
                    }

                    dailyAssignments[candidateId] = mandatoryShift;
                    currentCount++;
                }

                if (currentCount < requiredCount) {
                    logCoverageDiagnostic({
                        source: 'recalculateScheduleForMonth',
                        dateKey,
                        mandatoryShift,
                        requiredCount,
                        currentCount,
                        missingCount: requiredCount - currentCount,
                        discardedCandidates: [],
                    });
                }
            });

            const internIsUnassigned = dutyPool.some(n => n.id === 'nurse-11') && !dailyAssignments['nurse-11'];
            if (internIsUnassigned) {
                const adminNurseId = Object.keys(dailyAssignments).find(id => getShiftsFromCell(dailyAssignments[id]).includes('ADMIN') && id !== 'nurse-1');
                if (adminNurseId) { dailyAssignments['nurse-11'] = 'TRAVAIL'; dailyAssignments[adminNurseId] = 'ADMIN'; } 
                else { dailyAssignments['nurse-11'] = 'TRAVAIL'; }
            }

            // Regla de negocio: se aplica en assignAdminAndTWToRemainingNurses (posición 7=ADMIN, 8=ADMIN, 9+=TW)
            // enforceAdminOverflowToTW(dailyAssignments, nurseStats, weeklyStats, schedule, previousDateKey);

            // Asegurar que TODOS los enfermeros tienen un turno asignado (solo ADMIN/TW)
            nurses.forEach(nurse => {
                if (!dailyAssignments[nurse.id]) {
                    const hasPrevAdminOrTW = getShiftsFromCell(schedule[nurse.id]?.[previousDateKey]).some(s => ['ADMIN', 'TW'].includes(s));
                    const canGetTW =
                        nurse.id !== 'nurse-1' &&
                        nurse.id !== 'nurse-2' &&
                        nurse.id !== 'nurse-11' &&
                        nurseStats[nurse.id].tw_weekly < 1 &&
                        !hasPrevAdminOrTW;
                    dailyAssignments[nurse.id] = canGetTW ? 'TW' : 'ADMIN';
                }
            });

            Object.entries(dailyAssignments).forEach(([nurseId, cell]) => {
                const nurse = nurses.find(n => n.id === nurseId)!;
                const modifiedCell = applyJornadaModification(cell, nurse, currentDate, jornadasLaborales, agenda);
                dailyAssignments[nurseId] = modifiedCell || cell;
            });

            Object.entries(dailyAssignments).forEach(([nurseId, cell]) => {
                schedule[nurseId][dateKey] = cell;
            });
        }
        // No special handling for non-workdays - let App.tsx apply manual overrides there too
        
        nurses.forEach(nurse => {
            const cell = schedule[nurse.id]?.[dateKey];
            if (!cell) return;
            const shifts = getShiftsFromCell(cell);
            shifts.forEach(shift => {
                 if (shift === 'URGENCES' || shift === 'URGENCES_C') nurseStats[nurse.id].urgences++;
                 if (shift === 'TRAVAIL' || shift === 'TRAVAIL_C') nurseStats[nurse.id].travail++;
                 if (shift.includes('_TARDE')) nurseStats[nurse.id].afternoon++;
                 if (shift === 'ADMIN') {
                     nurseStats[nurse.id].admin++;
                     if (isApplyingWeeklyCoordination) weeklyAdminTWCount[nurse.id]++;
                 }
                 if (shift === 'TW') {
                     nurseStats[nurse.id].tw++;
                     nurseStats[nurse.id].tw_weekly = (nurseStats[nurse.id].tw_weekly || 0) + 1;
                     if (isApplyingWeeklyCoordination) weeklyAdminTWCount[nurse.id]++;
                 }
                 if (shift === 'VACCIN' || shift === 'VACCIN_AM') nurseStats[nurse.id].vaccin_am++;
                 if (shift === 'VACCIN_PM') nurseStats[nurse.id].vaccin_pm++;
                 
                 weeklyStats[nurse.id][shift] = (weeklyStats[nurse.id][shift] || 0) + 1;
                 
                 // Track last assignment date for consecutiveness penalty
                 lastAssignmentDate[nurse.id][shift] = day;
            });
             if (shifts.length > 0 && !shifts.every(s => ['ADMIN', 'TW', 'CA', 'SICK_LEAVE', 'FP', 'RECUP', 'STRASBOURG', 'F'].includes(s))) { nurseStats[nurse.id].clinicalTotal++; }
        });
    }

    return schedule;
};

export const generateAndBalanceGaps = (
    nurses: Nurse[],
    year: number,
    agenda: Agenda,
    manualOverrides: Schedule,
    vaccinationPeriod: { start: string; end: string } | null,
    strasbourgAssignments: Record<string, string[]>,
    jornadasLaborales: JornadaLaboral[],
    specialStrasbourgEvents: SpecialStrasbourgEvent[]
): Schedule => {
    const generatedGaps: Schedule = {};
    const fullSchedule: Schedule = JSON.parse(JSON.stringify(manualOverrides));

    const generationStats: Record<string, NurseStats> = {};
    nurses.forEach(nurse => { 
        generationStats[nurse.id] = { urgences: 0, travail: 0, admin: 0, tw: 0, clinicalTotal: 0, afternoon: 0, vaccin_am: 0, vaccin_pm: 0, tw_weekly: 0 }; 
    });

    const weeklyStats: Record<string, Record<WorkZone, number>> = {};
    nurses.forEach(nurse => { weeklyStats[nurse.id] = {} as Record<WorkZone, number>; });
    
    // Track last assignment date for consecutiveness penalty
    const lastAssignmentDate: Record<string, Record<WorkZone, number>> = {};
    nurses.forEach(nurse => { lastAssignmentDate[nurse.id] = {} as Record<WorkZone, number>; });
    
    // TODO: Load annual stats from AppState/Firebase (for now, undefined = no annual equity yet)
    const annualStats: Record<string, NurseStats> | undefined = undefined;

    for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
        const currentDate = new Date(d);
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getUTCDay();
        const dayOfMonth = currentDate.getUTCDate();

        if (dayOfWeek === 1) { 
            nurses.forEach(nurse => {
                generationStats[nurse.id].tw_weekly = 0;
                weeklyStats[nurse.id] = {} as Record<WorkZone, number>;
            });
        }
        
        const weekId = getWeekIdentifier(currentDate);
        const activityLevel = agenda[weekId] || 'NORMAL';
        const isWorkday = !(dayOfWeek === 0 || dayOfWeek === 6 || holidays2026.has(dateKey) || activityLevel === 'CLOSED');

        const dailyAssignments: Record<string, ScheduleCell> = {};

                if (isWorkday) {
            nurses.forEach(nurse => {
                // Si hay un turno manual, respetarlo y no generar automático
                if (manualOverrides[nurse.id]?.[dateKey]) {
                    dailyAssignments[nurse.id] = manualOverrides[nurse.id][dateKey];
                    return;
                }
                
                if (fullSchedule[nurse.id]?.[dateKey]) {
                    dailyAssignments[nurse.id] = fullSchedule[nurse.id][dateKey];
                }
            });

            nurses.forEach(nurse => {
                if (dailyAssignments[nurse.id]) return;
                if (isJornadaFullDayOff(nurse.id, currentDate, jornadasLaborales)) {
                    dailyAssignments[nurse.id] = { custom: `Red. 80%`, type: 'CA' };
                }
            });

            let dutyPool = nurses.filter(n => !dailyAssignments[n.id]);

            if (dutyPool.length > 0) {
                let neededShifts = getNeededShiftsInPriorityOrder(getClinicalNeedsForDay(currentDate, agenda, vaccinationPeriod));
                
                Object.values(dailyAssignments).forEach(cell => {
                    getShiftsFromCell(cell).forEach(shift => {
                        const index = neededShifts.indexOf(shift);
                        if (index > -1) neededShifts.splice(index, 1);
                    });
                });

                for (const need of neededShifts) {
                    const primaryStat = need.includes('URGENCES') ? 'urgences' : 'travail';
                    const candidate = findBestCandidateWithWeeklyEquity(dutyPool, generationStats, weeklyStats, need, primaryStat as keyof NurseStats, annualStats, dayOfMonth, lastAssignmentDate);
                    if (candidate) { 
                        dailyAssignments[candidate.id] = need;
                        if (!generatedGaps[candidate.id]) generatedGaps[candidate.id] = {};
                        generatedGaps[candidate.id][dateKey] = need;
                        dutyPool = dutyPool.filter(n => n.id !== candidate.id);
                    }
                }
                
                dutyPool.forEach(nurse => {
                    if (!dailyAssignments[nurse.id]) {
                        dailyAssignments[nurse.id] = 'ADMIN';
                         if (!generatedGaps[nurse.id]) generatedGaps[nurse.id] = {};
                         generatedGaps[nurse.id][dateKey] = 'ADMIN';
                    }
                });
            }
        }
        
        Object.entries(dailyAssignments).forEach(([nurseId, cell]) => {
            if (!cell) return;
            const shifts = getShiftsFromCell(cell);
            shifts.forEach(shift => {
                 if (shift === 'URGENCES' || shift === 'URGENCES_C') generationStats[nurseId].urgences++;
                 if (shift === 'TRAVAIL' || shift === 'TRAVAIL_C') generationStats[nurseId].travail++;
                 if (shift.includes('_TARDE')) generationStats[nurseId].afternoon++;
                 if (shift === 'ADMIN') generationStats[nurseId].admin++;
                 if (shift === 'TW') { generationStats[nurseId].tw++; generationStats[nurseId].tw_weekly = (generationStats[nurseId].tw_weekly || 0) + 1; }
                 
                 weeklyStats[nurseId][shift] = (weeklyStats[nurseId][shift] || 0) + 1;
                 
                 // Track last assignment date for consecutiveness penalty
                 lastAssignmentDate[nurseId][shift] = dayOfMonth;
            });
             if (shifts.length > 0 && !shifts.every(s => ['ADMIN', 'TW', 'CA', 'SICK_LEAVE', 'FP', 'RECUP', 'STRASBOURG', 'F'].includes(s))) { generationStats[nurseId].clinicalTotal++; }
        });
    }

    return generatedGaps;
};