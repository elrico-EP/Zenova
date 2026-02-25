
import React from 'react';

interface StackedBarProps {
  values: { value: number; color: string }[];
  total: number;
}

export const StackedBar: React.FC<StackedBarProps> = ({ values, total }) => {
  if (total === 0) {
    return <span className="text-slate-400">-</span>;
  }
  
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="font-semibold w-6">{total}</span>
      <div className="w-20 h-4 bg-gray-200 rounded-full flex overflow-hidden">
        {values.map((item, index) => {
          if (item.value === 0) return null;
          const percentage = (item.value / total) * 100;
          return (
            <div
              key={index}
              className={`${item.color}`}
              style={{ width: `${percentage}%` }}
              title={`${item.value} turnos`}
            />
          );
        })}
      </div>
    </div>
  );
};
