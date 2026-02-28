import React from 'react';

export type RecalcScope = 'none' | 'day' | 'week' | 'rest-month';

interface RecalcScopeModalProps {
  isOpen: boolean;
  contextLabel: string;
  onSelect: (scope: RecalcScope) => void;
  onClose: () => void;
}

export const RecalcScopeModal: React.FC<RecalcScopeModalProps> = ({
  isOpen,
  contextLabel,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Recalcular planificación</h3>
          <p className="text-sm text-slate-600 mt-1">Has hecho un {contextLabel}. Elige el alcance del recálculo.</p>
        </div>

        <div className="p-4 grid grid-cols-1 gap-2">
          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('none')}
          >
            <span className="font-medium text-slate-800">Nada</span>
            <p className="text-xs text-slate-500 mt-0.5">No recalcular (recomendado)</p>
          </button>

          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('day')}
          >
            <span className="font-medium text-slate-800">Solo día</span>
            <p className="text-xs text-slate-500 mt-0.5">Recalcula únicamente la fecha afectada</p>
          </button>

          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('week')}
          >
            <span className="font-medium text-slate-800">Solo semana</span>
            <p className="text-xs text-slate-500 mt-0.5">Recalcula la semana de la fecha afectada</p>
          </button>

          <button
            type="button"
            className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => onSelect('rest-month')}
          >
            <span className="font-medium text-slate-800">Resto del mes</span>
            <p className="text-xs text-slate-500 mt-0.5">Recalcula desde la fecha hasta fin de mes</p>
          </button>
        </div>

        <div className="px-4 pb-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancelar (Nada)
          </button>
        </div>
      </div>
    </div>
  );
};
