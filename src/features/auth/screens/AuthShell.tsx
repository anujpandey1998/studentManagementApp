import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme';

export function AuthShell({
  eyebrow = 'VIDYA · SCHOOL MANAGEMENT',
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle: string;
}>) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.mark}>V</Text>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          <View style={styles.intro}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.form}>{children}</View>
          <Text style={styles.footer}>A calmer, clearer school day.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  brand: { gap: theme.spacing.md },
  mark: {
    width: 48,
    height: 48,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 25,
    fontWeight: '800',
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  intro: { gap: theme.spacing.sm },
  title: { color: theme.colors.text, fontSize: 32, fontWeight: '700' },
  subtitle: { color: theme.colors.muted, fontSize: 16, lineHeight: 24 },
  form: { gap: theme.spacing.md },
  footer: { color: theme.colors.muted, textAlign: 'center', fontSize: 13 },
});
