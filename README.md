# Shop Floor Lite – Offline-First Manufacturing App

A robust, offline-first mobile application for manufacturing environments built with React Native and Expo.

## Project Status
This repository contains the work completed within the given time constraints for the
Shop Floor Lite mobile challenge. Due to limited time, only the portions implemented
during the challenge window are included here.

## Intended Features
- Authentication (mocked)
- Role-based views (Operator / Supervisor)
- Machine dashboard
- Downtime capture flow
- Maintenance checklist
- Alert management
- Summary view (KPIs)

## Technical Approach
- Offline-first data handling using local storage
- Queued actions intended to sync when connectivity is restored
- Unique identifiers planned for basic idempotency
- Zustand used for state management
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

