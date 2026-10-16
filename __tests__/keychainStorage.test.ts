jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import * as Keychain from 'react-native-keychain';
import { keychainStorage } from '../src/services/supabase/keychainStorage';

const mockedKeychain = jest.mocked(Keychain);

test('persists the Supabase session only in device-only Keychain storage', async () => {
  mockedKeychain.setGenericPassword.mockResolvedValue({
    service: 'com.studentmanagementapp.supabase-session',
    storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
  });

  await keychainStorage.setItem('supabase.auth.token', 'session-value');

  expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
    'supabase-session',
    'session-value',
    {
      service: 'com.studentmanagementapp.supabase-session',
      accessible: 'device-only',
    },
  );
});

test('returns null when no session has been saved', async () => {
  mockedKeychain.getGenericPassword.mockResolvedValue(false);

  await expect(
    keychainStorage.getItem('supabase.auth.token'),
  ).resolves.toBeNull();
});
