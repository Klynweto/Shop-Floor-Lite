import { create } from 'zustand';
import * as Network from 'expo-network';
import { SyncStatus } from '../types';
import { performSync, getPendingSyncCount } from '../utils/sync';

interface SyncState extends SyncStatus {
  checkNetworkStatus: () => Promise<void>;
  sync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: false,
  lastSyncTime: undefined,
  pendingItems: 0,
  syncing: false,

  checkNetworkStatus: async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      set({ isOnline });
      
      // Also refresh pending count
      await get().refreshPendingCount();
    } catch (error) {
      console.error('Network check error:', error);
      set({ isOnline: false });
    }
  },

  sync: async () => {
    if (get().syncing) return;
    
    set({ syncing: true });
    try {
      const result = await performSync();
      if (result.success) {
        set({
          lastSyncTime: new Date().toISOString(),
          pendingItems: 0,
        });
      } else {
        // Refresh pending count even on failure to show accurate count
        await get().refreshPendingCount();
      }
    } catch (error) {
      console.error('Sync error:', error);
      await get().refreshPendingCount();
    } finally {
      set({ syncing: false });
    }
  },

  refreshPendingCount: async () => {
    try {
      const count = await getPendingSyncCount();
      set({ pendingItems: count });
    } catch (error) {
      console.error('Error refreshing pending count:', error);
    }
  },
}));

