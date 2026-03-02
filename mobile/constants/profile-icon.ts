import AsyncStorage from '@react-native-async-storage/async-storage';

const miso1 = require('../assets/images/miso1.png');
const miso2 = require('../assets/images/miso2.png');
const wario = require('../assets/images/wario.png');

export const PROFILE_ICON_KEY = '@payback/profile_icon_id';

/** In-memory fallback when AsyncStorage native module is unavailable (e.g. web, some Expo environments). */
let memoryFallback: ProfileIconId | null = null;

export const PROFILE_ICONS = [
  { id: 'miso1', source: miso1, label: 'Miso 1' },
  { id: 'miso2', source: miso2, label: 'Miso 2' },
  { id: 'wario', source: wario, label: 'Miso 3' },
] as const;

export type ProfileIconId = (typeof PROFILE_ICONS)[number]['id'];

const sourceById: Record<ProfileIconId, number> = {
  miso1,
  miso2,
  wario,
};

export function getProfileIconSource(id: string): number | null {
  return sourceById[id as ProfileIconId] ?? null;
}

const ICON_IDS: ProfileIconId[] = ['miso1', 'miso2', 'wario'];

/** Stable "random" profile icon for a user id (e.g. friend). Same id always gets the same icon. */
export function getProfileIconSourceForUserId(userId: string): number {
  let n = 0;
  for (let i = 0; i < userId.length; i++) n += userId.charCodeAt(i);
  const idx = Math.abs(n) % ICON_IDS.length;
  return sourceById[ICON_IDS[idx]];
}

export async function getStoredProfileIconId(): Promise<ProfileIconId> {
  try {
    const id = await AsyncStorage.getItem(PROFILE_ICON_KEY);
    if (id && (id === 'miso1' || id === 'miso2' || id === 'wario')) return id;
  } catch {
    if (memoryFallback) return memoryFallback;
  }
  return 'miso1';
}

export async function setStoredProfileIconId(id: ProfileIconId): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_ICON_KEY, id);
  } catch {
    memoryFallback = id;
  }
}
