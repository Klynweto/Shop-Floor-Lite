import * as SQLite from 'expo-sqlite';
import { User, DowntimeEvent, MaintenanceTask, Alert } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('manufacturing.db');
  
  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS downtime_events (
      id TEXT PRIMARY KEY,
      operatorId TEXT NOT NULL,
      equipmentId TEXT NOT NULL,
      equipmentName TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id TEXT PRIMARY KEY,
      operatorId TEXT NOT NULL,
      equipmentId TEXT NOT NULL,
      equipmentName TEXT NOT NULL,
      checklistId TEXT NOT NULL,
      checklistName TEXT NOT NULL,
      status TEXT NOT NULL,
      completedAt TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_checklist_items (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      itemText TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (taskId) REFERENCES maintenance_tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      relatedId TEXT,
      acknowledged INTEGER DEFAULT 0,
      acknowledgedBy TEXT,
      acknowledgedAt TEXT,
      synced INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_downtime_operator ON downtime_events(operatorId);
    CREATE INDEX IF NOT EXISTS idx_downtime_synced ON downtime_events(synced);
    CREATE INDEX IF NOT EXISTS idx_maintenance_operator ON maintenance_tasks(operatorId);
    CREATE INDEX IF NOT EXISTS idx_maintenance_synced ON maintenance_tasks(synced);
    CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
    CREATE INDEX IF NOT EXISTS idx_alerts_synced ON alerts(synced);
  `);

  return db;
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// User operations
export const seedUsers = async (): Promise<void> => {
  const database = getDatabase();
  
  const users: Omit<User, 'id'>[] = [
    { username: 'operator1', password: 'operator123', role: 'operator', name: 'John Operator' },
    { username: 'operator2', password: 'operator123', role: 'operator', name: 'Jane Operator' },
    { username: 'supervisor1', password: 'supervisor123', role: 'supervisor', name: 'Bob Supervisor' },
  ];

  for (const user of users) {
    await database.runAsync(
      'INSERT OR IGNORE INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)',
      [`user_${user.username}`, user.username, user.password, user.role, user.name]
    );
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const database = getDatabase();
  const result = await database.getFirstAsync<User>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return result || null;
};

// Downtime operations
export const createDowntimeEvent = async (event: Omit<DowntimeEvent, 'id' | 'synced' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const database = getDatabase();
  const id = `downtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO downtime_events 
     (id, operatorId, equipmentId, equipmentName, startTime, endTime, reason, description, status, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, event.operatorId, event.equipmentId, event.equipmentName, event.startTime, event.endTime || null, 
     event.reason, event.description || null, event.status, now, now]
  );
  
  return id;
};

export const updateDowntimeEvent = async (id: string, updates: Partial<DowntimeEvent>): Promise<void> => {
  const database = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'synced' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length > 0) {
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await database.runAsync(
      `UPDATE downtime_events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
};

export const getDowntimeEvents = async (operatorId?: string, limit?: number): Promise<DowntimeEvent[]> => {
  const database = getDatabase();
  let query = 'SELECT * FROM downtime_events';
  const params: any[] = [];
  
  if (operatorId) {
    query += ' WHERE operatorId = ?';
    params.push(operatorId);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }
  
  const events = await database.getAllAsync<any>(query, params);
  return events.map(event => ({
    ...event,
    synced: Boolean(event.synced),
  }));
};

export const getActiveDowntimeEvents = async (): Promise<DowntimeEvent[]> => {
  const database = getDatabase();
  const events = await database.getAllAsync<any>(
    'SELECT * FROM downtime_events WHERE status = ? ORDER BY startTime DESC',
    ['active']
  );
  return events.map(event => ({
    ...event,
    synced: Boolean(event.synced),
  }));
};

// Maintenance operations
export const createMaintenanceTask = async (
  task: Omit<MaintenanceTask, 'id' | 'synced' | 'createdAt' | 'updatedAt'>,
  items: Omit<MaintenanceTask['items'][0], 'id' | 'taskId'>[]
): Promise<string> => {
  const database = getDatabase();
  const id = `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO maintenance_tasks 
     (id, operatorId, equipmentId, equipmentName, checklistId, checklistName, status, completedAt, synced, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, task.operatorId, task.equipmentId, task.equipmentName, task.checklistId, 
     task.checklistName, task.status, task.completedAt || null, now, now]
  );
  
  for (const item of items) {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await database.runAsync(
      'INSERT INTO maintenance_checklist_items (id, taskId, itemText, checked, notes) VALUES (?, ?, ?, ?, ?)',
      [itemId, id, item.itemText, item.checked ? 1 : 0, item.notes || null]
    );
  }
  
  return id;
};

export const updateMaintenanceTask = async (id: string, updates: Partial<MaintenanceTask>): Promise<void> => {
  const database = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'synced' && key !== 'items' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (fields.length > 0) {
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await database.runAsync(
      `UPDATE maintenance_tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
};

export const updateMaintenanceChecklistItem = async (
  itemId: string,
  updates: { checked?: boolean; notes?: string }
): Promise<void> => {
  const database = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.checked !== undefined) {
    fields.push('checked = ?');
    values.push(updates.checked ? 1 : 0);
  }
  
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  
  if (fields.length > 0) {
    values.push(itemId);
    await database.runAsync(
      `UPDATE maintenance_checklist_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
};

export const getMaintenanceTasks = async (operatorId?: string): Promise<MaintenanceTask[]> => {
  const database = getDatabase();
  let query = 'SELECT * FROM maintenance_tasks';
  const params: any[] = [];
  
  if (operatorId) {
    query += ' WHERE operatorId = ?';
    params.push(operatorId);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  const tasks = await database.getAllAsync<any>(query, params);
  
  // Load checklist items for each task
  for (const task of tasks) {
    const items = await database.getAllAsync<any>(
      'SELECT * FROM maintenance_checklist_items WHERE taskId = ?',
      [task.id]
    );
    task.items = items.map(item => ({ ...item, checked: Boolean(item.checked) }));
  }
  
  return tasks.map(task => ({
    ...task,
    synced: Boolean(task.synced),
  }));
};

// Alert operations
export const createAlert = async (alert: Omit<Alert, 'id' | 'acknowledged' | 'synced' | 'createdAt'>): Promise<string> => {
  const database = getDatabase();
  const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO alerts 
     (id, type, severity, title, message, relatedId, acknowledged, synced, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    [id, alert.type, alert.severity, alert.title, alert.message, alert.relatedId || null, now]
  );
  
  return id;
};

export const acknowledgeAlert = async (id: string, acknowledgedBy: string): Promise<void> => {
  const database = getDatabase();
  const now = new Date().toISOString();
  
  await database.runAsync(
    'UPDATE alerts SET acknowledged = 1, acknowledgedBy = ?, acknowledgedAt = ?, synced = 0 WHERE id = ?',
    [acknowledgedBy, now, id]
  );
};

export const getAlerts = async (acknowledged?: boolean): Promise<Alert[]> => {
  const database = getDatabase();
  let query = 'SELECT * FROM alerts';
  const params: any[] = [];
  
  if (acknowledged !== undefined) {
    query += ' WHERE acknowledged = ?';
    params.push(acknowledged ? 1 : 0);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  const alerts = await database.getAllAsync<Alert>(query, params);
  return alerts.map(alert => ({
    ...alert,
    acknowledged: Boolean(alert.acknowledged),
    synced: Boolean(alert.synced),
  }));
};

// Sync operations
export const getUnsyncedDowntimeEvents = async (): Promise<DowntimeEvent[]> => {
  const database = getDatabase();
  const events = await database.getAllAsync<any>(
    'SELECT * FROM downtime_events WHERE synced = 0'
  );
  return events.map(event => ({
    ...event,
    synced: Boolean(event.synced),
  }));
};

export const getUnsyncedMaintenanceTasks = async (): Promise<MaintenanceTask[]> => {
  const database = getDatabase();
  const tasks = await database.getAllAsync<any>(
    'SELECT * FROM maintenance_tasks WHERE synced = 0'
  );
  
  for (const task of tasks) {
    const items = await database.getAllAsync<any>(
      'SELECT * FROM maintenance_checklist_items WHERE taskId = ?',
      [task.id]
    );
    task.items = items.map(item => ({ ...item, checked: Boolean(item.checked) }));
  }
  
  return tasks.map(task => ({
    ...task,
    synced: Boolean(task.synced),
  }));
};

export const getUnsyncedAlerts = async (): Promise<Alert[]> => {
  const database = getDatabase();
  const alerts = await database.getAllAsync<Alert>(
    'SELECT * FROM alerts WHERE synced = 0'
  );
  return alerts.map(alert => ({
    ...alert,
    acknowledged: Boolean(alert.acknowledged),
    synced: Boolean(alert.synced),
  }));
};

export const markDowntimeEventSynced = async (id: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync('UPDATE downtime_events SET synced = 1 WHERE id = ?', [id]);
};

export const markMaintenanceTaskSynced = async (id: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync('UPDATE maintenance_tasks SET synced = 1 WHERE id = ?', [id]);
};

export const markAlertSynced = async (id: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync('UPDATE alerts SET synced = 1 WHERE id = ?', [id]);
};

