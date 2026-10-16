import React from 'react';
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from '@env';
import { AppErrorBoundary } from './src/app/AppErrorBoundary';
import { AppProviders } from './src/app/providers';
import { RootNavigator } from './src/app/navigation/RootNavigator';

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  tracesSampleRate: 0.1,
});

const App = () => {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <RootNavigator />
      </AppErrorBoundary>
    </AppProviders>
  );
};

export default Sentry.wrap(App);
