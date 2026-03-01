import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Your computer's IP — used when the app runs on a physical device (same Wi‑Fi). */
const DEVICE_API_URL = 'http://172.22.198.32:8000';

/**
 * Backend API base URL.
 * - Physical device: DEVICE_API_URL (your Mac's IP — phone and Mac must be on same Wi‑Fi).
 * - Android Emulator: 10.0.2.2
 * - iOS Simulator / web: localhost
 */
function getBaseUrl(): string {
  if (Constants.isDevice && Platform.OS !== 'web') {
    return DEVICE_API_URL;
  }
  if (__DEV__ && Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
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
