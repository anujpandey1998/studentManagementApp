import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui';
import { theme } from '../../../theme';
import { useAuth } from '../hooks/useAuth';

export function AuthLoadingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.text}>Restoring your secure session…</Text>
      </View>
    </SafeAreaView>
  );
}

export function AuthErrorScreen({ message }: { message: string }) {
  const { retry } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>
          Sign-in is unavailable
        </Text>
        <Text accessibilityRole="alert" style={styles.text}>
          {message}
        </Text>
        <Button title="Try again" onPress={retry} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  heading: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  text: { color: theme.colors.muted, fontSize: 16, lineHeight: 24 },
});
