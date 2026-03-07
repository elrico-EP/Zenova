// Freeze January and February 2026 schedules permanently
// This script extracts current schedules (with manual changes) and saves them to frozenSchedules
// Also clears manualOverrides for these months and sets closedMonths

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';
const supabase = createClient(supabaseUrl, supabaseKey);

const MONTHS_TO_FREEZE = ['2026-00', '2026-01']; // January and February 2026

async function freezeJanuaryFebruary() {
  console.log('🔒 Freezing January and February 2026 schedules...');

  try {
    // 1. Fetch current state
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

    console.log('\n📊 Current state:');
    console.log('- Frozen schedules:', Object.keys(frozenSchedules));
    console.log('- Manual overrides nurses:', Object.keys(manualOverrides));
    console.log('- Closed months:', Object.keys(closedMonths).filter(k => closedMonths[k]));

    // 2. Build final schedules for January and February (frozen + manual overrides)
    console.log('\n🔄 Building final schedules for January and February...');
    
    const finalSchedules = {};
    for (const monthKey of MONTHS_TO_FREEZE) {
      const baseSchedule = frozenSchedules[monthKey] || {};
      const finalSchedule = JSON.parse(JSON.stringify(baseSchedule));

      // Apply manual overrides
      for (const nurseId in manualOverrides) {
        if (!finalSchedule[nurseId]) {
          finalSchedule[nurseId] = {};
        }
        
        for (const dateKey in manualOverrides[nurseId]) {
          // Only apply overrides for this month
          if (dateKey.startsWith(monthKey)) {
            finalSchedule[nurseId][dateKey] = manualOverrides[nurseId][dateKey];
          }
        }
      }

      finalSchedules[monthKey] = finalSchedule;
      
      // Count shifts
      let totalShifts = 0;
      for (const nurseId in finalSchedule) {
        totalShifts += Object.keys(finalSchedule[nurseId]).length;
      }
      console.log(`  ✓ ${monthKey}: ${Object.keys(finalSchedule).length} nurses, ${totalShifts} shifts`);
    }

    // 3. Clean manual overrides for January and February
    console.log('\n🧹 Cleaning manual overrides for January and February...');
    const cleanedManualOverrides = {};
    
    for (const nurseId in manualOverrides) {
      const nurseOverrides = {};
      for (const dateKey in manualOverrides[nurseId]) {
        // Keep only overrides that are NOT from January or February
        const isJanOrFeb = MONTHS_TO_FREEZE.some(monthKey => dateKey.startsWith(monthKey));
        if (!isJanOrFeb) {
          nurseOverrides[dateKey] = manualOverrides[nurseId][dateKey];
        }
      }
      
      if (Object.keys(nurseOverrides).length > 0) {
        cleanedManualOverrides[nurseId] = nurseOverrides;
      }
    }

    const overridesRemoved = Object.keys(manualOverrides).length - Object.keys(cleanedManualOverrides).length;
    console.log(`  ✓ Removed overrides for ${overridesRemoved} nurses (for Jan/Feb dates)`);

    // 4. Set closedMonths for January and February
    const updatedClosedMonths = { ...closedMonths };
    for (const monthKey of MONTHS_TO_FREEZE) {
      updatedClosedMonths[monthKey] = true;
    }
    console.log('\n🔒 Setting closedMonths for January and February...');
    console.log(`  ✓ Closed months: ${Object.keys(updatedClosedMonths).filter(k => updatedClosedMonths[k]).join(', ')}`);

    // 5. Update frozenSchedules with final schedules
    const updatedFrozenSchedules = { ...frozenSchedules };
    for (const monthKey of MONTHS_TO_FREEZE) {
      updatedFrozenSchedules[monthKey] = finalSchedules[monthKey];
    }

    // 6. Save to Supabase
    console.log('\n💾 Saving to Supabase...');
    const updatedData = {
      ...currentData,
      frozenSchedules: updatedFrozenSchedules,
      manualOverrides: cleanedManualOverrides,
      closedMonths: updatedClosedMonths,
    };

    const { error: updateError } = await supabase
      .from('app_state')
      .update({ data: updatedData })
      .eq('id', 1);

    if (updateError) {
      throw new Error(`Error updating app_state: ${updateError.message}`);
    }

    console.log('✅ Successfully frozen January and February 2026!');
    console.log('\n📝 Summary:');
    console.log(`  - January (2026-00): ${Object.keys(finalSchedules['2026-00']).length} nurses`);
    console.log(`  - February (2026-01): ${Object.keys(finalSchedules['2026-01']).length} nurses`);
    console.log(`  - Manual overrides cleaned for Jan/Feb`);
    console.log(`  - Months marked as closed: ${MONTHS_TO_FREEZE.join(', ')}`);
    console.log('\n🎯 These months are now:');
    console.log('  ✓ Permanently frozen in frozenSchedules');
    console.log('  ✓ Cleared from manualOverrides');
    console.log('  ✓ Marked as closed');
    console.log('  ✓ Will appear in personal agendas as "planning original"');
    console.log('  ✓ Will NOT be affected by recalc from April onwards');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

freezeJanuaryFebruary();
