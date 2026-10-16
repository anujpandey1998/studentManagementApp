import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from './ui';
import { theme } from '../theme';

type Props = {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  onRetry: () => void;
  children: React.ReactNode;
};
export function AsyncState({
  loading,
  error,
  empty,
  onRetry,
  children,
}: Props) {
  if (loading) {
    return (
      <View
        accessibilityLabel="Loading content"
        accessibilityState={{ busy: true }}
        style={styles.stack}
      >
        {[1, 2, 3].map(id => (
          <View key={id} style={styles.skeleton} />
        ))}
      </View>
    );
  }
  if (error) {
    return (
      <Card>
        <Text accessibilityRole="alert" style={styles.text}>
          {error}
        </Text>
        <Button title="Try again" onPress={onRetry} />
      </Card>
    );
  }
  if (empty) {
    return (
      <Card>
        <Text style={styles.text}>Nothing here yet.</Text>
      </Card>
    );
  }
  return <>{children}</>;
}
const styles = StyleSheet.create({
  stack: { gap: 16 },
  skeleton: {
    height: 100,
    borderRadius: 16,
    backgroundColor: theme.colors.border,
  },
  text: { color: theme.colors.text, fontSize: 16 },
});
