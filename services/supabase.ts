import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
// WARNING: Using Service Role Key on the client side is dangerous in production.
// It bypasses Row Level Security. Use strictly as requested for this setup.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);