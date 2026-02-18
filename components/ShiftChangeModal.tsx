import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { NewDatePicker } from './NewDatePicker';
import type { ScheduleCell } from '../types';

interface ShiftChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nurseId: string;
  date: string;
  shift: ScheduleCell;
  onShiftChange: (nurseId: string, oldDate: string, newDate: string, shift: ScheduleCell) => void;
}

export const ShiftChangeModal: React.FC<ShiftChangeModalProps> = ({ isOpen, onClose, nurseId, date, shift, onShiftChange }) => {
  const [newDate, setNewDate] = useState(new Date(date));

  const handleDateChange = (selectedDate: Date) => {
    const timezoneOffset = selectedDate.getTimezoneOffset() * 60000; //offset in milliseconds
    const localDate = new Date(selectedDate.getTime() - timezoneOffset);
    setNewDate(localDate);
  };

  const handleSubmit = () => {
    onShiftChange(nurseId, date, newDate.toISOString().split('T')[0], shift);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Shift Date">
      <div className="p-4">
        <p className="mb-4">Change date for {shift?.custom} on {new Date(date).toLocaleDateString()}</p>
        <NewDatePicker selectedDate={newDate} onDateChange={handleDateChange} />
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-md">Confirm</button>
        </div>
      </div>
    </Modal>
  );
};