import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input } from '../../../components/ui';
import { theme } from '../../../theme';
import { sendPasswordReset } from '../api/authApi';
import { AuthShell } from './AuthShell';
import type { AuthStackParams } from '../types/navigation';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ForgotPassword'>) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setSubmitError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to send the reset email. Please try again.',
      );
    }
  });

  return (
    <AuthShell
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? 'If the account exists, a secure password reset link has been sent.'
          : 'Enter your account email and we will send you a secure reset link.'
      }
    >
      {!sent ? (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                label="Email address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.email?.message}
              />
            )}
          />
          {submitError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {submitError}
            </Text>
          ) : null}
          <Button
            title="Send reset link"
            onPress={submit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </>
      ) : (
        <Text style={styles.notice}>
          For local development, open the email in Supabase Mailpit at
          http://127.0.0.1:54324.
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        onPress={() => navigation.navigate('SignIn')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Back to sign in</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { color: theme.colors.danger, lineHeight: 21 },
  notice: { color: theme.colors.success, lineHeight: 22 },
  link: { alignSelf: 'center', padding: theme.spacing.sm },
  linkText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
});
