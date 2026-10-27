import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://tribbxygkdjvnlvbcgtw.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uHh07M4yfylS9Glysokyew_3yndMQ2s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
