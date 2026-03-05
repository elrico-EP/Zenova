import React, { useState, useMemo } from 'react';
import type { Nurse, WorkZone, StrasbourgEvent, HistoryEntry, User, SpecialStrasbourgEvent, Schedule, ManualChangePayload } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { getDateOfWeek } from '../utils/dateUtils';
import { agenda2026Data } from '../data/agenda2026';
import { VaccinationPeriodPlanner } from './VaccinationPeriodPlanner';
import { HistoryLog } from './HistoryLog';
import { StrasbourgEventsModule } from './StrasbourgEventsModule';
import { ManualChangeModal } from './ManualChangeModal';
import { SHIFTS } from '../constants';
import { getShiftsFromCell } from '../utils/scheduleUtils';
import { BulkEditModal } from './BulkEditModal';

const CollapsibleModule: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; disabled?: boolean; }> = ({ title, children, defaultOpen = false, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/80 ${disabled ? 'opacity-50' : ''}`}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between font-bold text-lg text-zen-800 p-4" aria-expanded={isOpen} disabled={disabled} >
                <span className="flex items-center gap-2">{title}</span>
                <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}><div className="p-4 border-t border-slate-200/80">{children}</div></div>
        </div>
    );
};

const ManageTeamModule: React.FC<{ nurses: Nurse[]; onAddNurse: (name: string) => void; onRemoveNurse: (id: string) => void; onUpdateNurseName: (id: string, newName: string) => void; onOpenAgenda: (nurse: Nurse) => void; isMonthClosed: boolean; }> = ({ nurses, onAddNurse, onRemoveNurse, onUpdateNurseName, onOpenAgenda, isMonthClosed }) => {
    const t = useTranslations();
    const permissions = usePermissions();
    const [newName, setNewName] = useState('');
    const handleAddNurse = (e: React.FormEvent) => { e.preventDefault(); if (newName.trim()) { onAddNurse(newName.trim()); setNewName(''); } };
    
    const canEditTeam = !isMonthClosed && permissions.canManageTeam;

    return (
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-slate-200/80 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-zen-800 flex-shrink-0">{t.manageTeam}</h3>
            <div className="space-y-1 mb-4">
                {nurses.map((nurse, index) => (
                    <div key={nurse.id} className={`flex items-center justify-between p-2 rounded-lg gap-2 transition-colors ${index % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}`}>
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                            {permissions.isViewingAsAdmin && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>}
                            <input type="text" value={nurse.name} readOnly={!permissions.isViewingAsAdmin} onChange={(e) => onUpdateNurseName(nurse.id, e.target.value)} className="flex-grow p-1 text-sm bg-transparent border-none rounded-md focus:outline-none focus:ring-1 focus:ring-zen-500 w-full truncate" />
                        </div>
                        <div className="flex items-center flex-shrink-0">
                           {permissions.canOpenPersonalAgenda(nurse.id) && <button onClick={() => onOpenAgenda(nurse)} title={t.openPersonalAgenda} className="text-slate-500 hover:text-zen-600 p-1.5 rounded-full hover:bg-zen-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg></button>}
                           {permissions.isViewingAsAdmin && (
                               <button 
                                   onClick={() => {
                                       if (window.confirm(`¿Estás seguro de que quieres borrar todos los cambios manuales de ${nurse.name} para este mes?`)) {
                                           (onRemoveNurse as any)(nurse.id, 'RESET_MONTH'); 
                                       }
                                   }} 
                                   title="Resetear mes (borrar cambios manuales)" 
                                   className="text-slate-500 hover:text-amber-600 p-1.5 rounded-full hover:bg-amber-100 transition-colors"
                               >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                       <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                   </svg>
                               </button>
                           )}
                           {permissions.canManageTeam && <button onClick={() => { if (window.confirm(t.confirmDeleteNurseMessage)) onRemoveNurse(nurse.id);}} title={t.deleteNurse} className="text-slate-500 hover:text-red-600 p-1.5 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50" disabled={!canEditTeam}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>}
                        </div>
                    </div>
                ))}
            </div>
            {permissions.canManageTeam && <form onSubmit={handleAddNurse} className="flex space-x-2 flex-shrink-0"><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.addNursePlaceholder} className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-zen-500 focus:border-zen-500 text-sm disabled:bg-slate-100" disabled={!canEditTeam}/> <button type="submit" className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700 text-sm disabled:bg-zen-500" disabled={!canEditTeam}>{t.add}</button></form>}
        </div>
    );
};

const MassAbsenceModule: React.FC<{ nurses: Nurse[]; currentDate: Date; onMassAbsenceApply: (nurseIds: string[], startDate: string, endDate: string, shift: WorkZone) => void; }> = ({ nurses, currentDate, onMassAbsenceApply }) => {
    const t = useTranslations();
    const [selectedNurseIds, setSelectedNurseIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(() => currentDate.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => currentDate.toISOString().split('T')[0]);
    const [shift, setShift] = useState<WorkZone>('CA');

    const handleApply = () => {
        if (selectedNurseIds.length > 0 && startDate && endDate) { onMassAbsenceApply(selectedNurseIds, startDate, endDate, shift); setSelectedNurseIds([]); setStartDate(currentDate.toISOString().split('T')[0]); setEndDate(currentDate.toISOString().split('T')[0]); setShift('CA'); }
    };

    return (
        <div className="space-y-4 text-sm">
            <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                {nurses.map(n => (
                    <label key={n.id} className="flex items-center p-1 rounded-md hover:bg-slate-100">
                        <input type="checkbox" checked={selectedNurseIds.includes(n.id)} onChange={() => setSelectedNurseIds(p => p.includes(n.id) ? p.filter(id=>id!==n.id) : [...p, n.id])} className="mr-2"/>
                        {n.name}
                    </label>
                ))}
            </div>
            <select value={shift} onChange={e => setShift(e.target.value as WorkZone)} className="w-full p-2 border rounded-md">
                <option value="CA">{t.leaveType_CA}</option>
                <option value="SICK_LEAVE">{t.leaveType_SICK_LEAVE}</option>
                <option value="FP">{t.leaveType_FP}</option>
                <option value="CS">{t.leaveType_CS}</option>
            </select>
            <div className="flex gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-600 block mb-1">Inicio</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md text-sm"/>
                </div>
                <div className="flex-1 min-w-0">
                    <label className="text-xs text-gray-600 block mb-1">Fin</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md text-sm"/>
                </div>
            </div>
            <button onClick={handleApply} className="w-full px-4 py-2 bg-zen-700 text-white font-semibold rounded-md hover:bg-zen-600">{t.applyToWorkdays}</button>
        </div>
    );
}

const StrasbourgAnnualPlanner: React.FC<{ 
    nurses: Nurse[]; 
    strasbourgAssignments: Record<string, string[]>; 
    onStrasbourgUpdate: (weekId: string, nurseIds: string[]) => void;
}> = ({ nurses, strasbourgAssignments, onStrasbourgUpdate }) => {
    const { effectiveUser } = useUser();
    const permissions = usePermissions();
    const t = useTranslations();
    const [manualFilterNurseId, setManualFilterNurseId] = useState<string>('');
    const [expandedMonths, setExpandedMonths] = useState<number[]>([new Date().getMonth()]);
    const [addingToWeek, setAddingToWeek] = useState<string | null>(null);
    const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
    const [tempSelectedNurses, setTempSelectedNurses] = useState<string[]>([]);

    const filterNurseId = permissions.isViewingAsAdmin ? manualFilterNurseId : effectiveUser?.id || '';

    const sessionDataByMonth = useMemo(() => {
        const sessionWeeks = Object.entries(agenda2026Data).filter(([, activity]) => activity === 'SESSION').map(([weekId]) => weekId).sort();
        const grouped: { month: string; monthIndex: number; sessions: { weekId: string; nurseIds: string[] }[] }[] = [];
        sessionWeeks.forEach(weekId => {
            const date = getDateOfWeek(weekId);
            const monthIndex = date.getMonth();
            const monthName = date.toLocaleString('es-ES', { month: 'long' });
            const assignedNurses = strasbourgAssignments[weekId] || [];
            if (filterNurseId && !assignedNurses.includes(filterNurseId)) return;
            let monthGroup = grouped.find(g => g.monthIndex === monthIndex);
            if (!monthGroup) { monthGroup = { month: monthName, monthIndex, sessions: [] }; grouped.push(monthGroup); }
            monthGroup.sessions.push({ weekId, nurseIds: assignedNurses });
        });
        return grouped.sort((a,b) => a.monthIndex - b.monthIndex);
    }, [strasbourgAssignments, filterNurseId]);
    
    const toggleMonth = (monthIndex: number) => setExpandedMonths(prev => prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex]);

    const handleRemoveNurse = (weekId: string, nurseIdToRemove: string) => onStrasbourgUpdate(weekId, (strasbourgAssignments[weekId] || []).filter(id => id !== nurseIdToRemove));
    const handleAddNurse = (weekId: string, nurseIdToAdd: string) => { if (!nurseIdToAdd) { setAddingToWeek(null); return; } const current = strasbourgAssignments[weekId] || []; if (!current.includes(nurseIdToAdd)) onStrasbourgUpdate(weekId, [...current, nurseIdToAdd]); setAddingToWeek(null); };
    const openEditModal = (weekId: string) => { setTempSelectedNurses(strasbourgAssignments[weekId] || []); setEditingWeekId(weekId); };
    const handleTempSelectionChange = (nurseId: string) => setTempSelectedNurses(prev => prev.includes(nurseId) ? prev.filter(id => id !== nurseId) : [...prev, nurseId]);
    const saveEditChanges = () => { if (editingWeekId) onStrasbourgUpdate(editingWeekId, tempSelectedNurses); setEditingWeekId(null); setTempSelectedNurses([]); };

    return (
        <div className="space-y-4 text-sm">
            {permissions.isViewingAsAdmin && <select value={filterNurseId} onChange={e => setManualFilterNurseId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white"><option value="">{t.filterByNurse}</option>{nurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select>}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {sessionDataByMonth.map(({ month, monthIndex, sessions }) => (
                    <div key={monthIndex} className="bg-slate-50 rounded-lg">
                        <button onClick={() => toggleMonth(monthIndex)} className="w-full flex justify-between items-center p-3 font-semibold text-slate-700"><span className="capitalize">{month}</span><svg className={`w-4 h-4 transition-transform ${expandedMonths.includes(monthIndex) ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        {expandedMonths.includes(monthIndex) && (
                            <div className="p-3 border-t">
                                {sessions.map(({ weekId, nurseIds }) => {
                                    const date = getDateOfWeek(weekId); const endDate = new Date(date); endDate.setDate(date.getDate() + 4); const dateRange = `${date.getDate()} - ${endDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})}`;
                                    const availableNurses = nurses.filter(n => !nurseIds.includes(n.id));
                                    return (
                                        <div key={weekId} className="p-2 mb-2 bg-blue-100 rounded-md text-slate-800">
                                            <label className="font-semibold text-blue-800">{t.week} {weekId.split('-W')[1]} <span className="font-normal text-xs">({dateRange})</span></label>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {nurseIds.length === 0 && <span className="text-xs italic text-slate-500">{t.nobodyAssigned}</span>}
                                                {nurseIds.map(id => {
                                                    const nurse = nurses.find(n => n.id === id);
                                                    return (<div key={id} className="bg-blue-200 text-blue-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5"><span>{nurse?.name}</span>{permissions.isViewingAsAdmin && <button onClick={() => handleRemoveNurse(weekId, id)} className="text-blue-700 hover:text-blue-900">❌</button>}</div>);
                                                })}
                                            </div>
                                            {permissions.isViewingAsAdmin && (<div className="mt-2 pt-2 border-t border-blue-200/50 flex items-center gap-2">
                                                {addingToWeek === weekId ? (
                                                    <select value="" onChange={e => handleAddNurse(weekId, e.target.value)} className="w-full p-1 border border-blue-200 rounded-md text-xs bg-white"><option value="">{t.selectNurse}...</option>{availableNurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select>
                                                ) : (<button onClick={() => setAddingToWeek(weekId)} className="text-xs font-semibold text-blue-700 hover:text-blue-900">+ {t.addNurse}</button>)}
                                                <button onClick={() => openEditModal(weekId)} className="text-xs font-semibold text-blue-700 hover:text-blue-900">✏️ {t.editSession}</button>
                                            </div>)}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {editingWeekId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingWeekId(null)}>
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">{t.editSession} - {t.week} {editingWeekId.split('-W')[1]}</h3>
                        <div className="space-y-2 my-4 max-h-64 overflow-y-auto">{nurses.map(nurse => (<label key={nurse.id} className="flex items-center p-2 rounded-md hover:bg-slate-100"><input type="checkbox" checked={tempSelectedNurses.includes(nurse.id)} onChange={() => handleTempSelectionChange(nurse.id)} className="h-4 w-4 mr-3 rounded border-gray-300 text-zen-600 focus:ring-zen-500"/><span className="text-sm">{nurse.name}</span></label>))}</div>
                        <div className="flex justify-end gap-2 mt-4"><button onClick={() => setEditingWeekId(null)} className="px-4 py-2 text-sm bg-slate-200 rounded-md">{t.cancel}</button><button onClick={saveEditChanges} className="px-4 py-2 text-sm bg-zen-800 text-white rounded-md">{t.save}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface SidebarProps {
  nurses: Nurse[]; activeNursesForMonth: Nurse[];
  onAddNurse: (name: string) => void; onRemoveNurse: (id: string) => void; onUpdateNurseName: (id: string, newName: string) => void;
  onOpenAgenda: (nurse: Nurse) => void; 
  onOpenMyAgenda: () => void;
  onOpenProfile: () => void;
  onMassAbsenceApply: (nurseIds: string[], startDate: string, endDate: string, shift: WorkZone) => void;
  currentDate: Date;
  strasbourgAssignments: Record<string, string[]>; onStrasbourgUpdate: (weekId: string, nurseIds: string[]) => void;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  onSpecialStrasbourgEventsChange: (events: SpecialStrasbourgEvent[]) => void;
  specialStrasbourgEventsLog: HistoryEntry[];
  onClearStrasbourgLog: () => void;
  vaccinationPeriod: { start: string; end: string } | null; onVaccinationPeriodChange: (period: { start: string; end: string } | null) => void;
  isMonthClosed: boolean;
  onOpenJornadaManager: () => void;
  schedule: Schedule;
  onManualChange: (payload: ManualChangePayload) => Promise<void>;
  onOpenSwapModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const t = useTranslations();
  const permissions = usePermissions();
  
    return (
    <div className="space-y-6">
        {permissions.isViewingAsUser && (
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-slate-200/80 space-y-3">
                <button 
                    onClick={props.onOpenMyAgenda}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-user-blue-500 text-white font-semibold rounded-md hover:bg-user-blue-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {t.openMyAgenda}
                </button>
                <button 
                    onClick={props.onOpenProfile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" /></svg>
                    {t.myProfile}
                </button>
            </div>
        )}

        {/* 1. Team */}
        {permissions.canManageTeam && <ManageTeamModule nurses={props.nurses} onAddNurse={props.onAddNurse} onRemoveNurse={props.onRemoveNurse} onUpdateNurseName={props.onUpdateNurseName} onOpenAgenda={props.onOpenAgenda} isMonthClosed={props.isMonthClosed} />}
        
        {/* 2. Manual Edit */}
        {permissions.canDoManualChanges && (
            <CollapsibleModule title={t.manualChangeTitle} disabled={props.isMonthClosed}>
                <ManualChangeModal
                    nurses={props.nurses}
                    schedule={props.schedule}
                    onManualChange={props.onManualChange}
                    initialNurseId={null}
                    initialDateKey={null}
                    agenda={{} as any}
                    hours={{} as any}
                    onSwapShifts={async () => {}}
                    onSetPersonalHours={async () => {}}
                    vaccinationPeriod={props.vaccinationPeriod}
                />
            </CollapsibleModule>
        )}

        {/* 3. Mass Assign Absence */}
        {permissions.canDoMassAbsence && (
            <CollapsibleModule title={t.massAssignAbsence} disabled={props.isMonthClosed}>
                <MassAbsenceModule nurses={props.activeNursesForMonth} currentDate={props.currentDate} onMassAbsenceApply={props.onMassAbsenceApply} />
            </CollapsibleModule>
        )}

        {/* 4. Strasbourg Events */}
        {permissions.canManageStrasbourg && (
            <CollapsibleModule title={t.strasbourgEvents} disabled={props.isMonthClosed}>
                <StrasbourgEventsModule
                    events={props.specialStrasbourgEvents}
                    nurses={props.nurses}
                    onEventsChange={props.onSpecialStrasbourgEventsChange}
                    isAdmin={permissions.isViewingAsAdmin}
                    effectiveUser={null}
                    log={props.specialStrasbourgEventsLog}
                    onClearLog={props.onClearStrasbourgLog}
                />
            </CollapsibleModule>
        )}

        {/* 5. Advanced Settings (Combined) */}
        {permissions.isViewingAsAdmin && (
            <CollapsibleModule title={t.advancedSettings} disabled={props.isMonthClosed}>
                <div className="space-y-6">
                    {permissions.canManageJornadas && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{t.jornada_title}</h4>
                            <button onClick={props.onOpenJornadaManager} className="w-full px-4 py-2 bg-zen-700 text-white font-semibold rounded-md hover:bg-zen-600 text-sm">
                                {t.jornada_manageButton}
                            </button>
                        </div>
                    )}

                    {permissions.canManageStrasbourg && (
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{t.strasbourgPlanner}</h4>
                            <StrasbourgAnnualPlanner nurses={props.nurses} strasbourgAssignments={props.strasbourgAssignments} onStrasbourgUpdate={props.onStrasbourgUpdate} />
                        </div>
                    )}

                    {permissions.canManageVaccination && (
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{t.vaccinationCampaign}</h4>
                            <VaccinationPeriodPlanner period={props.vaccinationPeriod} onPeriodChange={props.onVaccinationPeriodChange} />
                        </div>
                    )}
                </div>
            </CollapsibleModule>
        )}
        
    </div>
  );
};