
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface VaccinationPeriodPlannerProps {
  period: { start: string; end: string } | null;
  onPeriodChange: (period: { start: string; end: string } | null) => void;
}

export const VaccinationPeriodPlanner: React.FC<VaccinationPeriodPlannerProps> = ({ period, onPeriodChange }) => {
    const t = useTranslations();
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        if (period?.end && newStart > period.end) {
            onPeriodChange({ start: newStart, end: newStart });
        } else {
            onPeriodChange({ start: newStart, end: period?.end || newStart });
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEnd = e.target.value;
        if (period?.start && newEnd < period.start) {
            onPeriodChange({ start: period.start, end: period.start });
        } else {
            onPeriodChange({ start: period?.start || newEnd, end: newEnd });
        }
    };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4 text-gray-700">{t.vaccinationCampaign}</h3>
      <div className="space-y-3">
        <div>
            <label htmlFor="vac-start-date" className="block text-sm font-medium text-gray-700">
                {t.startDate}
            </label>
            <input
                type="date"
                id="vac-start-date"
                value={period?.start || ''}
                onChange={handleStartDateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
        </div>
        <div>
            <label htmlFor="vac-end-date" className="block text-sm font-medium text-gray-700">
                {t.endDate}
            </label>
            <input
                type="date"
                id="vac-end-date"
                value={period?.end || ''}
                onChange={handleEndDateChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
        </div>
      </div>
    </div>
  );
};