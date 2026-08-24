import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://scihwbmnhizpeqihujjc.supabase.co';
const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaWh3Ym1uaGl6cGVxaWh1ampjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDY1NjAsImV4cCI6MjA5OTk4MjU2MH0.mhGPO6Lhx-olstscLmqNKuzle4O50_LbD8w-3g0IgWI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
