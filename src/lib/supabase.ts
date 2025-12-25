// /src/lib/supabase.ts
// Cliente de Supabase para Litper Pro

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Soporte para VITE_ prefix y sin prefix
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  'https://gtsivwbnhcawvmsfujby.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0c2l2d2JuaGNhd3Ztc2Z1amJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzE1OTksImV4cCI6MjA4MjA0NzU5OX0.aCLguM3d7vsX5z7PhOQs__TSORmiSmLOI7SINfzBKzg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cliente para serverless functions (usa process.env)
export function getSupabaseServer() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || supabaseUrl;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;

  return createClient<Database>(url, key);
}

export default supabase;
