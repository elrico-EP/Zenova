// Analyze May 2026 afternoon shifts for Paola and Elena
// Investigating why they have 3 consecutive URGENCES_TARDE

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simplified data structures for analysis
const nurses = [
  { id: 'nurse-1', name: 'Elvio', jornadaType: '100%' },
  { id: 'nurse-2', name: 'Tanja', jornadaType: '100%' },
  { id: 'nurse-3', name: 'Virginie', jornadaType: '100%' },
  { id: 'nurse-4', name: 'Paola', jornadaType: '90%' }, // END_SHIFT_4H Monday
  { id: 'nurse-5', name: 'Elena', jornadaType: '90%' }, // LEAVE_EARLY_1H Mon-Thu
  { id: 'nurse-6', name: 'Miguel', jornadaType: '100%' },
  { id: 'nurse-7', name: 'Gorka', jornadaType: '100%' },
  { id: 'nurse-8', name: 'Katelijn', jornadaType: '90%' }, // END_SHIFT_4H Friday
  { id: 'nurse-9', name: 'Joseph', jornadaType: '100%' },
  { id: 'nurse-10', name: 'Tatiana', jornadaType: '80%' }, // FULL_DAY_OFF Wednesday
];

const agenda2026 = {
  '2026-W19': 'NORMAL',        // 04/05/2026 - Week starts May 4 (Monday)
  '2026-W20': 'NORMAL',        // 11/05/2026 - Week starts May 11 (Monday)
  '2026-W21': 'SESSION',       // 18/05/2026 - Week starts May 18 (Monday)
  '2026-W22': 'WHITE_GREEN',   // 25/05/2026 - Week starts May 25 (Monday)
};

const holidays2026 = new Set([
  '2026-05-01', // May 1 (Friday)
  '2026-05-14', // May 14 (Thursday - Ascension)
  '2026-05-15', // May 15 (Friday - Bridge day)
  '2026-05-25', // May 25 (Monday - Pentecost)
]);

console.log('=== MAY 2026 CALENDAR STRUCTURE ===\n');
console.log('Week 19 (W19): May 4-8 - NORMAL week');
console.log('  - May 1 (Fri): HOLIDAY (before this week)');
console.log('  - May 4 (Mon): Normal Monday');
console.log('  - May 5 (Tue): Normal Tuesday');
console.log('  - May 6 (Wed): Normal Wednesday');
console.log('  - May 7 (Thu): Normal Thursday');
console.log('  - May 8 (Fri): Normal Friday');
console.log('');
console.log('Week 20 (W20): May 11-15 - NORMAL week');
console.log('  - May 11 (Mon): Normal Monday');
console.log('  - May 12 (Tue): Normal Tuesday');
console.log('  - May 13 (Wed): Normal Wednesday');
console.log('  - May 14 (Thu): HOLIDAY (Ascension)');
console.log('  - May 15 (Fri): HOLIDAY (Bridge day)');
console.log('');
console.log('Week 21 (W21): May 18-22 - SESSION week');
console.log('  - May 18 (Mon): Normal Monday');
console.log('  - May 19 (Tue): Normal Tuesday');
console.log('  - May 20 (Wed): Normal Wednesday');
console.log('  - May 21 (Thu): Normal Thursday');
console.log('  - May 22 (Fri): Normal Friday');
console.log('  - Strasbourg: Elvio, Elena, Virginie, Gorka');
console.log('');
console.log('Week 22 (W22): May 25-29 - WHITE_GREEN week');
console.log('  - May 25 (Mon): HOLIDAY (Pentecost)');
console.log('  - May 26 (Tue): Normal Tuesday');
console.log('  - May 27 (Wed): Normal Wednesday');
console.log('  - May 28 (Thu): Normal Thursday');
console.log('  - May 29 (Fri): Normal Friday');
console.log('\n');

// Jornada restrictions
const jornadaRestrictions = {
  'Paola': { 
    type: '90% END_SHIFT_4H',
    restrictedDay: 1, // Monday (0=Sunday, 1=Monday)
    description: 'Cannot work afternoon shifts on Monday'
  },
  'Elena': { 
    type: '90% LEAVE_EARLY_1H',
    restrictedDay: null, // Can work afternoons but leaves 1h early Mon-Thu
    description: 'Can work afternoons but -1h Mon-Thu'
  },
  'Katelijn': { 
    type: '90% END_SHIFT_4H',
    restrictedDay: 5, // Friday
    description: 'Cannot work afternoon shifts on Friday'
  },
  'Tatiana': { 
    type: '80% FULL_DAY_OFF',
    restrictedDay: 3, // Wednesday
    description: 'Does not work Wednesdays at all'
  }
};

console.log('=== JORNADA RESTRICTIONS (Important for afternoon shifts) ===\n');
for (const [nurse, restriction] of Object.entries(jornadaRestrictions)) {
  console.log(`${nurse}: ${restriction.description}`);
}
console.log('\n');

// Key observation about algorithm
console.log('=== ALGORITHM KEY CHARACTERISTICS ===\n');
console.log('1. URGENCES_TARDE is assigned FIRST (highest priority)');
console.log('2. Selection uses: Monthly stat (lowest URGENCES_TARDE count) → Weekly stat → Total clinical → Random');
console.log('3. Weekly stats RESET every Monday');
console.log('4. Jornada restrictions filter candidates BEFORE selection');
console.log('5. Nurses with upcoming Strasbourg are NOT explicitly deprioritized\n');

console.log('=== HYPOTHESIS: Why Consecutive Afternoon Shifts? ===\n');
console.log('THEORY 1: Limited Candidate Pool');
console.log('  - Paola: Cannot work Mon afternoon (jornada)');
console.log('  - Katelijn: Cannot work Fri afternoon (jornada)');
console.log('  - Tatiana: Cannot work Wed (full day off)');
console.log('  - This reduces afternoon pool from 10 to 7-8 on certain days');
console.log('');
console.log('THEORY 2: Weekly Stats Reset');
console.log('  - If Paola works URGENCES_TARDE on Thu-Fri of Week 19...');
console.log('  - Stats reset Monday May 11 (Week 20)');
console.log('  - Paola again has low weekly stat, gets selected for Week 20');
console.log('  - If pattern repeats → consecutive weeks');
console.log('');
console.log('THEORY 3: Monthly Stat Tie-Breaking');
console.log('  - If multiple nurses have SAME monthly URGENCES_TARDE count...');
console.log('  - System uses weekly stat → total clinical → RANDOM');
console.log('  - Random tie-breaker could pick same nurse multiple times');
console.log('');
console.log('THEORY 4: Strasbourg Weeks');
console.log('  - Week 21 (May 18-22) is SESSION week');
console.log('  - Elena assigned to STRASBOURG this week');
console.log('  - But if she already worked consecutive afternoons in W19-W20...');
console.log('  - System does NOT retroactively balance this out');
console.log('\n');

console.log('=== SPECIFIC INVESTIGATION NEEDED ===\n');
console.log('To confirm root cause, need to:');
console.log('1. Run full recalculateScheduleForMonth() for May 2026');
console.log('2. Trace day-by-day URGENCES_TARDE assignments:');
console.log('   - Which nurses are candidates each day?');
console.log('   - What are their monthly/weekly stats at time of selection?');
console.log('   - Who gets selected and why?');
console.log('3. Check if pattern is:');
console.log('   - Paola: Thu/Fri Week 19 → Tue/Wed Week 20 → Mon Week 22?');
console.log('   - Elena: Similar pattern the following week?');
console.log('4. Verify if issue is:');
console.log('   - a) Insufficient candidate pool diversity');
console.log('   - b) Weekly reset creating artificial "freshness"');
console.log('   - c) Random tie-breaking favoring same person');
console.log('   - d) Lack of "recent assignment" penalty\n');

console.log('=== POTENTIAL SOLUTIONS (if confirmed as issue) ===\n');
console.log('Option A: Add "last URGENCES_TARDE date" tracking');
console.log('  - Deprioritize nurse if they worked same shift in past 3 days');
console.log('  - Prevents consecutive afternoon assignments');
console.log('');
console.log('Option B: Strasbourg week awareness');
console.log('  - Reduce monthly stat weight for nurses assigned to Strasbourg upcoming week');
console.log('  - Spreads afternoon load before SESSION weeks');
console.log('');
console.log('Option C: Stronger weekly equity');
console.log('  - Change sorting to: Weekly stat → Monthly stat (reverse current order)');
console.log('  - Prevents same person dominating within single week');
console.log('');
console.log('Option D: Consecutive shift penalty');
console.log('  - Add penalty score for working same shift yesterday');
console.log('  - Force more rotation within week');
console.log('\n');

console.log('=== RECOMMENDATION ===');
console.log('First, confirm the exact pattern by examining the generated schedule.');
console.log('The user should provide the actual May 2026 schedule to see:');
console.log('- Which exact dates Paola/Elena have URGENCES_TARDE');
console.log('- What days of the week these fall on');
console.log('- Whether they are truly consecutive or just frequent\n');

console.log('Without seeing the actual schedule, this is the best analysis possible.');
console.log('The algorithm is working as designed (equitable monthly distribution),');
console.log('but may need refinement to avoid "bunching" within short time windows.\n');
