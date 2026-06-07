/**
 * JSON localStorage persistence — lifetime free data for Fahad
 */

import { localDate } from './utils.js';

const STORAGE_KEY = 'fahadFitData_v1';

const DEFAULT_DATA = {
  profile: {
    name: 'Fahad',
    startWeight: 103,
    currentWeight: 103,
    targetWeight: 80,
    heightCm: 175,
    startDate: localDate(),
  },
  logs: [],
  weightHistory: [
    { date: localDate(), weight: 103 },
  ],
  settings: {
    cycleIntensity: 'moderate',
    soundFx: true,
    coachVoice: true,
  },
  workoutPlanVersion: 3,
  stats: {
    totalSessions: 0,
    totalCaloriesBurned: 0,
    totalMinutes: 0,
  },
  workoutPlan: null,
  workoutPlanWeek: null,
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed, DEFAULT_DATA);
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function mergeDefaults(data, defaults) {
  const settings = { ...defaults.settings, ...data.settings };
  delete settings.notifications;
  delete settings.reminders;
  delete settings.reminderTime;

  return {
    ...defaults,
    ...data,
    profile: { ...defaults.profile, ...data.profile },
    settings,
    stats: { ...defaults.stats, ...data.stats },
    logs: data.logs || [],
    weightHistory: data.weightHistory || defaults.weightHistory,
    workoutPlan: data.workoutPlan || null,
    workoutPlanWeek: data.workoutPlanWeek || null,
    workoutPlanVersion: data.workoutPlanVersion ?? 3,
  };
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
}

export function addLog(data, logEntry) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: localDate(),
    timestamp: new Date().toISOString(),
    ...logEntry,
  };

  data.logs.unshift(entry);
  recalculateStats(data);
  saveData(data);
  return entry;
}

function recalculateStats(data) {
  data.stats.totalSessions = data.logs.length;
  data.stats.totalCaloriesBurned = data.logs.reduce((s, l) => s + (l.calories || 0), 0);
  data.stats.totalMinutes = data.logs.reduce((s, l) => s + (l.duration || 0), 0);
}

export function deleteLog(data, logId) {
  const idx = data.logs.findIndex(l => l.id === logId);
  if (idx === -1) return false;
  data.logs.splice(idx, 1);
  recalculateStats(data);
  saveData(data);
  return true;
}

export function deleteLogsForDate(data, date) {
  const before = data.logs.length;
  data.logs = data.logs.filter(l => l.date !== date);
  if (data.logs.length === before) return 0;
  recalculateStats(data);
  saveData(data);
  return before - data.logs.length;
}

export function updateProfile(data, updates) {
  data.profile = { ...data.profile, ...updates };
  saveData(data);
}

export function updateWeight(data, weight) {
  const today = localDate();
  data.profile.currentWeight = weight;

  const existing = data.weightHistory.find(w => w.date === today);
  if (existing) {
    existing.weight = weight;
  } else {
    data.weightHistory.push({ date: today, weight });
  }

  data.weightHistory.sort((a, b) => a.date.localeCompare(b.date));
  saveData(data);
}

export function getLogsForDate(data, date) {
  return data.logs.filter(l => l.date === date);
}

export function getLogsForMonth(data, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return data.logs.filter(l => l.date.startsWith(prefix));
}

export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fahad-fit-backup-${localDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const merged = mergeDefaults(parsed, DEFAULT_DATA);
        recalculateStats(merged);
        saveData(merged);
        resolve(merged);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(DEFAULT_DATA);
}

export { STORAGE_KEY, DEFAULT_DATA };
