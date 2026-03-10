import React, { useEffect } from 'react';
import type { Nurse, Schedule, SpecialStrasbourgEvent } from '../types';
import { SHIFTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { getWeeksForMonth } from '../utils/dateUtils';

interface PersonalAgendaPrintViewProps {
  nurse: Nurse;
  year: number;
  month: number;
  schedule: Schedule[string];
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  isAnnual?: boolean;
  allSchedules?: Record<number, Schedule[string]>;
}

export const PersonalAgendaPrintView: React.FC<PersonalAgendaPrintViewProps> = ({
  nurse,
  year,
  month,
  schedule,
  specialStrasbourgEvents,
  isAnnual = false,
  allSchedules
}) => {
  const { language } = useLanguage();

  const shiftColorMap: Record<string, { bg: string; text: string }> = {
    'bg-blue-200': { bg: '#BFDBFE', text: '#1E40AF' },
    'bg-yellow-200': { bg: '#FEF08A', text: '#854D0E' },
    'bg-blue-500': { bg: '#3B82F6', text: '#EFF6FF' },
    'bg-yellow-500': { bg: '#EAB308', text: '#FFFBEB' },
    'bg-orange-200': { bg: '#FED7AA', text: '#9A3412' },
    'bg-orange-600': { bg: '#EA580C', text: '#FFF7ED' },
    'bg-purple-300': { bg: '#D8B4FE', text: '#581C87' },
    'bg-purple-500': { bg: '#A855F7', text: '#FAF5FF' },
    'bg-rose-300': { bg: '#FDA4AF', text: '#881337' },
    'bg-cyan-200': { bg: '#A5F3FC', text: '#164E63' },
    'bg-sky-200': { bg: '#BAE6FD', text: '#0C4A6E' },
    'bg-green-200': { bg: '#BBF7D0', text: '#166534' },
    'bg-indigo-200': { bg: '#C7D2FE', text: '#3730A3' },
    'bg-gray-500': { bg: '#6B7280', text: '#F9FAFB' },
    'bg-gray-100': { bg: '#F3F4F6', text: '#374151' },
    'bg-teal-200': { bg: '#99F6E4', text: '#115E59' },
    'bg-teal-400': { bg: '#2DD4BF', text: '#064E3B' },
  };

  useEffect(() => {
    // Auto-trigger print dialog after component renders
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const renderMonthCalendar = (monthIndex: number, monthSchedule: Schedule[string]) => {
    const currentDate = new Date(year, monthIndex, 1);
    const monthName = currentDate.toLocaleString(language, { month: 'long', year: 'numeric' });
    const allDates = getWeeksForMonth(year, monthIndex);
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const weeks: React.ReactElement[] = [];
    
    // Group dates into weeks of 7
    for (let i = 0; i < allDates.length; i += 7) {
      const weekDates = allDates.slice(i, i + 7);
      const days: React.ReactElement[] = [];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dateForCell = weekDates[dayOfWeek];
        
        if (!dateForCell) {
          days.push(
            <td key={`empty-${i}-${dayOfWeek}`} className="print-cell print-cell-empty"></td>
          );
        } else {
          const dayCount = dateForCell.getUTCDate();
          const dateKey = dateForCell.toISOString().split('T')[0];
          const shiftCell = monthSchedule?.[dateKey];
          const specialEvent = specialStrasbourgEvents.find(e => 
            e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate
          );
          
          let shiftText = '';
          let cellClass = 'print-cell';
          let cellStyle: React.CSSProperties | undefined;
          
          if (specialEvent) {
            shiftText = specialEvent.name;
            cellClass += ' print-cell-event';
            cellStyle = { backgroundColor: '#EDE9FE', color: '#5B21B6' };
          } else if (shiftCell) {
            if (typeof shiftCell === 'string') {
              shiftText = SHIFTS[shiftCell]?.label || shiftCell;
              cellClass += ` print-cell-${shiftCell.toLowerCase()}`;
              const shiftDef = SHIFTS[shiftCell];
              const colors = shiftDef ? shiftColorMap[shiftDef.color] : undefined;
              if (colors) {
                cellStyle = { backgroundColor: colors.bg, color: colors.text };
              }
            } else if ('custom' in shiftCell) {
              // CustomShift - custom is a string
              shiftText = typeof shiftCell.custom === 'string' 
                ? shiftCell.custom 
                : shiftCell.time || 'Custom';
              cellClass += ' print-cell-custom';
              cellStyle = { backgroundColor: '#FEF3C7', color: '#92400E' };
            } else if ('split' in shiftCell) {
              const [morning, afternoon] = shiftCell.split;
              const morningText = morning && typeof morning === 'string' ? (SHIFTS[morning]?.label || morning) : '';
              const afternoonText = afternoon && typeof afternoon === 'string' ? (SHIFTS[afternoon]?.label || afternoon) : '';
              shiftText = `${morningText || '—'} / ${afternoonText || '—'}`;
              cellClass += ' print-cell-split';
              cellStyle = { backgroundColor: '#DBEAFE', color: '#1E3A8A' };
            }
          }
          
          days.push(
            <td key={`day-${dayCount}`} className={cellClass} style={cellStyle}>
              <div className="print-day-number">{dayCount}</div>
              {shiftText && <div className="print-shift-text">{shiftText}</div>}
            </td>
          );
        }
      }
      
      weeks.push(<tr key={`week-${i / 7}`}>{days}</tr>);
    }
    
    return (
      <div className="print-month-container" key={`month-${monthIndex}`}>
        {isAnnual && <h2 className="print-month-title">{monthName}</h2>}
        <table className="print-calendar-table">
          <thead>
            <tr>
              {dayNames.map(day => (
                <th key={day} className="print-header-cell">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>{weeks}</tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="print-view-container">
      <style>{`
        @media print {
          @page {
            size: ${isAnnual ? 'portrait' : 'landscape'};
            margin: 15mm;
          }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        .print-view-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 100%;
          padding: 20px;
          background: white;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #1E293B;
          padding-bottom: 15px;
        }
        
        .print-header h1 {
          margin: 0;
          font-size: 28px;
          color: #1E293B;
        }
        
        .print-header h2 {
          margin: 8px 0 0 0;
          font-size: 18px;
          color: #475569;
          font-weight: normal;
        }
        
        .print-month-container {
          margin-bottom: ${isAnnual ? '40px' : '0'};
          page-break-inside: avoid;
        }
        
        .print-month-title {
          font-size: 20px;
          color: #334155;
          margin: 0 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #CBD5E1;
        }
        
        .print-calendar-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .print-header-cell {
          background-color: #1E293B;
          color: white;
          padding: 8px;
          font-weight: bold;
          font-size: 11px;
          text-align: center;
          border: 1px solid #0F172A;
        }
        
        .print-cell {
          border: 1px solid #CBD5E1;
          padding: 6px;
          height: ${isAnnual ? '50px' : '80px'};
          vertical-align: top;
          background-color: white;
        }
        
        .print-cell-empty {
          background-color: #F8FAFC;
        }
        
        .print-day-number {
          font-weight: bold;
          font-size: ${isAnnual ? '8px' : '10px'};
          color: inherit;
          opacity: 0.85;
          margin-bottom: 3px;
        }
        
        .print-shift-text {
          font-size: ${isAnnual ? '7px' : '9px'};
          font-weight: 600;
          color: inherit;
          word-wrap: break-word;
        }
        
        /* Shift color coding */
        .print-cell-morning { background-color: #BFDBFE; }
        .print-cell-afternoon { background-color: #FEF08A; }
        .print-cell-night { background-color: #3B82F6; color: white; }
        .print-cell-long_day { background-color: #EAB308; }
        .print-cell-split { background-color: #DBEAFE; }
        .print-cell-custom { background-color: #FEF3C7; }
        .print-cell-event { background-color: #EDE9FE; }
        .print-cell-tw { background-color: #BBF7D0; }
        .print-cell-fp { background-color: #F3F4F6; }
        .print-cell-strasbourg { background-color: #FDA4AF; }
        .print-cell-libero { background-color: #A5F3FC; }
        
        @media print {
          .print-view-container {
            padding: 0;
          }
          
          .print-cell {
            page-break-inside: avoid;
          }
        }
      `}</style>
      
      <div className="print-header">
        <h1>{nurse.name}</h1>
        <h2>
          {isAnnual 
            ? `${year} - Annual Agenda`
            : new Date(year, month, 1).toLocaleString(language, { month: 'long', year: 'numeric' })
          }
        </h2>
      </div>
      
      {isAnnual ? (
        // Annual view - 12 months
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const monthSchedule = allSchedules?.[i] || {};
            return renderMonthCalendar(i, monthSchedule);
          })}
        </>
      ) : (
        // Monthly view
        renderMonthCalendar(month, schedule)
      )}
      
      <div className="no-print" style={{ marginTop: '20px', textAlign: 'center', color: '#64748B' }}>
        <p>Press <strong>Ctrl+P</strong> (or Cmd+P on Mac) to print or save as PDF</p>
        <button 
          onClick={() => window.close()} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#1E293B',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '10px'
          }}
        >
          Close Window
        </button>
      </div>
    </div>
  );
};
