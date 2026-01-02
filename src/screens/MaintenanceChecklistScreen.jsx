import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Checkbox,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import {
  createMaintenanceTask,
  getMaintenanceTasks,
  updateMaintenanceTask,
  updateMaintenanceChecklistItem,
} from '../database/database';
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

const CHECKLIST_TEMPLATES = {
  'Machine A': [
    'Check oil levels',
    'Inspect belts for wear',
    'Clean filters',
    'Test safety switches',
    'Lubricate moving parts',
  ],
  'Machine B': [
    'Check hydraulic fluid',
    'Inspect electrical connections',
    'Clean work area',
    'Test emergency stop',
    'Verify calibration',
  ],
  'Machine C': [
    'Check coolant levels',
    'Inspect cutting tools',
    'Clean chip collection',
    'Test spindle operation',
    'Verify program accuracy',
  ],
  default: [
    'Visual inspection',
    'Check for leaks',
    'Test operation',
    'Clean equipment',
    'Document findings',
  ],
};

export default function MaintenanceChecklistScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const { refreshPendingCount } = useSyncStore();
  const [equipment, setEquipment] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!user) return;
    const userTasks = await getMaintenanceTasks(user.id);
    setTasks(userTasks.filter((t) => t.status !== 'completed'));
  };

  const handleCreateTask = async () => {
    if (!equipment) {
      Alert.alert('Validation Error', 'Please select equipment');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const checklistItems = CHECKLIST_TEMPLATES[equipment] || CHECKLIST_TEMPLATES.default;
      const items = checklistItems.map((itemText) => ({
        itemText,
        checked: false,
      }));

      const taskId = await createMaintenanceTask(
        {
          operatorId: user.id,
          equipmentId: `equip_${equipment}`,
          equipmentName: equipment,
          checklistId: `checklist_${equipment}`,
          checklistName: `${equipment} Maintenance Checklist`,
          status: 'pending',
        },
        items
      );

      await refreshPendingCount();
      await loadTasks();

      Alert.alert('Success', 'Maintenance task created');
      setEquipment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create maintenance task');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  const handleToggleItem = async (itemId, checked) => {
    if (!selectedTask) return;

    await updateMaintenanceChecklistItem(itemId, { checked });
    await loadTasks();

    // Reload selected task
    const updatedTasks = await getMaintenanceTasks(user?.id);
    const updated = updatedTasks.find((t) => t.id === selectedTask.id);
    if (updated) {
      setSelectedTask(updated);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    setLoading(true);
    try {
      // Check if all items are checked
      const allChecked = selectedTask.items.every((item) => item.checked);
      if (!allChecked) {
        Alert.alert('Validation Error', 'Please complete all checklist items');
        setLoading(false);
        return;
      }

      await updateMaintenanceTask(selectedTask.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Create alert for supervisor
      await createAlert({
        type: 'maintenance',
        severity: 'medium',
        title: `Maintenance Completed: ${selectedTask.equipmentName}`,
        message: `Operator ${user?.name} completed maintenance checklist for ${selectedTask.equipmentName}`,
        relatedId: selectedTask.id,
      });

      await refreshPendingCount();
      await loadTasks();
      setShowTaskDialog(false);
      setSelectedTask(null);

      Alert.alert('Success', 'Maintenance task completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete maintenance task');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Create Maintenance Task
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

            <Button
              mode="contained"
              onPress={handleCreateTask}
              loading={loading}
              disabled={loading || !equipment}
              style={styles.button}
              icon="plus"
            >
              Create Task
            </Button>
          </Card.Content>
        </Card>

        {tasks.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Active Maintenance Tasks
              </Text>
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => handleOpenTask(task)}
                >
                  <Card.Content>
                    <Text variant="titleMedium">{task.equipmentName}</Text>
                    <Text variant="bodySmall" style={styles.taskStatus}>
                      Status: {task.status}
                    </Text>
                    <Text variant="bodySmall" style={styles.taskProgress}>
                      Progress: {task.items.filter((i) => i.checked).length} / {task.items.length}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showTaskDialog}
          onDismiss={() => setShowTaskDialog(false)}
          style={styles.dialog}
        >
          <Dialog.ScrollArea>
            <Dialog.Title>{selectedTask?.equipmentName}</Dialog.Title>
            <Dialog.Content>
              {selectedTask && (
                <>
                  <Text variant="bodyMedium" style={styles.checklistTitle}>
                    {selectedTask.checklistName}
                  </Text>
                  {selectedTask.items.map((item) => (
                    <View key={item.id} style={styles.checklistItem}>
                      <Checkbox
                        status={item.checked ? 'checked' : 'unchecked'}
                        onPress={() => handleToggleItem(item.id, !item.checked)}
                      />
                      <Text
                        style={[
                          styles.checklistItemText,
                          item.checked && styles.checklistItemTextChecked,
                        ]}
                      >
                        {item.itemText}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowTaskDialog(false)}>Close</Button>
              <Button
                onPress={handleCompleteTask}
                loading={loading}
                disabled={
                  loading ||
                  !selectedTask?.items.every((i) => i.checked)
                }
                mode="contained"
              >
                Complete
              </Button>
            </Dialog.Actions>
          </Dialog.ScrollArea>
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
  button: {
    marginTop: 8,
  },
  taskCard: {
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
  },
  taskStatus: {
    marginTop: 4,
    textTransform: 'capitalize',
  },
  taskProgress: {
    marginTop: 4,
    color: '#666',
  },
  dialog: {
    maxHeight: '80%',
  },
  checklistTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistItemText: {
    flex: 1,
    marginLeft: 8,
  },
  checklistItemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
});

