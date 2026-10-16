import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'vidya-query-cache-v1',
  throttleTime: 1000,
});
