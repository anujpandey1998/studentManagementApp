import { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener(state =>
    setOnline(
      state.isConnected !== false && state.isInternetReachable !== false,
    ),
  ),
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      retry: 2,
    },
    mutations: { retry: false },
  },
});

// staleTime: 60000 — queries ka data default 60 seconds fresh rahega.
// retry: 2 — failed queries ko maximum 2 additional retry attempts milenge, unless individually overridden.
