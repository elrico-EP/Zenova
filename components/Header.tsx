
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { MonthPicker } from './MonthPicker';
import { ExportControls } from './ExportControls';
import { ZenovaLogo } from './ZenovaLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Nurse, Schedule, Notes, Agenda, User, Hours, JornadaLaboral } from '../types';

type AppView = 'schedule' | 'balance' | 'wishes' | 'userManagement' | 'profile' | 'annual';

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
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1 text-gray-700">
                        {user.role === 'admin' && isImpersonating && (
                            <>
                                <button onClick={() => impersonate(null)} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 font-semibold">{t.returnToAdmin}</button>
                                <div className="border-t my-1"></div>
                            </>
                        )}
                        <button onClick={() => { setView('profile'); setIsOpen(false); }} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">{t.myProfile}</button>
                        {user.role === 'admin' && (
                            <>
                                <div className="border-t my-1"></div>
                                <div className="px-4 py-2 text-xs text-gray-400 uppercase">{t.selectView}</div>
                                <div className="max-h-48 overflow-y-auto">
                                    {nurses.map(n => <button key={n.id} onClick={() => { impersonate(n); setIsOpen(false); }} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">{n.name}</button>)}
                                </div>
                            </>
                        )}
                        <div className="border-t my-1"></div>
                        <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">{t.logout}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface HeaderProps {
  monthName: string;
  year: number;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
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
}

export const Header: React.FC<HeaderProps> = ({ monthName, year, currentDate, onDateChange, isMonthClosed, onToggleMonthLock, schedule, nurses, notes, agenda, hours, jornadasLaborales, onExportPdf, view, setView, onOpenHelp, onOpenHistory, onOpenAnnualPlanner }) => {
  const t = useTranslations();
  const permissions = usePermissions();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  
  const theme = permissions.isViewingAsAdmin ? 
    { bg: 'bg-zen-800', text: 'text-white', button: 'bg-white/10 text-white hover:bg-white/20', activeViewBg: 'bg-white', activeViewText: 'text-zen-800', inactiveViewText: 'text-zen-100 hover:text-white hover:bg-white/10' } :
    { bg: 'bg-zen-800', text: 'text-white', button: 'bg-white/10 text-white hover:bg-white/20', activeViewBg: 'bg-white', activeViewText: 'text-zen-800', inactiveViewText: 'text-zen-100 hover:text-white hover:bg-white/10' };

  const navButtonClass = (buttonView: AppView) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === buttonView ? `${theme.activeViewBg} ${theme.activeViewText} shadow-sm` : theme.inactiveViewText}`;
  const userMenuButtonClass = `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${theme.button}`;

  const handlePrevMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <header className={`no-print rounded-xl shadow-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 ${theme.bg} ${theme.text}`}>
      <div className="flex items-center gap-4">
        <ZenovaLogo className="h-10 w-10" />
        <h1 className="text-xl font-bold hidden lg:block">Zenova</h1>
      </div>
      
      <div className="flex items-center gap-2 bg-black/10 p-1 rounded-lg">
        <button onClick={handlePrevMonth} className={`p-2 rounded-md ${theme.button}`}><ArrowLeftIcon className="w-5 h-5" /></button>
        <div className="relative">
          <button onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)} className="px-4 py-2 text-center w-48 font-semibold capitalize rounded-md bg-white/5 hover:bg-white/10 transition-colors">{monthName} {year}</button>
          {isMonthPickerOpen && <MonthPicker currentDate={currentDate} onSelectDate={(d) => { onDateChange(d); setIsMonthPickerOpen(false); }} onClose={() => setIsMonthPickerOpen(false)} />}
        </div>
        <button onClick={handleNextMonth} className={`p-2 rounded-md ${theme.button}`}><ArrowRightIcon className="w-5 h-5" /></button>
      </div>
      
      <nav className="flex items-center gap-2 bg-black/10 p-1 rounded-lg">
        <button onClick={() => setView('schedule')} className={navButtonClass('schedule')}>{t.nav_agenda}</button>
        {permissions.isViewingAsAdmin && <button onClick={() => setView('balance')} className={navButtonClass('balance')}>{t.nav_balance}</button>}
        {permissions.isViewingAsAdmin && <button onClick={onOpenAnnualPlanner} className={navButtonClass('annual')}>{t['planner.annual_planner_title']}</button>}
        <button onClick={() => setView('wishes')} className={navButtonClass('wishes')}>{t.wishesViewButton}</button>
        {permissions.canManageUsers && <button onClick={() => setView('userManagement')} className={navButtonClass('userManagement')}>{t.nav_users}</button>}
        <button onClick={onOpenHistory} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${theme.inactiveViewText}`}>{t.historyLog}</button>
      </nav>

      <div className="flex items-center gap-2">
        {permissions.canLockMonth && ( <button onClick={onToggleMonthLock} className={userMenuButtonClass} title={isMonthClosed ? t.unlockMonth : t.lockMonth}> {isMonthClosed ? '🔓' : '🔒'} </button> )}
        {permissions.canExport && <ExportControls {...{ schedule, nurses, currentDate, onExportPdf, agenda, notes, hours, jornadasLaborales }} />}
        <button onClick={onOpenHelp} className={userMenuButtonClass} title={t.help}>?</button>
        <LanguageSwitcher />
        <UserMenu nurses={nurses} buttonClass={userMenuButtonClass} setView={setView} />
      </div>
    </header>
  );
};
