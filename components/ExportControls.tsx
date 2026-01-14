
import React, { useState, useEffect, useRef } from 'react';
import type { Nurse, Schedule, Notes, Agenda } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { copyScheduleToClipboard } from '../utils/exportUtils';

interface ExportControlsProps {
    schedule: Schedule;
    nurses: Nurse[];
    currentDate: Date;
    notes: Notes;
    agenda: Agenda;
    onExportPdf: () => Promise<void>;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ schedule, nurses, currentDate, onExportPdf, agenda, notes }) => {
    const t = useTranslations();
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportToPdf = async () => {
        setIsMenuOpen(false);
        setIsPdfLoading(true);
        try {
            await onExportPdf();
        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setIsPdfLoading(false);
        }
    };

    const handleCopyToClipboard = async () => {
        setIsMenuOpen(false);
        await copyScheduleToClipboard(schedule, nurses, currentDate, agenda, notes);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="px-4 py-2 flex items-center text-sm font-medium bg-white/10 border border-white/20 rounded-md shadow-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-colors"
            >
                {t.export}
                <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={handleExportToPdf} disabled={isPdfLoading} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50" role="menuitem">
                            {isPdfLoading ? <svg className="h-5 w-5 mr-3 animate-spin text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>}
                            {t.exportPDF}
                        </button>
                        <button onClick={handleCopyToClipboard} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                             {copyStatus === 'copied' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>
                             )}
                            {copyStatus === 'copied' ? t.copied : t.copyToSheets}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
