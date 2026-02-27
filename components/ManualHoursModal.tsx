import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { useTranslations } from '../hooks/useTranslations';
import type { Nurse, ScheduleCell, PersonalHoursChangePayload, Hours, Agenda, SpecialStrasbourgEvent, JornadaLaboral } from '../types';
import { SHIFTS } from '../constants';
import { getScheduleCellHours } from '../utils/scheduleUtils';
import { getWeekIdentifier } from '../utils/dateUtils';

interface ManualHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  nurse: Nurse | null;
  dateKey: string;
  scheduleCell: ScheduleCell | undefined;
  hours: Hours;
  onSave: (payload: PersonalHoursChangePayload) => void;
  isMonthClosed: boolean;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  jornadasLaborales: JornadaLaboral[];
}

export const ManualHoursModal: React.FC<ManualHoursModalProps> = ({ isOpen, onClose, nurse, dateKey, scheduleCell, hours, onSave, isMonthClosed, agenda, strasbourgAssignments, specialStrasbourgEvents, jornadasLaborales }) => {
  const t = useTranslations();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const dailyHoursData = useMemo(() => {
    return nurse ? hours[nurse.id]?.[dateKey] : undefined;
  }, [hours, nurse, dateKey]);

  useEffect(() => {
    if (isOpen && dailyHoursData?.segments?.[0]) {
      setStartTime(dailyHoursData.segments[0].startTime || '');
      setEndTime(dailyHoursData.segments[0].endTime || '');
      setReason(dailyHoursData.note || '');
    } else if (isOpen && scheduleCell && nurse) {
        // If no manual hours, calculate hours based on context (Strasbourg week, jornadas, etc.)
        const date = new Date(dateKey + 'T12:00:00');
        const weekId = getWeekIdentifier(date);
        const activityLevel = agenda[weekId] || 'NORMAL';
        const specialEvent = specialStrasbourgEvents.find(e => e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate);
        
        const calculated = getScheduleCellHours(scheduleCell, nurse, date, activityLevel, strasbourgAssignments, jornadasLaborales, specialEvent);
        if (typeof calculated === 'string' && calculated.includes(' - ')) {
            const [start, end] = calculated.split(' - ');
            setStartTime(start);
            setEndTime(end);
        }
        setReason('');
    } else {
      setStartTime('');
      setEndTime('');
      setReason('');
    }
    setError('');
  }, [isOpen, dailyHoursData, scheduleCell, nurse, dateKey]);

  const handleSave = () => {
    if (isMonthClosed) {
      setError(t.unlockMonth);
      return;
    }
    if (!startTime || !endTime) {
      setError(t.error_morningTimeRequired);
      return;
    }
    if (!nurse) return;

    onSave({
      nurseId: nurse.id,
      dateKey,
      segments: [{ startTime, endTime }],
      reason,
    });
    onClose();
  };

  if (!nurse) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.changeShiftHours}>
      <div className="p-6 space-y-4">
        <div className="text-center">
          <p className="font-bold text-lg text-slate-800">{nurse.name}</p>
          <p className="text-sm text-slate-500">{new Date(dateKey + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase">{t.startTime}</label>
            <input 
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase">{t.endTime}</label>
            <input 
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase">{t.reasonForChange}</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t.reasonForChangePlaceholder}
            rows={3}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{error}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 font-medium">{t.cancel}</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700" disabled={isMonthClosed}>{t.save}</button>
        </div>
      </div>
    </Modal>
  );
};
