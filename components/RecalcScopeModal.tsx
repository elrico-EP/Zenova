import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

export type RecalcScope = 'none' | 'day' | 'week' | 'rest-month';

interface RecalcScopeModalProps {
  isOpen: boolean;
  context: 'manual' | 'swap';
  onSelect: (scope: RecalcScope) => void;
  onClose: () => void;
}

export const RecalcScopeModal: React.FC<RecalcScopeModalProps> = ({
  isOpen,
  context,
  onSelect,
  onClose,
}) => {
  const t = useTranslations();

  if (!isOpen) return null;

  const contextText = context === 'manual' ? t.recalcScope_context_manual : t.recalcScope_context_swap;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{t.recalcScope_title}</h3>
          <p className="text-sm text-slate-600 mt-1">{t.recalcScope_description.replace('{context}', contextText)}</p>
        </div>

        <div className="p-4 grid grid-cols-1 gap-2">
          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('none')}
          >
            <span className="font-medium text-slate-800">{t.recalcScope_none_title}</span>
            <p className="text-xs text-slate-500 mt-0.5">{t.recalcScope_none_desc}</p>
          </button>

          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('day')}
          >
            <span className="font-medium text-slate-800">{t.recalcScope_day_title}</span>
            <p className="text-xs text-slate-500 mt-0.5">{t.recalcScope_day_desc}</p>
          </button>

          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('week')}
          >
            <span className="font-medium text-slate-800">{t.recalcScope_week_title}</span>
            <p className="text-xs text-slate-500 mt-0.5">{t.recalcScope_week_desc}</p>
          </button>

          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('rest-month')}
          >
            <span className="font-medium text-slate-800">{t.recalcScope_restMonth_title}</span>
            <p className="text-xs text-slate-500 mt-0.5">{t.recalcScope_restMonth_desc}</p>
          </button>
        </div>

        <div className="px-4 pb-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            {t.recalcScope_cancel_none}
          </button>
        </div>
      </div>
    </div>
  );
};
