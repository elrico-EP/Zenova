
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { MonthPicker } from './MonthPicker';
import { ExportControls } from './ExportControls';
import { ZenovaLogo } from './ZenovaLogo';
import type { Nurse, Schedule, Notes, Agenda, User } from '../types';

const UserMenu: React.FC<{ nurses: Nurse[]; buttonClass: string }> = ({ nurses, buttonClass }) => {
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
                        {user.role === 'admin' && (
                            <>
                                {isImpersonating && <button onClick={() => impersonate(null)} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 font-semibold">{t.returnToAdmin}</button>}
                                <div className="px-4 py-2 text-xs text-gray-400 uppercase">{t.selectView}</div>
                                {nurses.map(n => <button key={n.id} onClick={() => { impersonate(n); setIsOpen(false); }} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">{n.name}</button>)}
                                <div className="border-t my-1"></div>
                            </>
                        )}
                        <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">Cerrar Sesión</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// FIX: Destructure 'buttonClass' from props to make it available in the component.
const LanguageSwitcher: React.FC<{ buttonClass: string }> = ({ buttonClass }) => {
    const { language, setLanguage } = useLanguage();
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

    const languages = { es: 'Español', en: 'English', fr: 'Français' };

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`${buttonClass} !font-bold`} title={t.changeLanguage}>
                {language.toUpperCase()}
                 <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1 text-gray-700">
                        {(Object.keys(languages) as Array<keyof typeof languages>).map(lang => (
                            <button
                                key={lang}
                                onClick={() => { setLanguage(lang); setIsOpen(false); }}
                                className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                {languages[lang]}
                            </button>
                        ))}
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
  onExportPdf: () => Promise<void>;
  view: 'schedule' | 'balance' | 'wishes' | 'userManagement';
  setView: (view: 'schedule' | 'balance' | 'wishes' | 'userManagement') => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ monthName, year, currentDate, onDateChange, isMonthClosed, onToggleMonthLock, schedule, nurses, notes, agenda, onExportPdf, view, setView, onOpenHelp }) => {
  const t = useTranslations();
  const permissions = usePermissions();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  
  const theme = permissions.isViewingAsAdmin
  ? {
      bg: 'bg-admin-red-500',
      text: 'text-white',
      secondaryBg: 'bg-black/10',
      focusOffset: 'focus:ring-offset-admin-red-500',
      buttonOverlay: 'bg-white/10 hover:bg-white/20',
      buttonBorder: 'border-white/20',
      activeViewText: 'text-admin-red-900', // Texto sobre el fondo claro del botón activo
      inactiveViewText: 'text-white/80 hover:text-white hover:bg-white/10',
    }
  : {
      bg: 'bg-user-blue-500',
      text: 'text-white',
      secondaryBg: 'bg-black/10',
      focusOffset: 'focus:ring-offset-user-blue-500',
      buttonOverlay: 'bg-white/10 hover:bg-white/20',
      buttonBorder: 'border-white/20',
      activeViewText: 'text-user-blue-900', // Texto sobre el fondo claro del botón activo
      inactiveViewText: 'text-white/80 hover:text-white hover:bg-white/10',
    };

  const goToPreviousMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => onDateChange(new Date());
  const handleDateSelect = (newDate: Date) => { onDateChange(newDate); setIsMonthPickerOpen(false); };
  
  const ViewToggleButton: React.FC<{ targetView: 'schedule' | 'balance' | 'wishes' | 'userManagement', label: string }> = ({ targetView, label }) => (
      <button 
        onClick={() => setView(targetView)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
          view === targetView 
            ? `bg-white/80 ${theme.activeViewText}` 
            : theme.inactiveViewText
        }`}
      >
        {label}
      </button>
  );

  const userMenuButtonClass = `flex items-center gap-2 p-2 rounded-lg ${theme.buttonOverlay}`;
  const actionButtonClass = `px-3 py-2 text-sm font-medium ${theme.buttonOverlay} ${theme.buttonBorder} rounded-md shadow-sm focus:outline-none focus:ring-2 ${theme.focusOffset} focus:ring-current transition-colors flex items-center gap-2`;

  return (
    <header className={`${theme.bg} ${theme.text} shadow-lg rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between no-print`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`${theme.buttonOverlay} p-2 rounded-lg`}><ZenovaLogo className="h-8 w-8" /></div>
          <span className="text-2xl font-bold tracking-wider"><span className="text-nova-500">Z</span>ENOVA</span>
        </div>
         <div className={`${theme.secondaryBg} rounded-lg p-1 flex items-center`}>
            <ViewToggleButton targetView="schedule" label="Planning" />
            <ViewToggleButton targetView="wishes" label={t.wishesViewButton} />
            {permissions.isViewingAsAdmin && (
              <>
                <ViewToggleButton targetView="balance" label="Balance" />
                <ViewToggleButton targetView="userManagement" label="Usuarios" />
              </>
            )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 sm:mt-0">
        {permissions.canExport && <ExportControls schedule={schedule} nurses={nurses} currentDate={currentDate} notes={notes} agenda={agenda} onExportPdf={onExportPdf} />}
        <button onClick={goToToday} className={actionButtonClass}>{t.today}</button>
        <div className={`relative flex items-center ${theme.buttonOverlay} rounded-md p-1`}>
            <button onClick={goToPreviousMonth} className={`p-2 rounded-md ${theme.buttonOverlay}`} aria-label={t.previousMonth}><ArrowLeftIcon className="w-5 h-5" /></button>
            <div className="relative">
              <button onClick={() => setIsMonthPickerOpen(true)} className={`px-2 py-1 rounded-md ${theme.buttonOverlay}`}><h2 className="text-xl font-semibold w-48 text-center capitalize">{`${monthName} ${year}`}</h2></button>
              {isMonthPickerOpen && <MonthPicker currentDate={currentDate} onSelectDate={handleDateSelect} onClose={() => setIsMonthPickerOpen(false)} />}
            </div>
            <button onClick={goToNextMonth} className={`p-2 rounded-md ${theme.buttonOverlay}`} aria-label={t.nextMonth}><ArrowRightIcon className="w-5 h-5" /></button>
        </div>
        <button onClick={onOpenHelp} className={`${actionButtonClass} !border-0`}>{t.help}</button>
        <LanguageSwitcher buttonClass={actionButtonClass} />
        
        {permissions.canLockMonth && (
            <div className="flex items-center">
                <button onClick={onToggleMonthLock} className={`p-2 rounded-md transition-colors text-white ${isMonthClosed ? 'bg-black/30 hover:bg-black/40' : 'bg-white/20 hover:bg-white/30'}`} title={isMonthClosed ? t.unlockMonth : t.lockMonth}>
                  {isMonthClosed ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 9a1 1 0 100-2 1 1 0 000 2z" /></svg>}
                </button>
            </div>
        )}
        <div className="h-6 w-px bg-white/20 mx-2"></div>
        <UserMenu nurses={nurses} buttonClass={userMenuButtonClass} />
      </div>
    </header>
  );
};
