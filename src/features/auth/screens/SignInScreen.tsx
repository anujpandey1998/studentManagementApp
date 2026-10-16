import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input } from '../../../components/ui';
import { theme } from '../../../theme';
import { signInWithPassword } from '../api/authApi';
import { AuthShell } from './AuthShell';
import type { AuthStackParams } from '../types/navigation';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
type FormValues = z.infer<typeof schema>;

export function SignInScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'SignIn'>) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await signInWithPassword(email, password);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to sign in. Please try again.',
      );
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your school account to continue."
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email address"
            accessibilityHint="Enter your school account email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label="Password"
            accessibilityHint="Enter your account password"
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="go"
            secureTextEntry
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={errors.password?.message}
            onSubmitEditing={() => submit()}
          />
        )}
      />
      {submitError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {submitError}
        </Text>
      ) : null}
      <Button
        title="Sign in"
        onPress={submit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Forgot password?"
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Forgot password?</Text>
      </Pressable>
      <Text style={styles.note}>
        Demo accounts are listed in the Phase 2 setup guide.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { color: theme.colors.danger, lineHeight: 21 },
  link: { alignSelf: 'center', padding: theme.spacing.sm },
  linkText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
  note: { color: theme.colors.muted, textAlign: 'center', fontSize: 13 },
});
