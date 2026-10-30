import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://zdvavegjhpmvtynzjlzn.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdmF2ZWdqaHBtdnR5bnpqbHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjQ0NDksImV4cCI6MjEwODkwMDQ0OX0.V6t6Rmr4qxtecEmgp0b0wRVmZCmjnQbaEu4J0Xiff2I';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
