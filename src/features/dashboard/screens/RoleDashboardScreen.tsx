import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { Avatar, Button, Card } from '../../../components/ui';
import { useAuth } from '../../auth/hooks/useAuth';
import type { RootState } from '../../../store';
import type { Role } from '../../../types/domain';
import type { RootStackParams } from '../../../app/navigation/types';
import type { SchoolFeature } from '../../school/api/schoolApi';
import { theme } from '../../../theme';
import { enablePushNotifications } from '../../../services/notifications/pushNotifications';

const roleContent: Record<
  Role,
  {
    greeting: string;
    description: string;
    modules: { feature: SchoolFeature; label: string; description: string }[];
  }
> = {
  admin: {
    greeting: 'Your school, at a glance.',
    description: 'Manage your school community and keep the day moving.',
    modules: [
      {
        feature: 'students',
        label: 'Students',
        description: 'Find and register learners.',
      },
      {
        feature: 'attendance',
        label: 'Attendance',
        description: 'Record and review daily attendance.',
      },
      {
        feature: 'results',
        label: 'Marks & results',
        description: 'Review exam performance.',
      },
      {
        feature: 'timetable',
        label: 'Timetable',
        description: 'See the school schedule.',
      },
      {
        feature: 'assignments',
        label: 'Assignments',
        description: 'Track class work and due dates.',
      },
      {
        feature: 'fees',
        label: 'Fees',
        description: 'Review invoices and payments.',
      },
      {
        feature: 'notices',
        label: 'Notices',
        description: 'Read school announcements.',
      },
    ],
  },
  teacher: {
    greeting: 'Your classroom, in sync.',
    description: 'Plan lessons, record attendance and support every learner.',
    modules: [
      {
        feature: 'students',
        label: 'My students',
        description: 'Browse learners in your assigned classes.',
      },
      {
        feature: 'attendance',
        label: 'Attendance',
        description: 'Record daily class attendance.',
      },
      {
        feature: 'results',
        label: 'Marks & results',
        description: 'Review marks for assigned classes.',
      },
      {
        feature: 'timetable',
        label: 'Timetable',
        description: 'See your class schedule.',
      },
      {
        feature: 'assignments',
        label: 'Assignments',
        description: 'Review class work and due dates.',
      },
      {
        feature: 'notices',
        label: 'Notices',
        description: 'Read school announcements.',
      },
    ],
  },
  student: {
    greeting: 'Your learning journey.',
    description: 'Stay on top of classes, progress and school updates.',
    modules: [
      {
        feature: 'attendance',
        label: 'My attendance',
        description: 'Check your daily attendance record.',
      },
      {
        feature: 'results',
        label: 'My results',
        description: 'Review your exam marks.',
      },
      {
        feature: 'timetable',
        label: 'My timetable',
        description: 'See your weekly class schedule.',
      },
      {
        feature: 'assignments',
        label: 'Assignments',
        description: 'Keep track of class work and due dates.',
      },
      {
        feature: 'fees',
        label: 'Fees',
        description: 'Review your invoices and payments.',
      },
      {
        feature: 'notices',
        label: 'Notices',
        description: 'Read school announcements.',
      },
    ],
  },
};

const roleNames: Record<Role, string> = {
  admin: 'School administrator',
  teacher: 'Teacher',
  student: 'Student',
};

export function RoleDashboardScreen({ role }: { role: Role }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pushReady, setPushReady] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const removeTokenListener = useRef<(() => void) | null>(null);
  const content = roleContent[role];
  useEffect(
    () => () => {
      removeTokenListener.current?.();
    },
    [],
  );
  const enableNotifications = async () => {
    if (!user) {
      return;
    }
    setPushLoading(true);
    setError(null);
    try {
      removeTokenListener.current?.();
      removeTokenListener.current = await enablePushNotifications(user);
      setPushReady(true);
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : 'Unable to enable notifications.',
      );
    } finally {
      setPushLoading(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : 'Unable to sign out. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <Text style={styles.eyebrow}>VIDYA · YOUR SCHOOL</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {content.greeting}
            </Text>
          </View>
          <Avatar name={user?.fullName ?? 'Vidya'} />
        </View>
        <View style={styles.profile}>
          <View style={styles.identity}>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.role}>{roleNames[role]}</Text>
          </View>
          <Text style={styles.description}>{content.description}</Text>
        </View>
        {content.modules.map((module, index) => (
          <Pressable
            key={module.feature}
            accessibilityRole="button"
            accessibilityLabel={`Open ${module.label}`}
            onPress={() =>
              navigation.navigate('SchoolFeature', {
                feature: module.feature,
              })
            }
          >
            <Card>
              <Text style={styles.cardIndex}>
                {String(index + 1).padStart(2, '0')} · YOUR WORKSPACE
              </Text>
              <Text style={styles.cardTitle}>{module.label}</Text>
              <Text style={styles.cardDescription}>{module.description}</Text>
              <Text style={styles.openLabel}>Open workspace →</Text>
            </Card>
          </Pressable>
        ))}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {!pushReady ? (
          <Button
            title="Enable notifications"
            loading={pushLoading}
            onPress={enableNotifications}
          />
        ) : (
          <Text style={styles.notificationReady}>
            Notifications are enabled for this device.
          </Text>
        )}
        <Button title="Sign out" onPress={handleSignOut} />
        <Text style={styles.footer}>
          Your access is based on your school account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  brand: { flex: 1, gap: theme.spacing.sm },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  profile: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  identity: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  name: { color: theme.colors.text, fontSize: 17, fontWeight: '700' },
  role: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  description: { color: theme.colors.muted, lineHeight: 22 },
  cardIndex: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '700' },
  cardDescription: { color: theme.colors.muted, lineHeight: 21 },
  openLabel: { color: theme.colors.primary, fontWeight: '700' },
  notificationReady: {
    color: theme.colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  error: { color: theme.colors.danger, lineHeight: 21 },
  footer: { color: theme.colors.muted, textAlign: 'center', fontSize: 13 },
});
