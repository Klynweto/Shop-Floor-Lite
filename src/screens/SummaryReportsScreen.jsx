import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, SegmentedButtons } from 'react-native-paper';
import {
  getDowntimeEvents,
  getMaintenanceTasks,
  getAlerts,
} from '../database/database';
import { format, startOfDay, subDays, isWithinInterval } from 'date-fns';

export default function SummaryReportsScreen({ navigation }) {
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subDays(startOfDay(now), 7);
          break;
        case 'month':
          startDate = subDays(startOfDay(now), 30);
          break;
        default:
          startDate = startOfDay(now);
      }

      const [downtimeEvents, maintenanceTasks, alerts] = await Promise.all([
        getDowntimeEvents(),
        getMaintenanceTasks(),
        getAlerts(),
      ]);

      const filterByDate = (date) => {
        const eventDate = new Date(date);
        return isWithinInterval(eventDate, { start: startDate, end: now });
      };

      const filteredDowntime = downtimeEvents.filter((e) =>
        filterByDate(e.createdAt)
      );
      const filteredMaintenance = maintenanceTasks.filter((t) =>
        filterByDate(t.createdAt)
      );
      const filteredAlerts = alerts.filter((a) => filterByDate(a.createdAt));

      // Calculate downtime minutes
      const downtimeMinutes = filteredDowntime.reduce((total, event) => {
        if (event.endTime) {
          const start = new Date(event.startTime).getTime();
          const end = new Date(event.endTime).getTime();
          return total + Math.round((end - start) / 1000 / 60);
        }
        return total;
      }, 0);

      // Calculate average downtime duration
      const resolvedEvents = filteredDowntime.filter((e) => e.endTime);
      const avgDowntime =
        resolvedEvents.length > 0
          ? downtimeMinutes / resolvedEvents.length
          : 0;

      // Maintenance completion rate
      const completedMaintenance = filteredMaintenance.filter(
        (t) => t.status === 'completed'
      ).length;
      const maintenanceCompletionRate =
        filteredMaintenance.length > 0
          ? (completedMaintenance / filteredMaintenance.length) * 100
          : 0;

      // Alert acknowledgment rate
      const acknowledgedAlerts = filteredAlerts.filter((a) => a.acknowledged)
        .length;
      const alertAcknowledgmentRate =
        filteredAlerts.length > 0
          ? (acknowledgedAlerts / filteredAlerts.length) * 100
          : 0;

      setStats({
        downtimeEvents: filteredDowntime.length,
        downtimeMinutes,
        avgDowntime,
        maintenanceTasks: filteredMaintenance.length,
        completedMaintenance,
        maintenanceCompletionRate,
        alerts: filteredAlerts.length,
        acknowledgedAlerts,
        alertAcknowledgmentRate,
        topReasons: getTopReasons(filteredDowntime),
      });
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopReasons = (events) => {
    const reasonCounts = {};
    events.forEach((event) => {
      reasonCounts[event.reason] = (reasonCounts[event.reason] || 0) + 1;
    });
    return Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value)}
            buttons={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
        </View>

        {/* Downtime Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Downtime Summary
            </Text>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Total Events:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats.downtimeEvents}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Total Minutes:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats.downtimeMinutes}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Average Duration:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {Math.round(stats.avgDowntime)} min
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Top Reasons */}
        {stats.topReasons.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Top Downtime Reasons
              </Text>
              {stats.topReasons.map((item, index) => (
                <View key={index} style={styles.reasonRow}>
                  <Text variant="bodyMedium" style={styles.reasonText}>
                    {index + 1}. {item.reason}
                  </Text>
                  <Text variant="bodyMedium" style={styles.reasonCount}>
                    {item.count}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Maintenance Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Maintenance Summary
            </Text>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Total Tasks:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats.maintenanceTasks}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Completed:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats.completedMaintenance}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Completion Rate:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {Math.round(stats.maintenanceCompletionRate)}%
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Alert Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Alert Summary
            </Text>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Total Alerts:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats.alerts}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Acknowledged:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats.acknowledgedAlerts}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text variant="bodyLarge">Acknowledgment Rate:</Text>
              <Text variant="headlineSmall" style={styles.statValue}>
                {Math.round(stats.alertAcknowledgmentRate)}%
              </Text>
            </View>
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
  periodSelector: {
    padding: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  reasonText: {
    flex: 1,
  },
  reasonCount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
});

