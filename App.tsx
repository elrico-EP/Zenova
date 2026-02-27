
import React, { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { ScheduleGrid, BASE_CELL_WIDTH, DAY_COL_WIDTH, PRESENT_COL_WIDTH, NOTES_COL_WIDTH } from './components/ScheduleGrid';
import { Header } from './components/Header';
import { PersonalAgendaModal } from './components/PersonalAgendaModal';
import { AgendaPlanner } from './components/AgendaPlanner';
import { ZoomControls } from './components/ZoomControls';
import { Sidebar } from './components/Sidebar';
import { BalancePage } from './components/BalancePage';
import { WishesPage } from './components/WishesPage';
import { HelpModal } from './components/HelpModal';
import { HistoryModal } from './components/HistoryModal';
import { JornadaLaboralManager } from './components/JornadaLaboralManager';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementPage } from './components/UserManagementPage';
import { ProfilePage } from './components/ProfilePage';
import { ForceChangePasswordScreen } from './components/ForceChangePasswordScreen';
import type { User, Schedule, Nurse, WorkZone, RuleViolation, Agenda, ScheduleCell, Notes, Hours, ManualChangePayload, ManualChangeLogEntry, StrasbourgEvent, BalanceData, ShiftCounts, HistoryEntry, CustomShift, Wishes, PersonalHoursChangePayload, JornadaLaboral, SpecialStrasbourgEvent, AppState } from './types';
import { UndoIcon } from './components/Icons';
import { SHIFTS, INITIAL_NURSES } from './constants';
import { recalculateScheduleForMonth, getShiftsFromCell, generateAndBalanceGaps } from './utils/scheduleUtils';
import { calculateHoursForMonth, calculateHoursForDay, calculateHoursDifference } from './utils/hoursUtils';
import { getActiveJornada } from './utils/jornadaUtils';
import { generateAndDownloadPdf, generateAnnualAgendaPdf } from './utils/exportUtils';
import { getWeekIdentifier } from './utils/dateUtils';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026, holidays2026 } from './data/agenda2026';
import { useLanguage } from './contexts/LanguageContext';
import { useUser, UserProvider } from './contexts/UserContext';
import { NurseProvider, useNurses } from './contexts/NurseContext';
import { useTranslations } from './hooks/useTranslations';
import { usePermissions } from './hooks/usePermissions';
import { SwapShiftPanel } from './components/SwapShiftModal';
import { WorkConditionsBar } from './components/WorkConditionsBar';
import { AnnualPlannerModal } from './components/AnnualPlannerModal';
import { ManualHoursModal } from './components/ManualHoursModal';
import { MaximizeIcon, RestoreIcon } from './components/Icons';
import { useSupabaseState } from './hooks/useSupabaseState'

const AppContent: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-01T12:00:00'));
  const { user, effectiveUser, isLoading: isAuthLoading } = useUser();
  const { nurses, setMonth } = useNurses();

  const [localNurses, setLocalNurses] = useState<Nurse[]>([]);
  const [isEditingNurses, setIsEditingNurses] = useState(false);

  useEffect(() => {
    setMonth(currentDate.getMonth());
  }, [currentDate, setMonth]);
  // Guardar usuario para no tener que loguearme cada vez
  useEffect(() => {
    if (user) {
        localStorage.setItem('zenova_user', JSON.stringify(user));
        console.log('✅ Usuario guardado');
    }
  }, [user]);

  // Restaurar usuario al cargar la página
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('zenova_user');
    if (usuarioGuardado) {
        console.log('🔄 Restaurando usuario...');
        // No hacemos nada más aquí, solo verificamos que existe
    }
  }, []);
  const permissions = usePermissions();
  const { data: sharedData, loading: isStateLoading, updateData } = useSupabaseState();
  
  // Debug: Log when sharedData changes
  useEffect(() => {
    if (sharedData) {
      console.log('📦 sharedData actualizado. Hours:', sharedData.hours ? Object.keys(sharedData.hours).length : 0, 'enfermeros');
    }
  }, [sharedData]);
  
  // UI State remains local
  const [view, setView] = useState<'schedule' | 'balance' | 'wishes' | 'userManagement' | 'profile'>('schedule');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<AppState[]>([]);
  const [selectedNurseForAgenda, setSelectedNurseForAgenda] = useState<Nurse | null>(null);
  const [isJornadaManagerOpen, setIsJornadaManagerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.4);
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const [swapPanelConfig, setSwapPanelConfig] = useState({ isOpen: false, initialDate: '', initialNurseId: '' });
  const [manualHoursModalConfig, setManualHoursModalConfig] = useState<{ isOpen: boolean; nurse: Nurse | null; dateKey: string; }>({ isOpen: false, nurse: null, dateKey: '' });
  const [isAnnualPlannerOpen, setIsAnnualPlannerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [showFullscreenToast, setShowFullscreenToast] = useState(false);

  // State derived from shared state now
  // Mantener nurses localmente si hay cambios pendientes, sino usar Supabase
  useEffect(() => {
    const newNursesSource = sharedData?.nurses && sharedData.nurses.length > 0 ? sharedData.nurses : nurses;
    
    if (!isEditingNurses) {
      setLocalNurses(currentLocalNurses => {
        // Deep comparison to prevent infinite loops from object recreation
        if (JSON.stringify(currentLocalNurses) !== JSON.stringify(newNursesSource)) {
          return newNursesSource;
        }
        return currentLocalNurses;
      });
    }
  }, [sharedData?.nurses, nurses, isEditingNurses]);

  const agenda = sharedData?.agenda ?? {};
  // Extraer manualOverrides de Supabase
  const manualOverrides = sharedData?.manualOverrides || {}
  const notes = sharedData?.notes ?? {};
  const vaccinationPeriod = sharedData?.vaccinationPeriod ?? null;
  const strasbourgAssignments = sharedData?.strasbourgAssignments ?? {};
  const strasbourgEvents = sharedData?.strasbourgEvents ?? [];
  const specialStrasbourgEvents = sharedData?.specialStrasbourgEvents ?? [];
  const specialStrasbourgEventsLog = sharedData?.specialStrasbourgEventsLog ?? [];
  const closedMonths = sharedData?.closedMonths ?? {};
  const wishes = sharedData?.wishes ?? {};
  const jornadasLaborales = sharedData?.jornadasLaborales ?? [];
  const manualChangeLog = sharedData?.manualChangeLog ?? [];
  
  // Hours comes from Supabase now (for manual overrides) and gets merged with calculated hours
  const [localHours, setLocalHours] = useState<Hours>({});
  const savedHours = sharedData?.hours ?? {};
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const { language } = useLanguage();
  const t = useTranslations();

  useEffect(() => {
    try {
        const storedHistory = localStorage.getItem('nursingAppChangeHistory');
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    } catch (error) {
        console.error("Failed to load history from localStorage:", error);
        setHistory([]);
    }
  }, []);
  
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    try {
        localStorage.removeItem('nursingAppChangeHistory');
    } catch (error) {
        console.error("Failed to clear history from localStorage:", error);
    }
  }, []);

  const handleDeleteHistoryEntry = useCallback((id: string) => {
    setHistory(prev => {
        const updated = prev.filter(e => e.id !== id);
        try {
            localStorage.setItem('nursingAppChangeHistory', JSON.stringify(updated));
        } catch (error) {
            console.error("Failed to update history in localStorage:", error);
        }
        return updated;
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            setShowFullscreenToast(true);
        }).catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
        const isFs = !!document.fullscreenElement;
        setIsFullscreen(isFs);
        if (!isFs) {
            setShowFullscreenToast(false);
        }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  
  useEffect(() => {
      if (showFullscreenToast) {
          const timer = setTimeout(() => {
              setShowFullscreenToast(false);
          }, 4000);
          return () => clearTimeout(timer);
      }
  }, [showFullscreenToast]);
  
  const year = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const monthKey = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isMonthClosed = !!closedMonths[monthKey];

  const effectiveAgenda = useMemo(() => (year === 2026 ? agenda2026Data : agenda), [year, agenda]);
  const [schedule, setSchedule] = useState<Schedule>({});
  
  useEffect(() => {
    const allowedViews: Array<'schedule' | 'balance' | 'wishes' | 'userManagement' | 'profile'> = permissions.isViewingAsViewer ? ['schedule'] : ['schedule', 'wishes', 'profile', 'balance', 'userManagement'];
    if (!allowedViews.includes(view)) {
      setView('schedule');
    }
  }, [effectiveUser, view, permissions.isViewingAsViewer]);



  // Base overrides (only fixed events, NO manual changes) for the "Original Planning"
  const baseOverrides = useMemo(() => {
    const merged: Schedule = {};
    specialStrasbourgEvents.forEach(event => {
        if (!event.startDate || !event.endDate || !event.nurseIds) return;
        for (let d = new Date(event.startDate); d <= new Date(event.endDate); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            event.nurseIds.forEach(nurseId => {
                if (!merged[nurseId]) merged[nurseId] = {};
                const timeString = event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : undefined;
                merged[nurseId][dateKey] = { custom: event.name, type: 'STRASBOURG', time: timeString };
            });
        }
    });
    return merged;
  }, [specialStrasbourgEvents]);

  // Combined overrides WITH manual changes for the "Current Planning"
  const combinedOverrides = useMemo(() => {
    const merged: Schedule = JSON.parse(JSON.stringify(manualOverrides));
    specialStrasbourgEvents.forEach(event => {
        if (!event.startDate || !event.endDate || !event.nurseIds) return;
        for (let d = new Date(event.startDate); d <= new Date(event.endDate); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            event.nurseIds.forEach(nurseId => {
                if (!merged[nurseId]) merged[nurseId] = {};
                const timeString = event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : undefined;
                merged[nurseId][dateKey] = { custom: event.name, type: 'STRASBOURG', time: timeString };
            });
        }
    });
    return merged;
  }, [manualOverrides, specialStrasbourgEvents, sharedData]);

  const { fullOriginalSchedule, fullCurrentSchedule } = useMemo(() => {
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    const dates = [prevMonthDate, currentDate, nextMonthDate];
    const originalSchedules: Schedule[] = [];
    const currentSchedules: Schedule[] = [];

    dates.forEach(date => {
        const month = date.getMonth();
        const isInternActive = month >= 9 || month <= 1;
        const nursesForDate = isInternActive ? nurses : nurses.filter(n => n.id !== 'nurse-11');

        originalSchedules.push(recalculateScheduleForMonth(nursesForDate, date, effectiveAgenda, baseOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales));
        currentSchedules.push(recalculateScheduleForMonth(nursesForDate, date, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales));
    });
    
    const mergeSchedules = (schedules: Schedule[]): Schedule => {
        const merged: Schedule = {};
        schedules.forEach(sch => {
            for (const nurseId in sch) {
                if (!merged[nurseId]) merged[nurseId] = {};
                Object.assign(merged[nurseId], sch[nurseId]);
            }
        });
        return merged;
    };
    
    return {
        fullOriginalSchedule: mergeSchedules(originalSchedules),
        fullCurrentSchedule: mergeSchedules(currentSchedules)
    };
}, [nurses, currentDate, effectiveAgenda, baseOverrides, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales]);
  
  const currentSchedule = useMemo(() => {
    return recalculateScheduleForMonth(nurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
  }, [nurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales]);

  // Forzar recálculo cuando cambian los datos de Supabase
useEffect(() => {
    if (sharedData?.manualOverrides) {
        console.log('✅ Datos de Supabase listos (una sola vez)')
    }
}, [sharedData?.manualOverrides]) // <-- Solo esta dependencia, no todo sharedData
  
 useEffect(() => {
    setSchedule(prevSchedule => {
      if (JSON.stringify(prevSchedule) !== JSON.stringify(currentSchedule)) {
        return currentSchedule;
      }
      return prevSchedule;
    });
}, [currentSchedule]);

  useEffect(() => {
    console.log('🔄 Recalculando horas (savedHours cambió):', Object.keys(savedHours).length, 'enfermeros con datos');
    const calculatedHoursForMonth = calculateHoursForMonth(nurses, currentDate, effectiveAgenda, schedule, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales);
    const newHoursState = JSON.parse(JSON.stringify(calculatedHoursForMonth));
    
    // Merge with manual hours from Supabase
    for (const nurseId in newHoursState) {
        if (nurses.some(n => n.id === nurseId)) {
            for (const dateKey in newHoursState[nurseId]) {
                // Prefer saved manual hours from Supabase
                if (savedHours[nurseId]?.[dateKey]) {
                    const manualData = savedHours[nurseId][dateKey];
                    // If there's a manual value, use it instead of calculated
                    if (manualData.manual !== undefined) {
                        newHoursState[nurseId][dateKey].manual = manualData.manual;
                    }
                    if (manualData.segments) {
                        newHoursState[nurseId][dateKey].segments = manualData.segments;
                    }
                    if (manualData.note) {
                        newHoursState[nurseId][dateKey].note = manualData.note;
                    }
                }
            }
        }
    }
    
    setLocalHours(newHoursState);
  }, [nurses, schedule, currentDate, effectiveAgenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales, savedHours]);

  // Use localHours as the final hours state (already merged with savedHours)
  const hours = localHours;

  const balanceData = useMemo<BalanceData[]>(() => {
    // Optimization: Only calculate balance data if we are in the balance view or a personal agenda is open
    if (view !== 'balance' && !selectedNurseForAgenda) return [];
    
    if (nurses.length === 0) return [];
    const annualSchedules: { [month: number]: Schedule } = {};
    for (let m = 0; m < 12; m++) {
      annualSchedules[m] = recalculateScheduleForMonth(nurses, new Date(year, m, 1), effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
    }
    return nurses.map(nurse => {
      const emptyCounts = (): ShiftCounts => ({ 
        TRAVAIL: 0, TRAVAIL_TARDE: 0, URGENCES: 0, URGENCES_TARDE: 0, 
        ADMIN: 0, ADM_PLUS: 0, TW: 0, TW_ABROAD: 0, CA: 0, FP: 0, 
        CS: 0, RECUP: 0, SICK_LEAVE: 0, STRASBOURG: 0, LIBERO: 0, 
        VACCIN: 0, VACCIN_AM: 0, VACCIN_PM: 0, VACCIN_PM_PLUS: 0,
        URGENCES_TARDE_PLUS: 0, TRAVAIL_TARDE_PLUS: 0
      });
      const annualCounts = emptyCounts();
      const monthlyCounts = emptyCounts();
      let annualWorkedHours = 0;
      let monthlyWorkedHours = 0;
      let annualTotalWorkDays = 0;
      let monthlyTotalWorkDays = 0;
      const currentMonthIndex = currentDate.getMonth();

      for (let m = 0; m < 12; m++) {
        const monthSchedule = annualSchedules[m];
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(Date.UTC(year, m, day));
          const dateKey = date.toISOString().split('T')[0];
          const cell = monthSchedule[nurse.id]?.[dateKey];
          const shifts = getShiftsFromCell(cell);
          const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
          let dailyWorkedHours = calculateHoursForDay(nurse, cell, date, effectiveAgenda, strasbourgAssignments, specialEvent, jornadasLaborales) || 0;
          annualWorkedHours += dailyWorkedHours;
          shifts.forEach(s => { if (s in annualCounts) annualCounts[s as keyof ShiftCounts]++; });
          if (shifts.length > 0 && !shifts.includes('CA')) { annualTotalWorkDays++; }
          if (m === currentMonthIndex) {
            monthlyWorkedHours += dailyWorkedHours;
            shifts.forEach(s => { if (s in monthlyCounts) monthlyCounts[s as keyof ShiftCounts]++; });
             if (shifts.length > 0 && !shifts.includes('CA')) { monthlyTotalWorkDays++; }
          }
        }
      }
      return {
        nurseId: nurse.id, monthlyCounts, annualCounts, monthlyTotalWorkDays, annualTotalWorkDays,
        monthlyTotalHours: monthlyWorkedHours, annualTotalHours: annualWorkedHours,
        monthlyTargetHours: 0, annualTargetHours: 0, monthlyBalance: monthlyWorkedHours, annualBalance: annualWorkedHours, hasConsecutiveAdmTw: false,
      };
    });
  }, [nurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, year, jornadasLaborales, specialStrasbourgEvents, view, selectedNurseForAgenda]);
  
  const updateDataWithUndo = useCallback(async (updates: Partial<AppState>) => {
      if (sharedData) {
          setUndoStack(prev => [sharedData, ...prev].slice(0, 10));
          await updateData(updates);
      }
  }, [sharedData, updateData]);

  const handleUndo = useCallback(async () => {
      if (undoStack.length > 0) {
          const prevState = undoStack[0];
          setUndoStack(prev => prev.slice(1));
          await updateData(prevState);
      }
  }, [undoStack, updateData]);

  const addHistoryEntry = useCallback((action: string, details: string) => {
    if (!user) return;
    
    const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: user.name,
        action,
        details,
    };
    
    setHistory(prevHistory => {
        const updatedHistory = [newEntry, ...prevHistory].slice(0, 100);
        try {
            localStorage.setItem('nursingAppChangeHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage:", error);
        }
        return updatedHistory;
    });
  }, [user]);

  const handleClearGlobalHistory = useCallback(() => {
    const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: user?.name || 'Admin',
        action: t.history_clear_log,
        details: t.history_clear_log_details,
    };
    const clearedHistory = [newEntry];
    setHistory(clearedHistory);
    try {
        localStorage.setItem('nursingAppChangeHistory', JSON.stringify(clearedHistory));
    } catch (error) {
        console.error("Failed to save cleared history to localStorage:", error);
    }
  }, [user, t]);

  const handleManualChange = useCallback(async (payload: ManualChangePayload) => {
    const { nurseIds, startDate, endDate } = payload;
    let details = `Applied shift to ${nurseIds.length} nurse(s) from ${startDate} to ${endDate}`;
    if (nurseIds.length === 1) {
        const nurseName = nurses.find(n => n.id === nurseIds[0])?.name || 'Unknown';
        details = `Changed shift for ${nurseName} from ${startDate} to ${endDate}`;
    }
    addHistoryEntry(t.history_manualChange, details);
    
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    const newLog: ManualChangeLogEntry[] = [...(manualChangeLog ?? [])];

    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        for (const nurseId of nurseIds) {
            const originalCellForLog = currentSchedule[nurseId]?.[dateKey];
            if (!newOverrides[nurseId]) newOverrides[nurseId] = {};
            const existingCell = newOverrides[nurseId][dateKey];
            if (JSON.stringify(existingCell) === JSON.stringify(payload.shift)) continue;
            
            if (payload.shift === 'DELETE') {
                delete newOverrides[nurseId][dateKey];
            } else {
                newOverrides[nurseId][dateKey] = payload.shift;
            }
            
            newLog.push({
                id: `log-${Date.now()}-${nurseId}-${dateKey}`,
                timestamp: new Date().toISOString(),
                user: user?.name || 'System',
                nurseId: nurseId,
                dateKey: dateKey,
                originalShift: originalCellForLog,
                newShift: payload.shift,
            });
        }
    }
    
       await updateDataWithUndo({ manualOverrides: newOverrides, manualChangeLog: newLog });
    // Ya no recargamos, los cambios se ven en tiempo real
    console.log('✅ Cambios guardados, se verán automáticamente')
  }, [manualOverrides, manualChangeLog, currentSchedule, user, updateData, addHistoryEntry, t, nurses]);
  
  const handleBulkUpdate = useCallback(async (updatedOverrides: Schedule) => {
    addHistoryEntry(t.history_bulk_edit, t.history_bulk_edit_details);
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (const nurseId in updatedOverrides) {
        if (!newOverrides[nurseId]) {
            newOverrides[nurseId] = {};
        }
        Object.assign(newOverrides[nurseId], updatedOverrides[nurseId]);
    }
    await updateData({ manualOverrides: newOverrides });
  }, [manualOverrides, updateData, addHistoryEntry, t]);

  const handleGenerateRestOfYear = useCallback(async () => {
    if (!window.confirm(t['planner.generate_rest_year_confirm_intelligent'])) return;

    addHistoryEntry(t.history_generate_rest_year, t.history_generate_rest_year_details);

    const generatedForGaps = generateAndBalanceGaps(
        nurses,
        year,
        effectiveAgenda,
        manualOverrides,
        vaccinationPeriod,
        strasbourgAssignments,
        jornadasLaborales,
        specialStrasbourgEvents
    );
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (const nurseId in generatedForGaps) {
        if (!newOverrides[nurseId]) {
            newOverrides[nurseId] = {};
        }
        Object.assign(newOverrides[nurseId], generatedForGaps[nurseId]);
    }
    await updateData({ manualOverrides: newOverrides });
  }, [nurses, year, effectiveAgenda, manualOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales, specialStrasbourgEvents, updateData, addHistoryEntry, t]);

  const handleDeleteManualOverride = useCallback(async (payload: { nurseId: string, dateKey: string }) => {
      const { nurseId, dateKey } = payload;
      const nurseName = nurses.find(n => n.id === nurseId)?.name || 'Unknown';
      addHistoryEntry('Delete Override', `Removed override for ${nurseName} on ${dateKey}`);
      
      const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
      if (newOverrides[nurseId] && newOverrides[nurseId][dateKey]) {
          delete newOverrides[nurseId][dateKey];
          if (Object.keys(newOverrides[nurseId]).length === 0) {
              delete newOverrides[nurseId];
          }
          await updateData({ manualOverrides: newOverrides });
      }
  }, [manualOverrides, updateData, addHistoryEntry, nurses]);

  const handleNoteChange = useCallback((dateKey: string, text: string, color: string) => {
      addHistoryEntry(t.history_noteChange, `Changed note on ${dateKey}`);
      updateDataWithUndo({ notes: { ...notes, [dateKey]: { text, color } } });
  }, [notes, updateData, addHistoryEntry, t.history_noteChange]);

const handleAddNurse = useCallback((name: string) => {
    setIsEditingNurses(true);
    addHistoryEntry(t.history_addNurse, `Added: ${name}`);
    const maxOrder = Math.max(...localNurses.map(n => n.order), 0);
    const newNurse: Nurse = { id: `nurse-${Date.now()}`, name, email: `${name.toLowerCase().replace(' ', '')}@example.com`, role: 'nurse', order: maxOrder + 1 };
    const updatedNurses = [...localNurses, newNurse].sort((a,b) => a.order - b.order);
    setLocalNurses(updatedNurses);
    updateData({ nurses: updatedNurses });
    setTimeout(() => setIsEditingNurses(false), 1000);
  }, [localNurses, setLocalNurses, updateData, addHistoryEntry, t]);

  const handleRemoveNurse = useCallback((id: string, action?: 'RESET_MONTH') => {
    if (action === 'RESET_MONTH') {
      const nurseName = nurses.find(n => n.id === id)?.name || 'Unknown';
      addHistoryEntry('Reset Month', `Cleared all manual overrides for ${nurseName} in ${monthKey}`);
      
      const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
      if (newOverrides[id]) {
        // Only clear overrides for the current month
        const [y, m] = monthKey.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        
        for (let d = 1; d <= daysInMonth; d++) {
          const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          delete newOverrides[id][dateKey];
        }
        
        if (Object.keys(newOverrides[id]).length === 0) {
          delete newOverrides[id];
        }
        
        updateData({ manualOverrides: newOverrides });
      }
      return;
    }
    
    addHistoryEntry(t.history_removeNurse, `Removed: ${nurses.find(n => n.id === id)?.name}`);
    updateData({ nurses: nurses.filter(n => n.id !== id) });
  }, [nurses, updateData, addHistoryEntry, t, monthKey, manualOverrides]);
  
  const handleUpdateNurseName = useCallback((id: string, newName: string) => {
    setIsEditingNurses(true); // ← AÑADIR ESTO AL INICIO
    
    const oldName = localNurses.find(n=>n.id===id)?.name || 'Unknown';
    addHistoryEntry(t.history_updateNurseName, `Renamed ${oldName} to ${newName}`);
    
    const updatedNurses = localNurses.map(n => n.id === id ? { ...n, name: newName } : n);
    setLocalNurses(updatedNurses);
    updateData({ nurses: updatedNurses });
    
    setTimeout(() => setIsEditingNurses(false), 1000); // ← AÑADIR ESTO AL FINAL
  }, [localNurses, setLocalNurses, updateData, addHistoryEntry, t.history_updateNurseName]);

  const handleToggleMonthLock = useCallback(() => {
    addHistoryEntry('Toggle Lock', `Month ${monthKey} ${!isMonthClosed ? 'locked' : 'unlocked'}`);
    console.log(`Toggling month lock for ${monthKey}. Current state: ${isMonthClosed}`);
    const newClosedMonths = {...closedMonths, [monthKey]: !isMonthClosed};
    console.log('New closedMonths state:', newClosedMonths);
    updateDataWithUndo({ closedMonths: newClosedMonths });
  }, [closedMonths, monthKey, isMonthClosed, updateData, addHistoryEntry]);
  
  const handleStrasbourgUpdate = useCallback((weekId: string, nurseIds: string[]) => {
    addHistoryEntry(t.history_strasbourgUpdate, `Updated assignments for week ${weekId}`);
    updateData({ strasbourgAssignments: { ...strasbourgAssignments, [weekId]: nurseIds } });
  }, [strasbourgAssignments, updateData, addHistoryEntry, t.history_strasbourgUpdate]);

  const handleSpecialStrasbourgEventsChange = useCallback((newEvents: SpecialStrasbourgEvent[]) => {
      const action = newEvents.length > specialStrasbourgEvents.length ? 'Evento Creado' : 
                     newEvents.length < specialStrasbourgEvents.length ? 'Evento Eliminado' : 'Evento Modificado';
      
      const newLogEntry: HistoryEntry = {
          id: `sevtlog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: user?.name || 'System',
          action,
          details: `Cambio en eventos especiales de Estrasburgo`
      };

      addHistoryEntry(t.history_specialEvent, t.history_specialEvent);
      updateDataWithUndo({ 
          specialStrasbourgEvents: newEvents,
          specialStrasbourgEventsLog: [newLogEntry, ...specialStrasbourgEventsLog].slice(0, 50)
      });
  }, [updateDataWithUndo, addHistoryEntry, t, specialStrasbourgEvents, specialStrasbourgEventsLog, user]);

  const handleClearStrasbourgLog = useCallback(async () => {
      try {
        await updateData({ specialStrasbourgEventsLog: [] });
        console.log('✅ Registro de Estrasburgo limpiado');
      } catch (error) {
        console.error('❌ Error al limpiar registro:', error);
      }
  }, [updateData]);

  const handleMassAbsenceApply = useCallback((nurseIds: string[], startDate: string, endDate: string, shift: WorkZone) => {
    addHistoryEntry(t.history_massAbsence, `Applied ${shift} to ${nurseIds.length} nurses from ${startDate} to ${endDate}.`);
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay(); const dateKey = d.toISOString().split('T')[0]; const weekId = getWeekIdentifier(d);
        if (dayOfWeek === 0 || dayOfWeek === 6 || (effectiveAgenda[weekId] || 'NORMAL') === 'CLOSED' || holidays2026.has(dateKey)) continue;
        nurseIds.forEach(nurseId => { if (!newOverrides[nurseId]) newOverrides[nurseId] = {}; newOverrides[nurseId][dateKey] = shift; });
    }
    updateData({ manualOverrides: newOverrides });
  }, [manualOverrides, effectiveAgenda, updateData, addHistoryEntry, t]);

  const handleJornadasChange = useCallback(async (newJornadas: JornadaLaboral[]) => {
    addHistoryEntry(t.history_jornadaChange, t.history_jornadaChange);
    try {
      await updateData({ jornadasLaborales: newJornadas });
      console.log('✅ Jornadas laborales actualizadas');
    } catch (error) {
      console.error('❌ Error al guardar jornadas:', error);
    }
  }, [updateData, addHistoryEntry, t]);

  const handleConfirmSwap = useCallback(async (payload: { date: string; nurse1Id: string; nurse2Id: string }) => {
    const { date, nurse1Id, nurse2Id } = payload;
    const nurse1Name = nurses.find(n => n.id === nurse1Id)?.name || 'N/A';
    const nurse2Name = nurses.find(n => n.id === nurse2Id)?.name || 'N/A';
    addHistoryEntry(t.history_swapShifts, `${nurse1Name} ↔ ${nurse2Name} on ${date}`);
    
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    const newLog: ManualChangeLogEntry[] = [...(manualChangeLog ?? [])];
    
    if (!newOverrides[nurse1Id]) newOverrides[nurse1Id] = {};
    if (!newOverrides[nurse2Id]) newOverrides[nurse2Id] = {};
    
    const shift1 = currentSchedule[nurse1Id]?.[date];
    const shift2 = currentSchedule[nurse2Id]?.[date];
    
    const newShift1 = shift2;
    const newShift2 = shift1;

    if (newShift1) { newOverrides[nurse1Id][date] = newShift1; } else { delete newOverrides[nurse1Id][date]; }
    if (newShift2) { newOverrides[nurse2Id][date] = newShift2; } else { delete newOverrides[nurse2Id][date]; }

    newLog.push({ id: `log-${Date.now()}-${nurse1Id}-${date}`, timestamp: new Date().toISOString(), user: user?.name || 'System', nurseId: nurse1Id, dateKey: date, originalShift: shift1, newShift: newShift1 || 'DELETE' });
    newLog.push({ id: `log-${Date.now()}-${nurse2Id}-${date}`, timestamp: new Date().toISOString(), user: user?.name || 'System', nurseId: nurse2Id, dateKey: date, originalShift: shift2, newShift: newShift2 || 'DELETE' });
    
    try {
      await updateData({ manualOverrides: newOverrides, manualChangeLog: newLog });
      console.log('✅ Intercambio guardado exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar intercambio:', error);
    }
  }, [manualOverrides, manualChangeLog, currentSchedule, user, updateData, addHistoryEntry, t, nurses]);
  
  const handleOpenManualHoursModal = useCallback((dateKey: string, nurseId: string) => {
    const nurse = nurses.find(n => n.id === nurseId);
    if (nurse) {
      setManualHoursModalConfig({ isOpen: true, nurse, dateKey });
    }
  }, [nurses]);

  const handlePersonalHoursChange = useCallback(async (payload: PersonalHoursChangePayload) => {
    const { nurseId, dateKey, segments, reason } = payload;
    const nurseName = nurses.find(n => n.id === nurseId)?.name || 'Unknown';
    addHistoryEntry('Hours Change', `Modified hours for ${nurseName} on ${dateKey}`);
    
    console.log('💾 Guardando horas manuales en Supabase...');
    const newHours = JSON.parse(JSON.stringify(savedHours));
    if (!newHours[nurseId]) newHours[nurseId] = {};
    
    // Calculate total manual hours from segments
    let manualTotal = 0;
    if (segments && segments.length > 0) {
        for (const seg of segments) {
            if (seg.startTime && seg.endTime) {
                const [startH, startM] = seg.startTime.split(':').map(Number);
                const [endH, endM] = seg.endTime.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;
                manualTotal += (endMinutes - startMinutes) / 60;
            }
        }
    }
    
    newHours[nurseId][dateKey] = {
        calculated: 0, // Will be recalculated in the merge
        manual: manualTotal,
        segments,
        note: reason
    };
    
    await updateData({ hours: newHours });
    console.log('✅ Horas manuales guardadas en Supabase');
  }, [savedHours, nurses, updateData, addHistoryEntry]);

  const handleOpenSwapPanelFromCell = (dateKey: string, nurseId: string) => {
    setSwapPanelConfig({ isOpen: true, initialDate: dateKey, initialNurseId: nurseId });
  };

  const handleOpenMyAgenda = useCallback(() => {
    if (effectiveUser?.role === 'nurse') {
        const nurseIdToOpen = (effectiveUser as User).nurseId ?? effectiveUser.id;
        const nurseToOpen = nurses.find(n => n.id === nurseIdToOpen);
        if (nurseToOpen) { setSelectedNurseForAgenda(nurseToOpen); }
    }
  }, [effectiveUser, nurses]);

  const nurseBalanceData = useMemo(() => {
    if (!selectedNurseForAgenda) return null;
    return balanceData.find(bd => bd.nurseId === selectedNurseForAgenda.id) || null;
  }, [selectedNurseForAgenda, balanceData]);

  const handleExportAnnualAgenda = useCallback(async (nurse: Nurse, useOriginal: boolean) => {
    const year = currentDate.getFullYear();
    const overridesToUse = useOriginal ? baseOverrides : combinedOverrides;
    const allSchedules: Record<number, Schedule[string]> = {};
    for (let month = 0; month < 12; month++) {
        const monthDate = new Date(year, month, 1);
        const isInternActive = month >= 9 || month <= 1;
        const activeNursesForMonth = isInternActive ? nurses : nurses.filter(n => n.id !== 'nurse-11');
        const monthSchedule = recalculateScheduleForMonth( activeNursesForMonth, monthDate, effectiveAgenda, overridesToUse, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
        allSchedules[month] = monthSchedule[nurse.id] || {};
    }
    await generateAnnualAgendaPdf({ nurse, year, allSchedules, agenda: effectiveAgenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales });
  }, [nurses, currentDate, effectiveAgenda, baseOverrides, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales, specialStrasbourgEvents]);

  const monthsWithOverrides = useMemo(() => {
    const months = new Set<number>();
    if (!manualOverrides) return months;
    for (const nurseId in manualOverrides) {
        for (const dateKey in manualOverrides[nurseId]) {
            const monthIndex = new Date(dateKey + 'T12:00:00Z').getUTCMonth();
            months.add(monthIndex);
        }
    }
    return months;
  }, [manualOverrides]);

  const handleAgendaChange = useCallback((newAgenda: Agenda) => {
      addHistoryEntry('Agenda Update', 'Updated annual activity levels.');
      updateData({ agenda: newAgenda });
  }, [addHistoryEntry, updateData]);

  const handleVaccinationPeriodChange = useCallback((period: { start: string, end: string } | null) => {
      addHistoryEntry(t.history_vaccinationPeriodChange, `Period set to ${period ? `${period.start} to ${period.end}` : 'None'}`);
      updateData({ vaccinationPeriod: period });
  }, [addHistoryEntry, updateData, t.history_vaccinationPeriodChange]);

  if (isAuthLoading || isStateLoading) { return ( <div className="min-h-screen flex items-center justify-center bg-zen-50"> <div className="text-center"> <svg className="animate-spin h-8 w-8 text-zen-700 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <p className="mt-2 text-zen-600">{t.loadingData}</p> </div> </div> ); }
  if (!user) { return <LoginScreen />; }
  if ((user as any).mustChangePassword || (user as any).passwordResetRequired) { return <ForceChangePasswordScreen />; }

  return (
    <div className="min-h-screen flex flex-col">
      {showFullscreenToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm transition-opacity duration-300 animate-fade-in-out">
            Press ESC to exit fullscreen mode
        </div>
      )}
      <div className="flex-shrink-0 max-w-screen-2xl w-full mx-auto p-4 pb-0 no-print">
         <Header 
            monthName={currentDate.toLocaleString(language, { month: 'long' })}
            year={year} onDateChange={setCurrentDate} currentDate={currentDate}
            isMonthClosed={isMonthClosed} onToggleMonthLock={handleToggleMonthLock}
            schedule={schedule} nurses={nurses} notes={notes} agenda={effectiveAgenda} hours={hours}
            jornadasLaborales={jornadasLaborales}
            onExportPdf={async () => generateAndDownloadPdf({nurses, schedule, currentDate, notes, agenda: effectiveAgenda, strasbourgAssignments})}
            view={view}
            setView={setView}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenAnnualPlanner={() => setIsAnnualPlannerOpen(true)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
        />
      </div>

      <main className="flex-grow max-w-screen-2xl w-full mx-auto p-4 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-8 h-full print-main-content lg:items-stretch">
          {!permissions.isViewingAsViewer && view === 'schedule' && (
             <aside className="lg:w-1/4 xl:w-1/5 flex-shrink-0 no-print overflow-y-auto pr-2 custom-scrollbar">
              <Sidebar 
                nurses={nurses} 
                activeNursesForMonth={nurses} 
                onAddNurse={handleAddNurse} 
                onRemoveNurse={handleRemoveNurse} 
                onUpdateNurseName={handleUpdateNurseName} 
                onOpenAgenda={setSelectedNurseForAgenda}
                onOpenMyAgenda={handleOpenMyAgenda}
                onOpenProfile={() => setView('profile')}
                onMassAbsenceApply={handleMassAbsenceApply} 
                currentDate={currentDate} 
                strasbourgAssignments={strasbourgAssignments} 
                onStrasbourgUpdate={handleStrasbourgUpdate} 
                specialStrasbourgEvents={specialStrasbourgEvents} 
                onSpecialStrasbourgEventsChange={handleSpecialStrasbourgEventsChange} 
                specialStrasbourgEventsLog={specialStrasbourgEventsLog}
                onClearStrasbourgLog={handleClearStrasbourgLog}
                vaccinationPeriod={vaccinationPeriod} 
                onVaccinationPeriodChange={handleVaccinationPeriodChange} 
                isMonthClosed={isMonthClosed} 
                onOpenJornadaManager={() => setIsJornadaManagerOpen(true)}
                schedule={schedule}
                onManualChange={handleManualChange}
                onOpenSwapModal={() => setSwapPanelConfig({ isOpen: true, initialDate: '', initialNurseId: '' })}
              />
            </aside>
          )}

          <div className={`flex flex-col min-w-0 h-full overflow-hidden ${view === 'schedule' && !permissions.isViewingAsViewer ? 'lg:w-3/4 xl:w-4/5' : 'w-full'}`}>
              {view === 'schedule' ? (
                <div className="flex flex-col h-full">
                  <div className="flex-shrink-0 mb-6 no-print overflow-x-auto">
                    <AgendaPlanner
                      currentDate={currentDate}
                      agenda={agenda}
                      onAgendaChange={handleAgendaChange}
                      onWeekSelect={setCurrentDate}
                    >
                      <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
                    </AgendaPlanner>
                  </div>
                  
                  <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                    {permissions.isViewingAsAdmin && (
                        <div className="flex-shrink-0">
                            <WorkConditionsBar 
                                nurses={nurses}
                                jornadas={jornadasLaborales}
                                currentDate={currentDate}
                            />
                        </div>
                    )}
                    <ScheduleGrid ref={scheduleGridRef} nurses={nurses} schedule={schedule} currentDate={currentDate} violations={[]} agenda={effectiveAgenda} notes={notes} hours={hours} onNoteChange={handleNoteChange} vaccinationPeriod={vaccinationPeriod} zoomLevel={zoomLevel} strasbourgAssignments={strasbourgAssignments} isMonthClosed={isMonthClosed} jornadasLaborales={jornadasLaborales} onCellDoubleClick={handleOpenSwapPanelFromCell} onOpenManualHoursModal={handleOpenManualHoursModal} />
                  </div>
                </div>
              ) : view === 'balance' ? ( 
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  <BalancePage nurses={nurses} balanceData={balanceData} currentDate={currentDate} onDateChange={setCurrentDate} onOpenAgenda={setSelectedNurseForAgenda} /> 
                </div>
              ) : view === 'wishes' ? ( 
                <div className="h-full overflow-hidden">
                  <WishesPage 
                    nurses={nurses} 
                    year={year} 
                    currentDate={currentDate}
                    wishes={wishes}   
                    onWishesChange={(nurseId, dateKey, text, shiftType) => updateData({ wishes: { ...wishes, [nurseId]: { ...wishes[nurseId], [dateKey]: { ...wishes[nurseId]?.[dateKey], text, shiftType } } } })} 
                    onWishValidationChange={(nurseId, dateKey, isValidated) => {
                      const wish = wishes[nurseId]?.[dateKey];
                      const updates: any = {
                        wishes: { 
                          ...wishes, 
                          [nurseId]: { 
                            ...wishes[nurseId], 
                            [dateKey]: { ...wishes[nurseId]?.[dateKey], validated: isValidated } 
                          } 
                        }
                      };
                      
                      if (wish?.shiftType) {
                        const newNurseOverrides = { ...(manualOverrides[nurseId] || {}) };
                        
                        if (isValidated) {
                          // Apply ONLY to that specific day
                          newNurseOverrides[dateKey] = wish.shiftType;
                        } else {
                          // Remove from schedule if it matches the wish shift
                          if (newNurseOverrides[dateKey] === wish.shiftType) {
                            delete newNurseOverrides[dateKey];
                          }
                        }
                        
                        updates.manualOverrides = {
                          ...manualOverrides,
                          [nurseId]: newNurseOverrides
                        };
                      }
                      
                      updateData(updates);
                    }} 
                    onDeleteWish={(nurseId, dateKey) => {
                      const wish = wishes[nurseId]?.[dateKey];
                      const newNurseWishes = { ...(wishes[nurseId] || {}) };
                      delete newNurseWishes[dateKey];
                      
                      const updates: any = {
                        wishes: {
                          ...wishes,
                          [nurseId]: newNurseWishes
                        }
                      };

                      // Also remove the override if it was validated and matches
                      if (wish?.validated && wish?.shiftType && manualOverrides[nurseId]?.[dateKey] === wish.shiftType) {
                        const newNurseOverrides = { ...(manualOverrides[nurseId] || {}) };
                        delete newNurseOverrides[dateKey];
                        updates.manualOverrides = {
                          ...manualOverrides,
                          [nurseId]: newNurseOverrides
                        };
                      }

                      updateData(updates);
                    }}
                    agenda={effectiveAgenda} 
                  /> 
                </div>
              ) : view === 'userManagement' ? ( 
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  <UserManagementPage nurses={nurses} /> 
                </div>
              ) : ( 
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  <ProfilePage nurses={nurses} /> 
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Modals outside main layout flow */}
      {isAnnualPlannerOpen && permissions.isViewingAsAdmin && (
          <AnnualPlannerModal
              isOpen={isAnnualPlannerOpen}
              onClose={() => setIsAnnualPlannerOpen(false)}
              year={year}
              monthsWithOverrides={monthsWithOverrides}
              nurses={nurses}
              initialOverrides={manualOverrides}
              onSaveOverrides={handleBulkUpdate}
              onGenerate={handleGenerateRestOfYear}
          />
      )}
      {selectedNurseForAgenda && nurseBalanceData && ( 
          <PersonalAgendaModal 
              nurse={selectedNurseForAgenda} 
              currentDate={currentDate} 
              originalSchedule={fullOriginalSchedule[selectedNurseForAgenda.id] || {}}
              currentSchedule={fullCurrentSchedule[selectedNurseForAgenda.id] || {}}
              manualOverrides={manualOverrides}
              manualChangeLog={manualChangeLog}
              hours={hours} 
              onClose={() => setSelectedNurseForAgenda(null)} 
              onNavigate={setCurrentDate} 
              agenda={effectiveAgenda} 
              strasbourgAssignments={strasbourgAssignments} 
              balanceData={nurseBalanceData} 
              specialStrasbourgEvents={specialStrasbourgEvents} 
              nurses={nurses} 
              history={history} 
              onExportAnnual={handleExportAnnualAgenda} 
              jornadasLaborales={jornadasLaborales}
          /> 
      )}
      {permissions.canManageJornadas && isJornadaManagerOpen && (<JornadaLaboralManager nurses={nurses} jornadas={jornadasLaborales} onClose={() => setIsJornadaManagerOpen(false)} onSave={handleJornadasChange} />)}
      {permissions.canManageSwaps && (
          <SwapShiftPanel 
              isOpen={swapPanelConfig.isOpen} 
              onClose={() => setSwapPanelConfig({ isOpen: false, initialDate: '', initialNurseId: '' })}
              nurses={nurses} 
              schedule={currentSchedule} 
              onConfirmSwap={handleConfirmSwap}
              onManualChange={handleManualChange}
              initialDate={swapPanelConfig.initialDate}
              initialNurseId={swapPanelConfig.initialNurseId}
              isMonthClosed={isMonthClosed}
          />
      )}
      <ManualHoursModal
          isOpen={manualHoursModalConfig.isOpen}
          onClose={() => setManualHoursModalConfig({ ...manualHoursModalConfig, isOpen: false })}
          nurse={manualHoursModalConfig.nurse}
          dateKey={manualHoursModalConfig.dateKey}
          scheduleCell={manualHoursModalConfig.nurse ? currentSchedule[manualHoursModalConfig.nurse.id]?.[manualHoursModalConfig.dateKey] : undefined}
          hours={hours}
          onSave={handlePersonalHoursChange}
          isMonthClosed={isMonthClosed}
          agenda={effectiveAgenda}
          strasbourgAssignments={strasbourgAssignments}
          specialStrasbourgEvents={specialStrasbourgEvents}
          jornadasLaborales={jornadasLaborales}
      />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        history={history} 
        onClearHistory={handleClearHistory}
        onDeleteHistoryEntry={handleDeleteHistoryEntry}
      />
      
      {undoStack.length > 0 && (
        <button 
            onClick={handleUndo}
            className="fixed bottom-6 right-6 z-50 bg-zen-800 text-white p-4 rounded-full shadow-2xl hover:bg-zen-700 transition-all flex items-center gap-2 group"
            title="Deshacer última acción"
        >
            <UndoIcon className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold uppercase text-xs tracking-widest">Deshacer</span>
        </button>
      )}
    </div>
  );
};
const App: React.FC = () => (
  <NurseProvider>
    <AppContent />
  </NurseProvider>
);

export default App;