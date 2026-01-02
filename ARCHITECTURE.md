# Architecture Overview

## Offline-First Design

The app is built with an offline-first architecture, ensuring it works seamlessly in areas with spotty Wi-Fi.

### Database Layer
- **SQLite**: Local database using `expo-sqlite`
- All data is stored locally first
- Tables: users, downtime_events, maintenance_tasks, maintenance_checklist_items, alerts
- Boolean values stored as integers (0/1) and converted in application layer

### Sync Mechanism
- **Network Detection**: Uses `expo-network` to check connectivity
- **Sync Status**: Visible in UI with pending item count
- **Data Integrity**: 
  - All changes marked with `synced` flag
  - Only unsynced items are sent during sync
  - Items marked as synced after successful upload
- **Automatic Sync**: Checks network status every 30 seconds
- **Manual Sync**: Users can trigger sync manually when online

### State Management
- **Zustand**: Lightweight state management
- **Stores**:
  - `authStore`: Authentication state
  - `syncStore`: Network and sync status
  - `dashboardStore`: Dashboard statistics

### Data Flow

1. **User Action** → Local Database → UI Update
2. **Background**: Check network → Sync if online
3. **Sync**: Send unsynced items → Mark as synced on success

## Security

- **Secure Storage**: User credentials stored in `expo-secure-store`
- **Authentication**: Simple username/password (can be enhanced with JWT)
- **Role-Based Access**: Operator vs Supervisor views

## Key Features

### Operator Features
- Capture downtime events with equipment and reason
- Complete maintenance checklists
- View personal dashboard

### Supervisor Features
- Review and acknowledge alerts
- View comprehensive reports
- Monitor all operations

## Production Considerations

1. **API Integration**: Replace sync simulation with actual REST API
2. **Authentication**: Implement JWT tokens
3. **Encryption**: Encrypt sensitive data at rest
4. **Conflict Resolution**: Handle sync conflicts
5. **Background Sync**: Implement background sync service
6. **Error Handling**: Enhanced error recovery
7. **Analytics**: Add usage analytics
8. **Push Notifications**: Alert supervisors of critical events

