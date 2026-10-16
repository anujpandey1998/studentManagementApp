import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@env';
import { keychainStorage } from './keychainStorage';

export function getSupabaseConfig() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.startsWith('replace-with-')
  ) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and add the local API URL and publishable key.',
    );
  }

  return { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY };
}

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const config = getSupabaseConfig();
  client = createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: keychainStorage,
    },
  });
  return client;
}
