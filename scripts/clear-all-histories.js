import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co';
const supabaseKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllHistories() {
  try {
    const { data: row, error: fetchError } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 1)
      .single();

    if (fetchError) throw fetchError;

    const current = row?.data || {};
    const manualCount = Array.isArray(current.manualChangeLog) ? current.manualChangeLog.length : 0;
    const strasbourgCount = Array.isArray(current.specialStrasbourgEventsLog) ? current.specialStrasbourgEventsLog.length : 0;

    const cleaned = {
      ...current,
      manualChangeLog: [],
      specialStrasbourgEventsLog: [],
      updatedAt: Date.now(),
    };

    const { error: updateError } = await supabase
      .from('app_state')
      .update({ data: cleaned })
      .eq('id', 1);

    if (updateError) throw updateError;

    console.log('✅ Historiales globales borrados correctamente');
    console.log(`- manualChangeLog: ${manualCount} -> 0`);
    console.log(`- specialStrasbourgEventsLog: ${strasbourgCount} -> 0`);
    console.log('ℹ️ No se han tocado turnos, overrides ni frozenSchedules.');
  } catch (error) {
    console.error('❌ Error al limpiar historiales:', error.message || error);
    process.exit(1);
  }
}

clearAllHistories();
