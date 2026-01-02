import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase, seedUsers } from './src/database/database';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await initDatabase();
        
        // Seed users
        await seedUsers();
        
        // Check authentication
        await checkAuth();
        
        setDbInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setDbInitialized(true); // Still show app even if there's an error
      }
    };

    initializeApp();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

