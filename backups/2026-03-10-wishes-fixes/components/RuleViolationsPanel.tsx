import React from 'react';
import type { RuleViolation, Nurse } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';

interface RuleViolationsPanelProps {
  violations: RuleViolation[];
  nurses: Nurse[];
}

export const RuleViolationsPanel: React.FC<RuleViolationsPanelProps> = ({ violations, nurses }) => {
  const t = useTranslations();
  const { language } = useLanguage();

  const getNurseName = (nurseId: string) => {
    if (nurseId === 'global') return t.generalCoverage;
    return nurses.find(n => n.id === nurseId)?.name || t.unknown;
  };
  
  const getViolationContext = (violation: RuleViolation): string => {
      if (violation.dateKey) {
          return new Date(violation.dateKey + 'T12:00:00').toLocaleDateString(language, { day: 'numeric', month: 'short' });
      }
      if (violation.weekId) {
          return `${t.week} ${violation.weekId.split('-W')[1]}`;
      }
      return '';
  }

  if (violations.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-2 text-gray-700">{t.planningAlerts}</h3>
        <div className="flex items-center text-green-600">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          <p className="text-sm font-medium">{t.noConflicts}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4 text-gray-700 flex items-center">
        <span className="text-red-500 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </span>
        {t.planningAlerts} ({violations.length})
      </h3>
      <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {violations.map((v, index) => (
          <li key={index} className="flex items-start text-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${v.severity === 'error' ? 'text-red-500' : 'text-yellow-500'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            <div>
              <p className="font-semibold text-gray-800">
                {getNurseName(v.nurseId)} - {getViolationContext(v)}
              </p>
              <p className="text-gray-600">{v.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};