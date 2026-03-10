// Script to read and compare Excel schedules
import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read both Excel files
const currentFile = join(__dirname, '../docs/Turnos aplicacion Enero y Febrero.xlsx');
const correctFile = join(__dirname, '../docs/Turnos reales enero y febrero.xlsx');

console.log('Reading current schedule from app...');
const currentWorkbook = XLSX.readFile(currentFile);
const currentSheet = currentWorkbook.Sheets[currentWorkbook.SheetNames[0]];
const currentData = XLSX.utils.sheet_to_json(currentSheet, { header: 1 });

console.log('Reading correct schedule...');
const correctWorkbook = XLSX.readFile(correctFile);
const correctSheet = correctWorkbook.Sheets[correctWorkbook.SheetNames[0]];
const correctData = XLSX.utils.sheet_to_json(correctSheet, { header: 1 });

console.log('\n=== CURRENT SCHEDULE (from app) ===');
console.log(JSON.stringify(currentData, null, 2));

console.log('\n=== CORRECT SCHEDULE (should be) ===');
console.log(JSON.stringify(correctData, null, 2));
