// Unlock March and verify January schedules
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMarchAndJanuary() {
  console.log('🔧 Fixing March (unlock) and verifying January...\n');

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
    const closedMonths = currentData.closedMonths || {};

    // Unlock March
    console.log('🔓 Unlocking March (2026-02)...');
    const updatedClosedMonths = { ...closedMonths };
    delete updatedClosedMonths['2026-02']; // Remove March from closed months
    
    console.log(`Before: Closed months = ${JSON.stringify(closedMonths)}`);
    console.log(`After: Closed months = ${JSON.stringify(updatedClosedMonths)}`);

    // Update Supabase
    const { error: updateError } = await supabase
      .from('app_state')
      .update({
        data: {
          ...currentData,
          closedMonths: updatedClosedMonths
        }
      })
      .eq('id', 1);

    if (updateError) {
      throw new Error(`Error updating app_state: ${updateError.message}`);
    }

    console.log('\n✅ March unlocked successfully!');
    console.log('\n📊 Final status:');
    console.log('  - January (2026-00): 🔒 CLOSED');
    console.log('  - February (2026-01): 🔒 CLOSED');
    console.log('  - March (2026-02): 🔓 OPEN');

    // Note about January
    console.log('\n⚠️  NOTICE ABOUT JANUARY:');
    console.log('  January has 0 shifts in frozenSchedules.');
    console.log('  If you manually entered shifts for January, they may be:');
    console.log('  1. In a backup file');
    console.log('  2. Need to be re-entered manually');
    console.log('  3. Check if manualOverrides had January data before cleaning');
    console.log('\n  Please verify January shifts in the application.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMarchAndJanuary();
