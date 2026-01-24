
import React, { useState, useMemo, useEffect } from 'react';
import type { Nurse, Schedule, ScheduleCell } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SHIFTS } from '../constants';

interface SwapShiftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nurses: Nurse[];
  schedule: Schedule;
  onConfirmSwap: (payload: { date: string; nurse1Id: string; nurse2Id: string }) => void;
  initialDate: string;
  initialNurseId: string;
  isMonthClosed?: boolean;
}

const ShiftDisplay: React.FC<{ cell: ScheduleCell | undefined }> = ({ cell }) => {
    const t = useTranslations();
    if (!cell) {
        return <span className="text-slate-500 italic">{t.shift_free}</span>;
    }
    let shiftId;
    if (typeof cell === 'string') {
        shiftId = cell;
    } else if (typeof cell === 'object' && 'type' in cell && cell.type) {
        shiftId = cell.type;
    }

    const shiftInfo = shiftId ? SHIFTS[shiftId] : null;

    if (shiftInfo) {
        return <div className={`px-2 py-1 text-sm font-semibold rounded-md ${shiftInfo.color} ${shiftInfo.textColor}`}>{shiftInfo.label}</div>
    }
    
    if (typeof cell === 'object' && 'custom' in cell) {
         return <div className="px-2 py-1 text-sm font-semibold rounded-md bg-slate-200 text-slate-700">{cell.custom.split('\n')[0]}</div>
    }
    
    return <span className="text-slate-500 italic">{t.shift_complex}</span>;
}

export const SwapShiftPanel: React.FC<SwapShiftPanelProps> = ({ isOpen, onClose, nurses, schedule, onConfirmSwap, initialDate, initialNurseId, isMonthClosed }) => {
  const t = useTranslations();
  
  const [nurse2Id, setNurse2Id] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNurse2Id('');
      setError('');
    }
  }, [isOpen]);

  const nurse1 = useMemo(() => nurses.find(n => n.id === initialNurseId), [initialNurseId, nurses]);
  const nurse2 = useMemo(() => nurses.find(n => n.id === nurse2Id), [nurse2Id, nurses]);

  const { shift1, shift2 } = useMemo(() => {
    if (!isOpen) return { shift1: undefined, shift2: undefined };
    const s1 = schedule[initialNurseId]?.[initialDate];
    const s2 = schedule[nurse2Id]?.[initialDate];
    return { shift1: s1, shift2: s2 };
  }, [initialDate, initialNurseId, nurse2Id, schedule, isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMonthClosed) { setError(t.unlockMonth); return; }
    if (!initialNurseId || !nurse2Id) { setError(t.swap_error_nurses); return; }
    
    if (shift1 === shift2) { // Allow swapping same shifts (effectively does nothing but useful for re-assignment logic)
        // No error, just proceed.
    }

    if (!shift1 && !shift2) {
        // If both are free, there's nothing to swap.
        setError(t.swap_error_noShift);
        return;
    }

    setError('');
    onConfirmSwap({ date: initialDate, nurse1Id: initialNurseId, nurse2Id });
    onClose();
  };

  const availableNursesForB = nurses.filter(n => n.id !== initialNurseId);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <header className="p-4 border-b border-slate-200 bg-white flex-shrink-0 flex items-center gap-4">
                <button onClick={onClose} className="p-1 text-slate-500 hover:bg-slate-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span>🔁</span> {t.swapShifts}
                </h3>
            </header>
            
            <form id="swap-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-4 space-y-6">
                <section className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t.day}</label>
                        <p className="font-medium text-slate-800">{initialDate ? new Date(initialDate + 'T12:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t.nurse1}</label>
                        <p className="font-medium text-slate-800">{nurse1?.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                            <span className="text-slate-500">{t.swap_original}</span>
                            <ShiftDisplay cell={shift1} />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t.nurse2}</label>
                    <select value={nurse2Id} onChange={e => setNurse2Id(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm">
                        <option value="" disabled>{t.selectNursePrompt}</option>
                        {availableNursesForB.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                    {nurse2Id && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="text-slate-500">{t.swap_original}</span>
                            <ShiftDisplay cell={shift2} />
                        </div>
                    )}
                </section>
                
                {nurse1 && nurse2 && (
                  <section className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <h4 className="font-bold text-blue-800">{t.swapPreview}</h4>
                      <div className="text-sm text-blue-900 space-y-1">
                          <p className="flex items-center gap-2"><strong>{nurse1?.name}:</strong> <ShiftDisplay cell={shift2} /></p>
                          <p className="flex items-center gap-2"><strong>{nurse2?.name}:</strong> <ShiftDisplay cell={shift1} /></p>
                      </div>
                  </section>
                )}

                {error && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{error}</p>}
            </form>
            
            <footer className="p-4 bg-white border-t border-slate-200 flex-shrink-0 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 font-medium">{t.cancel}</button>
                <button type="submit" form="swap-form" className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700" disabled={!nurse2Id || isMonthClosed}>{t.confirmSwap}</button>
            </footer>
        </div>
      </div>
    </>
  );
};
