import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.warn('Supabase-url eller anon-key saknas i miljövariablerna. Kör i demo-läge.');
}

// När Supabase inte är konfigurerat behöver vi ett "placeholder"-client objekt
// för att typsystemet ska fungera. Koden väljer ändå bort Supabase-anrop i detta läge.
export const supabase = createClient(
  supabaseUrl || 'https://demo.invalid',
  supabaseAnonKey || 'demo-key'
);
