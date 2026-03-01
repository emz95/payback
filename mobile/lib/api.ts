import { Platform } from 'react-native';

/**
 * Backend API base URL.
 * Set EXPO_PUBLIC_API_URL in .env to your computer's IP (e.g. http://192.168.1.5:8000)
 * so the app on a physical device can reach the backend. Restart Expo after changing .env.
 */
function getBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (__DEV__ && Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

const BASE_URL = getBaseUrl();

export type ApiRoot = { message: string };
export type ApiHello = { message: string };

export async function getRoot(): Promise<ApiRoot> {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getHello(name: string = 'friend'): Promise<ApiHello> {
  const url = `${BASE_URL}/hello?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
