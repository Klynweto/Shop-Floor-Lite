import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DowntimeCaptureScreen from '../screens/DowntimeCaptureScreen';
import MaintenanceChecklistScreen from '../screens/MaintenanceChecklistScreen';
import AlertManagementScreen from '../screens/AlertManagementScreen';
import SummaryReportsScreen from '../screens/SummaryReportsScreen';
import SyncIndicator from '../components/SyncIndicator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function OperatorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DowntimeCapture"
        component={DowntimeCaptureScreen}
        options={{
          title: 'Downtime Capture',
          tabBarLabel: 'Downtime',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MaintenanceChecklist"
        component={MaintenanceChecklistScreen}
        options={{
          title: 'Maintenance Checklist',
          tabBarLabel: 'Maintenance',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-check" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function SupervisorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AlertManagement"
        component={AlertManagementScreen}
        options={{
          title: 'Alert Management',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SummaryReports"
        component={SummaryReportsScreen}
        options={{
          title: 'Summary Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user?.role === 'operator' ? (
          <Stack.Screen name="OperatorApp" component={OperatorTabs} />
        ) : (
          <Stack.Screen name="SupervisorApp" component={SupervisorTabs} />
        )}
      </Stack.Navigator>
      <SyncIndicator />
    </NavigationContainer>
  );
}

