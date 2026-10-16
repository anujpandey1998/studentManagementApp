import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { theme } from '../theme';

export function Card({ children }: React.PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
export function Input({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, props.style]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
export function Badge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
}
export function Avatar({ name, uri }: { name: string; uri?: string }) {
  return (
    <View accessibilityLabel={name} style={styles.avatar}>
      {uri ? (
        <Image
          accessibilityLabel={`${name} profile photo`}
          source={{ uri }}
          style={styles.avatarImage}
        />
      ) : (
        <Text style={styles.initials}>
          {name
            .split(' ')
            .map(part => part[0])
            .slice(0, 2)
            .join('')}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  field: { gap: 8 },
  label: { color: theme.colors.text, fontSize: 16 },
  input: {
    color: theme.colors.text,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    minHeight: 48,
  },
  error: { color: theme.colors.danger },
  badge: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.accent,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  initials: { color: theme.colors.primary, fontWeight: '700', fontSize: 18 },
});
