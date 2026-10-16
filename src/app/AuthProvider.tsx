import React, { createContext, useCallback, useEffect, useMemo } from 'react';
import { AppState, Linking } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useDispatch } from 'react-redux';
import {
  authChecking,
  authCleared,
  authFailed,
  authRecoveryCompleted,
  authRecoveryStarted,
  authResolved,
} from '../store/authSlice';
import type { AppDispatch } from '../store';
import { loadSessionUser } from '../features/auth/api/authApi';
import { getSupabaseClient } from '../services/supabase/client';
import { queryPersister } from '../services/offline/queryPersister';

interface AuthContextValue {
  retry: () => void;
  signOut: () => Promise<void>;
  completePasswordRecovery: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'An unexpected auth error occurred.';
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const clientRef = React.useRef<SupabaseClient | null>(null);
  const sessionVersion = React.useRef(0);
  const activeUserId = React.useRef<string | null>(null);

  const loadProfile = useCallback(
    async (client: SupabaseClient, session: Session, version: number) => {
      try {
        const user = await loadSessionUser(client, session);
        if (version === sessionVersion.current) {
          dispatch(authResolved(user));
        }
      } catch (error) {
        if (version === sessionVersion.current) {
          dispatch(authFailed(errorMessage(error)));
        }
      }
    },
    [dispatch],
  );

  const retry = useCallback(() => {
    try {
      const client = clientRef.current ?? getSupabaseClient();
      clientRef.current = client;
      dispatch(authChecking());
      const version = ++sessionVersion.current;
      client.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) {
            dispatch(authFailed(error.message));
          } else if (data.session) {
            loadProfile(client, data.session, version).catch(profileError => {
              dispatch(authFailed(errorMessage(profileError)));
            });
          } else {
            dispatch(authCleared());
          }
        })
        .catch(error => {
          dispatch(authFailed(errorMessage(error)));
        });
    } catch (error) {
      dispatch(authFailed(errorMessage(error)));
    }
  }, [dispatch, loadProfile]);

  useEffect(() => {
    let client: SupabaseClient;
    try {
      client = getSupabaseClient();
      clientRef.current = client;
    } catch (error) {
      dispatch(authFailed(errorMessage(error)));
      return;
    }

    const handleSession = (event: string, session: Session | null): void => {
      if (event === 'SIGNED_OUT' || !session) {
        sessionVersion.current += 1;
        activeUserId.current = null;
        queryClient.clear();
        Promise.resolve(queryPersister.removeClient()).catch(
          (error: unknown) => {
            console.error('Failed to remove persisted school data.', error);
          },
        );
        dispatch(authCleared());
        return;
      }
      if (activeUserId.current && activeUserId.current !== session.user.id) {
        queryClient.clear();
        Promise.resolve(queryPersister.removeClient()).catch(
          (error: unknown) => {
            console.error('Failed to remove persisted school data.', error);
          },
        );
      }
      activeUserId.current = session.user.id;
      if (event === 'PASSWORD_RECOVERY') {
        dispatch(authRecoveryStarted());
      }
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'PASSWORD_RECOVERY'
      ) {
        dispatch(authChecking());
        const version = ++sessionVersion.current;
        setTimeout(() => {
          loadProfile(client, session, version).catch(error => {
            dispatch(authFailed(errorMessage(error)));
          });
        }, 0);
      }
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(handleSession);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        client.auth.startAutoRefresh().catch(error => {
          dispatch(authFailed(errorMessage(error)));
        });
      } else {
        client.auth.stopAutoRefresh().catch(error => {
          dispatch(authFailed(errorMessage(error)));
        });
      }
    });
    if (AppState.currentState === 'active') {
      client.auth.startAutoRefresh().catch(error => {
        dispatch(authFailed(errorMessage(error)));
      });
    }

    const handleRecoveryLink = async (url: string | null | undefined) => {
      if (!url) {
        return;
      }
      try {
        const parsed = new URL(url);
        const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
        const query = new URLSearchParams(parsed.search);
        const params = fragment.has('access_token') ? fragment : query;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (
          parsed.protocol !== 'vidya:' ||
          parsed.host !== 'auth' ||
          parsed.pathname !== '/reset-password' ||
          params.get('type') !== 'recovery' ||
          !accessToken ||
          !refreshToken
        ) {
          return;
        }

        dispatch(authRecoveryStarted());
        const { error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          dispatch(authFailed(error.message));
        }
      } catch (error) {
        dispatch(authFailed(errorMessage(error)));
      }
    };

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleRecoveryLink(url).catch(error => {
        dispatch(authFailed(errorMessage(error)));
      });
    });
    Linking.getInitialURL()
      .then(handleRecoveryLink)
      .catch(error => {
        dispatch(authFailed(errorMessage(error)));
      });

    return () => {
      sessionVersion.current += 1;
      subscription.unsubscribe();
      appState.remove();
      linkSubscription.remove();
    };
  }, [dispatch, loadProfile, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      retry,
      async signOut() {
        const client = clientRef.current ?? getSupabaseClient();
        const { error } = await client.auth.signOut();
        if (error) {
          throw error;
        }
      },
      completePasswordRecovery() {
        dispatch(authRecoveryCompleted());
      },
    }),
    [dispatch, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
