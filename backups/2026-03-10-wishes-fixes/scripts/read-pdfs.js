// Extract schedules from PDF files
import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function extractPDF(filePath, title) {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`📄 ${title}`);
  console.log(`${'='.repeat(100)}\n`);
  
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdf = await pdfjsLib.getDocument(dataBuffer).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    
    console.log(`Pages: ${pdf.numPages}`);
    console.log(`\nContent:\n`);
    console.log(fullText);
    
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

main().catch(console.error);
