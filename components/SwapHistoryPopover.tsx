
import React, { useRef, useEffect } from 'react';
import type { Nurse, ScheduleCell, SwapInfo } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { SHIFTS } from '../constants';

interface SwapHistoryPopoverProps {
  nurseId: string;
  nurses: Nurse[];
  visualSwaps: Record<string, Record<string, SwapInfo>>;
  onClose: () => void;
  onUndoSwap: (payload: { dateKey: string, nurseId1: string, nurseId2: string }) => void;
  targetElement: HTMLElement | null;
}

const ShiftDisplay: React.FC<{ cell: ScheduleCell | undefined }> = ({ cell }) => {
    if (!cell) return <span className="text-slate-500 italic">Libre</span>;
    let shiftId;
    if (typeof cell === 'string') shiftId = cell;
    else if (typeof cell === 'object' && 'type' in cell && cell.type) shiftId = cell.type;

    const shiftInfo = shiftId ? SHIFTS[shiftId] : null;
    if (shiftInfo) return <div className={`px-1.5 py-0.5 text-xs font-semibold rounded ${shiftInfo.color} ${shiftInfo.textColor}`}>{shiftInfo.label}</div>
    if (typeof cell === 'object' && 'custom' in cell) return <div className="px-1.5 py-0.5 text-xs font-semibold rounded bg-slate-200 text-slate-700">{cell.custom.split('\n')[0]}</div>
    return <span className="text-slate-500 italic">Complejo</span>;
}

export const SwapHistoryPopover: React.FC<SwapHistoryPopoverProps> = ({ nurseId, nurses, visualSwaps, onClose, onUndoSwap, targetElement }) => {
    const t = useTranslations();
    const popoverRef = useRef<HTMLDivElement>(null);
    const nurseName = nurses.find(n => n.id === nurseId)?.name;

    const swaps = Object.entries(visualSwaps)
        .map(([dateKey, dailySwaps]) => ({ dateKey, swap: dailySwaps[nurseId] }))
        .filter(item => item.swap)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    const popoverStyle: React.CSSProperties = { position: 'fixed', zIndex: 50 };
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        popoverStyle.top = `${rect.bottom + 8}px`;
        popoverStyle.left = `${rect.left}px`;
    }

    return (
        <div ref={popoverRef} style={popoverStyle} className="w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-96">
            <header className="p-3 border-b flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-slate-800">{t.swapHistory} - {nurseName}</h3>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">&times;</button>
            </header>
            <main className="flex-grow overflow-y-auto p-3 space-y-2 text-sm">
                {swaps.length === 0 ? (
                    <p className="text-slate-500 italic text-center p-4">{t.noSwaps}</p>
                ) : (
                    swaps.map(({ dateKey, swap }) => {
                        const swappedWithNurse = nurses.find(n => n.id === swap.swappedWithNurseId);
                        return (
                            <div key={dateKey} className="p-2 bg-slate-50 rounded-md">
                                <p className="font-semibold text-slate-700">{new Date(dateKey + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                <div className="mt-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShiftDisplay cell={swap.originalShift} />
                                        <span>&rarr;</span>
                                        <ShiftDisplay cell={swap.shownShift} />
                                        <span className="text-slate-500 text-xs">({t.swappedWith} {swappedWithNurse?.name})</span>
                                    </div>
                                    <button 
                                        onClick={() => onUndoSwap({ dateKey, nurseId1: nurseId, nurseId2: swap.swappedWithNurseId })}
                                        className="text-xs text-blue-600 hover:underline"
                                    >{t.undoSwap}</button>
                                </div>
                            </div>
                        )
                    })
                )}
            </main>
        </div>
    );
};
