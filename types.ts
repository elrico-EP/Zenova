
export interface User {
  id: string; 
  name: string;
  email: string;
  role: UserRole;
  isTestUserMode?: boolean;
  impersonatedNurse?: Nurse | null;
}

export type ActivityLevel = 'NORMAL' | 'SESSION' | 'WHITE_GREEN' | 'REDUCED' | 'CLOSED';

export type WorkZone = 
  | 'URGENCES' 
  | 'TRAVAIL' 
  | 'URGENCES_TARDE'
  | 'TRAVAIL_TARDE'
  | 'ADMIN' 
  | 'TW' 
  | 'F' 
  | 'STRASBOURG' 
  | 'LIBERO'
  | 'RECUP'
  | 'FP'
  | 'SICK_LEAVE'
  | 'CA'
  | 'VACCIN'
  | 'VACCIN_AM'
  | 'VACCIN_PM'
  | 'TRAVAIL_C'  // Complemento clínico corto
  | 'URGENCES_C'; // Complemento clínico corto

export interface Shift {
  id: WorkZone;
  label: string;
  description: string;
  color: string;
  textColor: string;
}

export interface Nurse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  order: number;
}

export type UserRole = 'admin' | 'nurse';

export interface CustomShift {
  custom: string;
  type?: WorkZone; 
  time?: string; 
}

export type ScheduleCell = WorkZone | CustomShift | { split: [WorkZone | CustomShift, WorkZone | CustomShift] };

export interface Schedule {
  [nurseId: string]: {
    [dateKey: string]: ScheduleCell; // dateKey is 'YYYY-MM-DD'
  };
}

export type RuleViolation = {
  nurseId: string;
  message: string;
  severity: 'warning' | 'error';
  dateKey?: string; // 'YYYY-MM-DD'
  weekId?: string;
}

export type Agenda = {
  [weekIdentifier: string]: ActivityLevel; // e.g., '2024-W34'
};

export interface DailyNote {
  text: string;
  color: string;
}

export interface Notes {
  [dateKey: string]: DailyNote; // dateKey is 'YYYY-MM-DD'
}

export interface NurseStats {
    urgences: number;
    travail: number;
    admin: number;
    tw: number;
    clinicalTotal: number;
    afternoon: number;
    vaccin_am: number;
    vaccin_pm: number;
    tw_weekly: number;
}

export interface TimeSegment {
  startTime: string;
  endTime: string;
}

export interface DailyHours {
  calculated: number;
  manual?: number;
  note?: string; 
  segments?: TimeSegment[];
}

export interface Hours {
  [nurseId: string]: {
      [dateKey: string]: DailyHours;
  };
}

export type ChangeScope = 'single' | 'all_nurses_day' | 'all_nurses_from_day';

export type ManualChangePayload = {
    nurseIds: string[];
    shift: ScheduleCell | 'DELETE';
    startDate: string;
    endDate: string;
    scope: ChangeScope;
    startTime?: string;
    endTime?: string;
};

export type PersonalHoursChangePayload = {
  nurseId: string;
  dateKey: string;
  segments: TimeSegment[];
  reason?: string;
};

export type SwapRequest = {
  nurse1Id: string;
  nurse2Id: string;
  startDate: string;
  endDate: string;
};

export interface SwapInfo {
  shownShift: ScheduleCell;
  swappedWithNurseId: string;
  originalShift: ScheduleCell;
}

export interface StrasbourgEvent {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    nurseId: string;
    time?: string;
}

export interface SpecialStrasbourgEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  nurseIds: string[];
  notes?: string;
  startTime?: string;
  endTime?: string;
}

export interface ShiftCounts {
    TRAVAIL: number;
    TRAVAIL_TARDE: number;
    URGENCES: number;
    URGENCES_TARDE: number;
    ADMIN: number;
    TW: number;
    CA: number;
    FP: number;
    SICK_LEAVE: number;
    STRASBOURG: number;
    LIBERO: number;
    VACCIN: number;
    VACCIN_AM: number;
    VACCIN_PM: number;
}

export interface BalanceData {
    nurseId: string;
    monthlyCounts: ShiftCounts;
    annualCounts: ShiftCounts;
    monthlyTotalWorkDays: number;
    annualTotalWorkDays: number;
    monthlyTotalHours: number;
    annualTotalHours: number;
    monthlyTargetHours: number;
    annualTargetHours: number;
    monthlyBalance: number;
    annualBalance: number;
    hasConsecutiveAdmTw: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Wish {
  text: string;
  validated: boolean;
}

export interface Wishes {
  [nurseId: string]: {
    [dateKey: string]: Wish;
  };
}

export interface ShiftRotation {
  id: string;
  name: string;
  shifts: ScheduleCell[];
}

export interface ShiftRotationAssignment {
  id: string;
  rotationId: string;
  nurseIds: string[];
  startDate: string; // YYYY-MM-DD
}

export type ReductionOption = 'FULL_DAY_OFF' | 'START_SHIFT_4H' | 'END_SHIFT_4H' | 'LEAVE_EARLY_1H_L_J' | 'FRIDAY_PLUS_EXTRA';

export type ReductionMode = "DAY_OFF" | "HOURS_PER_DAY" | "FIXED_DAY" | "TIME_BLOCK";

export interface JornadaLaboral {
    id: string;
    nurseId: string;
    porcentaje: 80 | 90 | 100;
    fechaInicio: string; // YYYY-MM-DD
    fechaFin?: string; // YYYY-MM-DD
    reductionOption?: ReductionOption;
    reductionDayOfWeek?: 1 | 2 | 3 | 4 | 5; // Monday=1, ..., Friday=5
    secondaryReductionDayOfWeek?: 1 | 2 | 3 | 4; // For 80% Friday rule
}