/**
 * Daily workout engine — monthly progression, unique weekly plans, swap support
 */

import { EXERCISES } from './exercises.js';
import { localDate } from './utils.js';

function block(exerciseId, durationSec, restSec = 30) {
  const ex = EXERCISES[exerciseId];
  return {
    exerciseId,
    name: ex?.name || exerciseId,
    category: ex?.category || 'strength',
    durationSec,
    restSec,
    gif: ex?.gif,
    tips: ex?.tips,
    muscles: ex?.muscles,
  };
}

export function getMonthNumber(startDate, forDate = null) {
  const start = new Date(startDate + 'T12:00:00');
  const target = forDate ? new Date(forDate + 'T12:00:00') : new Date();
  const months = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
  return Math.max(1, months + 1);
}

export function getMonthPhase(monthNum) {
  if (monthNum <= 1) return { label: 'Foundation', minTier: 1, maxTier: 2, intensity: 0.85 };
  if (monthNum <= 2) return { label: 'Building', minTier: 1, maxTier: 3, intensity: 1.0 };
  if (monthNum <= 3) return { label: 'Intensifying', minTier: 2, maxTier: 4, intensity: 1.15 };
  return { label: 'Beast Mode', minTier: 3, maxTier: 4, intensity: 1.3 };
}

function scaleDuration(baseSec, week, monthNum) {
  const phase = getMonthPhase(monthNum);
  const weekMult = 1 + (week - 1) * 0.06;
  return Math.round(baseSec * 2.6 * phase.intensity * Math.min(weekMult, 1.35));
}

function scaleRest(baseRest, week, monthNum) {
  const phase = getMonthPhase(monthNum);
  const restCut = (monthNum - 1) * 2 + (week - 1) * 1;
  return Math.max(phase.maxTier >= 4 ? 20 : 25, baseRest + 15 - restCut);
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dateSeed(dateStr) {
  return dateStr.split('-').reduce((acc, n) => acc + parseInt(n, 10) * 17, 0);
}

function warmup(week, monthNum) {
  return [
    block('armCircles', scaleDuration(30, week, monthNum), 10),
    block('hipCircles', scaleDuration(30, week, monthNum), 10),
    block('jumpingJacks', scaleDuration(40, week, monthNum), 15),
    block('highKnees', scaleDuration(35, week, monthNum), 15),
  ];
}

function cooldown(week, monthNum) {
  return [
    block('catCow', scaleDuration(40, week, monthNum), 10),
    block('hamstringStretch', scaleDuration(35, week, monthNum), 10),
    block('quadStretch', scaleDuration(35, week, monthNum), 10),
    block('childPose', scaleDuration(45, week, monthNum), 0),
  ];
}

function buildMain(pool, week, monthNum, seed, count) {
  const shuffled = seededShuffle(pool, seed);
  const picked = [];
  const used = new Set();
  for (const item of shuffled) {
    if (picked.length >= count) break;
    if (used.has(item.id)) continue;
    used.add(item.id);
    picked.push(block(item.id, scaleDuration(item.sec, week, monthNum), scaleRest(item.rest, week, monthNum)));
  }
  return picked;
}

const POOLS = {
  legs: [
    { id: 'squats', sec: 50, rest: 30 }, { id: 'lunges', sec: 45, rest: 30 },
    { id: 'reverseLunges', sec: 45, rest: 30 }, { id: 'lateralLunges', sec: 45, rest: 30 },
    { id: 'gluteBridge', sec: 50, rest: 25 }, { id: 'pulseSquats', sec: 45, rest: 30 },
    { id: 'frogSquats', sec: 45, rest: 30 }, { id: 'calfRaises', sec: 45, rest: 25 },
    { id: 'donkeyKick', sec: 40, rest: 25 }, { id: 'fireHydrant', sec: 40, rest: 25 },
    { id: 'singleLegBridge', sec: 40, rest: 30 }, { id: 'curtsyLunges', sec: 45, rest: 30 },
  ],
  upper: [
    { id: 'pushUps', sec: 45, rest: 35 }, { id: 'widePushUps', sec: 40, rest: 35 },
    { id: 'diamondPushUps', sec: 35, rest: 40 }, { id: 'pikePushUps', sec: 40, rest: 35 },
    { id: 'closeGripPushUps', sec: 40, rest: 35 }, { id: 'shoulderTaps', sec: 40, rest: 30 },
    { id: 'inchworm', sec: 40, rest: 30 }, { id: 'walkout', sec: 40, rest: 30 },
    { id: 'commandoPlank', sec: 35, rest: 30 }, { id: 'crabWalk', sec: 40, rest: 30 },
    { id: 'kneePushUps', sec: 45, rest: 30 },
  ],
  hiit: [
    { id: 'burpees', sec: 35, rest: 30 }, { id: 'sprawl', sec: 35, rest: 30 },
    { id: 'squatJumps', sec: 35, rest: 30 }, { id: 'mountainClimbers', sec: 40, rest: 25 },
    { id: 'skaterHops', sec: 35, rest: 30 }, { id: 'tuckJumps', sec: 30, rest: 35 },
    { id: 'plankJacks', sec: 40, rest: 25 }, { id: 'highKnees', sec: 45, rest: 25 },
    { id: 'starJumps', sec: 35, rest: 25 }, { id: 'fastFeet', sec: 40, rest: 25 },
    { id: 'bearCrawl', sec: 40, rest: 30 },
  ],
  core: [
    { id: 'plank', sec: 55, rest: 25 }, { id: 'sidePlank', sec: 35, rest: 20 },
    { id: 'crunches', sec: 45, rest: 25 }, { id: 'bicycleCrunches', sec: 45, rest: 25 },
    { id: 'legRaises', sec: 40, rest: 30 }, { id: 'russianTwists', sec: 45, rest: 25 },
    { id: 'deadBug', sec: 45, rest: 25 }, { id: 'hollowHold', sec: 40, rest: 30 },
    { id: 'vUps', sec: 35, rest: 30 }, { id: 'flutterKicks', sec: 40, rest: 25 },
    { id: 'toeTouches', sec: 40, rest: 25 }, { id: 'birdDog', sec: 40, rest: 25 },
  ],
  full: [
    { id: 'burpees', sec: 35, rest: 35 }, { id: 'pushUps', sec: 45, rest: 30 },
    { id: 'squats', sec: 50, rest: 30 }, { id: 'lunges', sec: 45, rest: 30 },
    { id: 'mountainClimbers', sec: 40, rest: 30 }, { id: 'gluteBridge', sec: 50, rest: 25 },
    { id: 'squatJumps', sec: 35, rest: 35 }, { id: 'plank', sec: 50, rest: 30 },
    { id: 'inchworm', sec: 40, rest: 30 }, { id: 'bearCrawl', sec: 40, rest: 30 },
    { id: 'russianTwists', sec: 40, rest: 25 },
  ],
  cardio: [
    { id: 'runningInPlace', sec: 60, rest: 20 }, { id: 'highKnees', sec: 50, rest: 25 },
    { id: 'buttKicks', sec: 50, rest: 25 }, { id: 'jumpingJacks', sec: 55, rest: 20 },
    { id: 'skaterHops', sec: 40, rest: 30 }, { id: 'starJumps', sec: 40, rest: 25 },
    { id: 'fastFeet', sec: 45, rest: 25 }, { id: 'mountainClimbers', sec: 45, rest: 25 },
    { id: 'shadowBox', sec: 50, rest: 25 }, { id: 'crossPunches', sec: 45, rest: 25 },
  ],
  plyo: [
    { id: 'squatJumps', sec: 35, rest: 40 }, { id: 'tuckJumps', sec: 30, rest: 40 },
    { id: 'burpees', sec: 35, rest: 40 }, { id: 'skaterHops', sec: 40, rest: 35 },
    { id: 'plankJacks', sec: 40, rest: 35 }, { id: 'starJumps', sec: 40, rest: 30 },
    { id: 'frogSquats', sec: 40, rest: 35 }, { id: 'sprawl', sec: 35, rest: 35 },
    { id: 'bearCrawl', sec: 45, rest: 30 }, { id: 'fastFeet', sec: 45, rest: 25 },
  ],
  boxing: [
    { id: 'shadowBox', sec: 55, rest: 25 }, { id: 'crossPunches', sec: 45, rest: 25 },
    { id: 'highKnees', sec: 45, rest: 25 }, { id: 'squatJumps', sec: 35, rest: 30 },
    { id: 'mountainClimbers', sec: 40, rest: 25 }, { id: 'burpees', sec: 30, rest: 35 },
    { id: 'plank', sec: 45, rest: 25 }, { id: 'jumpingJacks', sec: 45, rest: 20 },
    { id: 'skaterHops', sec: 35, rest: 30 }, { id: 'pushUps', sec: 40, rest: 30 },
  ],
  ninja: [
    { id: 'bearCrawl', sec: 45, rest: 30 }, { id: 'crabWalk', sec: 40, rest: 30 },
    { id: 'sprawl', sec: 35, rest: 35 }, { id: 'inchworm', sec: 40, rest: 30 },
    { id: 'squatJumps', sec: 35, rest: 35 }, { id: 'mountainClimbers', sec: 45, rest: 25 },
    { id: 'walkout', sec: 40, rest: 30 }, { id: 'tuckJumps', sec: 30, rest: 35 },
    { id: 'plankJacks', sec: 40, rest: 30 }, { id: 'lunges', sec: 45, rest: 30 },
  ],
  glutes: [
    { id: 'gluteBridge', sec: 50, rest: 25 }, { id: 'singleLegBridge', sec: 40, rest: 30 },
    { id: 'donkeyKick', sec: 45, rest: 25 }, { id: 'fireHydrant', sec: 45, rest: 25 },
    { id: 'frogSquats', sec: 45, rest: 30 }, { id: 'reverseLunges', sec: 45, rest: 30 },
    { id: 'curtsyLunges', sec: 45, rest: 30 }, { id: 'pulseSquats', sec: 45, rest: 30 },
    { id: 'superman', sec: 40, rest: 25 }, { id: 'lateralLunges', sec: 45, rest: 30 },
  ],
  dance: [
    { id: 'jumpingJacks', sec: 50, rest: 20 }, { id: 'skaterHops', sec: 40, rest: 25 },
    { id: 'highKnees', sec: 45, rest: 25 }, { id: 'buttKicks', sec: 45, rest: 25 },
    { id: 'starJumps', sec: 40, rest: 25 }, { id: 'squatJumps', sec: 35, rest: 30 },
    { id: 'crossPunches', sec: 45, rest: 25 }, { id: 'runningInPlace', sec: 50, rest: 20 },
    { id: 'lateralLunges', sec: 40, rest: 25 }, { id: 'mountainClimbers', sec: 40, rest: 25 },
  ],
  abs: [
    { id: 'vUps', sec: 35, rest: 30 }, { id: 'bicycleCrunches', sec: 45, rest: 25 },
    { id: 'hollowHold', sec: 40, rest: 30 }, { id: 'legRaises', sec: 40, rest: 30 },
    { id: 'russianTwists', sec: 45, rest: 25 }, { id: 'flutterKicks', sec: 40, rest: 25 },
    { id: 'plank', sec: 50, rest: 25 }, { id: 'sidePlank', sec: 35, rest: 20 },
    { id: 'toeTouches', sec: 40, rest: 25 }, { id: 'commandoPlank', sec: 35, rest: 30 },
  ],
  prison: [
    { id: 'pushUps', sec: 45, rest: 30 }, { id: 'squats', sec: 50, rest: 30 },
    { id: 'lunges', sec: 45, rest: 30 }, { id: 'burpees', sec: 30, rest: 40 },
    { id: 'mountainClimbers', sec: 40, rest: 30 }, { id: 'plank', sec: 50, rest: 25 },
    { id: 'jumpingJacks', sec: 45, rest: 25 }, { id: 'closeGripPushUps', sec: 40, rest: 30 },
    { id: 'gluteBridge', sec: 45, rest: 25 }, { id: 'crunches', sec: 40, rest: 25 },
  ],
  mobility: [
    { id: 'armCircles', sec: 40, rest: 10 }, { id: 'hipCircles', sec: 40, rest: 10 },
    { id: 'catCow', sec: 45, rest: 10 }, { id: 'inchworm', sec: 40, rest: 20 },
    { id: 'walkout', sec: 40, rest: 20 }, { id: 'birdDog', sec: 40, rest: 20 },
    { id: 'gluteBridge', sec: 45, rest: 20 }, { id: 'lunges', sec: 40, rest: 25 },
    { id: 'superman', sec: 40, rest: 20 }, { id: 'plank', sec: 40, rest: 25 },
  ],
  speed: [
    { id: 'fastFeet', sec: 45, rest: 25 }, { id: 'highKnees', sec: 45, rest: 25 },
    { id: 'buttKicks', sec: 45, rest: 25 }, { id: 'skaterHops', sec: 40, rest: 30 },
    { id: 'tuckJumps', sec: 30, rest: 35 }, { id: 'sprawl', sec: 35, rest: 30 },
    { id: 'bearCrawl', sec: 40, rest: 30 }, { id: 'starJumps', sec: 35, rest: 30 },
    { id: 'mountainClimbers', sec: 40, rest: 25 },
  ],
  savage: [
    { id: 'burpees', sec: 35, rest: 25 }, { id: 'squatJumps', sec: 35, rest: 25 },
    { id: 'pushUps', sec: 40, rest: 25 }, { id: 'tuckJumps', sec: 30, rest: 30 },
    { id: 'sprawl', sec: 35, rest: 25 }, { id: 'vUps', sec: 35, rest: 25 },
    { id: 'bearCrawl', sec: 45, rest: 25 }, { id: 'mountainClimbers', sec: 45, rest: 20 },
    { id: 'plankJacks', sec: 40, rest: 25 }, { id: 'lunges', sec: 45, rest: 25 },
  ],
};

const WORKOUT_TEMPLATES = [
  { name: 'Leg Day Destroyer', icon: 'footprint', tagline: 'Build power from the ground up', accent: 'accent-orange', focus: 'Lower Body Power', pool: 'legs', count: 12, tier: 1 },
  { name: 'Core Crusher', icon: 'target', tagline: 'Sculpt that midsection', accent: 'accent-cyan', focus: 'Abs & Obliques', pool: 'core', count: 12, tier: 1 },
  { name: 'Cardio Endurance', icon: 'activity', tagline: 'Build stamina, burn fat', accent: 'accent-violet', focus: 'Steady State Cardio', pool: 'cardio', count: 11, tier: 1 },
  { name: 'Morning Flow', icon: 'sun', tagline: 'Wake up and move', accent: 'accent-lime', focus: 'Mobility + Light Strength', pool: 'mobility', count: 10, tier: 1 },
  { name: 'Glute Activation', icon: 'heart', tagline: 'Fire up your posterior chain', accent: 'accent-pink', focus: 'Glutes & Hips', pool: 'glutes', count: 11, tier: 1 },
  { name: 'Easy Burn Starter', icon: 'zap', tagline: 'Perfect for building the habit', accent: 'accent-blue', focus: 'Beginner Full Body', pool: 'prison', count: 10, tier: 1 },
  { name: 'Upper Body Burn', icon: 'dumbbell', tagline: 'Push power, zero weights', accent: 'accent-pink', focus: 'Chest, Shoulders, Arms', pool: 'upper', count: 11, tier: 2 },
  { name: 'Full Body Beast', icon: 'zap', tagline: 'Leave nothing behind', accent: 'accent-lime', focus: 'Total Body Strength', pool: 'full', count: 12, tier: 2 },
  { name: 'Dance Cardio Party', icon: 'sparkles', tagline: 'Move like nobody\'s watching', accent: 'accent-fuchsia', focus: 'Fun Fat Burn', pool: 'dance', count: 11, tier: 2 },
  { name: 'Prison Workout Classic', icon: 'shield', tagline: 'Old-school bodyweight grind', accent: 'accent-amber', focus: 'Raw Strength Endurance', pool: 'prison', count: 11, tier: 2 },
  { name: 'Bear Crawl Gauntlet', icon: 'footprint', tagline: 'Move like a ninja', accent: 'accent-teal', focus: 'Animal Flow + Agility', pool: 'ninja', count: 11, tier: 2 },
  { name: 'Lower Body Ladder', icon: 'footprint', tagline: 'Legs that don\'t quit', accent: 'accent-orange', focus: 'Quads, Glutes, Hamstrings', pool: 'legs', count: 11, tier: 2 },
  { name: 'Strength Endurance', icon: 'shield', tagline: 'Last longer, go harder', accent: 'accent-blue', focus: 'Muscular Endurance', pool: 'full', count: 11, tier: 2 },
  { name: 'HIIT Inferno', icon: 'flame', tagline: 'Maximum calorie burn mode', accent: 'accent-red', focus: 'High Intensity Intervals', pool: 'hiit', count: 12, tier: 3 },
  { name: 'Shadow Box Burn', icon: 'wind', tagline: 'Float like a butterfly...', accent: 'accent-rose', focus: 'Boxing Cardio', pool: 'boxing', count: 11, tier: 3 },
  { name: 'Power & Plyo', icon: 'rocket', tagline: 'Explosive strength day', accent: 'accent-yellow', focus: 'Explosive Movements', pool: 'plyo', count: 11, tier: 3 },
  { name: 'Tabata Torch', icon: 'flame', tagline: '20 on, 10 off — pure fire', accent: 'accent-rose', focus: 'Tabata Fat Burn', pool: 'hiit', count: 12, tier: 3 },
  { name: 'Abs of Steel', icon: 'target', tagline: 'Core strength redefined', accent: 'accent-cyan', focus: 'Advanced Core', pool: 'abs', count: 11, tier: 3 },
  { name: 'Speed & Agility', icon: 'activity', tagline: 'Quick feet, fast results', accent: 'accent-teal', focus: 'Speed Drills', pool: 'speed', count: 10, tier: 3 },
  { name: 'Push Power Hour', icon: 'dumbbell', tagline: 'Chest, shoulders, triceps', accent: 'accent-fuchsia', focus: 'Upper Push Focus', pool: 'upper', count: 12, tier: 3 },
  { name: 'Athletic Conditioning', icon: 'wind', tagline: 'Train like an athlete', accent: 'accent-teal', focus: 'Sport Performance', pool: 'ninja', count: 12, tier: 4 },
  { name: 'Metabolic Mayhem', icon: 'zap', tagline: 'Rev your metabolism', accent: 'accent-red', focus: 'Metabolic Conditioning', pool: 'savage', count: 12, tier: 4 },
  { name: 'Fat Burn Blitz', icon: 'sparkles', tagline: 'Maximum sweat session', accent: 'accent-orange', focus: 'Peak Calorie Burn', pool: 'hiit', count: 12, tier: 4 },
  { name: 'Fight Camp', icon: 'flame', tagline: 'Championship rounds at home', accent: 'accent-red', focus: 'Fight-Style Conditioning', pool: 'boxing', count: 12, tier: 4 },
  { name: 'AMRAP Madness', icon: 'timer', tagline: 'As many rounds as possible', accent: 'accent-purple', focus: 'Density Training', pool: 'savage', count: 12, tier: 4 },
  { name: 'Zero Gear Hero', icon: 'shield', tagline: 'Nothing but you vs gravity', accent: 'accent-lime', focus: 'Pure Bodyweight', pool: 'full', count: 12, tier: 4 },
  { name: 'Night Sweat Session', icon: 'moon', tagline: 'Burn off the day', accent: 'accent-violet', focus: 'Evening HIIT', pool: 'plyo', count: 11, tier: 4 },
  { name: 'Savage Circuit', icon: 'flame', tagline: 'No mercy, all sweat', accent: 'accent-red', focus: 'Brutal Circuits', pool: 'savage', count: 12, tier: 4 },
  { name: 'EMOM Engine', icon: 'timer', tagline: 'Every minute on the minute', accent: 'accent-cyan', focus: 'Timed Intervals', pool: 'hiit', count: 12, tier: 4 },
  { name: 'Final Boss Friday', icon: 'trophy', tagline: 'The hardest session of the week', accent: 'accent-yellow', focus: 'Ultimate Challenge', pool: 'savage', count: 13, tier: 4 },
];

const PLAN_VERSION = 3;

export function getNext7Dates(fromDate = null) {
  const base = fromDate ? new Date(fromDate + 'T12:00:00') : new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(localDate(d));
  }
  return dates;
}

function getAllowedIndices(monthNum) {
  const phase = getMonthPhase(monthNum);
  return WORKOUT_TEMPLATES
    .map((t, i) => ({ ...t, index: i }))
    .filter(t => t.tier >= phase.minTier && t.tier <= phase.maxTier)
    .map(t => t.index);
}

/** Build a 7-day plan — each workout appears at most once per week */
export function buildWeekPlan(startDate, logs = [], dates = null) {
  const weekDates = dates || getNext7Dates();
  const plan = {};
  const used = new Set();

  for (const dateStr of weekDates) {
    const monthNum = getMonthNumber(startDate, dateStr);
    let allowed = getAllowedIndices(monthNum);

    // Avoid same as last completed workout on day 1
    if (dateStr === weekDates[0]) {
      const lastWorkout = logs.find(l => l.type === 'workout');
      if (lastWorkout?.workoutName) {
        const lastIdx = WORKOUT_TEMPLATES.findIndex(t => t.name === lastWorkout.workoutName);
        if (lastIdx >= 0 && allowed.length > 1) {
          allowed = allowed.filter(i => i !== lastIdx);
        }
      }
    }

    const seed = dateSeed(dateStr) + monthNum * 13 + weekDates.indexOf(dateStr) * 7;
    const shuffled = seededShuffle(allowed.filter(i => !used.has(i)), seed);

    // Fallback: if we run out of unique allowed, pick any unused globally
    let pick = shuffled[0];
    if (pick === undefined) {
      const remaining = WORKOUT_TEMPLATES.map((_, i) => i).filter(i => !used.has(i));
      pick = seededShuffle(remaining, seed)[0] ?? 0;
    }

    plan[dateStr] = pick;
    used.add(pick);
  }

  return plan;
}

export function ensureWeekPlan(data, startDate, logs) {
  const dates = getNext7Dates();
  const weekKey = dates[0];

  if (data.workoutPlanVersion !== PLAN_VERSION) {
    data.workoutPlan = null;
    data.workoutPlanVersion = PLAN_VERSION;
  }

  if (!data.workoutPlan || data.workoutPlanWeek !== weekKey) {
    data.workoutPlan = buildWeekPlan(startDate, logs, dates);
    data.workoutPlanWeek = weekKey;
  }

  return data.workoutPlan;
}

/** Swap today's workout with another day in the current week plan */
export function swapWorkoutDays(data, startDate, logs, dateA, dateB) {
  const plan = ensureWeekPlan(data, startDate, logs);
  if (!plan[dateA] || !plan[dateB]) return { ok: false, message: 'Invalid dates' };
  if (dateA === dateB) return { ok: false, message: 'Same day' };

  const temp = plan[dateA];
  plan[dateA] = plan[dateB];
  plan[dateB] = temp;

  return { ok: true, plan };
}

export function getWorkoutIndex(startDate, logs = [], forDate = null, plan = null) {
  const dateStr = forDate || localDate();
  if (plan && plan[dateStr] !== undefined) return plan[dateStr];

  const start = new Date(startDate + 'T12:00:00');
  const target = new Date(dateStr + 'T12:00:00');
  const daysSince = Math.max(0, Math.floor((target - start) / 86400000));
  return daysSince % WORKOUT_TEMPLATES.length;
}

export function getTodaysWorkout(weekNumber, startDate, logs = [], forDate = null, plan = null) {
  const dateStr = forDate || localDate();
  const monthNum = getMonthNumber(startDate, dateStr);
  const index = getWorkoutIndex(startDate, logs, dateStr, plan);
  const template = WORKOUT_TEMPLATES[index];
  const seed = dateSeed(dateStr) + index * 31 + weekNumber + monthNum * 7;

  const blocks = [
    ...warmup(weekNumber, monthNum),
    ...buildMain(POOLS[template.pool], weekNumber, monthNum, seed, template.count),
    ...cooldown(weekNumber, monthNum),
  ];

  const totalWorkSec = blocks.reduce((s, b) => s + b.durationSec, 0);
  const totalRestSec = blocks.reduce((s, b) => s + b.restSec, 0);
  const dayNum = Math.max(0, Math.floor((new Date(dateStr + 'T12:00:00') - new Date(startDate + 'T12:00:00')) / 86400000));
  const phase = getMonthPhase(monthNum);

  return {
    ...template,
    index,
    weekNumber,
    monthNumber: monthNum,
    monthPhase: phase.label,
    dayNumber: dayNum + 1,
    blocks,
    totalWorkSec,
    totalRestSec,
    totalMinutes: Math.round((totalWorkSec + totalRestSec) / 60),
    exerciseCount: blocks.length,
    date: dateStr,
  };
}

export function getWeekPreview(startDate, logs = [], plan = null) {
  const activePlan = plan || buildWeekPlan(startDate, logs);
  const today = localDate();
  const preview = [];

  for (const dateStr of getNext7Dates()) {
    const d = new Date(dateStr + 'T12:00:00');
    const week = getWeekNumber(startDate, dateStr);
    const w = getTodaysWorkout(week, startDate, logs, dateStr, activePlan);
    preview.push({
      date: dateStr,
      dayLabel: dateStr === today ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' }),
      name: w.name,
      icon: w.icon,
      focus: w.focus,
      minutes: w.totalMinutes,
      tier: WORKOUT_TEMPLATES[w.index]?.tier,
      monthPhase: w.monthPhase,
      isToday: dateStr === today,
      templateIndex: w.index,
    });
  }
  return preview;
}

export function getWeekNumber(startDate, forDate = null) {
  const start = new Date(startDate + 'T12:00:00');
  const target = forDate ? new Date(forDate + 'T12:00:00') : new Date();
  const diffDays = Math.floor((target - start) / 86400000);
  return Math.min(12, Math.max(1, Math.floor(diffDays / 7) + 1));
}

export const MOTIVATIONAL_QUOTES = [
  "Pain is temporary. Your progress is forever.",
  "No gym? No problem. No excuses.",
  "Today's sweat is tomorrow's confidence.",
  "You're stronger than your strongest excuse.",
  "The only bad workout is the one you skipped.",
  "Your future self is cheering you on right now.",
  "Discipline beats motivation. Show up anyway.",
  "Burn it. Earn it. Own it.",
  "Champions train. Everyone else makes excuses.",
  "New day, new workout. Keep showing up.",
  "Each month gets tougher — and so do you.",
  "30 programs. Zero equipment. All you.",
  "Dance Cardio today? Shadow Box tomorrow? Let's go.",
];

export function randomQuote(profile = {}) {
  const name = profile.name || 'Fahad';
  const start = profile.startWeight ?? 103;
  const target = profile.targetWeight ?? 80;
  const current = profile.currentWeight ?? start;
  const remaining = Math.max(0, Math.round((current - target) * 10) / 10);
  const dynamic = [
    `Every rep gets you closer to ${target}kg, ${name}.`,
    `${start} → ${target}. You're not dreaming it, you're doing it.`,
    remaining > 0 ? `${remaining}kg to go. One session at a time.` : `${name}, you reached your target zone. Stay strong!`,
  ];
  const pool = [...dynamic, ...MOTIVATIONAL_QUOTES];
  return pool[Math.floor(Math.random() * pool.length)];
}

export { WORKOUT_TEMPLATES };
