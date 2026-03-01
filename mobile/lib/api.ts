import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

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

/** Get current Supabase access token for backend auth. */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Fetch from backend with Authorization: Bearer <token>. Use for protected routes. */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  });
}

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

export type ApiGroup = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_by: string;
  created_at?: string;
};

export async function getGroups(): Promise<ApiGroup[]> {
  const res = await fetchWithAuth('/groups');
  if (!res.ok) {
    let msg = `Groups failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {
      // ignore if body isn't JSON
    }
    throw new Error(msg);
  }
  return res.json();
}
