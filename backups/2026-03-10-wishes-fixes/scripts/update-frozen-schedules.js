// Update Supabase with correct frozen schedules for January and February
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load frozen schedules
const frozenSchedulesPath = join(__dirname, 'frozen-schedules-jan-feb-final.json');
const frozenSchedulesData = JSON.parse(fs.readFileSync(frozenSchedulesPath, 'utf-8'));

console.log('Loaded frozen schedules:');
console.log('- January (2026-00):', Object.keys(frozenSchedulesData['2026-00']).length, 'nurses');
console.log('- February (2026-01):', Object.keys(frozenSchedulesData['2026-01']).length, 'nurses');

// Initialize Supabase
const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFrozenSchedules() {
  try {
    console.log('\n📥 Fetching current app_state from Supabase...');
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

    // Merge with existing frozen schedules (keep other months)
    const currentFrozenSchedules = currentData.data?.frozenSchedules || {};
    const updatedFrozenSchedules = {
      ...currentFrozenSchedules,
      '2026-00': frozenSchedulesData['2026-00'],
      '2026-01': frozenSchedulesData['2026-01']
    };

    console.log('\n📝 Updating Supabase with correct schedules...');
    const { error: updateError } = await supabase
      .from('app_state')
      .update({
        data: {
          ...currentData.data,
          frozenSchedules: updatedFrozenSchedules,
          updatedAt: Date.now()
        }
      })
      .eq('id', 1);

    if (updateError) {
      console.error('❌ Error updating app_state:', updateError);
      return;
    }

    console.log('✅ Frozen schedules updated successfully!');
    console.log('\n📊 Summary:');
    console.log('- January 2026 (2026-00): Updated');
    console.log('- February 2026 (2026-01): Updated');
    console.log('- Other months: Preserved');
    console.log('\n🔄 Please refresh the application in your browser to see the changes.');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

updateFrozenSchedules();
