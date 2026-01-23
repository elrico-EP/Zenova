import React from 'react';
import type { HistoryEntry } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../hooks/usePermissions';

interface HistoryLogProps {
  history: HistoryEntry[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
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
      {history.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No hay cambios registrados.</p>
      ) : (
        history.map(entry => (
          <div key={entry.id} className="text-xs p-2 bg-slate-50 rounded-md border border-slate-200/80">
            <p className="font-semibold text-slate-700">{entry.action}</p>
            <p className="text-slate-600">{entry.details}</p>
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