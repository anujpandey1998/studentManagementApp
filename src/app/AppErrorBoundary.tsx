import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Button } from '../components/ui';
import { theme } from '../theme';

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>
              Something went wrong
            </Text>
            <Text style={styles.message}>
              The screen could not be displayed. Please try again.
            </Text>
            <Button title="Try again" onPress={this.retry} />
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  message: { color: theme.colors.muted, lineHeight: 22 },
});
