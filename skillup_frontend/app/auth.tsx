import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../constants/Api';
import { useAuth } from '../context/AuthContext';

// Turns a DRF error payload (e.g. {"username": ["A user with that username
// already exists."]}) into a readable message.
const formatApiError = (data: unknown): string => {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.detail === 'string') return record.detail;
    const parts = Object.entries(record).map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
      return field === 'non_field_errors' ? text : `${field}: ${text}`;
    });
    if (parts.length) return parts.join('\n');
  }
  return 'Authentication failed. Please try again.';
};

const AuthScreen = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, isLoading, signIn } = useAuth();

  if (isLoading) return null;
  if (token) return <Redirect href="/" />;

  const handleAuth = async () => {
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter a username and password.');
      return;
    }
    if (isSignup && !email.trim()) {
      setError('Please enter an email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isSignup ? `${API_URL}/signup` : `${API_URL}/login`;
      const body = isSignup
        ? JSON.stringify({ username: username.trim(), email: email.trim(), password })
        : JSON.stringify({ username: username.trim(), password });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await response.json();

      if (response.ok) {
        await signIn(data.token);
      } else {
        setError(formatApiError(data));
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <LinearGradient
      colors={['#4A0E4E', '#8A2BE2', '#9400D3']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <Text style={styles.title}>{isSignup ? 'Sign Up' : 'Login'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#B19CD9"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          {isSignup && (
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#B19CD9"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#B19CD9"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#8A2BE2" />
            ) : (
              <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={switchMode}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FFD1D1',
    backgroundColor: 'rgba(180, 30, 60, 0.45)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    textAlign: 'center',
    width: '100%',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#8A2BE2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
  },
});

export default AuthScreen;
