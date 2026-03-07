// Rollback frozen schedules to empty (restore previous state)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function rollback() {
  try {
    console.log('📥 Fetching current app_state from Supabase...');
    const { data: currentData, error: fetchError } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 1)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching app_state:', fetchError);
      return;
    }

    console.log('✅ Current data fetched');
    console.log('Current frozen schedules months:', Object.keys(currentData.data?.frozenSchedules || {}));

    // Remove only January and February from frozen schedules
    const frozenSchedules = currentData.data?.frozenSchedules || {};
    delete frozenSchedules['2026-00']; // January
    delete frozenSchedules['2026-01']; // February
    // Keep all other months intact (including March, April, etc.)

    console.log('\n📝 Removing January and February frozen schedules...');
    const { error: updateError } = await supabase
      .from('app_state')
      .update({
        data: {
          ...currentData.data,
          frozenSchedules: frozenSchedules,
          updatedAt: Date.now()
        }
      })
      .eq('id', 1);

    if (updateError) {
      console.error('❌ Error updating app_state:', updateError);
      return;
    }

    console.log('✅ Rollback completed!');
    console.log('\n📊 Summary:');
    console.log('- January 2026 (2026-00): REMOVED');
    console.log('- February 2026 (2026-01): REMOVED');
    console.log('- Other months (including March): PRESERVED');
    console.log('\nRemaining frozen schedule months:', Object.keys(frozenSchedules));
    console.log('\n🔄 Please refresh the application in your browser.');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

rollback();
