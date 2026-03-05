// Debug script para verificar turnos del 4 de mayo de 2026
import { getWeekIdentifier } from './utils/dateUtils';
import { agenda2026Data, holidays2026 } from './data/agenda2026';

const may4 = new Date(Date.UTC(2026, 4, 4)); // May 4, 2026 in UTC
const dateStr = may4.toISOString().split('T')[0];
const dayOfWeek = may4.getUTCDay();

console.log('=== DEBUG: May 4, 2026 ===');
console.log('Date:', dateStr);
console.log('Day of Week (UTC):', dayOfWeek, '-> ', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]);
console.log('Is Weekend?:', dayOfWeek === 0 || dayOfWeek === 6);
console.log('Is Holiday?:', holidays2026.has(dateStr));

const weekId = getWeekIdentifier(may4);
const activityLevel = agenda2026Data[weekId] || 'NORMAL';
console.log('Week ID:', weekId);
console.log('Activity Level:', activityLevel);

// Check clinical needs
console.log('\n=== Expected Clinical Needs ===');
if (dayOfWeek === 0 || dayOfWeek === 6 || activityLevel === 'CLOSED' || holidays2026.has(dateStr)) {
    console.log('No clinical needs (weekend, closed, or holiday)');
} else if (dayOfWeek === 5) {
    console.log('Friday - Special needs');
} else {
    console.log('Regular workday (NORMAL):');
    console.log('- URGENCES: 2');
    console.log('- TRAVAIL: 2');
    console.log('- URGENCES_TARDE: 1');
    console.log('- TRAVAIL_TARDE: 1');
    console.log('Total: 6 mandatory shifts');
}
