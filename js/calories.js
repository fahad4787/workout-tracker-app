/**
 * Calorie & fitness calculations for Fahad's journey (103kg → 80kg)
 */

import { localDate, addDays } from './utils.js';

const USER_DEFAULTS = {
  startWeight: 103,
  targetWeight: 80,
  heightCm: 175, // adjustable in settings
};

// MET values (Metabolic Equivalent of Task)
const CYCLE_MET = {
  light: 4.0,      // < 10 km/h equivalent, easy pace
  moderate: 6.8,   // 12-14 km/h, steady effort
  vigorous: 10.0,  // 16-19 km/h, hard effort
  intense: 12.0,   // 20+ km/h, sprint intervals
};

const WORKOUT_MET = {
  warmup: 3.0,
  strength: 5.5,
  hiit: 8.0,
  cardio: 7.0,
  core: 4.5,
  cooldown: 2.5,
};

/**
 * Calories burned = MET × weight(kg) × duration(hours)
 */
export function calcCalories(met, weightKg, durationMinutes) {
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

export function calcCycleCalories(intensity, weightKg, durationMinutes) {
  const met = CYCLE_MET[intensity] || CYCLE_MET.moderate;
  return calcCalories(met, weightKg, durationMinutes);
}

export function calcWorkoutCalories(exercises, weightKg) {
  let total = 0;
  for (const ex of exercises) {
    const met = WORKOUT_MET[ex.category] || WORKOUT_MET.strength;
    total += calcCalories(met, weightKg, ex.durationSec / 60);
  }
  return total;
}

export function calcBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function weightProgress(current, start, target) {
  const totalToLose = start - target;
  const lost = start - current;
  const pct = Math.min(100, Math.max(0, (lost / totalToLose) * 100));
  return Math.round(pct);
}

export function estimateWeeksToGoal(currentWeight, targetWeight, weeklyLossKg = 1.0) {
  const remaining = currentWeight - targetWeight;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / weeklyLossKg);
}

export function dailyCalorieTarget(weightKg, heightCm = 175, activityLevel = 'moderate') {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 + 5;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
  const tdee = bmr * (multipliers[activityLevel] || 1.55);
  // 750 kcal deficit ≈ 0.7kg/week loss
  return Math.round(tdee - 750);
}

export function weeklyStats(logs) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekLogs = logs.filter(l => new Date(l.date) >= weekAgo);
  const totalCalories = weekLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalMinutes = weekLogs.reduce((s, l) => s + (l.duration || 0), 0);
  const sessions = weekLogs.length;

  return { totalCalories, totalMinutes, sessions };
}

const WEEKLY_GOALS = { sessions: 5, calories: 2500, minutes: 300 };

export function weeklyGoalProgress(logs) {
  const week = weeklyStats(logs);
  const sessionPct = Math.min(100, (week.sessions / WEEKLY_GOALS.sessions) * 100);
  const calPct = Math.min(100, (week.totalCalories / WEEKLY_GOALS.calories) * 100);
  const minPct = Math.min(100, (week.totalMinutes / WEEKLY_GOALS.minutes) * 100);
  const overall = Math.round((sessionPct + calPct + minPct) / 3);

  return { ...week, overall, goals: WEEKLY_GOALS };
}

export function calcStreak(logs) {
  if (!logs.length) return 0;

  const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
  const today = localDate();
  const yesterday = addDays(today, -1);

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = dates[0] === today ? today : yesterday;

  for (const date of dates) {
    if (date === checkDate) {
      streak++;
      checkDate = addDays(checkDate, -1);
    } else if (date < checkDate) {
      break;
    }
  }
  return streak;
}

export { CYCLE_MET, WORKOUT_MET, USER_DEFAULTS };
