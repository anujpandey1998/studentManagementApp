import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../../components/ui';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../../../theme';
import { updatePassword } from '../api/authApi';
import { AuthShell } from './AuthShell';

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function UpdatePasswordScreen() {
  const { completePasswordRecovery } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async ({ password }) => {
    setSubmitError(null);
    try {
      await updatePassword(password);
      completePasswordRecovery();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to update your password. Please try again.',
      );
    }
  });

  return (
    <AuthShell
      eyebrow="SECURE ACCOUNT RECOVERY"
      title="Choose a new password"
      subtitle="Use at least 8 characters. Your secure reset link is required."
    >
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            label="New password"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <Input
            label="Confirm new password"
            autoCapitalize="none"
            autoComplete="new-password"
            secureTextEntry
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={errors.confirmPassword?.message}
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
        title="Update password"
        onPress={submit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { color: theme.colors.danger, lineHeight: 21 },
});
