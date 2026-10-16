import * as Keychain from 'react-native-keychain';
import type { SupportedStorage } from '@supabase/supabase-js';

const service = 'com.studentmanagementapp.supabase-session';
const username = 'supabase-session';

export const keychainStorage = {
  async getItem(key: string) {
    if (key !== 'supabase.auth.token') {
      return null;
    }
    const credentials = await Keychain.getGenericPassword({ service });
    return credentials ? credentials.password : null;
  },
  async setItem(key: string, value: string) {
    if (key !== 'supabase.auth.token') {
      throw new Error(`Unexpected secure-storage key: ${key}`);
    }
    const saved = await Keychain.setGenericPassword(username, value, {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    if (!saved) {
      throw new Error('Could not save the session in secure storage.');
    }
  },
  async removeItem(key: string) {
    if (key !== 'supabase.auth.token') {
      throw new Error(`Unexpected secure-storage key: ${key}`);
    }
    await Keychain.resetGenericPassword({ service });
  },
} satisfies SupportedStorage;
