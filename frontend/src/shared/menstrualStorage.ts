// frontend/src/shared/menstrualStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

export type MenstrualSettings = {
  lastPeriodStartISO: string | null; // YYYY-MM-DD
  cycleLengthDays: number; // e.g. 28
  periodLengthDays: number; // e.g. 5
  updatedAtISO: string; // YYYY-MM-DD
};

const STORAGE_KEY = "menstrual_settings_v1";

export const DEFAULT_MENSTRUAL_SETTINGS: MenstrualSettings = {
  // nice default so the UI doesn’t look empty:
  // last period = 14 days ago (approx mid-cycle)
  lastPeriodStartISO: null,
  cycleLengthDays: 28,
  periodLengthDays: 5,
  updatedAtISO: todayISO(),
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export async function loadMenstrualSettings(): Promise<MenstrualSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_MENSTRUAL_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as MenstrualSettings;
    // basic guards + defaults
    return {
      lastPeriodStartISO: parsed.lastPeriodStartISO ?? null,
      cycleLengthDays: typeof parsed.cycleLengthDays === "number" ? parsed.cycleLengthDays : 28,
      periodLengthDays: typeof parsed.periodLengthDays === "number" ? parsed.periodLengthDays : 5,
      updatedAtISO: parsed.updatedAtISO ?? todayISO(),
    };
  } catch {
    return DEFAULT_MENSTRUAL_SETTINGS;
  }
}

export async function saveMenstrualSettings(next: Omit<MenstrualSettings, "updatedAtISO">): Promise<void> {
  const payload: MenstrualSettings = {
    ...next,
    updatedAtISO: todayISO(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function clearMenstrualSettings(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}