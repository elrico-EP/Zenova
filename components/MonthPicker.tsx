
import React, { useState, useEffect, useRef } from 'react';

interface MonthPickerProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MonthPicker: React.FC<MonthPickerProps> = ({ currentDate, onSelectDate, onClose }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleMonthClick = (monthIndex: number) => {
    onSelectDate(new Date(currentYear, monthIndex, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, viewDate.getMonth(), 1));
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-72 text-gray-800"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-center mb-4">
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="font-semibold border-gray-300 rounded-md shadow-sm focus:ring-zen-500 focus:border-zen-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((monthName, index) => (
          <button
            key={monthName}
            onClick={() => handleMonthClick(index)}
            className={`p-2 rounded-md text-sm font-medium transition-colors ${
              currentMonth === index && currentDate.getFullYear() === currentYear
                ? 'bg-zen-800 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {monthName}
          </button>
        ))}
      </div>
    </div>
  );
};