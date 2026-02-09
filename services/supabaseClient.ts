
import { createClient } from '@supabase/supabase-js';

// Default credentials (fallback if env vars are missing)
const DEFAULT_URL = 'https://lujrbhsqzbonxlgxshub.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1anJiaHNxemJvbnhsZ3hzaHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDY0ODcsImV4cCI6MjA4NjA4MjQ4N30.iG4G9Pk_UwBYvw_ODzNNjb52R66SxobqBHM_3lLa3Fs';

// Robust environment variable extraction
const getEnv = (key: string) => {
  try {
    // Check for Vite's import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    // Fallback to process.env if available
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase Config Missing: Realtime features and backend Auth will not work. Application is running in Mock Mode.");
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
