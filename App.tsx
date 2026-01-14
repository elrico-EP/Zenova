
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ScheduleGrid } from './components/ScheduleGrid';
import { Header } from './components/Header';
import { PersonalAgendaModal } from './components/PersonalAgendaModal';
import { AgendaPlanner } from './components/AgendaPlanner';
import { ZoomControls } from './components/ZoomControls';
import { Sidebar } from './components/Sidebar';
import { BalancePage } from './components/BalancePage';
import { WishesPage } from './components/WishesPage';
import { HelpModal } from './components/HelpModal';
import { JornadaLaboralManager } from './components/JornadaLaboralManager';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementPage } from './components/UserManagementPage';
import type { User, Schedule, Nurse, WorkZone, RuleViolation, Agenda, ScheduleCell, Notes, Hours, ManualChangePayload, StrasbourgEvent, BalanceData, ShiftCounts, HistoryEntry, CustomShift, Wishes, PersonalHoursChangePayload, JornadaLaboral, SpecialStrasbourgEvent, SwapInfo } from './types';
import { SHIFTS, INITIAL_NURSES } from './constants';
import { recalculateScheduleForMonth, getShiftsFromCell } from './utils/scheduleUtils';
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

const App: React.FC = () => {
  const { user, effectiveUser, isLoading: isAuthLoading } = useUser();
  const permissions = usePermissions();
  const { data: sharedData, loading: isStateLoading, updateData } = useSharedState();

  const [currentDate, setCurrentDate] = useState(new Date('2026-01-01T12:00:00'));
  
  // UI State remains local
  const [view, setView] = useState<'schedule' | 'balance' | 'wishes' | 'userManagement'>('schedule');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedNurseForAgenda, setSelectedNurseForAgenda] = useState<Nurse | null>(null);
  const [isJornadaManagerOpen, setIsJornadaManagerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFitToScreen, setIsFitToScreen] = useState(true);
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const [swapPanelConfig, setSwapPanelConfig] = useState({ isOpen: false, initialDate: '', initialNurseId: '' });


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
  const history = sharedData?.history ?? [];
  const jornadasLaborales = sharedData?.jornadasLaborales ?? [];
  const visualSwaps = sharedData?.visualSwaps ?? {};
  
  const [hours, setHours] = useState<Hours>({});
  
  const { language } = useLanguage();
  const t = useTranslations();
  
  const year = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const monthKey = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isMonthClosed = !!closedMonths[monthKey];

  const effectiveAgenda = useMemo(() => (year === 2026 ? agenda2026Data : agenda), [year, agenda]);
  const [schedule, setSchedule] = useState<Schedule>({});
  
  useEffect(() => {
    // When the effective user is a nurse (either by login or impersonation),
    // and the current view is 'balance', reset to the default 'schedule' view.
    if (effectiveUser?.role === 'nurse' && (view === 'balance' || view === 'userManagement')) {
      setView('schedule');
    }
  }, [effectiveUser, view]);

  const activeNurses = useMemo(() => {
    const month = currentDate.getMonth();
    const isInternActive = month >= 9 || month <= 1;
    if (isInternActive) return nurses;
    return nurses.filter(n => n.id !== 'nurse-11');
  }, [nurses, currentDate]);

  const combinedOverrides = useMemo(() => {
    const eventOverrides: Schedule = {};
    strasbourgEvents.forEach(event => {
        if (!event.startDate || !event.endDate || !event.nurseId) return;
        for (let d = new Date(event.startDate); d <= new Date(event.endDate); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            if (!eventOverrides[event.nurseId]) eventOverrides[event.nurseId] = {};
            eventOverrides[event.nurseId][dateKey] = { custom: event.name, type: 'STRASBOURG' };
        }
    });
    const merged = { ...eventOverrides };
    for (const nurseId in manualOverrides) {
        if (!merged[nurseId]) merged[nurseId] = {};
        for (const dateKey in manualOverrides[nurseId]) {
            merged[nurseId][dateKey] = manualOverrides[nurseId][dateKey];
        }
    }
    return merged;
  }, [manualOverrides, strasbourgEvents]);

  useEffect(() => {
    const newSchedule = recalculateScheduleForMonth(activeNurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
    setSchedule(newSchedule);
  }, [activeNurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales]);

  useEffect(() => {
    const calculatedHoursForMonth = calculateHoursForMonth(activeNurses, currentDate, effectiveAgenda, schedule, strasbourgAssignments, specialStrasbourgEvents);
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
  }, [activeNurses, schedule, currentDate, effectiveAgenda, strasbourgAssignments, specialStrasbourgEvents]);

  const balanceData = useMemo<BalanceData[]>(() => {
    if (nurses.length === 0) return [];

    const annualSchedules: { [month: number]: Schedule } = {};
    for (let m = 0; m < 12; m++) {
      annualSchedules[m] = recalculateScheduleForMonth(nurses, new Date(year, m, 1), effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales);
    }
    
    return nurses.map(nurse => {
      const localYearlyHours: Record<string, any> = {};
      for (let m = 0; m < 12; m++) {
        const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        try {
          const storedData = localStorage.getItem(`individualSchedule-${nurse.id}-${monthKey}`);
          if (storedData) localYearlyHours[monthKey] = JSON.parse(storedData);
        } catch (e) { console.error(e); }
      }

      const emptyCounts = (): ShiftCounts => ({ TRAVAIL: 0, TRAVAIL_TARDE: 0, URGENCES: 0, URGENCES_TARDE: 0, ADMIN: 0, TW: 0, CA: 0, FP: 0, SICK_LEAVE: 0, STRASBOURG: 0, LIBERO: 0, VACCIN: 0, VACCIN_AM: 0, VACCIN_PM: 0 });
      
      const annualCounts = emptyCounts();
      const monthlyCounts = emptyCounts();
      
      let annualWorkedHours = 0;
      let monthlyWorkedHours = 0;
      let annualTotalWorkDays = 0;
      let monthlyTotalWorkDays = 0;
      const currentMonthIndex = currentDate.getMonth();

      // Loop through the year to calculate ACTUAL worked hours and shift counts.
      for (let m = 0; m < 12; m++) {
        const monthSchedule = annualSchedules[m];
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const localMonthData = localYearlyHours[`${year}-${String(m + 1).padStart(2, '0')}`];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(Date.UTC(year, m, day));
          const dateKey = date.toISOString().split('T')[0];
          
          const cell = monthSchedule[nurse.id]?.[dateKey];
          const shifts = getShiftsFromCell(cell);
          const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
          const localDayData = localMonthData?.[dateKey];
          
          let dailyWorkedHours = 0;
          if (localDayData && localDayData.startTime && localDayData.endTime) {
            dailyWorkedHours = calculateHoursDifference(localDayData.startTime, localDayData.endTime) || 0;
          } else {
            dailyWorkedHours = calculateHoursForDay(nurse, cell, date, effectiveAgenda, strasbourgAssignments, specialEvent) || 0;
          }
          
          annualWorkedHours += dailyWorkedHours;
          shifts.forEach(s => { if (s in annualCounts) annualCounts[s as keyof ShiftCounts]++; });
          if (shifts.length > 0 && !shifts.includes('CA')) {
            annualTotalWorkDays++;
          }

          if (m === currentMonthIndex) {
            monthlyWorkedHours += dailyWorkedHours;
            shifts.forEach(s => { if (s in monthlyCounts) monthlyCounts[s as keyof ShiftCounts]++; });
             if (shifts.length > 0 && !shifts.includes('CA')) {
               monthlyTotalWorkDays++;
             }
          }
        }
      }

      return {
        nurseId: nurse.id,
        monthlyCounts,
        annualCounts,
        monthlyTotalWorkDays,
        annualTotalWorkDays,
        monthlyTotalHours: monthlyWorkedHours,
        annualTotalHours: annualWorkedHours,
        monthlyTargetHours: 0, // Obsolete, set to 0
        annualTargetHours: 0, // Obsolete, set to 0
        monthlyBalance: monthlyWorkedHours, // Re-defined as total hours
        annualBalance: annualWorkedHours, // Re-defined as total hours
        hasConsecutiveAdmTw: false,
      };
    });
  }, [nurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, year, jornadasLaborales, specialStrasbourgEvents]);
  
  const addHistoryEntry = useCallback((action: string, details: string) => {
    if (!user) return;
    const newEntry: HistoryEntry = { id: Date.now().toString(), timestamp: new Date().toISOString(), user: user.name, action, details };
    updateData({ history: [newEntry, ...(sharedData?.history ?? [])] });
  }, [user, sharedData?.history, updateData]);

  const handleManualChange = useCallback(async (payload: ManualChangePayload) => {
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    const { nurseIds, shift, startDate, endDate } = payload;
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        nurseIds.forEach(nurseId => {
            if (!newOverrides[nurseId]) newOverrides[nurseId] = {};
            if (shift === 'DELETE') delete newOverrides[nurseId][dateKey];
            else newOverrides[nurseId][dateKey] = shift;
        });
    }
    await updateData({ manualOverrides: newOverrides });
    addHistoryEntry(t.history_manualChange, `Applied ${typeof payload.shift === 'string' ? payload.shift : 'custom shift'} to ${payload.nurseIds.length} nurse(s) from ${payload.startDate} to ${payload.endDate}`);
  }, [manualOverrides, updateData, addHistoryEntry, t.history_manualChange]);
  
  const handleNoteChange = useCallback((dateKey: string, text: string, color: string) => updateData({ notes: { ...notes, [dateKey]: { text, color } } }), [notes, updateData]);
  const handleAddNurse = useCallback((name: string) => {
    const maxOrder = Math.max(...nurses.map(n => n.order), 0);
    const newNurse: Nurse = { id: `nurse-${Date.now()}`, name, email: `${name.toLowerCase().replace(' ', '')}@example.com`, role: 'nurse', order: maxOrder + 1 };
    updateData({ nurses: [...nurses, newNurse].sort((a,b) => a.order - b.order) });
    addHistoryEntry(t.history_addNurse, `Added: ${name}`);
  }, [nurses, updateData, addHistoryEntry, t.history_addNurse]);

  const handleRemoveNurse = useCallback((id: string) => {
    updateData({ nurses: nurses.filter(n => n.id !== id) });
    addHistoryEntry(t.history_removeNurse, `Removed: ${nurses.find(n => n.id === id)?.name}`);
  }, [nurses, updateData, addHistoryEntry, t.history_removeNurse]);
  
  const handleUpdateNurseName = useCallback((id: string, newName: string) => {
      updateData({ nurses: nurses.map(n => n.id === id ? { ...n, name: newName } : n) });
  }, [nurses, updateData]);

  const handleToggleMonthLock = useCallback(() => updateData({ closedMonths: {...closedMonths, [monthKey]: !isMonthClosed} }), [closedMonths, monthKey, isMonthClosed, updateData]);
  const handleStrasbourgUpdate = useCallback((weekId: string, nurseIds: string[]) => updateData({ strasbourgAssignments: { ...strasbourgAssignments, [weekId]: nurseIds } }), [strasbourgAssignments, updateData]);
  const handleSpecialStrasbourgEventsChange = useCallback((newEvents: SpecialStrasbourgEvent[]) => {
      updateData({ specialStrasbourgEvents: newEvents });
      addHistoryEntry('Eventos Estrasburgo', 'Actualizada la lista de eventos especiales.');
  }, [updateData, addHistoryEntry]);

  const handleMassAbsenceApply = useCallback((nurseIds: string[], startDate: string, endDate: string, shift: WorkZone) => {
    const newOverrides = JSON.parse(JSON.stringify(manualOverrides));
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay(); const dateKey = d.toISOString().split('T')[0]; const weekId = getWeekIdentifier(d);
        if (dayOfWeek === 0 || dayOfWeek === 6 || (effectiveAgenda[weekId] || 'NORMAL') === 'CLOSED' || holidays2026.has(dateKey)) continue;
        nurseIds.forEach(nurseId => { if (!newOverrides[nurseId]) newOverrides[nurseId] = {}; newOverrides[nurseId][dateKey] = shift; });
    }
    updateData({ manualOverrides: newOverrides });
    addHistoryEntry('Mass Absence Assignment', `Applied ${shift} to ${nurseIds.length} nurses from ${startDate} to ${endDate}.`);
  }, [manualOverrides, effectiveAgenda, updateData, addHistoryEntry]);

  const handleJornadasChange = useCallback((newJornadas: JornadaLaboral[]) => {
    updateData({ jornadasLaborales: newJornadas });
    addHistoryEntry(t.history_jornadaChange, `Se han actualizado las jornadas laborales.`);
  }, [updateData, addHistoryEntry, t.history_jornadaChange]);

  const handleConfirmSwap = useCallback((payload: { date: string; nurse1Id: string; nurse2Id: string }) => {
    const { date, nurse1Id, nurse2Id } = payload;
    const newSwaps = JSON.parse(JSON.stringify(visualSwaps));

    const shift1 = schedule[nurse1Id]?.[date] || 'CA'; // Default to CA if no shift
    const shift2 = schedule[nurse2Id]?.[date] || 'CA';

    if (!newSwaps[date]) newSwaps[date] = {};

    newSwaps[date][nurse1Id] = { shownShift: shift2, swappedWithNurseId: nurse2Id, originalShift: shift1 };
    newSwaps[date][nurse2Id] = { shownShift: shift1, swappedWithNurseId: nurse1Id, originalShift: shift2 };

    updateData({ visualSwaps: newSwaps });

    const nurse1Name = nurses.find(n => n.id === nurse1Id)?.name || 'N/A';
    const nurse2Name = nurses.find(n => n.id === nurse2Id)?.name || 'N/A';
    addHistoryEntry(t.history_swapShifts, `Intercambio: ${nurse1Name} ↔ ${nurse2Name} en ${date}`);
  }, [visualSwaps, schedule, updateData, addHistoryEntry, t.history_swapShifts, nurses]);
  
  const handleUndoSwap = useCallback((payload: { dateKey: string, nurseId1: string, nurseId2: string }) => {
      const { dateKey, nurseId1, nurseId2 } = payload;
      const newSwaps = JSON.parse(JSON.stringify(visualSwaps));
      if (newSwaps[dateKey]) {
          delete newSwaps[dateKey][nurseId1];
          delete newSwaps[dateKey][nurseId2];
          if (Object.keys(newSwaps[dateKey]).length === 0) {
              delete newSwaps[dateKey];
          }
      }
      updateData({ visualSwaps: newSwaps });

      const nurse1Name = nurses.find(n => n.id === nurseId1)?.name || 'N/A';
      const nurse2Name = nurses.find(n => n.id === nurseId2)?.name || 'N/A';
      addHistoryEntry(t.history_undoSwap, `Deshacer intercambio: ${nurse1Name} ↔ ${nurse2Name} en ${dateKey}`);
  }, [visualSwaps, updateData, addHistoryEntry, t.history_undoSwap, nurses]);
  
  const handleOpenSwapPanelFromCell = (dateKey: string, nurseId: string) => {
    setSwapPanelConfig({ isOpen: true, initialDate: dateKey, initialNurseId: nurseId });
  };

  const handleOpenMyAgenda = useCallback(() => {
    if (effectiveUser && effectiveUser.role === 'nurse') {
        const nurseToOpen = nurses.find(n => n.id === effectiveUser.id);
        if (nurseToOpen) {
            setSelectedNurseForAgenda(nurseToOpen);
        }
    }
  }, [effectiveUser, nurses]);


  const nurseBalanceData = useMemo(() => {
    if (!selectedNurseForAgenda) return null;
    return balanceData.find(bd => bd.nurseId === selectedNurseForAgenda.id) || null;
  }, [selectedNurseForAgenda, balanceData]);

  const handleExportAnnualAgenda = useCallback(async (nurse: Nurse) => {
    const year = currentDate.getFullYear();
    const allSchedules: Record<number, Schedule[string]> = {};
    
    for (let month = 0; month < 12; month++) {
        const monthDate = new Date(year, month, 1);
        
        const isInternActive = month >= 9 || month <= 1;
        const activeNursesForMonth = isInternActive ? nurses : nurses.filter(n => n.id !== 'nurse-11');

        const monthSchedule = recalculateScheduleForMonth(
            activeNursesForMonth,
            monthDate,
            effectiveAgenda,
            combinedOverrides,
            vaccinationPeriod,
            strasbourgAssignments,
            jornadasLaborales
        );
        allSchedules[month] = monthSchedule[nurse.id] || {};
    }

    await generateAnnualAgendaPdf({
        nurse,
        year,
        allSchedules,
        agenda: effectiveAgenda,
        strasbourgAssignments,
        specialStrasbourgEvents,
    });
  }, [nurses, currentDate, effectiveAgenda, combinedOverrides, vaccinationPeriod, strasbourgAssignments, jornadasLaborales, specialStrasbourgEvents]);

  if (isAuthLoading || isStateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zen-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-zen-700 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-zen-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 print-container">
         <Header 
            monthName={currentDate.toLocaleString(language, { month: 'long' })}
            year={year} onDateChange={setCurrentDate} currentDate={currentDate}
            isMonthClosed={isMonthClosed} onToggleMonthLock={handleToggleMonthLock}
            schedule={schedule} nurses={nurses} notes={notes} agenda={effectiveAgenda}
            onExportPdf={async () => generateAndDownloadPdf({nurses: activeNurses, schedule, currentDate, notes, agenda: effectiveAgenda, strasbourgAssignments})}
            view={view}
            setView={setView}
            onOpenHelp={() => setIsHelpModalOpen(true)}
        />
        {selectedNurseForAgenda && nurseBalanceData && ( <PersonalAgendaModal nurse={selectedNurseForAgenda} currentDate={currentDate} schedule={schedule[selectedNurseForAgenda.id] || {}} hours={hours} onClose={() => setSelectedNurseForAgenda(null)} onNavigate={setCurrentDate} agenda={effectiveAgenda} strasbourgAssignments={strasbourgAssignments} balanceData={nurseBalanceData} specialStrasbourgEvents={specialStrasbourgEvents} visualSwaps={visualSwaps} nurses={nurses} history={history} onExportAnnual={handleExportAnnualAgenda} /> )}
        {permissions.canManageJornadas && isJornadaManagerOpen && (<JornadaLaboralManager nurses={nurses} jornadas={jornadasLaborales} onClose={() => setIsJornadaManagerOpen(false)} onSave={handleJornadasChange} />)}
        {permissions.canManageSwaps && (
            <SwapShiftPanel 
                isOpen={swapPanelConfig.isOpen} 
                onClose={() => setSwapPanelConfig({ isOpen: false, initialDate: '', initialNurseId: '' })}
                nurses={nurses} 
                schedule={schedule} 
                onConfirmSwap={handleConfirmSwap}
                initialDate={swapPanelConfig.initialDate}
                initialNurseId={swapPanelConfig.initialNurseId}
                isMonthClosed={isMonthClosed}
            />
        )}
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        <main className="flex flex-col lg:flex-row gap-8 mt-8 print-main-content">
          {view !== 'userManagement' && view === 'schedule' && (
             <aside className="lg:w-1/4 xl:w-1/5 flex-shrink-0 no-print">
              <Sidebar 
                nurses={nurses} 
                activeNursesForMonth={activeNurses} 
                onAddNurse={handleAddNurse} 
                onRemoveNurse={handleRemoveNurse} 
                onUpdateNurseName={handleUpdateNurseName} 
                onOpenAgenda={setSelectedNurseForAgenda}
                onOpenMyAgenda={handleOpenMyAgenda}
                onMassAbsenceApply={handleMassAbsenceApply} 
                currentDate={currentDate} 
                strasbourgAssignments={strasbourgAssignments} 
                onStrasbourgUpdate={handleStrasbourgUpdate} 
                specialStrasbourgEvents={specialStrasbourgEvents} 
                onSpecialStrasbourgEventsChange={handleSpecialStrasbourgEventsChange} 
                vaccinationPeriod={vaccinationPeriod} 
                onVaccinationPeriodChange={(period) => updateData({ vaccinationPeriod: period })} 
                isMonthClosed={isMonthClosed} 
                history={history} 
                onOpenJornadaManager={() => setIsJornadaManagerOpen(true)}
                schedule={schedule}
                onManualChange={handleManualChange}
                onOpenSwapModal={() => setSwapPanelConfig({ isOpen: true, initialDate: '', initialNurseId: '' })}
                visualSwaps={visualSwaps}
                onUndoSwap={handleUndoSwap}
              />
            </aside>
          )}
          <div className={`flex-grow ${view === 'schedule' ? 'lg:w-3/4 xl:w-4/5' : 'w-full'}`}>
              {view === 'schedule' ? (
                <>
                  <div className="no-print">
                    <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} isFitToScreen={isFitToScreen} setIsFitToScreen={setIsFitToScreen} />
                    <AgendaPlanner currentDate={currentDate} agenda={agenda} onAgendaChange={(newAgenda) => updateData({ agenda: newAgenda })} onWeekSelect={setCurrentDate} />
                  </div>
                  <div className="mt-6">
                    <ScheduleGrid ref={scheduleGridRef} nurses={activeNurses} schedule={schedule} currentDate={currentDate} violations={[]} agenda={effectiveAgenda} notes={notes} hours={hours} onNoteChange={handleNoteChange} vaccinationPeriod={vaccinationPeriod} zoomLevel={zoomLevel} isFitToScreen={isFitToScreen} strasbourgAssignments={strasbourgAssignments} specialStrasbourgEvents={specialStrasbourgEvents} isMonthClosed={isMonthClosed} jornadasLaborales={jornadasLaborales} visualSwaps={visualSwaps} onCellDoubleClick={handleOpenSwapPanelFromCell} />
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
              ) : ( <UserManagementPage /> )}
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
