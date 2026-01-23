import React, { useState } from 'react';
import type { Nurse, ShiftRotation, ShiftRotationAssignment, ScheduleCell, WorkZone } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SHIFTS } from '../constants';

// A small component to display a shift cell visually
const ShiftChip: React.FC<{ cell: ScheduleCell }> = ({ cell }) => {
    let label = '?';
    let color = 'bg-gray-200';
    let textColor = 'text-gray-800';
    
    let shiftId: WorkZone | undefined;
    if (typeof cell === 'string') {
        // FIX: Explicitly cast cell to WorkZone to resolve type inference issue.
        shiftId = cell as WorkZone;
    } else if (typeof cell === 'object' && 'custom' in cell) {
        shiftId = cell.type;
        label = SHIFTS[cell.type!]?.label || '?';
    } else if (typeof cell === 'object' && 'split' in cell) {
        label = 'S'; // For Split
        color = 'bg-purple-200';
        textColor = 'text-purple-800';
    }

    if (shiftId && SHIFTS[shiftId]) {
        label = SHIFTS[shiftId].label;
        color = SHIFTS[shiftId].color;
        textColor = SHIFTS[shiftId].textColor;
    }
    
    return <div className={`px-1.5 py-0.5 text-xs font-bold rounded ${color} ${textColor}`}>{label}</div>;
}

interface ShiftRotationManagerProps {
  nurses: Nurse[];
  shiftRotations: ShiftRotation[];
  onShiftRotationsChange: (newRotations: ShiftRotation[]) => void;
  shiftRotationAssignments: ShiftRotationAssignment[];
  onShiftRotationAssignmentsChange: (newAssignments: ShiftRotationAssignment[]) => void;
}

const ALL_SHIFTS = Object.keys(SHIFTS) as WorkZone[];

export const ShiftRotationManager: React.FC<ShiftRotationManagerProps> = ({
  nurses,
  shiftRotations, onShiftRotationsChange,
  shiftRotationAssignments, onShiftRotationAssignmentsChange
}) => {
    const t = useTranslations();
    const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateShifts, setTemplateShifts] = useState<ScheduleCell[]>(['TRAVAIL']);

    const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
    const [selectedRotationId, setSelectedRotationId] = useState('');
    const [selectedNurseIds, setSelectedNurseIds] = useState<string[]>([]);
    const [assignmentStartDate, setAssignmentStartDate] = useState(new Date().toISOString().split('T')[0]);
    
    const handleAddDayToTemplate = () => setTemplateShifts([...templateShifts, 'TRAVAIL']);
    const handleTemplateShiftChange = (index: number, shift: WorkZone) => {
        const newShifts = [...templateShifts];
        newShifts[index] = shift;
        setTemplateShifts(newShifts);
    };
    const handleRemoveTemplateDay = (index: number) => {
        setTemplateShifts(templateShifts.filter((_, i) => i !== index));
    };

    const handleSaveTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!templateName.trim() || templateShifts.length === 0) return;
        const newRotation: ShiftRotation = {
            id: `rot-${Date.now()}`,
            name: templateName.trim(),
            shifts: templateShifts
        };
        onShiftRotationsChange([...shiftRotations, newRotation]);
        setTemplateName('');
        setTemplateShifts(['TRAVAIL']);
        setIsTemplateFormOpen(false);
    };
    
    const handleDeleteTemplate = (id: string) => {
        if (window.confirm(t.shiftRotations_delete_confirm)) {
            onShiftRotationsChange(shiftRotations.filter(r => r.id !== id));
            onShiftRotationAssignmentsChange(shiftRotationAssignments.filter(a => a.rotationId !== id));
        }
    };

    const handleSaveAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRotationId || selectedNurseIds.length === 0 || !assignmentStartDate) return;
        const newAssignment: ShiftRotationAssignment = {
            id: `assign-${Date.now()}`,
            rotationId: selectedRotationId,
            nurseIds: selectedNurseIds,
            startDate: assignmentStartDate,
        };
        onShiftRotationAssignmentsChange([...shiftRotationAssignments, newAssignment]);
        setSelectedRotationId('');
        setSelectedNurseIds([]);
        setAssignmentStartDate(new Date().toISOString().split('T')[0]);
        setIsAssignmentFormOpen(false);
    };

    const handleDeleteAssignment = (id: string) => {
        if (window.confirm(t.shiftRotations_delete_confirm)) {
            onShiftRotationAssignmentsChange(shiftRotationAssignments.filter(a => a.id !== id));
        }
    };
    
    return (
        <div className="space-y-6 text-sm">
            <div>
                <h4 className="font-semibold text-slate-700 mb-2">{t.shiftRotations_templates}</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {shiftRotations.map(rot => (
                        <div key={rot.id} className="p-2 bg-slate-100 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{rot.name}</span>
                                <button onClick={() => handleDeleteTemplate(rot.id)} className="text-red-500 hover:text-red-700 text-xs font-mono">X</button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {rot.shifts.map((cell, i) => <ShiftChip key={i} cell={cell} />)}
                            </div>
                        </div>
                    ))}
                </div>
                {!isTemplateFormOpen && <button onClick={() => setIsTemplateFormOpen(true)} className="mt-2 text-xs font-semibold text-zen-600 hover:underline">+ {t.shiftRotations_newTemplate}</button>}
                {isTemplateFormOpen && (
                    <form onSubmit={handleSaveTemplate} className="mt-2 p-3 bg-white border rounded-md space-y-2">
                         <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder={t.shiftRotations_templateName} required className="w-full p-1.5 border rounded-md" />
                         <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                             {templateShifts.map((shift, i) => (
                                 <div key={i} className="flex items-center gap-2">
                                     <span className="text-xs text-slate-500 w-12">{t.day} {i+1}</span>
                                     <select value={typeof shift === 'string' ? shift : ''} onChange={e => handleTemplateShiftChange(i, e.target.value as WorkZone)} className="flex-grow p-1 border rounded-md bg-white">
                                         {ALL_SHIFTS.map(sId => <option key={sId} value={sId}>{SHIFTS[sId].label}</option>)}
                                     </select>
                                     <button type="button" onClick={() => handleRemoveTemplateDay(i)} className="text-red-500 hover:text-red-700 text-xs font-mono">X</button>
                                 </div>
                             ))}
                         </div>
                         <button type="button" onClick={handleAddDayToTemplate} className="text-xs font-semibold text-zen-600 hover:underline">+ {t.shiftRotations_addDay}</button>
                         <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                            <button type="button" onClick={() => setIsTemplateFormOpen(false)} className="px-3 py-1 bg-slate-200 rounded-md">{t.cancel}</button>
                            <button type="submit" className="px-3 py-1 bg-zen-800 text-white rounded-md">{t.shiftRotations_saveTemplate}</button>
                         </div>
                    </form>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-slate-700 mb-2">{t.shiftRotations_assignments}</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {shiftRotationAssignments.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(assign => {
                        const rot = shiftRotations.find(r => r.id === assign.rotationId);
                        const assignedNurses = nurses.filter(n => assign.nurseIds.includes(n.id)).map(n => n.name).join(', ');
                        return (
                            <div key={assign.id} className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-800">{rot?.name || t.unknown}</span>
                                    <button onClick={() => handleDeleteAssignment(assign.id)} className="text-red-500 hover:text-red-700 text-xs font-mono">X</button>
                                </div>
                                <p className="text-xs text-blue-700 mt-1"><strong>{t.nurse}:</strong> {assignedNurses}</p>
                                <p className="text-xs text-blue-700"><strong>{t.startDate}:</strong> {assign.startDate}</p>
                            </div>
                        )
                    })}
                </div>
                {!isAssignmentFormOpen && <button onClick={() => setIsAssignmentFormOpen(true)} className="mt-2 text-xs font-semibold text-zen-600 hover:underline">+ {t.shiftRotations_assignNurses}</button>}
                {isAssignmentFormOpen && (
                    <form onSubmit={handleSaveAssignment} className="mt-2 p-3 bg-white border rounded-md space-y-2">
                         <select value={selectedRotationId} onChange={e => setSelectedRotationId(e.target.value)} required className="w-full p-1.5 border rounded-md bg-white">
                            <option value="" disabled>{t.shiftRotations_selectRotation}</option>
                            {shiftRotations.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                         </select>
                         <div className="max-h-24 overflow-y-auto border rounded-lg p-2 space-y-1 bg-slate-50">
                             {nurses.map(n => <label key={n.id} className="flex items-center p-1 rounded-md hover:bg-slate-100"><input type="checkbox" checked={selectedNurseIds.includes(n.id)} onChange={() => setSelectedNurseIds(p => p.includes(n.id) ? p.filter(id=>id!==n.id) : [...p, n.id])} className="mr-2"/>{n.name}</label>)}
                         </div>
                         <input type="date" value={assignmentStartDate} onChange={e => setAssignmentStartDate(e.target.value)} required className="w-full p-1.5 border rounded-md" />
                         <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                            <button type="button" onClick={() => setIsAssignmentFormOpen(false)} className="px-3 py-1 bg-slate-200 rounded-md">{t.cancel}</button>
                            <button type="submit" className="px-3 py-1 bg-zen-800 text-white rounded-md">{t.shiftRotations_saveAssignment}</button>
                         </div>
                    </form>
                )}
            </div>
        </div>
    );
};
