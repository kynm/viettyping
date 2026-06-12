export const DATA_CHANGE_EVENT = 'viettyping:data-change';

export const MANAGED_DATA_KEYS = [
  'kids_learning_progress',
  'typing_completed_lessons',
  'typing_xp',
  'typing_streak',
  'typing_total_lessons',
  'typing_avg_wpm',
  'typing_avg_accuracy',
  'viettyping_badge_accuracy_100',
  'viettyping_badge_turtle_rescue',
  'viettyping_badge_speed_10',
  'viettyping_badge_speed_20',
  'viettyping_badge_speed_30',
  'viettyping_badge_speed_40',
  'viettyping_badge_speed_50',
  'viettyping_unlocked_mascots',
  'sound_muted',
] as const;

export type StoredSnapshot = Record<string, string>;

function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
}

export function setStoredValue(key: string, value: string) {
  localStorage.setItem(key, value);
  notifyDataChanged();
}

export function removeStoredValue(key: string) {
  localStorage.removeItem(key);
  notifyDataChanged();
}

export function readStoredSnapshot(): StoredSnapshot {
  return Object.fromEntries(
    MANAGED_DATA_KEYS.flatMap((key) => {
      const value = localStorage.getItem(key);
      return value === null ? [] : [[key, value]];
    }),
  );
}

export function replaceStoredSnapshot(snapshot: StoredSnapshot) {
  MANAGED_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  Object.entries(snapshot).forEach(([key, value]) => {
    if (MANAGED_DATA_KEYS.includes(key as (typeof MANAGED_DATA_KEYS)[number])) {
      localStorage.setItem(key, value);
    }
  });
  notifyDataChanged();
}

export function clearStoredSnapshot() {
  MANAGED_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
}
