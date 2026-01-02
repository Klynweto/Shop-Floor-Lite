import { create } from 'zustand';
import { DashboardStats } from '../types';
import {
  getActiveDowntimeEvents,
  getMaintenanceTasks,
  getAlerts,
  getDowntimeEvents,
} from '../database/database';
import { format, startOfDay } from 'date-fns';

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  refresh: (operatorId?: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,

  refresh: async (operatorId?: string) => {
    set({ isLoading: true });
    try {
      const [activeDowntime, maintenanceTasks, alerts, allDowntime] = await Promise.all([
        getActiveDowntimeEvents(),
        getMaintenanceTasks(operatorId),
        getAlerts(false),
        operatorId ? getDowntimeEvents(operatorId) : getDowntimeEvents(),
      ]);

      const today = startOfDay(new Date());
      const todayDowntime = allDowntime.filter((event) => {
        if (!event.endTime) return false;
        const eventDate = startOfDay(new Date(event.startTime));
        return eventDate.getTime() === today.getTime();
      });

      const todayDowntimeMinutes = todayDowntime.reduce((total, event) => {
        if (event.endTime) {
          const start = new Date(event.startTime).getTime();
          const end = new Date(event.endTime).getTime();
          return total + Math.round((end - start) / 1000 / 60);
        }
        return total;
      }, 0);

      const stats: DashboardStats = {
        activeDowntime: activeDowntime.length,
        pendingMaintenance: maintenanceTasks.filter((t) => t.status !== 'completed').length,
        unacknowledgedAlerts: alerts.length,
        todayDowntimeMinutes,
      };

      set({ stats, isLoading: false });
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      set({ isLoading: false });
    }
  },
}));

