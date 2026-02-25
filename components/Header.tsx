import React, { useState, useRef, useEffect } from 'react';
// FIX: Add MaximizeIcon and RestoreIcon for the fullscreen toggle button.
import { ArrowLeftIcon, ArrowRightIcon, MaximizeIcon, RestoreIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { MonthPicker } from './MonthPicker';
import { ExportControls } from './ExportControls';
import { ZenovaLogo } from './ZenovaLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Nurse, Schedule, Notes, Agenda, User, Hours, JornadaLaboral } from '../types';

export type AppView = 'schedule' | 'balance' | 'wishes' | 'userManagement' | 'profile';

const UserMenu: React.FC<{
    nurses: Nurse[];
    buttonClass: string;
    setView: (view: AppView) => void;
}> = ({ nurses, buttonClass, setView }) => {
    const { user, effectiveUser, logout, impersonate, isImpersonating } = useUser();
    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={buttonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" /></svg>
                <span className="font-medium text-sm">{isImpersonating ? `${t.viewingAs} ${effectiveUser?.name}` : user.name}</span>
                 <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                     <div className="py-1">
                        <div className="px-4 py-2 text-sm text-slate-700 border-b">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        {user.role !== 'viewer' && (
                            <button onClick={() => { setView('profile'); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t.myProfile}</button>
                        )}
                        {user.role === 'admin' && (
                            <div className="border-t">
                                <div className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase">{t.adminView}</div>
                                <div className="max-h-40 overflow-y-auto">
                                    {nurses.map(nurse => (
                                        <button key={nurse.id} onClick={() => { impersonate(nurse); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                            {t.viewingAs} {nurse.name}
                                        </button>
                                    ))}
                                </div>
                                {isImpersonating && <button onClick={() => { impersonate(null); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t">{t.returnToAdmin}</button>}
                            </div>
                        )}
                        <div className="border-t">
                             <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">{t.logout}</button>
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};


interface HeaderProps {
  monthName: string;
  year: number;
  onDateChange: (date: Date) => void;
  currentDate: Date;
  isMonthClosed: boolean;
  onToggleMonthLock: () => void;
  schedule: Schedule;
  nurses: Nurse[];
  notes: Notes;
  agenda: Agenda;
  hours: Hours;
  jornadasLaborales: JornadaLaboral[];
  onExportPdf: () => Promise<void>;
  view: AppView;
  setView: (view: AppView) => void;
  onOpenHelp: () => void;
  onOpenHistory: () => void;
  onOpenAnnualPlanner: () => void;
  // FIX: Add missing props to support fullscreen toggle functionality passed from App.tsx
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  monthName, year, onDateChange, currentDate, isMonthClosed, onToggleMonthLock,
  schedule, nurses, notes, agenda, hours, jornadasLaborales, onExportPdf,
  view, setView, onOpenHelp, onOpenHistory, onOpenAnnualPlanner,
  // FIX: Destructure new fullscreen props to be used in the component.
  onToggleFullscreen, isFullscreen
}) => {
  const t = useTranslations();
  const permissions = usePermissions();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const { user } = useUser();

  const handlePrevMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const navButtonClass = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
  const activeNavClass = "bg-white text-zen-800 shadow";
  const inactiveNavClass = "text-white hover:bg-white/20";

  const userButtonClass = "px-3 py-2 flex items-center gap-2 text-sm font-medium bg-white/10 border border-white/20 rounded-full shadow-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-colors text-white";

  return (
    <header className="bg-zen-800 text-white p-4 rounded-xl shadow-lg no-print">
      {/* TOP ROW: Identity, Main Nav, User Menu */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <ZenovaLogo className="h-10 w-10" />
          <h1 className="text-xl font-bold hidden md:block">{t.appTitle}</h1>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-black/20 p-1 rounded-lg">
            <button onClick={() => setView('schedule')} className={`${navButtonClass} ${view === 'schedule' ? activeNavClass : inactiveNavClass}`}>{t.nav_agenda}</button>
            {!permissions.isViewingAsViewer && <button onClick={() => setView('balance')} className={`${navButtonClass} ${view === 'balance' ? activeNavClass : inactiveNavClass}`}>{t.nav_balance}</button>}
            {!permissions.isViewingAsViewer && <button onClick={() => setView('wishes')} className={`${navButtonClass} ${view === 'wishes' ? activeNavClass : inactiveNavClass}`}>{t.wishesViewButton}</button>}
            {permissions.canManageUsers && user?.role === 'admin' && <button onClick={() => setView('userManagement')} className={`${navButtonClass} ${view === 'userManagement' ? activeNavClass : inactiveNavClass}`}>{t.nav_users}</button>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
            <UserMenu nurses={nurses} buttonClass={userButtonClass} setView={setView} />
        </div>
      </div>

      {/* BOTTOM ROW: Date Nav & Actions */}
      <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-white/20"><ArrowLeftIcon className="w-5 h-5" /></button>
            <div className="relative">
                <button onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)} className="font-semibold text-lg w-48 text-center capitalize">{monthName} {year}</button>
                {isMonthPickerOpen && <MonthPicker currentDate={currentDate} onSelectDate={(d) => { onDateChange(d); setIsMonthPickerOpen(false); }} onClose={() => setIsMonthPickerOpen(false)} />}
            </div>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white/20"><ArrowRightIcon className="w-5 h-5" /></button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
            {permissions.canLockMonth && (
                <button 
                    onClick={onToggleMonthLock} 
                    className={`px-3 py-2 flex items-center gap-2 text-sm font-bold rounded-md shadow-sm transition-all duration-200 ${
                        isMonthClosed 
                        ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-300 ring-offset-1' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                    title={isMonthClosed ? t.unlockMonth : t.lockMonth}
                >
                    <span>{isMonthClosed ? '🔒' : '🔓'}</span>
                    <span className="hidden sm:inline">
                        {isMonthClosed ? t.locked : t.editable}
                    </span>
                </button>
            )}
            <ExportControls schedule={schedule} nurses={nurses} currentDate={currentDate} onExportPdf={onExportPdf} notes={notes} agenda={agenda} hours={hours} jornadasLaborales={jornadasLaborales} />
            {permissions.canSeeAdminModules && (
                <button onClick={onOpenAnnualPlanner} className="p-2 flex items-center text-sm font-medium bg-white/10 border border-white/20 rounded-md shadow-sm hover:bg-white/20" title={t['planner.annual_planner_title']}>
                    📅
                </button>
            )}
            <button onClick={onToggleFullscreen} className="p-2 flex items-center text-sm font-medium bg-white/10 border border-white/20 rounded-md shadow-sm hover:bg-white/20" title={isFullscreen ? t.restore : t.maximize}>
                {isFullscreen ? <RestoreIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
            </button>
            <button onClick={onOpenHistory} className="p-2 flex items-center text-sm font-medium bg-white/10 border border-white/20 rounded-md shadow-sm hover:bg-white/20" title={t.historyLog}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <button onClick={onOpenHelp} className="p-2 flex items-center text-sm font-medium bg-white/10 border border-white/20 rounded-md shadow-sm hover:bg-white/20" title={t.help}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};