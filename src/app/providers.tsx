import React from 'react';
import { Provider } from 'react-redux';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store';
import { queryClient } from '../query/queryClient';
import { queryPersister } from '../services/offline/queryPersister';
import { OfflineBanner } from '../components/OfflineBanner';
import { AuthProvider } from './AuthProvider';

export function AppProviders({ children }: React.PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: 24 * 60 * 60 * 1000,
            dehydrateOptions: {
              shouldDehydrateQuery: query => query.state.status === 'success',
            },
          }}
        >
          <AuthProvider>
            <OfflineBanner />
            {children}
          </AuthProvider>
        </PersistQueryClientProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
