// Extract text from PDFs
import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function extractPDF(filePath, title) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 ${title}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    console.log(`Pages: ${data.numpages}`);
    console.log(`\nContent (first 3000 chars):\n`);
    console.log(data.text.substring(0, 3000));
    
  } catch (err) {
    console.error('Error reading PDF:', err.message);
  }
}

async function main() {
  const docsDir = join(__dirname, '../docs');
  
  await extractPDF(
    join(docsDir, 'Schedule_2026-01.pdf'),
    'CURRENT JANUARY (Schedule_2026-01.pdf)'
  );
  
  await extractPDF(
    join(docsDir, 'Schedule_2026-02.pdf'),
    'CURRENT FEBRUARY (Schedule_2026-02.pdf)'
  );
  
  await extractPDF(
    join(docsDir, 'Turnos definitivos - enero y febrero.pdf'),
    'CORRECT JANUARY & FEBRUARY (Turnos definitivos - enero y febrero.pdf)'
  );
}

main();
