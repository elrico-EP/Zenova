// Extract complete schedules from both months
import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Nurse mapping
const nurseMapping = {
  'Elvio': 'nurse-1',
  'Tanja': 'nurse-2',
  'Virginie': 'nurse-3',
  'Paola': 'nurse-4',
  'Elena': 'nurse-5',
  'Miguel': 'nurse-6',
  'Gorka': 'nurse-7',
  'Katelijn': 'nurse-8',
  'Joseph': 'nurse-9',
  'Tatiana': 'nurse-10',
  'Trainee': 'nurse-11',
  'Ana': 'nurse-11'
};

// Shift mapping
const shiftMap = {
  'Urg AM': 'URGENCES',
  'Urg M': 'URGENCES',
  'Urg PM': 'URGENCES_TARDE',
  'Urg T': 'URGENCES_TARDE',
  'Trav AM': 'TRAVAIL',
  'Trav M': 'TRAVAIL',
  'Trav PM': 'TRAVAIL_TARDE',
  'Trav T': 'TRAVAIL_TARDE',
  'Adm': 'ADM',
  'TW': 'TW',
  'FP': 'FP',
  'CM': 'CM',
  'CA': 'CA',
  'PS': 'PS',
  'VA': 'VA',
  'Libero': 'LIB',
  'CS': 'CS',
  'STR': 'STR',
  'Euroscola': 'EUROSCOLA',
  'Sick': 'SICK_LEAVE',
  'Red. 80%': '',
  'Recup': ''
};

function parseExcelSchedule(filePath, startMonth) {
  console.log(`\nProcessing: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const header = data[0];
  const nurseColumns = {};
  Object.keys(nurseMapping).forEach(name => {
    const index = header.indexOf(name);
    if (index !== -1) {
      nurseColumns[name] = index;
    }
  });

  console.log('Nurses found:', Object.keys(nurseColumns));

  const frozenSchedules = {
    '2026-00': {}, // January
    '2026-01': {}  // February
  };

  let currentMonth = startMonth;
  const year = 2026;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const dayCell = String(row[0] || '');
    const dayMatch = dayCell.match(/^'?(\d+)\s+\w+/);
    if (!dayMatch) continue;

    const day = parseInt(dayMatch[1]);

    // Detect month transitions
    if (day === 1 && i > 15) {
      if (currentMonth === 1) currentMonth = 2;
      else if (currentMonth === 2) currentMonth = 3;
    }

    if (currentMonth > 2) break; // Stop after February

    const dateKey = `${year}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthKey = `2026-${String(currentMonth - 1).padStart(2, '0')}`;

    Object.entries(nurseColumns).forEach(([nurseName, colIndex]) => {
      const nurseId = nurseMapping[nurseName];
      let cellValue = String(row[colIndex] || '').trim();

      if (!cellValue || cellValue === '' || cellValue === 'Red. 80%') return;

      // Get first line only
      cellValue = cellValue.split('\n')[0].trim();
      
      // Remove hours in parentheses
      const mainShift = cellValue.split('(')[0].trim();

      // Map shift
      let shift = '';
      for (const [key, value] of Object.entries(shiftMap)) {
        if (mainShift.includes(key) || mainShift === key) {
          shift = value;
          break;
        }
      }

      if (shift) {
        if (!frozenSchedules[monthKey][nurseId]) {
          frozenSchedules[monthKey][nurseId] = {};
        }
        frozenSchedules[monthKey][nurseId][dateKey] = shift;
      }
    });
  }

  return frozenSchedules;
}

// Process both files
console.log('=== EXTRACTING FROM APP FILE (has correct January) ===');
const appFile = join(__dirname, '../docs/Turnos aplicacion Enero y Febrero.xlsx');
const appSchedule = parseExcelSchedule(appFile, 1); // Starts with January

console.log('=== EXTRACTING FROM CORRECT FILE (has correct February) ===');
const correctFile = join(__dirname, '../docs/Turnos reales enero y febrero.xlsx');
const correctSchedule = parseExcelSchedule(correctFile, 2); // Starts with February

// Combine: January from app file, February from correct file
const finalSchedule = {
  '2026-00': appSchedule['2026-00'],
  '2026-01': correctSchedule['2026-01']
};

console.log('\n=== FINAL FROZEN SCHEDULES ===');
console.log('January nurses:', Object.keys(finalSchedule['2026-00']).length);
console.log('February nurses:', Object.keys(finalSchedule['2026-01']).length);

// Save combined schedule
const outputPath = join(__dirname, 'frozen-schedules-jan-feb-final.json');
fs.writeFileSync(outputPath, JSON.stringify(finalSchedule, null, 2));
console.log(`\n✅ Saved combined schedule to: ${outputPath}`);

// Show sample
console.log('\n=== SAMPLE (First nurse, January) ===');
const firstNurse = Object.keys(finalSchedule['2026-00'])[0];
console.log(`${firstNurse}:`, JSON.stringify(finalSchedule['2026-00'][firstNurse], null, 2).substring(0, 500));
