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

/** Get current Supabase access token. Backend uses it in dev-only mode (reads user id from token, no verification). */
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
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    return await fetch(url, { ...options, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('fetch') || msg.includes('Network') || msg.includes('connection')) {
      throw new Error(
        `Can't reach the server at ${BASE_URL}. ` +
          (BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')
            ? 'On a device or simulator, set EXPO_PUBLIC_API_URL in mobile/.env to your computer\'s IP (e.g. http://192.168.1.5:8000) and restart Expo.'
            : 'Check that the backend is running and reachable.')
      );
    }
    throw e;
  }
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

/** start_date/end_date optional; when set use ISO "YYYY-MM-DD". member_ids = user ids to add as members (they will see the group). */
export type ApiGroupCreate = {
  name: string;
  start_date?: string;
  end_date?: string;
  member_ids?: string[];
};

export async function getGroups(): Promise<ApiGroup[]> {
  const res = await fetchWithAuth('/groups');
  if (!res.ok) {
    let msg = `Groups failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {
    }
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    throw new Error(`Invalid response from ${getBaseUrl()}/groups`);
  }
}

export async function getGroup(groupId: string): Promise<ApiGroup> {
  const res = await fetchWithAuth(`/groups/${groupId}`);
  if (!res.ok) {
    let msg = `Group failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export type ApiExpense = {
  id: string;
  group_id: string;
  title: string;
  category?: string | null;
  amount_cents: number;
  paid_by: string;
  split_mode?: string | null;
  created_at?: string;
};

export async function getExpensesForGroup(groupId: string): Promise<ApiExpense[]> {
  const res = await fetchWithAuth(`/expenses?group_id=${encodeURIComponent(groupId)}`);
  if (!res.ok) {
    let msg = `Expenses failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export type ApiGroupMember = { user_id: string; username: string };

export async function getGroupMembers(groupId: string): Promise<ApiGroupMember[]> {
  const res = await fetchWithAuth(`/groups/${groupId}/members`);
  if (!res.ok) {
    let msg = `Group members failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export type ApiExpenseCreate = {
  group_id: string;
  title: string;
  category: string;
  amount_cents: number;
  paid_by: string;
  split_mode: string;
};

export async function createExpense(payload: ApiExpenseCreate): Promise<ApiExpense> {
  const res = await fetchWithAuth('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Create expense failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function splitExpenseEqual(expenseId: string): Promise<unknown> {
  const res = await fetchWithAuth(`/expenses/${expenseId}/split-equal`, { method: 'POST' });
  if (!res.ok) {
    let msg = `Split expense failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/** Profile from backend (e.g. /profiles/me/following). */
export type ApiProfile = {
  id: string;
  username: string;
  venmo?: string | null;
  zelle?: string | null;
  created_at?: string;
};

export async function getFollowing(): Promise<ApiProfile[]> {
  const res = await fetchWithAuth('/profiles/me/following');
  if (!res.ok) {
    let msg = `Following failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    throw new Error(`Invalid response from ${getBaseUrl()}/profiles/me/following`);
  }
}

export async function getProfile(userId: string): Promise<ApiProfile> {
  const res = await fetchWithAuth(`/profiles/${userId}`);
  if (!res.ok) {
    let msg = `Profile failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getProfiles(): Promise<ApiProfile[]> {
  const res = await fetchWithAuth('/profiles');
  if (!res.ok) {
    let msg = `Profiles failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    throw new Error(`Invalid response from ${getBaseUrl()}/profiles`);
  }
}

export async function followUser(userId: string): Promise<void> {
  const res = await fetchWithAuth(`/profiles/${userId}/follow`, { method: 'POST' });
  if (!res.ok) {
    let msg = `Follow failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
}

export async function createGroup(group: ApiGroupCreate): Promise<ApiGroup> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not signed in');
  const res = await fetchWithAuth('/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: group.name,
      ...(group.start_date != null && { start_date: group.start_date }),
      ...(group.end_date != null && { end_date: group.end_date }),
      created_by: userId,
      ...(group.member_ids != null && group.member_ids.length > 0 && { member_ids: group.member_ids }),
    }),
  });
  if (!res.ok) {
    let msg = `Create group failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) msg += ` — ${body.detail}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

