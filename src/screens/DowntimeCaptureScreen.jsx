import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { createDowntimeEvent, updateDowntimeEvent, getActiveDowntimeEvents } from '../database/database';
import { createAlert } from '../database/database';
import { useSyncStore } from '../store/syncStore';

const EQUIPMENT_OPTIONS = [
  'Machine A',
  'Machine B',
  'Machine C',
  'Conveyor Belt 1',
  'Conveyor Belt 2',
  'Packaging Line 1',
  'Packaging Line 2',
];

const REASON_OPTIONS = [
  'Mechanical Failure',
  'Electrical Issue',
  'Maintenance',
  'Material Shortage',
  'Quality Issue',
  'Other',
];

export default function DowntimeCaptureScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const { refreshPendingCount } = useSyncStore();
  const [equipment, setEquipment] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingEvent, setResolvingEvent] = useState(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  useEffect(() => {
    loadActiveEvents();
  }, []);

  const loadActiveEvents = async () => {
    if (!user) return;
    const events = await getActiveDowntimeEvents();
    const userEvents = events.filter((e) => e.operatorId === user.id);
    setActiveEvents(userEvents);
  };

  const handleStartDowntime = async () => {
    if (!equipment || !reason) {
      Alert.alert('Validation Error', 'Please select equipment and reason');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const eventId = await createDowntimeEvent({
        operatorId: user.id,
        equipmentId: `equip_${equipment}`,
        equipmentName: equipment,
        startTime: new Date().toISOString(),
        reason,
        description: description || undefined,
        status: 'active',
      });

      // Create alert for supervisor
      await createAlert({
        type: 'downtime',
        severity: 'high',
        title: `Downtime Started: ${equipment}`,
        message: `Operator ${user.name} reported downtime for ${equipment}. Reason: ${reason}`,
        relatedId: eventId,
      });

      await refreshPendingCount();
      await loadActiveEvents();

      Alert.alert('Success', 'Downtime event started');
      setEquipment('');
      setReason('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create downtime event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDowntime = async (eventId) => {
    setResolvingEvent(eventId);
    setShowResolveDialog(true);
  };

  const confirmResolve = async () => {
    if (!resolvingEvent) return;

    setLoading(true);
    try {
      await updateDowntimeEvent(resolvingEvent, {
        endTime: new Date().toISOString(),
        status: 'resolved',
      });

      await refreshPendingCount();
      await loadActiveEvents();

      Alert.alert('Success', 'Downtime event resolved');
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve downtime event');
      console.error(error);
    } finally {
      setLoading(false);
      setShowResolveDialog(false);
      setResolvingEvent(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Start New Downtime Event
            </Text>

            <Text variant="bodyMedium" style={styles.label}>
              Equipment
            </Text>
            <View style={styles.equipmentContainer}>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <Button
                  key={eq}
                  mode={equipment === eq ? 'contained' : 'outlined'}
                  onPress={() => setEquipment(eq)}
                  style={styles.equipmentButton}
                >
                  {eq}
                </Button>
              ))}
            </View>

            <Text variant="bodyMedium" style={styles.label}>
              Reason
            </Text>
            <View style={styles.reasonContainer}>
              {REASON_OPTIONS.map((r) => (
                <Button
                  key={r}
                  mode={reason === r ? 'contained' : 'outlined'}
                  onPress={() => setReason(r)}
                  style={styles.reasonButton}
                >
                  {r}
                </Button>
              ))}
            </View>

            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Add any additional details..."
            />

            <Button
              mode="contained"
              onPress={handleStartDowntime}
              loading={loading}
              disabled={loading || !equipment || !reason}
              style={styles.button}
              icon="play"
            >
              Start Downtime
            </Button>
          </Card.Content>
        </Card>

        {activeEvents.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Active Downtime Events
              </Text>
              {activeEvents.map((event) => (
                <Card key={event.id} style={styles.eventCard}>
                  <Card.Content>
                    <Text variant="titleMedium">{event.equipmentName}</Text>
                    <Text variant="bodyMedium" style={styles.eventReason}>
                      Reason: {event.reason}
                    </Text>
                    {event.description && (
                      <Text variant="bodySmall" style={styles.eventDescription}>
                        {event.description}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={styles.eventTime}>
                      Started: {new Date(event.startTime).toLocaleString()}
                    </Text>
                    <Button
                      mode="contained"
                      onPress={() => handleResolveDowntime(event.id)}
                      style={styles.resolveButton}
                      icon="check"
                    >
                      Resolve
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showResolveDialog} onDismiss={() => setShowResolveDialog(false)}>
          <Dialog.Title>Resolve Downtime Event</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to mark this downtime event as resolved?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResolveDialog(false)}>Cancel</Button>
            <Button onPress={confirmResolve} loading={loading}>
              Resolve
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  card: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  equipmentButton: {
    marginBottom: 8,
  },
  reasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonButton: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  eventCard: {
    marginBottom: 12,
    backgroundColor: '#fff3cd',
  },
  eventReason: {
    marginTop: 4,
    fontWeight: '500',
  },
  eventDescription: {
    marginTop: 4,
    color: '#666',
  },
  eventTime: {
    marginTop: 8,
    color: '#666',
  },
  resolveButton: {
    marginTop: 12,
  },
});

