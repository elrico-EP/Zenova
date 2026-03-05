import type { JornadaLaboral } from '../types';

interface GetExpectedHoursForDayParams {
  /** The specific date for which to calculate the hours. */
  date: Date;
  /** The base theoretical hours for a full-time contract on that day. */
  baseDailyHours: number;
  /** The active work period for the nurse on that day, if any. */
  workPeriod: JornadaLaboral | null;
}

export const getExpectedHoursForDay = ({
  date,
  baseDailyHours,
  workPeriod,
}: GetExpectedHoursForDayParams): number => {
  if (!workPeriod || workPeriod.porcentaje === 100) {
    return baseDailyHours;
  }

  const dayOfWeek = date.getUTCDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6
  const isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;
  const isFriday = dayOfWeek === 5;

  if (workPeriod.porcentaje === 90) {
    switch (workPeriod.reductionOption) {
      case 'LEAVE_EARLY_1H_L_J':
        return isMonToThu ? Math.max(0, baseDailyHours - 1) : baseDailyHours;
      
      case 'START_SHIFT_4H':
      case 'END_SHIFT_4H':
        if (isMonToThu && dayOfWeek === workPeriod.reductionDayOfWeek) {
          return Math.max(0, baseDailyHours - 3);
        }
        return baseDailyHours;
        
      default:
        return baseDailyHours;
    }
  }

  if (workPeriod.porcentaje === 80) {
    switch (workPeriod.reductionOption) {
      case 'FULL_DAY_OFF':
        if (isMonToThu && dayOfWeek === workPeriod.reductionDayOfWeek) {
          return 0;
        }
        return baseDailyHours;

      case 'FRIDAY_PLUS_EXTRA':
        if (isFriday) {
          return 0;
        }
        if (isMonToThu && dayOfWeek === workPeriod.secondaryReductionDayOfWeek) {
          return Math.max(0, baseDailyHours - 1.5);
        }
        return baseDailyHours;
        
      default:
        return baseDailyHours;
    }
  }
  
  return baseDailyHours;
};