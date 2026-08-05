import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8001;

// On web the backend is on the same machine. On a device or emulator we
// derive the dev machine's LAN IP from the Expo dev server address; the
// Android emulator reaches the host via 10.0.2.2.
const getBackendHost = (): string => {
  if (Platform.OS === 'web') return '127.0.0.1';

  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  }
  return host;
};

// A published app (EAS Update / web deploy) should point at a public
// backend: set EXPO_PUBLIC_API_URL (e.g. https://skillup-backend.onrender.com/api)
// when exporting/publishing. Development falls back to auto-detection.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${getBackendHost()}:${BACKEND_PORT}/api`;
