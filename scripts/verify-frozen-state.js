// Verify frozen schedules for January and February 2026
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying January and February 2026 schedules...\n');

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 1)
      .single();

    if (error) {
      throw new Error(`Error fetching app_state: ${error.message}`);
    }

    const currentData = data.data;
    const frozenSchedules = currentData.frozenSchedules || {};
    const manualOverrides = currentData.manualOverrides || {};
    const closedMonths = currentData.closedMonths || {};

    console.log('📊 FROZEN SCHEDULES:');
    console.log('-------------------');
    for (const monthKey of ['2026-00', '2026-01', '2026-02', '2026-03', '2026-04']) {
      const monthName = {
        '2026-00': 'January',
        '2026-01': 'February',
        '2026-02': 'March',
        '2026-03': 'April',
        '2026-04': 'May'
      }[monthKey];
      
      if (frozenSchedules[monthKey]) {
        const nurses = Object.keys(frozenSchedules[monthKey]);
        let totalShifts = 0;
        nurses.forEach(nurseId => {
          totalShifts += Object.keys(frozenSchedules[monthKey][nurseId] || {}).length;
        });
        console.log(`${monthName} (${monthKey}): ${nurses.length} nurses, ${totalShifts} shifts`);
      } else {
        console.log(`${monthName} (${monthKey}): NOT FROZEN`);
      }
    }

    console.log('\n🔒 CLOSED MONTHS:');
    console.log('-------------------');
    for (const monthKey of ['2026-00', '2026-01', '2026-02', '2026-03', '2026-04']) {
      const monthName = {
        '2026-00': 'January',
        '2026-01': 'February',
        '2026-02': 'March',
        '2026-03': 'April',
        '2026-04': 'May'
      }[monthKey];
      
      const isClosed = closedMonths[monthKey] === true;
      console.log(`${monthName} (${monthKey}): ${isClosed ? '🔒 CLOSED' : '🔓 OPEN'}`);
    }

    console.log('\n📝 MANUAL OVERRIDES (by month):');
    console.log('-------------------');
    const overridesByMonth = {};
    for (const nurseId in manualOverrides) {
      for (const dateKey in manualOverrides[nurseId]) {
        const monthKey = dateKey.substring(0, 7); // Extract "2026-00" from "2026-00-01"
        overridesByMonth[monthKey] = (overridesByMonth[monthKey] || 0) + 1;
      }
    }
    
    for (const monthKey of ['2026-00', '2026-01', '2026-02', '2026-03', '2026-04']) {
      const monthName = {
        '2026-00': 'January',
        '2026-01': 'February',
        '2026-02': 'March',
        '2026-03': 'April',
        '2026-04': 'May'
      }[monthKey];
      
      const count = overridesByMonth[monthKey] || 0;
      console.log(`${monthName} (${monthKey}): ${count} manual overrides`);
    }

    console.log('\n✅ Verification complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verify();
