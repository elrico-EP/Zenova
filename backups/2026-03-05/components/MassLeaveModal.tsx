
import React, { useState } from 'react';
import type { Nurse, WorkZone } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface MassLeaveModalProps {
  nurse: Nurse;
  onClose: () => void;
  onApply: (nurseId: string, startDate: string, endDate: string, shift: WorkZone) => void;
}

export const MassLeaveModal: React.FC<MassLeaveModalProps> = ({ nurse, onClose, onApply }) => {
  const t = useTranslations();
  
  const leaveTypes: { value: WorkZone; label: string }[] = [
    { value: 'CA', label: t.leaveType_CA },
    { value: 'SICK_LEAVE', label: t.leaveType_SICK_LEAVE },
    { value: 'FP', label: t.leaveType_FP },
  ];

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [leaveType, setLeaveType] = useState<WorkZone>('CA');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      setError(t.error_dateOrder);
      return;
    }
    setError('');
    onApply(nurse.id, startDate, endDate, leaveType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
          aria-label={t.close}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">{t.massAssignAbsence}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t.for}: <span className="font-semibold">{nurse.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">
              {t.absenceType}
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as WorkZone)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {leaveTypes.map(lt => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                {t.startDate}
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                {t.endDate}
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              {t.applyToWorkdays}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};