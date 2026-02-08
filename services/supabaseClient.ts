import { createClient } from '@supabase/supabase-js';

// Robust environment variable extraction
const meta = import.meta as any;
let env = meta.env || {};

// Fallback to process.env if import.meta.env is empty
if (Object.keys(env).length === 0 && typeof process !== 'undefined' && process.env) {
  env = process.env;
}

// 1. Try Environment Variables
// 2. Fallback to the keys provided in your .env file
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://lujrbhsqzbonxlgxshub.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1anJiaHNxemJvbnhsZ3hzaHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDY0ODcsImV4cCI6MjA4NjA4MjQ4N30.iG4G9Pk_UwBYvw_ODzNNjb52R66SxobqBHM_3lLa3Fs';

console.log("Supabase Client Init:", supabaseUrl ? "URL Found" : "URL Missing");

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;