// Visual inspector of Excel data
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appFile = join(__dirname, '../docs/Turnos aplicacion Enero y Febrero.xlsx');
const correctFile = join(__dirname, '../docs/Turnos reales enero y febrero.xlsx');

function showExcelData(filePath, title) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 ${title}`);
  console.log(`${'='.repeat(80)}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const header = data[0];
  console.log('\nColumn headers:');
  header.forEach((h, i) => console.log(`  ${i}: ${h}`));

  console.log('\n--- First 50 rows ---\n');
  
  // Show formatted table
  for (let i = 0; i < Math.min(50, data.length); i++) {
    const row = data[i];
    const day = String(row[0] || '');
    
    if (i === 0) {
      console.log(`ROW ${i}: [HEADER]`);
    } else if (day.match(/WEEK|^\s*$/)) {
      console.log(`ROW ${i}: [SECTION] ${day}`);
    } else {
      // Format as: DAY | Nurse1 | Nurse2 | etc.
      let output = `ROW ${i}: ${day.padEnd(15)}`;
      for (let j = 1; j < Math.min(12, row.length); j++) {
        const cell = String(row[j] || '').split('\n')[0]; // Get first line only
        output += ` | ${cell.padEnd(20)}`;
      }
      console.log(output);
    }
  }
}

showExcelData(appFile, 'APP FILE (Turnos aplicacion Enero y Febrero.xlsx)');
showExcelData(correctFile, 'CORRECT FILE (Turnos reales enero y febrero.xlsx)');

console.log(`\n${'='.repeat(80)}`);
console.log('Instructions:');
console.log('1. Review both files above');
console.log('2. Copy differences and paste them here');
console.log('3. Or describe which file is correct for January and February');
console.log(`${'='.repeat(80)}\n`);
