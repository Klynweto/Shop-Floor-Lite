# Manufacturing Mobile App

A robust, offline-first mobile application for manufacturing environments built with React Native and Expo.

## Features

- **Authentication**: Role-based access (Operator/Supervisor)
- **Dashboard**: Role-specific views with key metrics
- **Downtime Capture**: Record and track equipment downtime
- **Maintenance Checklist**: Complete maintenance tasks with checklists
- **Alert Management**: Supervisors can review and acknowledge alerts
- **Summary Reports**: View detailed reports and analytics

## Technical Features

- **Offline-First**: Works seamlessly without internet connection
- **Sync Visibility**: Clear indication of sync status
- **Data Integrity**: Ensures data consistency across syncs
- **State Management**: Zustand for efficient state management

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on Android:
```bash
npm run android
```

## User Roles

### Operator
- Capture downtime events
- Complete maintenance checklists
- View personal dashboard

### Supervisor
- Review and acknowledge alerts
- View comprehensive reports
- Monitor operator activities

