import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co'; // Ejemplo: https://xxxxx.supabase.co
const supabaseAnonKey = 'sb_publishable_2vBvDLqJE9psfQnIcAuxnQ_vbQ3zlmd'; // La clave larga que copiaste

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
