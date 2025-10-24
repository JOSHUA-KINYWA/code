import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Return null if env vars are not set (e.g., during build without Supabase)
  if (!url || !key) {
    console.warn('Supabase credentials not found. Database features will be disabled.');
    return null as any;
  }
  
  return createBrowserClient(url, key);
};

