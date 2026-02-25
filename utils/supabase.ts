import { createClient } from '@supabase/supabase-js'

// REEMPLAZA ESTOS DOS VALORES CON LOS TUYOS DE SUPABASE:
const supabaseUrl = 'https://vetqhqjxisdhhikeosei.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldHFocWp4aXNkaGhpa2Vvc2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjcxMjgsImV4cCI6MjA4NjMwMzEyOH0.d2bRbJHQHYrIG-5ZrZLIdMs194BSbVW0HJMrqqv7iig'

export const supabase = createClient(supabaseUrl, supabaseKey)