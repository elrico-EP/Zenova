
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
import type { User, Schedule, Nurse, WorkZone, RuleViolation, Agenda, ScheduleCell, Notes, Hours, ManualChangePayload, ManualChangeLogEntry, StrasbourgEvent, BalanceData, ShiftCounts, HistoryEntry, CustomShift, Wishes, PersonalHoursChangePayload, JornadaLaboral, SpecialStrasbourgEvent } from './types';
import { SHIFTS, INITIAL_NURSES } from './constants';
import { recalculateScheduleForMonth, getShiftsFromCell, generateAndBalanceGaps } from './utils/scheduleUtils';
import { calculateHoursForMonth, calculateHoursForDay, calculateHoursDifference } from './utils/hoursUtils';
import { getActiveJornada } from './utils/jornadaUtils';
import { generateAndDownloadPdf, generateAnnualAgendaPdf } from './utils/exportUtils';
import { getWeekIdentifier } from './utils/dateUtils';
import { agenda2026Data, INITIAL_STRASBOURG_ASSIGNMENTS_2026, holidays2026 } from './data/agenda2026';
import { useLanguage } from './contexts/LanguageContext';
import { useUser } from './contexts/UserContext';
import { useTranslations } from './hooks/useTranslations';
import { useSharedState } from './hooks/useSharedState';
import { usePermissions } from './hooks/usePermissions';
import { SwapShiftPanel } from './components/SwapShiftModal';
import { WorkConditionsBar } from './components/WorkConditionsBar';
import { AnnualPlannerModal } from './components/AnnualPlannerModal';
import { BulkEditModal } from './components/BulkEditModal';

const App: React.FC = () => {
  const { user, effectiveUser, isLoading: isAuthLoading } = useUser();
  const permissions = usePermissions();
  const { data: sharedData, loading: isStateLoading, updateData } = useSharedState();

  const [currentDate, setCurrentDate] = useState(new Date('2026-01-01T12:00:00'));
  
  // UI State remains local
  const [view, setView] = useState<'schedule' | 'balance' | 'wishes' | 'userManagement' | 'profile'>('schedule');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedNurseForAgenda, setSelectedNurseForAgenda] = useState<Nurse | null>(null);
  const [isJornadaManagerOpen, setIsJornadaManagerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.4);
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const [swapPanelConfig, setSwapPanelConfig] = useState({ isOpen: false, initialDate: '', initialNurseId: '' });
  const [isAnnualPlannerOpen, setIsAnnualPlannerOpen] = useState(false);

  // State derived from shared state now
  const nurses = sharedData?.nurses ?? INITIAL_NURSES;
  const agenda = sharedData?.agenda ?? {};
  const manualOverrides = sharedData?.manualOverrides ?? {};
  const notes = sharedData?.notes ?? {};
  const vaccinationPeriod = sharedData?.vaccinationPeriod ?? null;
  const strasbourgAssignments = sharedData?.strasbourgAssignments ?? {};
  const strasbourgEvents = sharedData?.strasbourgEvents ?? [];
  const specialStrasbourgEvents = sharedData?.specialStrasbourgEvents ?? [];
  const closedMonths = sharedData?.closedMonths ?? {};
  const wishes = sharedData?.wishes ?? {};
  const jornadasLaborales = sharedData?.jornadasLaborales ?? [];
  const manualChangeLog = sharedData?.manualChangeLog ?? [];
  
  const [hours, setHours] = useState<Hours>({});
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
  
  const year = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const monthKey = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isMonthClosed = !!closedMonths[monthKey];

  const effectiveAgenda = useMemo(() => (year === 2026 ? agenda2026Data : agenda), [year, agenda]);
  const [schedule, setSchedule] = useState<Schedule>({});
  
  useEffect(() => {
    const allowedViews = permissions.isViewingAsViewer ? ['schedule'] : ['schedule', 'wishes', 'profile', 'balance', 'userManagement'];
    if (!allowedViews.includes(view)) {
      setView('schedule');
    }
  }, [effectiveUser, view, permissions.isViewingAsViewer]);

  const activeNurses = useMemo(() => {
    const month = currentDate.getMonth();
    const isInternActive = month >= 9 || month <= 1;
    if (isInternActive) return nurses;
    return nurses.filter(n => n.id !== 'nurse-11');
  }, [nurses, currentDate]);

  // Base overrides (only fixed events, NO manual changes) for the "Original Planning"
  const baseOverrides = useMemo(() => {
    const merged: Schedule = {};
    // This now correctly includes overrides from special events, but not manual ones.
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

  // Original schedule (base logic without any manual overrides)
  const originalSchedule = useMemo(() => {
    return recalculateScheduleForMonth(activeNurses, currentDate, effectiveAgenda, baseOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
  }, [activeNurses, currentDate, effectiveAgenda, baseOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales]);
  
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
  }, [manualOverrides, specialStrasbourgEvents]);

  // Current schedule (with manual overrides applied)
  const currentSchedule = useMemo(() => {
    return recalculateScheduleForMonth(activeNurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
  }, [activeNurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales]);

  // `schedule` state now points to `currentSchedule` for components that need the current view (like the main grid).
  useEffect(() => {
    setSchedule(currentSchedule);
  }, [currentSchedule]);

  useEffect(() => {
    const calculatedHoursForMonth = calculateHoursForMonth(activeNurses, currentDate, effectiveAgenda, schedule, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales);
    setHours(prevHours => {
        const newHoursState = JSON.parse(JSON.stringify(calculatedHoursForMonth));
        for (const nurseId in newHoursState) {
            if (activeNurses.some(n => n.id === nurseId) && prevHours[nurseId]) {
                for (const dateKey in newHoursState[nurseId]) {
                    if (prevHours[nurseId][dateKey]) {
                        const manualData = prevHours[nurseId][dateKey];
                        if (manualData.manual !== undefined) newHoursState[nurseId][dateKey].manual = manualData.manual;
                        if (manualData.segments) newHoursState[nurseId][dateKey].segments = manualData.segments;
                        if (manualData.note) newHoursState[nurseId][dateKey].note = manualData.note;
                    }
                }
            }
        }
        return newHoursState;
    });
  }, [activeNurses, schedule, currentDate, effectiveAgenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales]);

  const balanceData = useMemo<BalanceData[]>(() => {
    if (nurses.length === 0) return [];
    const annualSchedules: { [month: number]: Schedule } = {};
    for (let m = 0; m < 12; m++) {
      annualSchedules[m] = recalculateScheduleForMonth(nurses, new Date(year, m, 1), effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
    }
    return nurses.map(nurse => {
      const emptyCounts = (): ShiftCounts => ({ TRAVAIL: 0, TRAVAIL_TARDE: 0, URGENCES: 0, URGENCES_TARDE: 0, ADMIN: 0, TW: 0, CA: 0, FP: 0, SICK_LEAVE: 0, STRASBOURG: 0, LIBERO: 0, VACCIN: 0, VACCIN_AM: 0, VACCIN_PM: 0 });
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
  }, [nurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, year, jornadasLaborales, specialStrasbourgEvents]);
  
  const addHistoryEntry = useCallback((action: string, details: string, undoPayload?: any) => {
    if (!user) return;
    const newEntry: HistoryEntry = { id: Date.now().toString(), timestamp: new Date().toISOString(), user: user.name, action, details, undoPayload };
    
    setHistory(prevHistory => {
        const updatedHistory = [newEntry, ...prevHistory];

        if (updatedHistory.length > 100) {
            updatedHistory.pop(); 
        }
        
        try {
            localStorage.setItem('nursingAppChangeHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage:", error);
        }
        
        return updatedHistory;
    });
  }, [user]);

  const handleUndoChange = useCallback((entryToUndo: HistoryEntry) => {
    if (!window.confirm(t.admin_confirm_delete_change)) return;

    if (!entryToUndo.undoPayload) return;

    let newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    const { type, payload } = entryToUndo.undoPayload;

    if (type === 'manualOverride') {
        const { nurseIds, startDate, endDate } = payload;
        for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            for (const nurseId of nurseIds) {
                if (newOverrides[nurseId] && newOverrides[nurseId][dateKey]) {
                    delete newOverrides[nurseId][dateKey];
                    if (Object.keys(newOverrides[nurseId]).length === 0) {
                        delete newOverrides[nurseId];
                    }
                }
            }
        }
    } else if (type === 'swap') {
        const { date, nurse1Id, nurse2Id } = payload;
        if (newOverrides[nurse1Id] && newOverrides[nurse1Id][date]) {
            delete newOverrides[nurse1Id][date];
        }
        if (newOverrides[nurse2Id] && newOverrides[nurse2Id][date]) {
            delete newOverrides[nurse2Id][date];
        }
    }
    
    updateData({ manualOverrides: newOverrides });

    const newHistory = history.filter(h => h.id !== entryToUndo.id);
    setHistory(newHistory);
    try {
        localStorage.setItem('nursingAppChangeHistory', JSON.stringify(newHistory));
    } catch (error) {
        console.error("Failed to update history in localStorage:", error);
    }
  }, [manualOverrides, history, updateData, t.admin_confirm_delete_change]);


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
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    const newLog: ManualChangeLogEntry[] = [...(manualChangeLog ?? [])];
    const { nurseIds, shift, startDate, endDate } = payload;

    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        for (const nurseId of nurseIds) {
            const originalCellForLog = currentSchedule[nurseId]?.[dateKey];
            if (!newOverrides[nurseId]) newOverrides[nurseId] = {};
            const existingCell = newOverrides[nurseId][dateKey];
            if (JSON.stringify(existingCell) === JSON.stringify(shift)) continue;
            
            if (shift === 'DELETE') {
                delete newOverrides[nurseId][dateKey];
            } else {
                newOverrides[nurseId][dateKey] = shift;
            }
            
            newLog.push({
                id: `log-${Date.now()}-${nurseId}-${dateKey}`,
                timestamp: new Date().toISOString(),
                user: user?.name || 'System',
                nurseId: nurseId,
                dateKey: dateKey,
                originalShift: originalCellForLog,
                newShift: shift,
            });
        }
    }
    
    await updateData({ manualOverrides: newOverrides, manualChangeLog: newLog });
    
    let details = `Applied shift to ${payload.nurseIds.length} nurse(s) from ${payload.startDate} to ${payload.endDate}`;
    if (payload.nurseIds.length === 1) {
        const nurseName = nurses.find(n => n.id === payload.nurseIds[0])?.name || 'Unknown';
        details = `Changed shift for ${nurseName} from ${payload.startDate} to ${payload.endDate}`;
    }
    const undoPayload = { type: 'manualOverride', payload };
    addHistoryEntry(t.history_manualChange, details, undoPayload);
  }, [manualOverrides, manualChangeLog, currentSchedule, user, updateData, addHistoryEntry, t, nurses]);
  
  const handleBulkUpdate = useCallback(async (updatedOverrides: Schedule) => {
    // This is now a generic save function for overrides from the annual planner.
    // It receives a complete (but potentially partial) override object and merges it.
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (const nurseId in updatedOverrides) {
        if (!newOverrides[nurseId]) {
            newOverrides[nurseId] = {};
        }
        // This will add/update shifts for the edited months
        Object.assign(newOverrides[nurseId], updatedOverrides[nurseId]);
    }

    await updateData({ manualOverrides: newOverrides });
    addHistoryEntry(t.history_bulk_edit, t.history_bulk_edit_details);
  }, [manualOverrides, updateData, addHistoryEntry, t]);

  const handleGenerateRestOfYear = useCallback(async () => {
    if (!window.confirm(t['planner.generate_rest_year_confirm_intelligent'])) return;

    // The new util function will respect manualOverrides automatically
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

    // Merge new gaps with existing overrides
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (const nurseId in generatedForGaps) {
        if (!newOverrides[nurseId]) {
            newOverrides[nurseId] = {};
        }
        Object.assign(newOverrides[nurseId], generatedForGaps[nurseId]);
    }
    
    await updateData({ manualOverrides: newOverrides });
    addHistoryEntry(t.history_generate_rest_year, t.history_generate_rest_year_details);
  }, [nurses, year, effectiveAgenda, manualOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales, specialStrasbourgEvents, updateData, addHistoryEntry, t]);

  const handleDeleteManualOverride = useCallback(async (payload: { nurseId: string, dateKey: string }) => {
      const { nurseId, dateKey } = payload;
      const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
      
      if (newOverrides[nurseId] && newOverrides[nurseId][dateKey]) {
          delete newOverrides[nurseId][dateKey];
          if (Object.keys(newOverrides[nurseId]).length === 0) {
              delete newOverrides[nurseId];
          }
          await updateData({ manualOverrides: newOverrides });
      }
  }, [manualOverrides, updateData]);

  const handleNoteChange = useCallback((dateKey: string, text: string, color: string) => updateData({ notes: { ...notes, [dateKey]: { text, color } } }), [notes, updateData]);
  const handleAddNurse = useCallback((name: string) => {
    const maxOrder = Math.max(...nurses.map(n => n.order), 0);
    const newNurse: Nurse = { id: `nurse-${Date.now()}`, name, email: `${name.toLowerCase().replace(' ', '')}@example.com`, role: 'nurse', order: maxOrder + 1 };
    updateData({ nurses: [...nurses, newNurse].sort((a,b) => a.order - b.order) });
    addHistoryEntry(t.history_addNurse, `Added: ${name}`);
  }, [nurses, updateData, addHistoryEntry, t]);

  const handleRemoveNurse = useCallback((id: string) => {
    updateData({ nurses: nurses.filter(n => n.id !== id) });
    addHistoryEntry(t.history_removeNurse, `Removed: ${nurses.find(n => n.id === id)?.name}`);
  }, [nurses, updateData, addHistoryEntry, t]);
  
  const handleUpdateNurseName = useCallback((id: string, newName: string) => {
      updateData({ nurses: nurses.map(n => n.id === id ? { ...n, name: newName } : n) });
  }, [nurses, updateData]);

  const handleToggleMonthLock = useCallback(() => updateData({ closedMonths: {...closedMonths, [monthKey]: !isMonthClosed} }), [closedMonths, monthKey, isMonthClosed, updateData]);
  const handleStrasbourgUpdate = useCallback((weekId: string, nurseIds: string[]) => updateData({ strasbourgAssignments: { ...strasbourgAssignments, [weekId]: nurseIds } }), [strasbourgAssignments, updateData]);
  const handleSpecialStrasbourgEventsChange = useCallback((newEvents: SpecialStrasbourgEvent[]) => {
      updateData({ specialStrasbourgEvents: newEvents });
      addHistoryEntry(t.history_specialEvent, t.history_specialEvent);
  }, [updateData, addHistoryEntry, t]);

  const handleMassAbsenceApply = useCallback((nurseIds: string[], startDate: string, endDate: string, shift: WorkZone) => {
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay(); const dateKey = d.toISOString().split('T')[0]; const weekId = getWeekIdentifier(d);
        if (dayOfWeek === 0 || dayOfWeek === 6 || (effectiveAgenda[weekId] || 'NORMAL') === 'CLOSED' || holidays2026.has(dateKey)) continue;
        nurseIds.forEach(nurseId => { if (!newOverrides[nurseId]) newOverrides[nurseId] = {}; newOverrides[nurseId][dateKey] = shift; });
    }
    updateData({ manualOverrides: newOverrides });
    addHistoryEntry(t.history_massAbsence, `Applied ${shift} to ${nurseIds.length} nurses from ${startDate} to ${endDate}.`);
  }, [manualOverrides, effectiveAgenda, updateData, addHistoryEntry, t]);

  const handleJornadasChange = useCallback((newJornadas: JornadaLaboral[]) => {
    updateData({ jornadasLaborales: newJornadas });
    addHistoryEntry(t.history_jornadaChange, t.history_jornadaChange);
  }, [updateData, addHistoryEntry, t]);

  const handleConfirmSwap = useCallback((payload: { date: string; nurse1Id: string; nurse2Id: string }) => {
    const { date, nurse1Id, nurse2Id } = payload;
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    const newLog: ManualChangeLogEntry[] = [...(manualChangeLog ?? [])];
    
    if (!newOverrides[nurse1Id]) newOverrides[nurse1Id] = {};
    if (!newOverrides[nurse2Id]) newOverrides[nurse2Id] = {};
    
    // Get the CURRENT shifts of each nurse on that day, considering existing overrides.
    const shift1 = currentSchedule[nurse1Id]?.[date];
    const shift2 = currentSchedule[nurse2Id]?.[date];
    
    // Apply the swap to the manualOverrides object.
    const newShift1 = shift2;
    const newShift2 = shift1;

    if (newShift1) { newOverrides[nurse1Id][date] = newShift1; } else { delete newOverrides[nurse1Id][date]; }
    if (newShift2) { newOverrides[nurse2Id][date] = newShift2; } else { delete newOverrides[nurse2Id][date]; }

    // Log the change for Nurse 1
    newLog.push({
        id: `log-${Date.now()}-${nurse1Id}-${date}`,
        timestamp: new Date().toISOString(),
        user: user?.name || 'System',
        nurseId: nurse1Id,
        dateKey: date,
        originalShift: shift1,
        newShift: newShift1 || 'DELETE',
    });

    // Log the change for Nurse 2
    newLog.push({
        id: `log-${Date.now()}-${nurse2Id}-${date}`,
        timestamp: new Date().toISOString(),
        user: user?.name || 'System',
        nurseId: nurse2Id,
        dateKey: date,
        originalShift: shift2,
        newShift: newShift2 || 'DELETE',
    });
    
    updateData({ manualOverrides: newOverrides, manualChangeLog: newLog });
    
    const nurse1Name = nurses.find(n => n.id === nurse1Id)?.name || 'N/A';
    const nurse2Name = nurses.find(n => n.id === nurse2Id)?.name || 'N/A';
    const undoPayload = { type: 'swap', payload };
    addHistoryEntry(t.history_swapShifts, `${nurse1Name} ↔ ${nurse2Name} on ${date}`, undoPayload);
  }, [manualOverrides, manualChangeLog, currentSchedule, user, updateData, addHistoryEntry, t, nurses]);
  
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
        const monthSchedule = recalculateScheduleForMonth( activeNursesForMonth, monthDate, effectiveAgenda, overridesToUse, vaccinationPeriod, strasbourgAssignments, jornadasLaborales );
        allSchedules[month] = monthSchedule[nurse.id] || {};
    }
    // FIX: Pass jornadasLaborales to generateAnnualAgendaPdf
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

  if (isAuthLoading || isStateLoading) { return ( <div className="min-h-screen flex items-center justify-center bg-zen-50"> <div className="text-center"> <svg className="animate-spin h-8 w-8 text-zen-700 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <p className="mt-2 text-zen-600">{t.loadingData}</p> </div> </div> ); }
  if (!user) { return <LoginScreen />; }
  if ((user as User).mustChangePassword || (user as User).passwordResetRequired) { return <ForceChangePasswordScreen />; }

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 print-container">
         <Header 
            monthName={currentDate.toLocaleString(language, { month: 'long' })}
            year={year} onDateChange={setCurrentDate} currentDate={currentDate}
            isMonthClosed={isMonthClosed} onToggleMonthLock={handleToggleMonthLock}
            schedule={schedule} nurses={nurses} notes={notes} agenda={effectiveAgenda} hours={hours}
            jornadasLaborales={jornadasLaborales}
            onExportPdf={async () => generateAndDownloadPdf({nurses: activeNurses, schedule, currentDate, notes, agenda: effectiveAgenda, strasbourgAssignments})}
            view={view}
            setView={setView}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenAnnualPlanner={() => setIsAnnualPlannerOpen(true)}
        />
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
                originalSchedule={originalSchedule[selectedNurseForAgenda.id] || {}}
                currentSchedule={currentSchedule[selectedNurseForAgenda.id] || {}}
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
                initialDate={swapPanelConfig.initialDate}
                initialNurseId={swapPanelConfig.initialNurseId}
                isMonthClosed={isMonthClosed}
            />
        )}
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history} onUndo={handleUndoChange} />
        <main className="flex flex-col lg:flex-row gap-8 mt-8 print-main-content">
          {!permissions.isViewingAsViewer && view === 'schedule' && (
             <aside className="lg:w-1/4 xl:w-1/5 flex-shrink-0 no-print">
              <Sidebar 
                nurses={nurses} 
                activeNursesForMonth={activeNurses} 
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
                vaccinationPeriod={vaccinationPeriod} 
                onVaccinationPeriodChange={(period) => updateData({ vaccinationPeriod: period })} 
                isMonthClosed={isMonthClosed} 
                onOpenJornadaManager={() => setIsJornadaManagerOpen(true)}
                schedule={schedule}
                onManualChange={handleManualChange}
                onOpenSwapModal={() => setSwapPanelConfig({ isOpen: true, initialDate: '', initialNurseId: '' })}
              />
            </aside>
          )}
          <div className={`flex-grow min-w-0 ${view === 'schedule' && !permissions.isViewingAsViewer ? 'lg:w-3/4 xl:w-4/5' : 'w-full'}`}>
              {view === 'schedule' ? (
                <>
                  <div className="no-print">
                    <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
                    <AgendaPlanner currentDate={currentDate} agenda={agenda} onAgendaChange={(newAgenda) => updateData({ agenda: newAgenda })} onWeekSelect={setCurrentDate} />
                  </div>
                  <div className="mt-6">
                    {permissions.isViewingAsAdmin && (
                        <WorkConditionsBar 
                            nurses={activeNurses}
                            jornadas={jornadasLaborales}
                            currentDate={currentDate}
                        />
                    )}
                    <ScheduleGrid ref={scheduleGridRef} nurses={activeNurses} schedule={schedule} currentDate={currentDate} violations={[]} agenda={effectiveAgenda} notes={notes} hours={hours} onNoteChange={handleNoteChange} vaccinationPeriod={vaccinationPeriod} zoomLevel={zoomLevel} strasbourgAssignments={strasbourgAssignments} isMonthClosed={isMonthClosed} jornadasLaborales={jornadasLaborales} onCellDoubleClick={handleOpenSwapPanelFromCell} />
                  </div>
                </>
              ) : view === 'balance' ? ( <BalancePage nurses={nurses} balanceData={balanceData} currentDate={currentDate} onDateChange={setCurrentDate} onOpenAgenda={setSelectedNurseForAgenda} /> ) : 
                 view === 'wishes' ? ( 
              <WishesPage 
                nurses={activeNurses} 
                year={year} 
                wishes={wishes} 
                onWishesChange={(nurseId, dateKey, text) => updateData({ wishes: { ...wishes, [nurseId]: { ...wishes[nurseId], [dateKey]: { ...wishes[nurseId]?.[dateKey], text } } } })} 
                onWishValidationChange={(nurseId, dateKey, isValidated) => updateData({ wishes: { ...wishes, [nurseId]: { ...wishes[nurseId], [dateKey]: { ...wishes[nurseId]?.[dateKey], validated: isValidated } } } })} 
                agenda={effectiveAgenda} 
              /> 
              ) : view === 'userManagement' ? ( <UserManagementPage nurses={nurses} /> 
              ) : ( <ProfilePage nurses={nurses} /> )}
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
