import type { Wishes, Nurse, Agenda, Wish } from '../types';
import { getWeekIdentifier } from './dateUtils';
import { holidays2026 } from '../data/agenda2026';

// Generar CSV para exportar a Google Sheets
export const generateWishesCSV = (
    wishes: Wishes,
    nurses: Nurse[],
    year: number,
    startMonth: number = 0,
    endMonth: number = 11
): string => {
    const rows: string[][] = [];
    
    // Header con enfermeras
    const header = ['Fecha'];
    nurses.forEach(nurse => {
        header.push(nurse.name, `${nurse.name} (Estado)`);
    });
    rows.push(header);

    // Datos
    for (let month = startMonth; month <= endMonth; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const row = [dateKey];
            
            nurses.forEach(nurse => {
                const wish = wishes[nurse.id]?.[dateKey];
                row.push(wish?.text || '');
                row.push(wish?.validated ? '✅ Aprobado' : (wish?.text ? '⏳ Pendiente' : ''));
            });
            
            rows.push(row);
        }
    }

    // Convertir a CSV
    return rows.map(row => 
        row.map(cell => {
            // Escapar comillas y envolver en comillas si contiene comas
            const escaped = cell.replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(',')
    ).join('\n');
};

// Generar HTML para PDF
export const generateWishesPDFHTML = (
    wishes: Wishes,
    nurses: Nurse[],
    year: number,
    startMonth: number = 0,
    endMonth: number = 11,
    agenda: Agenda
): string => {
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Deseos - ${year}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #1a3a3a; }
            h2 { color: #2d5555; margin-top: 30px; page-break-before: avoid; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; page-break-inside: avoid; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #2d5555; color: white; font-weight: bold; }
            .day-normal { background-color: #f9fafb; }
            .day-session { background-color: #fce7e6; }
            .day-white_green { background-color: #e8fae6; }
            .day-reduced { background-color: #fef3c7; }
            .day-closed { background-color: #e5e7eb; }
            .day-holiday { background-color: #ffe8e8; }
            .wish-validated { background-color: #e8f5e9; border-left: 4px solid #4caf50; }
            .wish-pending { background-color: #fff3e0; border-left: 4px solid #ff9800; }
            .wish-empty { background-color: #fff; }
            .page-break { page-break-after: always; }
            .footer { font-size: 8px; color: #666; margin-top: 20px; text-align: center; }
        </style>
    </head>
    <body>
    `;

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const activityStyles: Record<string, string> = {
        'NORMAL': 'day-normal',
        'SESSION': 'day-session',
        'WHITE_GREEN': 'day-white_green',
        'REDUCED': 'day-reduced',
        'CLOSED': 'day-closed'
    };

    html += `<h1>Deseos y Eventos - ${year}</h1>`;

    for (let month = startMonth; month <= endMonth; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        if (month > startMonth && (month - startMonth) % 3 === 0) {
            html += '<div class="page-break"></div>';
        }

        html += `<h2>${monthNames[month]} ${year}</h2>`;
        html += '<table><thead><tr><th>Fecha</th>';
        
        nurses.forEach(nurse => {
            html += `<th>${nurse.name}</th>`;
        });
        
        html += '</tr></thead><tbody>';

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const weekId = getWeekIdentifier(date);
            const isHoliday = holidays2026.has(dateKey);
            const dayOfWeek = date.getDay();
            const activityLevel = agenda[weekId] || 'NORMAL';
            const activityClass = activityStyles[activityLevel] || 'day-normal';
            const dayBg = isHoliday ? 'day-holiday' : activityClass;
            
            html += `<tr><td class="${dayBg}"><strong>${dateKey}</strong></td>`;
            
            nurses.forEach(nurse => {
                const wish = wishes[nurse.id]?.[dateKey];
                const status = wish?.validated ? '✅ Aprobado' : (wish?.text ? '⏳ Pendiente' : '');
                const wishClass = wish?.validated ? 'wish-validated' : (wish?.text ? 'wish-pending' : 'wish-empty');
                html += `<td class="${wishClass}">${wish?.text || ''}<br/><small>${status}</small></td>`;
            });
            
            html += '</tr>';
        }
        
        html += '</tbody></table>';
    }

    html += `
        <div class="footer">
            Generado el: ${new Date().toLocaleString()}
        </div>
    </body>
    </html>
    `;

    return html;
};

// Descargar CSV
export const downloadWishesCSV = (csv: string, year: number) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `deseos-${year}.csv`;
    link.click();
};

// Abrir Google Sheets
export const openInGoogleSheets = (csv: string) => {
    // Descargar CSV primero
    downloadWishesCSV(csv, new Date().getFullYear());
    
    // Abrir Google Sheets en nuevo tab para que el usuario importe manualmente
    window.open('https://sheets.google.com/spreadsheets/create', '_blank');
};
