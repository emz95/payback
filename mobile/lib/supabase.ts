import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment (e.g. .env)"
  );
}

/** In-memory fallback when AsyncStorage native module is null (e.g. some Expo Go / simulator). */
const memoryStore: Record<string, string> = {};
const memoryStorage = {
  getItem: (key: string) => Promise.resolve(memoryStore[key] ?? null),
  setItem: (key: string, value: string) => {
    memoryStore[key] = value;
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
    return Promise.resolve();
  },
};

/** Wrap AsyncStorage so we fall back to in-memory on "Native module is null" (iOS simulator / Expo Go). */
function wrapWithFallback(
  primary: typeof AsyncStorage
): { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void>; removeItem: (k: string) => Promise<void> } {
  return {
    getItem: (key: string) =>
      primary.getItem(key).catch(() => memoryStorage.getItem(key)),
    setItem: (key: string, value: string) =>
      primary.setItem(key, value).catch(() => memoryStorage.setItem(key, value)),
    removeItem: (key: string) =>
      primary.removeItem(key).catch(() => memoryStorage.removeItem(key)),
  };
}

const isWeb = Platform.OS === "web" && typeof localStorage !== "undefined";
const authStorage = isWeb
  ? {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) =>
        Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) =>
        Promise.resolve(localStorage.removeItem(key)),
    }
  : wrapWithFallback(AsyncStorage);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
