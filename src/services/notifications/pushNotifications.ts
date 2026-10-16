import { Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { getApps } from '@react-native-firebase/app';
import { registerDeviceToken } from '../../features/school/api/schoolApi';
import type { SessionUser } from '../../types/domain';

export async function enablePushNotifications(
  user: SessionUser,
): Promise<() => void> {
  if (getApps().length === 0) {
    throw new Error(
      'Firebase is not configured. Add the Android google-services.json and iOS GoogleService-Info.plist before enabling push.',
    );
  }
  const platform = Platform.OS;
  if (platform !== 'ios' && platform !== 'android') {
    throw new Error(
      'Push notifications are only supported on iOS and Android.',
    );
  }
  const messaging = getMessaging();
  const permission = await requestPermission(messaging);
  const enabled =
    permission === AuthorizationStatus.AUTHORIZED ||
    permission === AuthorizationStatus.PROVISIONAL;
  if (!enabled) {
    throw new Error('Notification permission was not granted.');
  }
  const token = await getToken(messaging);
  if (!token) {
    throw new Error('Firebase did not return a device token.');
  }
  await registerDeviceToken({
    userId: user.id,
    instituteId: user.instituteId,
    token,
    platform,
  });
  const unsubscribe = onTokenRefresh(messaging, nextToken => {
    registerDeviceToken({
      userId: user.id,
      instituteId: user.instituteId,
      token: nextToken,
      platform,
    }).catch(error => {
      console.error('Failed to update the push notification token.', error);
    });
  });
  return unsubscribe;
}
