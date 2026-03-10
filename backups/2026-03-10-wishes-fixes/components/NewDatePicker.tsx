import React from 'react';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const NewDatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange }) => {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(new Date(event.target.value));
  };

  return (
    <input
      type="date"
      value={selectedDate.toISOString().split('T')[0]}
      onChange={handleDateChange}
      className="w-full p-2 border rounded-md bg-white text-gray-900"
    />
  );
};
