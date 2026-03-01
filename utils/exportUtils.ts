import React from 'react';
import ReactDOM from 'react-dom/client';
import type { Nurse, Schedule, ScheduleCell, WorkZone, Notes, Agenda, Hours, SpecialStrasbourgEvent, CustomShift, Shift, JornadaLaboral } from '../types';
import { SHIFTS } from '../constants';
import { PdfExportView } from '../components/PdfExportView';
import { LanguageProvider, Language } from '../contexts/LanguageContext';
import { getScheduleCellHours, getShiftsFromCell } from './scheduleUtils';
import { getWeekIdentifier } from './dateUtils';
import { holidays2026 } from '../data/agenda2026';
import { AnnualAgendaPdfView } from '../components/AnnualAgendaPdfView';
import { PersonalAgendaPdfView } from '../components/PersonalAgendaPdfView';
import { locales } from '../translations/locales';
import * as XLSX from 'xlsx';

declare const html2canvas: any;
declare const jspdf: any;

// FIX: Change Set<WorkZone> to Set<string> to allow 'DAY_OFF_80' which is not a standard WorkZone.
const EXCLUDED_SHIFTS: Set<string> = new Set(['TW', 'FP', 'SICK_LEAVE', 'RECUP', 'CA', 'STRASBOURG', 'DAY_OFF_80']);


const getShiftParts = (cell: ScheduleCell | undefined): [ScheduleCell | null, ScheduleCell | null] => {
    if (!cell) return [null, null];
    if (typeof cell === 'string') {
        if (cell.endsWith('_TARDE') || cell.endsWith('_T')) return [null, cell];
        if (cell.endsWith('_M')) return [cell, null];
        return [cell, cell]; // Full day
    }
    if (typeof cell === 'object' && 'split' in cell) return cell.split;
    if (typeof cell === 'object' && 'custom' in cell) return [cell, cell];
    return [null, null];
};


// ====================================================================================
// START: Copy to Clipboard for Sheets
// ====================================================================================

const tailwindToHexMap: Record<string, { bg: string, text: string }> = {
    'bg-blue-200': { bg: '#BFDBFE', text: '#1E40AF' },
    'bg-yellow-200': { bg: '#FEF08A', text: '#854D0E' },
    'bg-blue-500': { bg: '#3B82F6', text: '#EFF6FF' },
    'bg-yellow-500': { bg: '#EAB308', text: '#FFFBEB' },
    'bg-orange-200': { bg: '#FED7AA', text: '#9A3412' },
    'bg-purple-300': { bg: '#D8B4FE', text: '#581C87' },
    'bg-red-400': { bg: '#F87171', text: '#991B1B' },
    'bg-green-200': { bg: '#BBF7D0', text: '#166534' },
    'bg-gray-500': { bg: '#6B7280', text: '#F9FAFB' },
    'bg-gray-100': { bg: '#F3F4F6', text: '#374151' }, // Adjusted white for visibility
    'bg-gray-200': { bg: '#E5E7EB', text: '#4B5563' },
    'bg-teal-200': { bg: '#99F6E4', text: '#115E59' },
    'bg-teal-400': { bg: '#2DD4BF', text: '#064E3B' },
    'bg-cyan-200': { bg: '#A5F3FC', text: '#164E63' }, // Libero
    'bg-sky-200': { bg: '#BAE6FD', text: '#0C4A6E' },  // Recup
    'bg-rose-300': { bg: '#fda4af', text: '#881337' }, // Strasbourg
};

export const copyScheduleToClipboard = async (schedule: Schedule, nurses: Nurse[], currentDate: Date, agenda: Agenda, notes: Notes, hours: Hours, jornadasLaborales: JornadaLaboral[]): Promise<void> => {
    const lang = (localStorage.getItem('zenova-lang') || 'en') as Language;
    const t = locales[lang];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const activityHexStyles: Record<string, { bg: string; text: string; weekBg: string; weekText: string }> = {
      NORMAL: { bg: '#F8FAFC', text: '#1E293B', weekBg: '#475569', weekText: '#FFFFFF' },
      SESSION: { bg: '#FFE4E6', text: '#9F1239', weekBg: '#BE123C', weekText: '#FFFFFF' },
      WHITE_GREEN: { bg: '#F0FDF4', text: '#166534', weekBg: '#16A34A', weekText: '#FFFFFF' },
      REDUCED: { bg: '#FEFCE8', text: '#854D0E', weekBg: '#D97706', weekText: '#FFFFFF' },
      CLOSED: { bg: '#E5E7EB', text: '#4B5563', weekBg: '#6B7280', weekText: '#FFFFFF' },
    };
    const weekendBg = '#F1F5F9';
    const noteColorMap: Record<string, string> = {
        'bg-yellow-100': '#FEF9C3', 'bg-blue-100': '#DBEAFE', 'bg-green-100': '#DCFCE7',
        'bg-pink-100': '#FCE7F3', 'bg-purple-100': '#F3E8FF', 'bg-gray-100': '#F3F4F6', 'bg-white': '#FFFFFF',
    };

    let html = '<table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 10pt; border-color: #E5E7EB;">';
    html += `<thead><tr>
                <th style="padding: 8px; font-weight: bold; background-color: #F8FAFC; border-color: #E5E7EB; width: 100px;">${t.day}</th>`;
    nurses.forEach(n => { html += `<th style="padding: 8px; font-weight: bold; background-color: #F8FAFC; border-color: #E5E7EB; width: 120px;">${n.name}</th>`; });
    html += `<th style="padding: 8px; font-weight: bold; background-color: #F8FAFC; border-color: #E5E7EB; width: 80px;">${t.present}</th>`;
    html += `<th style="padding: 8px; font-weight: bold; background-color: #F8FAFC; border-color: #E5E7EB; width: 160px;">${t.notes}</th>`;
    html += '</tr></thead><tbody>';
    
    let lastWeekId: string | null = null;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayName = date.toLocaleDateString(lang, { weekday: 'short' }).replace('.', '');
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const weekId = getWeekIdentifier(date);
        const isHoliday = year === 2026 && holidays2026.has(dateKey);
        const activityLevel = agenda[weekId] || 'NORMAL';
        
        if (weekId !== lastWeekId) {
            const weekStyle = activityHexStyles[activityLevel] || activityHexStyles['NORMAL'];
            html += `<tr><td colspan="${nurses.length + 3}" style="background-color: ${weekStyle.weekBg}; color: ${weekStyle.weekText}; text-align: center; font-weight: bold; padding: 2px; font-size: 9pt;">${t.week.toUpperCase()} ${weekId.split('-W')[1]}</td></tr>`;
            lastWeekId = weekId;
        }

        const activityStyle = activityHexStyles[activityLevel];
        const dayRowBg = isHoliday ? activityHexStyles.CLOSED.bg : isWeekend ? weekendBg : activityStyle.bg;

        // Prepend with an apostrophe to force text format in Teams/Excel
        html += `<tr><td style="padding: 4px; font-weight: bold; text-align: center; background-color: ${dayRowBg}; border-color: #E5E7EB;">'${day} ${dayName}</td>`;

        if (activityLevel === 'CLOSED' && !isWeekend) {
            const closedTextCellIndex = Math.floor(nurses.length / 2);
            nurses.forEach((_, index) => {
                const cellContent = index === closedTextCellIndex ? `<span style="font-weight: bold; color: ${activityStyle.text};">${t.closed}</span>` : '';
                html += `<td style="padding: 4px; text-align: center; vertical-align: middle; height: 50px; background-color: ${activityStyle.bg}; border-color: #E5E7EB;">${cellContent}</td>`;
            });
        } else {
            nurses.forEach(nurse => {
                const cellData = schedule[nurse.id]?.[dateKey];
                
                const dailyHoursData = hours[nurse.id]?.[dateKey];
                const hasManualHours = dailyHoursData?.segments?.some(s => s.startTime || s.endTime);

                let allHours: string | { morning: string; afternoon: string } | string[];
                if (hasManualHours) {
                    allHours = dailyHoursData!.segments!.filter(s => s.startTime && s.endTime).map(s => `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`);
                } else {
                    // FIX: Pass jornadasLaborales to getScheduleCellHours
                    allHours = getScheduleCellHours(cellData, nurse, date, agenda[weekId] || 'NORMAL', agenda, jornadasLaborales);
                }

                const [morningPart, afternoonPart] = getShiftParts(cellData);
                let cellContent = '';
                let cellStyle = `padding: 4px; text-align: center; vertical-align: middle; height: 50px; background-color: ${dayRowBg}; border-color: #E5E7EB;`;
                
                const formatPart = (part: ScheduleCell | null, partHours: string, multilineTime: boolean): string => {
                    if (!part) return '';

                    let mainLabel: string;
                    if (typeof part === 'string') {
                        mainLabel = SHIFTS[part as WorkZone]?.label || '';
                    } else if (typeof part === 'object' && 'custom' in part) {
                        if ((part as CustomShift).custom === 'STR-PREP') {
                            return ''; // Return empty string for STR-PREP
                        }
                        mainLabel = (part as CustomShift).custom.split('\n')[0];
                    } else {
                        return '';
                    }
                    
                    if (!mainLabel) return '';
                    
                    if (!partHours) {
                        return mainLabel;
                    }

                    const timeHtml = `<span style="font-size: 8pt; color: #475569;">(${partHours})</span>`;
                    return multilineTime ? `${mainLabel}<br>${timeHtml}` : `${mainLabel} ${timeHtml}`;
                };
                
                const isFullDayEquivalent = morningPart !== null && morningPart === afternoonPart;
                const isMorningOnly = morningPart !== null && afternoonPart === null;
                const isAfternoonOnly = morningPart === null && afternoonPart !== null;

                if (isFullDayEquivalent || isMorningOnly || isAfternoonOnly) {
                    const singlePart = morningPart || afternoonPart;
                    const hoursString = Array.isArray(allHours) ? allHours.join(' & ') : typeof allHours === 'string' ? allHours : '';
                    cellContent = formatPart(singlePart, hoursString, true);
                } else {
                    const hoursObject = typeof allHours === 'object' && 'morning' in allHours ? allHours : { morning: '', afternoon: '' };
                    const morningText = formatPart(morningPart, hoursObject.morning, false);
                    const afternoonText = formatPart(afternoonPart, hoursObject.afternoon, false);
                    cellContent = [morningText, afternoonText].filter(Boolean).join('<br>');
                }

                const primaryShiftId = afternoonPart ? getShiftsFromCell(afternoonPart)[0] : getShiftsFromCell(morningPart)[0];
                if (primaryShiftId && SHIFTS[primaryShiftId] && tailwindToHexMap[SHIFTS[primaryShiftId].color]) {
                    const colors = tailwindToHexMap[SHIFTS[primaryShiftId].color];
                    cellStyle = `padding: 4px; text-align: center; vertical-align: middle; height: 50px; background-color: ${colors.bg}; color: ${colors.text}; border-color: #E5E7EB;`;
                }
                html += `<td style="${cellStyle}">${cellContent}</td>`;
            });
        }

        let presentCount = 0;
        nurses.forEach(nurse => {
            const shifts = getShiftsFromCell(schedule[nurse.id]?.[dateKey]);
            if (shifts.length > 0 && shifts.some(s => !EXCLUDED_SHIFTS.has(s))) {
                presentCount++;
            }
        });
        html += `<td style="padding: 4px; text-align: center; font-weight: bold; background-color: ${dayRowBg}; border-color: #E5E7EB;">${(activityLevel !== 'CLOSED' && presentCount > 0) ? presentCount : ''}</td>`;

        const note = notes[dateKey];
        const noteBg = note ? (noteColorMap[note.color] || dayRowBg) : dayRowBg;
        html += `<td style="padding: 4px; text-align: left; vertical-align: top; font-size: 9pt; background-color: ${noteBg}; border-color: #E5E7EB;">${note ? note.text.replace(/\n/g, '<br>') : ''}</td>`;
        
        html += '</tr>';
    }
    html += '</tbody></table>';

    try {
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
    }
};


// ====================================================================================
// START: PDF Export
// ====================================================================================

export const generateAndDownloadPdf = async (props: { nurses: Nurse[]; schedule: Schedule; currentDate: Date; notes: Notes; agenda: Agenda; strasbourgAssignments: Record<string, string[]>; }): Promise<void> => {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0px';
    document.body.appendChild(tempContainer);
    const root = ReactDOM.createRoot(tempContainer);
    try {
        await new Promise<void>((resolve) => {
             root.render( React.createElement( React.StrictMode, null, React.createElement( LanguageProvider, null, React.createElement(PdfExportView, props) ) ) );
            setTimeout(resolve, 500);
        });
        const canvas = await html2canvas(tempContainer.children[0] as HTMLElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('l', 'mm', 'a3'); 
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasRatio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / canvasRatio;
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * canvasRatio;
        }
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        const { currentDate } = props;
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        pdf.save(`Schedule_${year}-${month}.pdf`);
    } catch (error) {
        console.error("PDF generation failed:", error);
    } finally {
        root.unmount();
        document.body.removeChild(tempContainer);
    }
};

// ====================================================================================
// PERSONAL AGENDA - Copy to Clipboard (Monthly)
// ====================================================================================

export const copyPersonalAgendaToClipboard = async (props: {
  nurse: Nurse;
  currentDate: Date;
  schedule: Schedule[string];
  agenda: Agenda;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
}): Promise<void> => {
    const lang = (localStorage.getItem('zenova-lang') || 'en') as Language;
    const t = locales[lang];
    const { nurse, currentDate, schedule, agenda, specialStrasbourgEvents } = props;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Color styles
    const shiftColorMap: Record<string, string> = {};
    Object.entries(SHIFTS).forEach(([key, value]) => {
        if (tailwindToHexMap[value.color]) {
            shiftColorMap[key] = tailwindToHexMap[value.color].bg;
        }
    });
    
    let html = '<table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 11pt; border-color: #CBD5E1;">';
    
    html += `<thead><tr><th colspan="8" style="padding: 12px; font-weight: bold; font-size: 14pt; background-color: #1E293B; color: #FFFFFF; text-align: center;">${nurse.name} - ${monthName}</th></tr>`;
    html += '<tr>';
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(day => {
        html += `<th style="padding: 8px; font-weight: bold; background-color: #F1F5F9; border-color: #CBD5E1; text-align: center;">${day}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const startDayOfWeek = (firstDayOfMonth.getUTCDay() + 6) % 7;
    const weeksInMonth = Math.ceil((daysInMonth + startDayOfWeek) / 7);
    
    let dayCount = 1;
    for (let week = 0; week < weeksInMonth; week++) {
        if (dayCount > daysInMonth) break;
        html += '<tr>';
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const dayPosition = week * 7 + dayOfWeek;
            
            if (dayPosition < startDayOfWeek || dayCount > daysInMonth) {
                html += '<td style="padding: 8px; height: 60px; background-color: #F8FAFC; border-color: #CBD5E1;"></td>';
            } else {
                const dateForCell = new Date(Date.UTC(year, month, dayCount));
                const dateKey = dateForCell.toISOString().split('T')[0];
                const shiftCell = schedule?.[dateKey];
                const specialEvent = specialStrasbourgEvents.find(e => 
                    e.nurseIds.includes(nurse.id) && dateKey >= e.startDate && dateKey <= e.endDate
                );
                
                let cellContent = `<div style="font-weight: bold; font-size: 9pt; color: #64748B; margin-bottom: 4px;">${dayCount}</div>`;
                let bgColor = '#FFFFFF';
                
                if (specialEvent) {
                    cellContent += `<div style="font-weight: bold; color: #7C3AED;">${specialEvent.name}</div>`;
                    bgColor = '#EDE9FE';
                } else if (shiftCell) {
                    let shiftText = '';
                    if (typeof shiftCell === 'string') {
                        shiftText = SHIFTS[shiftCell as WorkZone]?.label || shiftCell;
                        bgColor = shiftColorMap[shiftCell] || '#FFFFFF';
                    } else if ('custom' in shiftCell) {
                        shiftText = shiftCell.custom.shift || shiftCell.custom.time || '';
                        bgColor = '#FEF3C7';
                    } else if ('split' in shiftCell) {
                        const [morning, afternoon] = shiftCell.split;
                        const morningText = morning && typeof morning === 'string' ? (SHIFTS[morning as WorkZone]?.label || morning) : '';
                        const afternoonText = afternoon && typeof afternoon === 'string' ? (SHIFTS[afternoon as WorkZone]?.label || afternoon) : '';
                        shiftText = `${morningText} / ${afternoonText}`;
                        bgColor = '#DBEAFE';
                    }
                    cellContent += `<div style="font-weight: bold;">${shiftText}</div>`;
                }
                html += `<td style="padding: 8px; height: 60px; background-color: ${bgColor}; border-color: #CBD5E1; vertical-align: top;">${cellContent}</td>`;
                dayCount++;
            }
        }
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    
    try {
        console.log('Clipboard copy: HTML size', html.length, 'bytes, weeks in output:', (html.match(/<tr>/g) || []).length, 'rows');
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);
        console.log('✓ Personal agenda copied to clipboard');
    } catch (err) {
        console.error('Failed to copy personal agenda to clipboard:', err);
        throw err;
    }
};

// ====================================================================================
// ANNUAL AGENDA - Copy to Clipboard 
// ====================================================================================

export const copyAnnualAgendaToClipboard = async (props: {
    nurse: Nurse;
    year: number;
    allSchedules: Record<number, Schedule[string]>;
    specialStrasbourgEvents: SpecialStrasbourgEvent[];
}): Promise<void> => {
    const lang = (localStorage.getItem('zenova-lang') || 'en') as Language;
    const t = locales[lang];
    const { nurse, year, allSchedules, specialStrasbourgEvents } = props;
    
    let html = '<table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 10pt; border-color: #CBD5E1;">';
    
    // Main header
    html += `<thead><tr><th colspan="9" style="padding: 12px; font-weight: bold; font-size: 14pt; background-color: #0F172A; color: #FFFFFF; text-align: center;">${nurse.name} - ${year} Annual Agenda</th></tr></thead>`;
    
    html += '<tbody>';
    
    // For each month
    for (let month = 0; month < 12; month++) {
        const currentDate = new Date(year, month, 1);
        const monthName = currentDate.toLocaleString(lang, { month: 'long' });
        const schedule = allSchedules[month] || {};
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Month header
        html += `<tr><td colspan="9" style="padding: 8px; font-weight: bold; font-size: 11pt; background-color: #334155; color: #FFFFFF; text-align: center;">${monthName}</td></tr>`;
        
        // Week headers
        html += '<tr>';
        html += '<th style="padding: 6px; font-weight: bold; background-color: #F1F5F9; border-color: #CBD5E1;">Week</th>';
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayNames.forEach(day => {
            html += `<th style="padding: 6px; font-weight: bold; background-color: #F1F5F9; border-color: #CBD5E1; text-align: center;">${day}</th>`;
        });
        html += '<th style="padding: 6px; font-weight: bold; background-color: #F1F5F9; border-color: #CBD5E1;">Notes</th></tr>';
        
        // Days
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
        const startDayOfWeek = (firstDayOfMonth.getUTCDay() + 6) % 7;
        
        let dayCount = 1;
        for (let week = 0; week < 6; week++) {
            if (dayCount > daysInMonth) break;
            
            html += '<tr>';
            
            // Week number
            const weekDate = new Date(year, month, Math.max(1, (week * 7) + 1 - startDayOfWeek));
            const weekId = getWeekIdentifier(weekDate);
            html += `<td style="padding: 4px; font-weight: bold; text-align: center; background-color: #F8FAFC; border-color: #CBD5E1;">W${weekId.split('-W')[1]}</td>`;
            
            // Days
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const dayPosition = week * 7 + dayOfWeek;
                
                if (dayPosition < startDayOfWeek || dayCount > daysInMonth) {
                    html += '<td style="padding: 4px; background-color: #F8FAFC; border-color: #CBD5E1;"></td>';
                } else {
                    const dateForCell = new Date(Date.UTC(year, month, dayCount));
                    const dateKey = dateForCell.toISOString().split('T')[0];
                    const shiftCell = schedule?.[dateKey];
                    
                    let shiftText = '';
                    let bgColor = '#FFFFFF';
                    
                    if (shiftCell) {
                        if (typeof shiftCell === 'string') {
                            const shiftLabel = SHIFTS[shiftCell as WorkZone]?.label || shiftCell;
                            shiftText = shiftLabel.substring(0, 6); // Abbreviated
                            bgColor = tailwindToHexMap[SHIFTS[shiftCell as WorkZone]?.color]?.bg || '#FFFFFF';
                        } else if ('custom' in shiftCell) {
                            shiftText = shiftCell.custom.shift?.substring(0, 6) || 'CUST';
                            bgColor = '#FEF3C7';
                        } else if ('split' in shiftCell) {
                            shiftText = 'SPLIT';
                            bgColor = '#DBEAFE';
                        }
                    }
                    
                    html += `<td style="padding: 4px; font-size: 8pt; font-weight: bold; text-align: center; background-color: ${bgColor}; border-color: #CBD5E1;">${shiftText}</td>`;
                    dayCount++;
                }
            }
            
            html += '<td style="padding: 4px; background-color: #FEFCE8; border-color: #CBD5E1;"></td>';
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';
    
    try {
        console.log('Annual clipboard: HTML size', html.length, 'bytes, 12 months data');
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);
        console.log('✓ Annual agenda copied to clipboard');
    } catch (err) {
        console.error('Failed to copy annual agenda to clipboard:', err);
        throw err;
    }
};

// ====================================================================================
// PDF EXPORTS
// ====================================================================================

export const generatePersonalAgendaPdf = async (props: {
  nurse: Nurse;
  currentDate: Date;
  schedule: Schedule[string];
  hours: Hours;
  agenda: Agenda;
  strasbourgAssignments: Record<string, string[]>;
  specialStrasbourgEvents: SpecialStrasbourgEvent[];
  jornadasLaborales: JornadaLaboral[];
}): Promise<void> => {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0px';
    document.body.appendChild(tempContainer);
    const root = ReactDOM.createRoot(tempContainer);

    try {
        await new Promise<void>((resolve) => {
             root.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(
                        LanguageProvider,
                        null,
                        React.createElement(PersonalAgendaPdfView, props)
                    )
                )
             );
            setTimeout(resolve, 1400);
        });

        const pdfRoot = tempContainer.querySelector('.personal-agenda-pdf-root') as HTMLElement | null;
        if (!pdfRoot) {
            console.error('PDF root not found. Container:', tempContainer.innerHTML.substring(0, 300));
            throw new Error('Personal agenda PDF root not found');
        }

        console.log('Rendering PDF, element size:', pdfRoot.scrollWidth, 'x', pdfRoot.scrollHeight);
        
        const canvas = await html2canvas(pdfRoot, {
            scale: 1.7,
            useCORS: true,
            allowTaint: true,
            windowWidth: Math.max(pdfRoot.scrollWidth, 1400),
            windowHeight: Math.max(pdfRoot.scrollHeight, 900),
            width: pdfRoot.scrollWidth,
            height: pdfRoot.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;

        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = pdfHeight - margin * 2;

        const imgProps = pdf.getImageProperties(imgData);
        const widthRatio = contentWidth / imgProps.width;
        const heightRatio = contentHeight / imgProps.height;
        const scale = Math.min(widthRatio, heightRatio);
        const finalWidth = imgProps.width * scale;
        const finalHeight = imgProps.height * scale;
        const x = margin + (contentWidth - finalWidth) / 2;
        const y = margin + (contentHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        const year = props.currentDate.getFullYear();
        const month = String(props.currentDate.getMonth() + 1).padStart(2, '0');
        pdf.save(`Agenda_${nurse.name.replace(/\s/g, '_')}_${year}-${month}.pdf`);

    } catch (error) {
        console.error("Personal Agenda PDF generation failed:", error);
        throw error; // Re-throw to be caught in the component
    } finally {
        root.unmount();
        if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};

export const generateAnnualAgendaPdf = async (props: {
    nurse: Nurse;
    year: number;
    allSchedules: Record<number, Schedule[string]>;
    agenda: Agenda;
    strasbourgAssignments: Record<string, string[]>;
    specialStrasbourgEvents: SpecialStrasbourgEvent[];
    jornadasLaborales: JornadaLaboral[];
}): Promise<void> => {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0px';
    document.body.appendChild(tempContainer);
    const root = ReactDOM.createRoot(tempContainer);

    try {
        console.log('Generating annual PDF for', props.nurse.name, 'year', props.year);
        await new Promise<void>((resolve) => {
             root.render(
                React.createElement(
                    React.StrictMode, null, 
                    React.createElement(
                        LanguageProvider, null, 
                        React.createElement(AnnualAgendaPdfView, props)
                    )
                )
             );
            setTimeout(resolve, 2000); // Initial render buffer increased
        });

        const waitForRenderedMonths = async (): Promise<NodeListOf<Element>> => {
            const maxAttempts = 80;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const elements = tempContainer.querySelectorAll('.month-pdf-container');
                if (elements.length >= 12) {
                    console.log(`✓ Found all ${elements.length} months after ${attempt} attempts`);
                    return elements;
                }
                if (attempt % 10 === 0) console.log(`Waiting for months... (${elements.length}/12)`);
                await new Promise(resolve => setTimeout(resolve, 400));
            }
            console.warn('Timeout waiting for month containers, proceeding with what we have');
            return tempContainer.querySelectorAll('.month-pdf-container');
        };

        let monthElements = await waitForRenderedMonths();
        if (monthElements.length < 12) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            monthElements = await waitForRenderedMonths();
        }
        if (monthElements.length === 0) {
            throw new Error('No month containers found for annual export');
        }
        if (monthElements.length < 12) {
            console.warn(`Expected 12 month containers but found ${monthElements.length}. Exporting available months.`);
        }
        
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pdfWidth - (margin * 2);
        const headerHeight = 20;
        const contentHeight = pdfHeight - (margin * 2) - headerHeight;

        for (let i = 0; i < monthElements.length; i++) {
            const monthElement = monthElements[i] as HTMLElement;
            const monthName = monthElement.dataset.monthName || '';

            if (i > 0) pdf.addPage();

            pdf.setFontSize(16);
            pdf.text(`${props.nurse.name} - ${props.year}`, margin, margin);
            pdf.setFontSize(12);
            pdf.text(monthName, margin, margin + 8);

            const canvas = await html2canvas(monthElement, { scale: 1.5, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            let finalImgHeight = imgHeight;
            if (imgHeight > contentHeight) {
                console.warn(`Month ${monthName} content is larger than available page height. It will be scaled down.`);
                finalImgHeight = contentHeight;
            }

            pdf.addImage(imgData, 'PNG', margin, margin + headerHeight, contentWidth, finalImgHeight);
        }

        pdf.save(`Annual_Agenda_${props.nurse.name.replace(/\s/g, '_')}_${props.year}.pdf`);

    } catch (error) {
        console.error("Annual Agenda PDF generation failed:", error);
        throw error;
    } finally {
        root.unmount();
        if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};