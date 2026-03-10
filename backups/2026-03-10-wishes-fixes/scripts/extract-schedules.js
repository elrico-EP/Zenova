// Script to extract and convert Excel schedules to frozen schedule format
import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const correctFile = join(__dirname, '../docs/Turnos reales enero y febrero.xlsx');

console.log('Reading correct schedule...');
const workbook = XLSX.readFile(correctFile);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Nurse names mapping (from Excel columns to nurse IDs)
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
  'Ana': 'nurse-11'
};

// Get nurse column indexes from header
const header = data[0];
const nurseColumns = {};
Object.keys(nurseMapping).forEach(name => {
  const index = header.indexOf(name);
  if (index !== -1) {
    nurseColumns[name] = index;
  }
});

console.log('\nNurse columns found:', nurseColumns);

// Shift mapping
const shiftMap = {
  'Urg M': 'URGENCES',
  'Urg T': 'URGENCES_TARDE',
  'Trav M': 'TRAVAIL',
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
  'Red. 80%': ''
};

// Parse schedule data
const frozenSchedules = {
  '2026-00': {}, // January (month index 0)
  '2026-01': {}  // February (month index 1)
};

let currentMonth = 2; // Start with February (since Excel starts from Feb 2nd)
let year = 2026;

console.log('\nProcessing rows...');

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  
  const dayCell = String(row[0] || '');
  
  // Check if it's a day row (e.g., "'1 Sun", "'2 Mon", etc.)
  const dayMatch = dayCell.match(/^'?(\d+)\s+\w+/);
  if (!dayMatch) continue;
  
  const day = parseInt(dayMatch[1]);
  
  // Detect month change (February starts at day 2, we're still in Feb until day 1 of March)
  if (day === 1 && i > 10) {
    currentMonth = 3; // March (but we're only doing Jan-Feb)
    break; // Stop processing
  }
  
  const dateKey = `${year}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const monthKey = `2026-${String(currentMonth - 1).padStart(2, '0')}`;
  
  console.log(`Processing ${dateKey}...`);
  
  // Extract shifts for each nurse
  Object.entries(nurseColumns).forEach(([nurseName, colIndex]) => {
    const nurseId = nurseMapping[nurseName];
    let cellValue = String(row[colIndex] || '').trim();
    
    if (!cellValue || cellValue === '' || cellValue === 'Red. 80%') return;
    
    // Handle multi-line cells (shift + hours)
    cellValue = cellValue.split('\n')[0].trim();
    
    // Handle cells with multiple shifts (e.g., "STR travel (08:00 - 13:30)")
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

// Write output
const output = {
  '2026-01': frozenSchedules['2026-01'] // Only February
};

console.log('\n=== FROZEN SCHEDULES (February 2026) ===');
console.log(JSON.stringify(output, null, 2));

// Save to file
const outputPath = join(__dirname, 'frozen-schedule-february.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\n✅ Saved to: ${outputPath}`);
