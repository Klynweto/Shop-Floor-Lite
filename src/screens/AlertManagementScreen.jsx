import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { getAlerts, acknowledgeAlert } from '../database/database';
import { useSyncStore } from '../store/syncStore';
import { format } from 'date-fns';

export default function AlertManagementScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const { refreshPendingCount } = useSyncStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('unacknowledged');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let allAlerts = await getAlerts();
      
      if (filter === 'unacknowledged') {
        allAlerts = allAlerts.filter((a) => !a.acknowledged);
      } else if (filter === 'acknowledged') {
        allAlerts = allAlerts.filter((a) => a.acknowledged);
      }
      
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    if (!user) return;

    try {
      await acknowledgeAlert(alertId, user.id);
      await refreshPendingCount();
      await loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#666';
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAlerts} />
        }
      >
        <View style={styles.filterContainer}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={filter === 'unacknowledged'}
            onPress={() => setFilter('unacknowledged')}
            style={styles.filterChip}
          >
            Unacknowledged
          </Chip>
          <Chip
            selected={filter === 'acknowledged'}
            onPress={() => setFilter('acknowledged')}
            style={styles.filterChip}
          >
            Acknowledged
          </Chip>
        </View>

        {alerts.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No alerts found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              style={[
                styles.alertCard,
                !alert.acknowledged && styles.unacknowledgedCard,
              ]}
            >
              <Card.Content>
                <View style={styles.alertHeader}>
                  <View style={styles.alertTitleContainer}>
                    <Text variant="titleMedium" style={styles.alertTitle}>
                      {alert.title}
                    </Text>
                    <Chip
                      style={[
                        styles.severityChip,
                        { backgroundColor: getSeverityColor(alert.severity) },
                      ]}
                      textStyle={styles.severityChipText}
                    >
                      {alert.severity.toUpperCase()}
                    </Chip>
                  </View>
                  {!alert.acknowledged && (
                    <Chip style={styles.unacknowledgedChip}>NEW</Chip>
                  )}
                </View>

                <Text variant="bodyMedium" style={styles.alertMessage}>
                  {alert.message}
                </Text>

                <View style={styles.alertMeta}>
                  <Text variant="bodySmall" style={styles.alertType}>
                    Type: {alert.type}
                  </Text>
                  <Text variant="bodySmall" style={styles.alertTime}>
                    {format(new Date(alert.createdAt), 'MMM d, HH:mm')}
                  </Text>
                </View>

                {alert.acknowledged && alert.acknowledgedBy && (
                  <View style={styles.acknowledgedInfo}>
                    <Text variant="bodySmall" style={styles.acknowledgedText}>
                      Acknowledged by: {alert.acknowledgedBy}
                    </Text>
                    {alert.acknowledgedAt && (
                      <Text variant="bodySmall" style={styles.acknowledgedText}>
                        {format(new Date(alert.acknowledgedAt), 'MMM d, HH:mm')}
                      </Text>
                    )}
                  </View>
                )}

                {!alert.acknowledged && (
                  <Button
                    mode="contained"
                    onPress={() => handleAcknowledge(alert.id)}
                    style={styles.acknowledgeButton}
                    icon="check-circle"
                  >
                    Acknowledge
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        )}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  alertCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  unacknowledgedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  severityChip: {
    height: 24,
  },
  severityChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unacknowledgedChip: {
    backgroundColor: '#1976d2',
  },
  alertMessage: {
    marginTop: 8,
    marginBottom: 12,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  alertType: {
    color: '#666',
    textTransform: 'capitalize',
  },
  alertTime: {
    color: '#666',
  },
  acknowledgedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  acknowledgedText: {
    color: '#4caf50',
    marginTop: 4,
  },
  acknowledgeButton: {
    marginTop: 12,
  },
});

