import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Manufacturing Mobile
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                autoCapitalize="none"
                style={styles.input}
                disabled={loading}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                disabled={loading}
                onSubmitEditing={handleLogin}
              />

              {error ? (
                <Text style={styles.error} variant="bodyMedium">
                  {error}
                </Text>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Sign In
              </Button>

              <View style={styles.demoInfo}>
                <Text variant="bodySmall" style={styles.demoText}>
                  Demo Credentials:
                </Text>
                <Text variant="bodySmall">Operator: operator1 / operator123</Text>
                <Text variant="bodySmall">Supervisor: supervisor1 / supervisor123</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoInfo: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  demoText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

