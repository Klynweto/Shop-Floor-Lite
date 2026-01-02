export type UserRole = 'operator' | 'supervisor';

export interface User {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  role: UserRole;
  name: string;
}

export interface DowntimeEvent {
  id: string;
  operatorId: string;
  equipmentId: string;
  equipmentName: string;
  startTime: string;
  endTime?: string;
  reason: string;
  description?: string;
  status: 'active' | 'resolved';
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceTask {
  id: string;
  operatorId: string;
  equipmentId: string;
  equipmentName: string;
  checklistId: string;
  checklistName: string;
  items: MaintenanceChecklistItem[];
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceChecklistItem {
  id: string;
  taskId: string;
  itemText: string;
  checked: boolean;
  notes?: string;
}

export interface Alert {
  id: string;
  type: 'downtime' | 'maintenance' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  relatedId?: string; // ID of related downtime/maintenance
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  synced: boolean;
  createdAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime?: string;
  pendingItems: number;
  syncing: boolean;
}

export interface DashboardStats {
  activeDowntime: number;
  pendingMaintenance: number;
  unacknowledgedAlerts: number;
  todayDowntimeMinutes: number;
}

