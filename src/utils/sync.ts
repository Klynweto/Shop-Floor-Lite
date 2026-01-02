import * as Network from 'expo-network';
import {
  getUnsyncedDowntimeEvents,
  getUnsyncedMaintenanceTasks,
  getUnsyncedAlerts,
  markDowntimeEventSynced,
  markMaintenanceTaskSynced,
  markAlertSynced,
} from '../database/database';
import { DowntimeEvent, MaintenanceTask, Alert } from '../types';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
}

/**
 * Simulates syncing data to a remote server
 * In production, this would make actual API calls
 */
const syncToServer = async (
  downtimeEvents: DowntimeEvent[],
  maintenanceTasks: MaintenanceTask[],
  alerts: Alert[]
): Promise<{ success: boolean; errors: string[] }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, replace this with actual API calls
  // For now, we'll simulate success
  const errors: string[] = [];
  
  // Simulate occasional failures for testing
  if (Math.random() < 0.1) {
    errors.push('Simulated network error');
    return { success: false, errors };
  }
  
  return { success: true, errors: [] };
};

export const performSync = async (): Promise<SyncResult> => {
  try {
    // Check network connectivity
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['No internet connection available'],
      };
    }

    // Get all unsynced items
    const [downtimeEvents, maintenanceTasks, alerts] = await Promise.all([
      getUnsyncedDowntimeEvents(),
      getUnsyncedMaintenanceTasks(),
      getUnsyncedAlerts(),
    ]);

    if (downtimeEvents.length === 0 && maintenanceTasks.length === 0 && alerts.length === 0) {
      return {
        success: true,
        syncedItems: 0,
        errors: [],
      };
    }

    // Attempt to sync
    const result = await syncToServer(downtimeEvents, maintenanceTasks, alerts);

    if (!result.success) {
      return {
        success: false,
        syncedItems: 0,
        errors: result.errors,
      };
    }

    // Mark items as synced
    const syncPromises: Promise<void>[] = [];
    
    for (const event of downtimeEvents) {
      syncPromises.push(markDowntimeEventSynced(event.id));
    }
    
    for (const task of maintenanceTasks) {
      syncPromises.push(markMaintenanceTaskSynced(task.id));
    }
    
    for (const alert of alerts) {
      syncPromises.push(markAlertSynced(alert.id));
    }

    await Promise.all(syncPromises);

    const totalSynced = downtimeEvents.length + maintenanceTasks.length + alerts.length;

    return {
      success: true,
      syncedItems: totalSynced,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      syncedItems: 0,
      errors: [error instanceof Error ? error.message : 'Unknown sync error'],
    };
  }
};

export const getPendingSyncCount = async (): Promise<number> => {
  try {
    const [downtimeEvents, maintenanceTasks, alerts] = await Promise.all([
      getUnsyncedDowntimeEvents(),
      getUnsyncedMaintenanceTasks(),
      getUnsyncedAlerts(),
    ]);

    return downtimeEvents.length + maintenanceTasks.length + alerts.length;
  } catch (error) {
    return 0;
  }
};

