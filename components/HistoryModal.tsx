import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { HistoryEntry } from '../types';
import { HistoryLog } from './HistoryLog';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
  onDeleteHistoryEntry: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClearHistory, onDeleteHistoryEntry }) => {
  const t = useTranslations();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full relative transform transition-all flex flex-col h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-4 border-b mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">{t.historyLog}</h2>
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

        <main className="overflow-y-auto pr-2">
          <HistoryLog 
            history={history} 
            onClearAll={onClearHistory}
            onDeleteEntry={onDeleteHistoryEntry}
          />
        </main>
      </div>
    </div>
  );
};