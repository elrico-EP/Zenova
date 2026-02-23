import React from 'react';
import type { HistoryEntry } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';

interface HistoryLogProps {
  history: HistoryEntry[];
  onDeleteEntry?: (id: string) => void;
  onClearAll?: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history, onDeleteEntry, onClearAll }) => {
  const t = useTranslations();
  const { language } = useLanguage();
  const permissions = usePermissions();

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(language, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-2">
      {permissions.isViewingAsAdmin && onClearAll && history.length > 0 && (
        <div className="flex justify-end mb-2">
          <button 
            onClick={() => {
              if (window.confirm('¿Borrar todo el historial?')) onClearAll();
            }}
            className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
          >
            {t.clearAll || 'Limpiar Todo'}
          </button>
        </div>
      )}
      {history.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No hay cambios registrados.</p>
      ) : (
        history.map(entry => (
          <div key={entry.id} className="text-xs p-2 bg-slate-50 rounded-md border border-slate-200/80 group relative">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <p className="font-semibold text-slate-700">{entry.action}</p>
                <p className="text-slate-600">{entry.details}</p>
              </div>
              {permissions.isViewingAsAdmin && onDeleteEntry && (
                <button 
                  onClick={() => onDeleteEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                  title="Eliminar entrada"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-1">
                <p className="text-slate-400">
                    {entry.user} - {formatDate(entry.timestamp)}
                </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};