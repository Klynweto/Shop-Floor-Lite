import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useSyncStore } from '../store/syncStore';
import { format } from 'date-fns';

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { stats, isLoading, refresh } = useDashboardStore();
  const { isOnline, pendingItems, lastSyncTime, syncing, checkNetworkStatus, refreshPendingCount, sync } = useSyncStore();

  useEffect(() => {
    if (user) {
      refresh(user.role === 'operator' ? user.id : undefined);
      checkNetworkStatus();
      refreshPendingCount();
    }
  }, [user]);

  const handleRefresh = () => {
    if (user) {
      refresh(user.role === 'operator' ? user.id : undefined);
      checkNetworkStatus();
      refreshPendingCount();
    }
  };

  const isOperator = user?.role === 'operator';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.welcomeText}>
            Welcome, {user?.name}
          </Text>
          <Text variant="bodyMedium" style={styles.roleText}>
            {isOperator ? 'Operator' : 'Supervisor'}
          </Text>
        </View>

        {/* Sync Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.syncStatus}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4caf50' : '#f44336' }]} />
              <Text variant="bodyMedium">
                {isOnline ? 'Online' : 'Offline'}
              </Text>
              {pendingItems > 0 && (
                <Text variant="bodySmall" style={styles.pendingText}>
                  {pendingItems} pending sync
                </Text>
              )}
            </View>
            {lastSyncTime && (
              <Text variant="bodySmall" style={styles.syncTime}>
                Last sync: {format(new Date(lastSyncTime), 'MMM d, HH:mm')}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {isOperator ? (
            <>
              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="headlineLarge" style={styles.statValue}>
                    {stats?.activeDowntime || 0}
                  </Text>
                  <Text variant="bodyMedium">Active Downtime</Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="headlineLarge" style={styles.statValue}>
                    {stats?.pendingMaintenance || 0}
                  </Text>
                  <Text variant="bodyMedium">Pending Maintenance</Text>
                </Card.Content>
              </Card>
            </>
          ) : (
            <>
              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="headlineLarge" style={styles.statValue}>
                    {stats?.unacknowledgedAlerts || 0}
                  </Text>
                  <Text variant="bodyMedium">Unacknowledged Alerts</Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <Text variant="headlineLarge" style={styles.statValue}>
                    {stats?.activeDowntime || 0}
                  </Text>
                  <Text variant="bodyMedium">Active Downtime Events</Text>
                </Card.Content>
              </Card>
            </>
          )}

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineLarge" style={styles.statValue}>
                {stats?.todayDowntimeMinutes || 0}
              </Text>
              <Text variant="bodyMedium">Today's Downtime (min)</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.actionsContainer}>
              {isOperator ? (
                <>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('DowntimeCapture')}
                    style={styles.actionButton}
                    icon="clock-outline"
                  >
                    Record Downtime
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('MaintenanceChecklist')}
                    style={styles.actionButton}
                    icon="clipboard-check"
                  >
                    Maintenance
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('AlertManagement')}
                    style={styles.actionButton}
                    icon="bell"
                  >
                    View Alerts
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('SummaryReports')}
                    style={styles.actionButton}
                    icon="chart-bar"
                  >
                    Reports
                  </Button>
                </>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Sync Action */}
        {pendingItems > 0 && isOnline && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={sync}
                loading={syncing}
                disabled={syncing}
                style={styles.syncButton}
                icon="sync"
              >
                Sync Now ({pendingItems} pending)
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Logout */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={logout}
              style={styles.logoutButton}
              icon="logout"
              textColor="#d32f2f"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 16,
  },
  welcomeText: {
    fontWeight: 'bold',
  },
  roleText: {
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pendingText: {
    marginLeft: 'auto',
    color: '#ff9800',
    fontWeight: 'bold',
  },
  syncTime: {
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    elevation: 2,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  syncButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#d32f2f',
  },
});

