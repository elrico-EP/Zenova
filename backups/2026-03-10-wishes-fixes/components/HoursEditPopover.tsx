import React, { useState, useEffect, useRef } from 'react';
import type { TimeSegment } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface HoursEditPopoverProps {
    anchorEl: HTMLElement;
    initialSegments: TimeSegment[] | undefined;
    initialNote: string | undefined;
    onSave: (segments: TimeSegment[], note: string) => void;
    onClose: () => void;
}

export const HoursEditPopover: React.FC<HoursEditPopoverProps> = ({ anchorEl, initialSegments, initialNote, onSave, onClose }) => {
    const t = useTranslations();
    const popoverRef = useRef<HTMLDivElement>(null);
    
    // For now, only support one segment. Can be extended later.
    const [startTime, setStartTime] = useState(initialSegments?.[0]?.startTime || '');
    const [endTime, setEndTime] = useState(initialSegments?.[0]?.endTime || '');
    const [note, setNote] = useState(initialNote || '');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSave = () => {
        const segments: TimeSegment[] = [];
        if (startTime && endTime) {
            segments.push({ startTime, endTime });
        }
        onSave(segments, note);
    };

    const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 50,
    };
    if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        style.top = `${rect.bottom + 8}px`;
        style.left = `${rect.left}px`;
    }

    return (
        <div ref={popoverRef} style={style} className="bg-white rounded-lg shadow-2xl border border-gray-300 p-4 w-72">
            <h4 className="font-semibold text-lg mb-4 text-slate-800">{t.changeMyHours}</h4>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-center p-1 border rounded-md text-sm" />
                    <span>-</span>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full text-center p-1 border rounded-md text-sm" />
                </div>
                <div>
                    <textarea 
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder={t.reasonForChange}
                        rows={2}
                        className="w-full p-2 border rounded-md text-sm"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="px-3 py-1 text-sm bg-slate-200 rounded-md">{t.cancel}</button>
                <button onClick={handleSave} className="px-3 py-1 text-sm bg-zen-800 text-white rounded-md">{t.save}</button>
            </div>
        </div>
    );
};