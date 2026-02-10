import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'TU_PROJECT_URL_AQUI'; // Ejemplo: https://xxxxx.supabase.co
const supabaseAnonKey = 'TU_ANON_KEY_AQUI'; // La clave larga que copiaste

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
