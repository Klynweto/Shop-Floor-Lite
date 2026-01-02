# Manufacturing Mobile App - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Expo Go app on your Android device (for testing)

## Installation

1. Navigate to the project directory:
```bash
cd manufacturing-mobile-app
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

Or for Android directly:
```bash
npm run android
```

### Using Expo Go

1. Install Expo Go on your Android device from Google Play Store
2. Run `npm start`
3. Scan the QR code with Expo Go app

## Default Credentials

### Operator
- Username: `operator1`
- Password: `operator123`

### Supervisor
- Username: `supervisor1`
- Password: `supervisor123`

## Features

### For Operators:
- **Dashboard**: View active downtime and pending maintenance
- **Downtime Capture**: Record and resolve equipment downtime
- **Maintenance Checklist**: Complete maintenance tasks with checklists

### For Supervisors:
- **Dashboard**: View overall statistics and alerts
- **Alert Management**: Review and acknowledge alerts
- **Summary Reports**: View detailed reports (Today/Week/Month)

## Offline-First Architecture

The app uses SQLite for local data storage and syncs when online:
- All data is stored locally first
- Sync status is visible in the UI
- Data integrity is maintained during sync
- Works seamlessly offline

## Project Structure

```
manufacturing-mobile-app/
├── src/
│   ├── components/      # Reusable components
│   ├── database/        # SQLite database layer
│   ├── navigation/      # Navigation setup
│   ├── screens/         # Screen components
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions (sync, etc.)
├── assets/              # Images and assets
├── App.tsx              # Main app component
└── package.json         # Dependencies
```

## Building for Production

### Android APK

```bash
expo build:android
```

Or using EAS Build:
```bash
eas build --platform android
```

## Notes

- The app is configured for Android target
- All data persists locally using SQLite
- Sync mechanism simulates server communication (replace with actual API in production)
- Seed data is automatically created on first launch

