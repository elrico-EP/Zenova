// Check if there are any shifts for January in any location
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJanuaryDetailed() {
  console.log('🔍 Detailed check for January 2026 shifts...\n');

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
    const currentSchedule = currentData.currentSchedule || {};

    const monthKey = '2026-00';

    console.log('📊 JANUARY IN FROZEN SCHEDULES:');
    console.log('--------------------------------');
    if (frozenSchedules[monthKey]) {
      for (const nurseId in frozenSchedules[monthKey]) {
        const shifts = Object.keys(frozenSchedules[monthKey][nurseId] || {});
        if (shifts.length > 0) {
          console.log(`  ${nurseId}: ${shifts.length} shifts`);
          console.log(`    Example dates: ${shifts.slice(0, 3).join(', ')}`);
        }
      }
    } else {
      console.log('  ❌ No January entry in frozenSchedules');
    }

    console.log('\n📝 JANUARY IN MANUAL OVERRIDES:');
    console.log('--------------------------------');
    let januaryOverrideCount = 0;
    for (const nurseId in manualOverrides) {
      const januaryDates = Object.keys(manualOverrides[nurseId]).filter(d => d.startsWith(monthKey));
      if (januaryDates.length > 0) {
        januaryOverrideCount += januaryDates.length;
        console.log(`  ${nurseId}: ${januaryDates.length} overrides`);
        console.log(`    Dates: ${januaryDates.slice(0, 3).join(', ')}`);
      }
    }
    if (januaryOverrideCount === 0) {
      console.log('  ❌ No January entries in manualOverrides');
    }

    console.log('\n📅 JANUARY IN CURRENT SCHEDULE:');
    console.log('--------------------------------');
    if (currentSchedule) {
      for (const nurseId in currentSchedule) {
        const januaryDates = Object.keys(currentSchedule[nurseId] || {}).filter(d => d.startsWith(monthKey));
        if (januaryDates.length > 0) {
          console.log(`  ${nurseId}: ${januaryDates.length} shifts`);
          console.log(`    Example dates: ${januaryDates.slice(0, 3).join(', ')}`);
        }
      }
    } else {
      console.log('  ℹ️  No currentSchedule object in app_state');
    }

    // Check manualChangeLog for January
    const manualChangeLog = currentData.manualChangeLog || [];
    const januaryLogs = manualChangeLog.filter(log => log.dateKey && log.dateKey.startsWith(monthKey));
    
    console.log('\n📋 JANUARY IN MANUAL CHANGE LOG:');
    console.log('--------------------------------');
    if (januaryLogs.length > 0) {
      console.log(`  Found ${januaryLogs.length} log entries for January`);
      januaryLogs.slice(0, 3).forEach(log => {
        console.log(`  - ${log.dateKey}: ${log.nurseId} → ${log.newShift} (${new Date(log.timestamp).toLocaleString('es-ES')})`);
      });
    } else {
      console.log('  ❌ No January entries in manualChangeLog');
    }

    console.log('\n' + '='.repeat(50));
    console.log('💡 CONCLUSION:');
    if (januaryOverrideCount === 0 && januaryLogs.length === 0) {
      console.log('❌ January does NOT have manually entered shifts in Supabase');
      console.log('   Possible reasons:');
      console.log('   1. Changes were made locally but browser not refreshed');
      console.log('   2. Changes were made but page closed before sync');
      console.log('   3. Shifts need to be re-entered');
    } else {
      console.log(`✓ Found January data: ${januaryOverrideCount} overrides, ${januaryLogs.length} log entries`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkJanuaryDetailed();
