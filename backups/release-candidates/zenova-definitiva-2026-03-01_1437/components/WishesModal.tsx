
import React from 'react';
import type { Nurse, Wishes, Agenda } from '../types';
import { WishesCalendar } from './WishesCalendar';
import { useTranslations } from '../hooks/useTranslations';

interface WishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  nurses: Nurse[];
  year: number;
  wishes: Wishes;
  onWishesChange: (nurseId: string, dateKey: string, text: string) => void;
  agenda: Agenda;
}

export const WishesModal: React.FC<WishesModalProps> = (props) => {
  const t = useTranslations();
  const { isOpen, onClose } = props;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-slate-50 rounded-lg shadow-xl p-4 m-4 max-w-full w-full relative transform transition-all flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-zen-800">{t.wishesPageTitle}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label={t.close}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-grow overflow-auto">
          <WishesCalendar {...props} />
        </main>
      </div>
    </div>
  );
};