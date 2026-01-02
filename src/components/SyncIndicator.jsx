import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, FAB, Portal, Dialog, Button } from 'react-native-paper';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

export default function SyncIndicator() {
  const {
    isOnline,
    pendingItems,
    lastSyncTime,
    syncing,
    checkNetworkStatus,
    sync,
    refreshPendingCount,
  } = useSyncStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showSyncDialog, setShowSyncDialog] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkNetworkStatus();
      refreshPendingCount();
      
      // Check network status periodically
      const interval = setInterval(() => {
        checkNetworkStatus();
        refreshPendingCount();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleSync = async () => {
    await sync();
    setShowSyncDialog(false);
  };

  if (!isAuthenticated || (pendingItems === 0 && isOnline)) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          !isOnline && styles.offlineContainer,
          pendingItems > 0 && styles.pendingContainer,
        ]}
        onPress={() => setShowSyncDialog(true)}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#4caf50' : '#f44336' },
            ]}
          />
          <View style={styles.textContainer}>
            <Text variant="bodySmall" style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {pendingItems > 0 && (
              <Text variant="bodySmall" style={styles.pendingText}>
                {pendingItems} pending
              </Text>
            )}
          </View>
          {syncing && (
            <Text variant="bodySmall" style={styles.syncingText}>
              Syncing...
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <Portal>
        <Dialog
          visible={showSyncDialog}
          onDismiss={() => setShowSyncDialog(false)}
        >
          <Dialog.Title>Sync Status</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              <View style={styles.dialogRow}>
                <Text variant="bodyMedium">Status:</Text>
                <View style={styles.dialogStatus}>
                  <View
                    style={[
                      styles.dialogDot,
                      { backgroundColor: isOnline ? '#4caf50' : '#f44336' },
                    ]}
                  />
                  <Text variant="bodyMedium">
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              {pendingItems > 0 && (
                <View style={styles.dialogRow}>
                  <Text variant="bodyMedium">Pending Items:</Text>
                  <Text variant="bodyMedium" style={styles.dialogValue}>
                    {pendingItems}
                  </Text>
                </View>
              )}

              {lastSyncTime && (
                <View style={styles.dialogRow}>
                  <Text variant="bodyMedium">Last Sync:</Text>
                  <Text variant="bodyMedium" style={styles.dialogValue}>
                    {format(new Date(lastSyncTime), 'MMM d, HH:mm:ss')}
                  </Text>
                </View>
              )}

              {!isOnline && (
                <Text variant="bodySmall" style={styles.warningText}>
                  You are currently offline. Data will sync automatically when
                  connection is restored.
                </Text>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSyncDialog(false)}>Close</Button>
            {isOnline && pendingItems > 0 && !syncing && (
              <Button onPress={handleSync} mode="contained">
                Sync Now
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  offlineContainer: {
    backgroundColor: '#ffebee',
  },
  pendingContainer: {
    backgroundColor: '#fff3e0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontWeight: '500',
  },
  pendingText: {
    color: '#f57c00',
    fontWeight: 'bold',
  },
  syncingText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  dialogContent: {
    gap: 12,
  },
  dialogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialogDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dialogValue: {
    fontWeight: 'bold',
  },
  warningText: {
    color: '#f57c00',
    marginTop: 8,
  },
});

