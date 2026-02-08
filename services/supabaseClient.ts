import { createClient } from '@supabase/supabase-js';

// Robust environment variable extraction
let env: any = {};

try {
  // Check for Vite's import.meta.env
  if (import.meta && import.meta.env) {
    env = import.meta.env;
  }
} catch (e) {
  // Ignore errors if import.meta is not available
}

try {
  // Fallback to process.env if available (Node.js or some bundlers)
  // Ensure we check typeof process to avoid ReferenceError in strict browser envs
  if (Object.keys(env).length === 0 && typeof process !== 'undefined' && process.env) {
    env = process.env;
  }
} catch (e) {
  // Ignore errors if process is not available
}

// 1. Try Environment Variables
// 2. Fallback to the keys provided in your .env file
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://lujrbhsqzbonxlgxshub.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1anJiaHNxemJvbnhsZ3hzaHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDY0ODcsImV4cCI6MjA4NjA4MjQ4N30.iG4G9Pk_UwBYvw_ODzNNjb52R66SxobqBHM_3lLa3Fs';

console.log("Supabase Client Init:", supabaseUrl ? "URL Found" : "URL Missing");

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;