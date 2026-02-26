export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'viewer' | 'nurse';
  mustChangePassword?: boolean;  // camelCase en TypeScript
  nurseId?: string | null;       // camelCase en TypeScript
}

export type ActivityLevel = 'NORMAL' | 'SESSION' | 'WHITE_GREEN' | 'REDUCED' | 'CLOSED';

export type WorkZone = 
  | 'URGENCES' 
  | 'TRAVAIL' 
  | 'URGENCES_TARDE'
  | 'TRAVAIL_TARDE'
  | 'ADMIN' 
  | 'ADM_TARDE'
  | 'TW' 
  | 'TW_ABROAD'
  | 'F' 
  | 'STRASBOURG' 
  | 'LIBERO'
  | 'RECUP'
  | 'FP'
  | 'CS'
  | 'SICK_LEAVE'
  | 'CA'
  | 'VACCIN'
  | 'VACCIN_AM'
  | 'VACCIN_PM'
  | 'VACCIN_PM_PLUS'
  | 'URGENCES_TARDE_PLUS'
  | 'TRAVAIL_TARDE_PLUS'
  | 'ADM_TARDE_PLUS'
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
  password?: string;
  order: number;
  mustChangePassword?: boolean;
  passwordResetRequired?: boolean;
}

export type UserRole = 'admin' | 'nurse' | 'viewer';

export interface CustomShift {
  custom: string;
  type?: WorkZone; 
  time?: string; 
  manualSplit?: boolean;
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

export interface ManualChangeLogEntry {
  id: string;
  timestamp: string;
  user: string;
  nurseId: string;
  dateKey: string;
  originalShift: ScheduleCell | undefined;
  newShift: ScheduleCell | 'DELETE';
}

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

export interface StrasbourgEvent {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    nurseId: string;
    time?: string;
}

export type SpecialStrasbourgEventType = 'euroscola' | 'tuesday_permanence' | 'wednesday_permanence' | 'other';

export interface SpecialStrasbourgEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  nurseIds: string[];
  notes?: string;
  startTime?: string;
  endTime?: string;
  type?: SpecialStrasbourgEventType;
}

export interface ShiftCounts {
    TRAVAIL: number;
    TRAVAIL_TARDE: number;
    URGENCES: number;
    URGENCES_TARDE: number;
    ADMIN: number;
    ADM_TARDE: number;
    TW: number;
    TW_ABROAD: number;
    CA: number;
    FP: number;
    CS: number;
    RECUP: number;
    SICK_LEAVE: number;
    STRASBOURG: number;
    LIBERO: number;
    VACCIN: number;
    VACCIN_AM: number;
    VACCIN_PM: number;
    VACCIN_PM_PLUS: number;
    URGENCES_TARDE_PLUS: number;
    TRAVAIL_TARDE_PLUS: number;
    ADM_TARDE_PLUS: number;
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

export interface Wish {
  text: string;
  validated: boolean;
  shiftType?: WorkZone;
}

export interface Wishes {
  [nurseId: string]: {
    [dateKey: string]: Wish;
  };
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

// FIX: Add missing ShiftRotation and ShiftRotationAssignment type definitions.
export interface ShiftRotation {
  id: string;
  name: string;
  shifts: ScheduleCell[];
}

export interface ShiftRotationAssignment {
  id: string;
  rotationId: string;
  nurseIds: string[];
  startDate: string;
}

export interface AppState {
    nurses: Nurse[];
    agenda: Agenda;
    manualOverrides: Schedule;
    notes: Notes;
    vaccinationPeriod: { start: string; end: string } | null;
    strasbourgAssignments: Record<string, string[]>;
    strasbourgEvents: StrasbourgEvent[];
    specialStrasbourgEvents: SpecialStrasbourgEvent[];
    closedMonths: Record<string, boolean>;
    wishes: Wishes;
    jornadasLaborales: JornadaLaboral[];
    manualChangeLog: ManualChangeLogEntry[];
    specialStrasbourgEventsLog: HistoryEntry[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// FIX: Add missing SwapInfo type definition.
export interface SwapInfo {
  shownShift: ScheduleCell;
  swappedWithNurseId: string;
  originalShift: ScheduleCell;
}
