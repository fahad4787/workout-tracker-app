/**
 * FahadFit — Main Application Controller
 */

import {
  calcCycleCalories,
  calcWorkoutCalories,
  calcBMI,
  weightProgress,
  estimateWeeksToGoal,
  dailyCalorieTarget,
  weeklyStats,
  calcStreak,
  weeklyGoalProgress,
} from './calories.js';
import { loadData, saveData, addLog, updateWeight, updateProfile, exportJSON, importJSON, clearAllData, deleteLog, deleteLogsForDate } from './storage.js';
import { localDate, escapeHtml } from './utils.js';
import { getTodaysWorkout, getWeekNumber, getWeekPreview, randomQuote, ensureWeekPlan, swapWorkoutDays } from './workouts.js';
import { formatDuration } from './exercises.js';
import { mountExerciseMedia, preloadMedia, preloadWorkoutBlocks } from './exercise-media.js';
import { icon, setIcon } from './icons.js';
import {
  initAudio, unlockAudio, playTap, playToggle, playWorkStart, playRestStart,
  playCountdownTick, playGo, playComplete, setSoundFx, setCoachVoice,
  coachWorkoutStart, coachExercise, coachRest, coachCountdown, coachHalfway,
  coachAlmostDone, coachFinish, coachMotivate, showCoachText, resetCoachTimer,
  setCoachSpeakingListener, setCoachProfile, getCoachReadyText,
} from './audio.js';

// ─── State ───────────────────────────────────────────────
let data = loadData();
let activeTab = 'home';
let cycleTimer = null;
let cycleSeconds = 0;
let cycleRunning = false;
let workoutState = null;
let workoutTimer = null;
let lastCountdownSpoken = -1;
let pausedByBackground = false;

// ─── Static icons in HTML ──────────────────────────────────
function initStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    const size = parseInt(el.dataset.size || '20', 10);
    setIcon(el, name, size);
  });
}

// ─── DOM Ready ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

function init() {
  initStaticIcons();
  initAudio(data.settings);
  syncCoachProfile();
  setCoachSpeakingListener((speaking) => {
    document.getElementById('wp-coach-wrap')?.classList.toggle('speaking', speaking);
  });
  renderAll();
  setupNavigation();
  setupCycleTracker();
  setupWorkoutPlayer();
  setupSettings();
  setupDataManagement();
  setupCalendar();
  setupLogDeletion();
  setupGlobalTapSounds();
  setupAudioToggles();
  setupBackgroundPause();
  registerServiceWorker();
  document.getElementById('dash-start-workout')?.addEventListener('click', () => {
    switchTab('workout');
    setTimeout(() => document.getElementById('workout-start-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  });
  document.getElementById('dash-go-settings')?.addEventListener('click', () => switchTab('settings'));
}

function profileName() {
  return data.profile.name || 'Fahad';
}

function syncCoachProfile() {
  setCoachProfile({
    name: data.profile.name,
    startWeight: data.profile.startWeight,
    currentWeight: data.profile.currentWeight,
    targetWeight: data.profile.targetWeight,
  });
  const coachEl = document.getElementById('wp-coach');
  if (coachEl && !workoutState) coachEl.textContent = getCoachReadyText();
}

// ─── Navigation ──────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  if (workoutState && tab !== 'workout') {
    if (!confirm('Workout in progress. Leave anyway? Progress won\'t be saved.')) return;
    clearInterval(workoutTimer);
    workoutState = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
    resetWorkoutPauseButton();
    document.getElementById('workout-preview')?.classList.remove('hidden');
    document.getElementById('workout-player')?.classList.add('hidden');
    document.getElementById('workout-complete')?.classList.add('hidden');
  }

  if (cycleRunning && tab !== 'cycle') {
    if (!confirm('Cycle timer is running. Leave anyway?')) return;
  }

  activeTab = tab;
  document.querySelectorAll('[data-tab]').forEach(b => {
    const isActive = b.dataset.tab === activeTab;
    b.classList.toggle('tab-active', isActive);
    b.classList.toggle('text-gray-400', !isActive);
    const ic = b.querySelector('.nav-icon');
    if (ic) ic.classList.toggle('nav-icon-active', isActive);
  });
  document.querySelectorAll('[data-panel]').forEach(p => {
    p.classList.toggle('hidden', p.dataset.panel !== activeTab);
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (activeTab === 'history') renderHistory();
  if (activeTab === 'home') renderDashboard();
  if (activeTab === 'workout') renderWorkoutPreview();
  if (activeTab === 'settings') renderSettings();
}

// ─── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  const { profile, stats } = data;
  const progress = weightProgress(profile.currentWeight, profile.startWeight, profile.targetWeight);
  const lost = Math.round((profile.startWeight - profile.currentWeight) * 10) / 10;
  const remaining = Math.round((profile.currentWeight - profile.targetWeight) * 10) / 10;
  const streak = calcStreak(data.logs);
  const week = weeklyStats(data.logs);
  const bmi = calcBMI(profile.currentWeight, profile.heightCm);
  const weeksLeft = estimateWeeksToGoal(profile.currentWeight, profile.targetWeight);
  const calorieTarget = dailyCalorieTarget(profile.currentWeight, profile.heightCm);

  renderHeader(profile, streak);
  document.getElementById('dash-greeting').innerHTML = getGreeting();
  document.getElementById('dash-quote').textContent = randomQuote(profile);
  document.getElementById('dash-weight').textContent = profile.currentWeight;
  document.getElementById('dash-target').textContent = profile.targetWeight;
  document.getElementById('dash-lost').textContent = lost > 0 ? `-${lost}` : '0';
  document.getElementById('dash-remaining').textContent = remaining;
  document.getElementById('dash-streak').textContent = streak;
  document.getElementById('dash-sessions').textContent = stats.totalSessions;
  document.getElementById('dash-calories').textContent = stats.totalCaloriesBurned.toLocaleString();
  document.getElementById('dash-minutes').textContent = stats.totalMinutes;
  document.getElementById('dash-bmi').textContent = bmi;
  document.getElementById('dash-weeks').textContent = weeksLeft;
  document.getElementById('dash-cal-target').textContent = calorieTarget;
  document.getElementById('dash-week-cal').textContent = week.totalCalories.toLocaleString();
  document.getElementById('dash-week-min').textContent = week.totalMinutes;
  document.getElementById('dash-week-sessions').textContent = week.sessions;

  const goal = weeklyGoalProgress(data.logs);
  document.getElementById('dash-week-goal-pct').textContent = `${goal.overall}%`;
  document.getElementById('dash-week-goal-bar').style.width = `${goal.overall}%`;

  // Progress ring
  const ring = document.getElementById('progress-ring');
  if (ring) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (progress / 100) * circumference;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
  }
  document.getElementById('dash-progress-pct').textContent = `${progress}%`;

  // Today's activity
  const today = localDate();
  const todayLogs = data.logs.filter(l => l.date === today);
  const todayEl = document.getElementById('dash-today-activity');
  const clearTodayBtn = document.getElementById('clear-today-btn');
  if (todayLogs.length) {
    todayEl.innerHTML = todayLogs.map(l => renderLogRow(l)).join('');
    clearTodayBtn?.classList.remove('hidden');
  } else {
    todayEl.innerHTML = `<p class="text-gray-400 text-sm text-center py-4 flex items-center justify-center gap-2">${icon('flame', 16, 'text-orange-400')} No workout yet today — let's go!</p>`;
    clearTodayBtn?.classList.add('hidden');
  }

  // Today's workout preview
  renderWorkoutPreview();
}

function renderHeader(profile, streak) {
  renderBranding(profile);
  const journey = document.getElementById('header-journey');
  if (journey) journey.textContent = `${profile.currentWeight} → ${profile.targetWeight} kg`;
  const streakEl = document.getElementById('dash-streak');
  if (streakEl) streakEl.textContent = streak;
}

function renderBranding(profile) {
  const name = profile.name || 'Fahad';
  const brand = `${name}Fit`;
  document.title = brand;
  const brandEl = document.getElementById('app-brand');
  if (brandEl) brandEl.textContent = brand;
  const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (meta) meta.content = brand;
}

function renderDashboardQuickStart(workout) {
  const nameEl = document.getElementById('dash-today-workout');
  const metaEl = document.getElementById('dash-today-meta');
  const iconEl = document.getElementById('dash-quick-icon');
  if (!nameEl || !workout) return;
  nameEl.textContent = workout.name;
  if (metaEl) metaEl.textContent = `${workout.totalMinutes} min · ${workout.exerciseCount} exercises · ${workout.monthPhase}`;
  if (iconEl) iconEl.innerHTML = icon(workout.icon, 24);
}

function renderWorkoutPreview() {
  const prevWeek = data.workoutPlanWeek;
  const prevVersion = data.workoutPlanVersion;
  ensureWeekPlan(data, data.profile.startDate, data.logs);
  if (data.workoutPlanWeek !== prevWeek || data.workoutPlanVersion !== prevVersion) saveData(data);
  const plan = data.workoutPlan;
  const today = localDate();
  const week = getWeekNumber(data.profile.startDate, today);
  const workout = getTodaysWorkout(week, data.profile.startDate, data.logs, today, plan);

  renderDashboardQuickStart(workout);
  preloadWorkoutBlocks(workout.blocks);

  document.getElementById('preview-name').textContent = workout.name;
  setIcon(document.getElementById('preview-icon'), workout.icon, 40);
  document.getElementById('preview-tagline').textContent = workout.tagline;
  document.getElementById('preview-duration').textContent = `${workout.totalMinutes} min`;
  document.getElementById('preview-exercises').textContent = `${workout.exerciseCount} exercises`;
  document.getElementById('preview-focus').textContent = workout.focus;
  document.getElementById('preview-week').textContent = `Day ${workout.dayNumber} · Week ${week} · ${workout.monthPhase}`;

  const accent = document.getElementById('preview-accent');
  if (accent) {
    accent.className = `workout-hero-accent ${workout.accent || 'accent-orange'}`;
  }

  const monthBadge = document.getElementById('month-phase-badge');
  if (monthBadge) {
    monthBadge.textContent = `Month ${workout.monthNumber} · ${workout.monthPhase}`;
  }

  const weekEl = document.getElementById('week-preview');
  if (weekEl) {
    const preview = getWeekPreview(data.profile.startDate, data.logs, plan);
    weekEl.innerHTML = preview.map(p => `
      <button type="button"
        class="week-preview-card rounded-xl text-left ${p.isToday ? 'today' : ''}"
        data-swap-date="${p.date}"
        ${p.isToday ? 'disabled' : ''}
        aria-label="${p.isToday ? 'Today' : `Swap with ${p.dayLabel}`}">
        <p class="day-label ${p.isToday ? 'text-lime-400' : 'text-muted'}">${p.dayLabel}</p>
        <div class="my-2 text-pink-400">${icon(p.icon, 22)}</div>
        <p class="workout-name">${p.name}</p>
        <p class="workout-meta">${p.minutes} min · Tier ${p.tier || 1}</p>
        ${!p.isToday ? '<p class="text-[10px] text-cyan-400/80 mt-1.5">Tap to swap</p>' : ''}
      </button>
    `).join('');

    weekEl.querySelectorAll('[data-swap-date]').forEach(btn => {
      btn.addEventListener('click', () => handleWorkoutSwap(btn.dataset.swapDate));
    });
  }
}

function handleWorkoutSwap(targetDate) {
  const today = localDate();
  if (!targetDate || targetDate === today) return;

  const plan = ensureWeekPlan(data, data.profile.startDate, data.logs);
  const todayWorkout = getTodaysWorkout(
    getWeekNumber(data.profile.startDate, today),
    data.profile.startDate,
    data.logs,
    today,
    plan
  );
  const targetWorkout = getTodaysWorkout(
    getWeekNumber(data.profile.startDate, targetDate),
    data.profile.startDate,
    data.logs,
    targetDate,
    plan
  );

  if (!confirm(`Swap today's "${todayWorkout.name}" with ${targetDate}'s "${targetWorkout.name}"?`)) return;

  const result = swapWorkoutDays(data, data.profile.startDate, data.logs, today, targetDate);
  if (!result.ok) {
    showToast(result.message || 'Could not swap', 'warning');
    return;
  }

  saveData(data);
  showToast(`Swapped! Today is now ${targetWorkout.name}`, 'success');
  renderWorkoutPreview();
}

function getGreeting() {
  const h = new Date().getHours();
  const iconName = h < 12 ? 'sun' : h < 17 ? 'zap' : 'moon';
  const name = escapeHtml(data.profile.name || 'Fahad');
  const text = h < 12 ? `Good morning, ${name}` : h < 17 ? `Good afternoon, ${name}` : `Good evening, ${name}`;
  return `${text} ${icon(iconName, 18, 'inline ml-1 text-yellow-400')}`;
}

function setCycleStartLabel(mode) {
  const btn = document.getElementById('cycle-start');
  if (!btn) return;
  const map = {
    start: { icon: 'play', label: 'Start Ride', disabled: false },
    running: { icon: 'pause', label: 'Running...', disabled: true },
    resume: { icon: 'play', label: 'Resume', disabled: false },
  };
  const cfg = map[mode] || map.start;
  btn.innerHTML = `${icon(cfg.icon, 16)}<span class="cycle-start-label">${cfg.label}</span>`;
  btn.disabled = cfg.disabled;
}

// ─── Cycle Tracker ─────────────────────────────────────────
function setupCycleTracker() {
  const startBtn = document.getElementById('cycle-start');
  const pauseBtn = document.getElementById('cycle-pause');
  const resetBtn = document.getElementById('cycle-reset');
  const saveBtn = document.getElementById('cycle-save');
  const manualInput = document.getElementById('cycle-manual-min');
  const intensitySelect = document.getElementById('cycle-intensity');

  intensitySelect.value = data.settings.cycleIntensity || 'moderate';
  intensitySelect.addEventListener('change', () => {
    data.settings.cycleIntensity = intensitySelect.value;
    saveData(data);
    updateCycleEstimate();
  });

  manualInput.addEventListener('input', updateCycleEstimate);

  startBtn.addEventListener('click', () => {
    if (!cycleRunning) {
      cycleRunning = true;
      clearBackgroundPauseHints();
      cycleTimer = setInterval(() => {
        cycleSeconds++;
        updateCycleDisplay();
        updateCycleEstimate();
      }, 1000);
      setCycleStartLabel('running');
      pauseBtn.disabled = false;
    }
  });

  pauseBtn.addEventListener('click', () => {
    cycleRunning = false;
    clearInterval(cycleTimer);
    clearBackgroundPauseHints();
    setCycleStartLabel('resume');
  });

  resetBtn.addEventListener('click', () => {
    cycleRunning = false;
    clearInterval(cycleTimer);
    cycleSeconds = 0;
    setCycleStartLabel('start');
    pauseBtn.disabled = true;
    updateCycleDisplay();
    updateCycleEstimate();
  });

  saveBtn.addEventListener('click', saveCycleSession);

  // Quick time buttons
  document.querySelectorAll('[data-cycle-min]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.cycleMin);
      manualInput.value = mins;
      cycleSeconds = mins * 60;
      updateCycleDisplay();
      updateCycleEstimate();
    });
  });

  updateCycleDisplay();
  updateCycleEstimate();
}

function updateCycleDisplay() {
  const mins = Math.floor(cycleSeconds / 60);
  const secs = cycleSeconds % 60;
  document.getElementById('cycle-timer').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateCycleEstimate() {
  const mins = cycleSeconds > 0
    ? Math.ceil(cycleSeconds / 60)
    : parseInt(document.getElementById('cycle-manual-min').value) || 0;
  const intensity = document.getElementById('cycle-intensity').value;
  const calories = calcCycleCalories(intensity, data.profile.currentWeight, mins);

  const intensityLabels = {
    light: 'Easy Pace',
    moderate: 'Steady Effort',
    vigorous: 'Hard Push',
    intense: 'Beast Mode',
  };

  document.getElementById('cycle-est-calories').textContent = calories;
  document.getElementById('cycle-est-minutes').textContent = mins;
  document.getElementById('cycle-est-intensity').textContent = intensityLabels[intensity];

  // Distance estimate (avg 18 km/h moderate)
  const speedMap = { light: 12, moderate: 18, vigorous: 24, intense: 30 };
  const distance = ((speedMap[intensity] || 18) * (mins / 60)).toFixed(1);
  document.getElementById('cycle-est-distance').textContent = distance;

  // Fat burn estimate (~60% of calories from fat at moderate)
  const fatBurn = Math.round(calories * 0.55);
  document.getElementById('cycle-est-fat').textContent = fatBurn;

  const weightEl = document.getElementById('cycle-base-weight');
  if (weightEl) weightEl.textContent = data.profile.currentWeight;
}

function saveCycleSession() {
  const mins = cycleSeconds > 0
    ? Math.ceil(cycleSeconds / 60)
    : parseInt(document.getElementById('cycle-manual-min').value) || 0;

  if (mins < 1) {
    showToast('Ride for at least 1 minute!', 'warning');
    return;
  }

  const intensity = document.getElementById('cycle-intensity').value;
  const calories = calcCycleCalories(intensity, data.profile.currentWeight, mins);

  addLog(data, {
    type: 'cycle',
    duration: mins,
    calories,
    intensity,
    notes: `${intensity} intensity cycle session`,
  });

  showToast(`${calories} kcal burned! Great ride, ${profileName()}!`, 'success');

  cycleSeconds = 0;
  cycleRunning = false;
  clearInterval(cycleTimer);
  setCycleStartLabel('start');
  document.getElementById('cycle-pause').disabled = true;
  updateCycleDisplay();
  updateCycleEstimate();
  renderDashboard();
}

function setupGlobalTapSounds() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, [data-tab], [data-swap-date], [data-cycle-min]');
    if (!btn || btn.disabled) return;
    if (btn.id === 'toggle-sfx' || btn.id === 'toggle-coach') return;
    unlockAudio();
    playTap();
  }, { passive: true });
}

function setupBackgroundPause() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') {
      if (pausedByBackground) {
        showToast('Timers paused while you were away — tap Resume to continue', 'info');
        pausedByBackground = false;
      }
      return;
    }

    if (cycleRunning) {
      cycleRunning = false;
      clearInterval(cycleTimer);
      pausedByBackground = true;
      setCycleStartLabel('resume');
      document.getElementById('cycle-bg-pause-hint')?.classList.remove('hidden');
    }

    if (workoutState && !workoutState.paused) {
      workoutState.paused = true;
      pausedByBackground = true;
      const btn = document.getElementById('workout-pause-btn');
      if (btn) btn.innerHTML = `${icon('play', 16)} Resume`;
      if (window.speechSynthesis) speechSynthesis.cancel();
      showCoachText('Paused — app went to background.');
    }
  });
}

function clearBackgroundPauseHints() {
  document.getElementById('cycle-bg-pause-hint')?.classList.add('hidden');
}

function setupAudioToggles() {
  updateAudioToggleUI();
  document.getElementById('toggle-sfx')?.addEventListener('click', () => {
    data.settings.soundFx = !data.settings.soundFx;
    setSoundFx(data.settings.soundFx);
    saveData(data);
    playToggle();
    updateAudioToggleUI();
  });
  document.getElementById('toggle-coach')?.addEventListener('click', () => {
    data.settings.coachVoice = !data.settings.coachVoice;
    setCoachVoice(data.settings.coachVoice);
    saveData(data);
    playToggle();
    updateAudioToggleUI();
    const msg = data.settings.coachVoice ? 'Coach Maya is on' : 'Coach muted';
    if (!document.getElementById('workout-player')?.classList.contains('hidden')) {
      showCoachText(msg);
    } else {
      showToast(msg, 'info');
    }
  });
}

function updateAudioToggleUI() {
  const sfxBtn = document.getElementById('toggle-sfx');
  const coachBtn = document.getElementById('toggle-coach');
  const sfxOn = data.settings.soundFx !== false;
  const coachOn = data.settings.coachVoice !== false;
  if (sfxBtn) {
    sfxBtn.classList.toggle('active', sfxOn);
    sfxBtn.title = sfxOn ? 'Sound FX on' : 'Sound FX off';
    sfxBtn.setAttribute('aria-label', sfxOn ? 'Turn sound FX off' : 'Turn sound FX on');
  }
  if (coachBtn) {
    coachBtn.classList.toggle('active', coachOn);
    coachBtn.title = coachOn ? 'Coach on' : 'Coach off';
    coachBtn.setAttribute('aria-label', coachOn ? 'Turn coach off' : 'Turn coach on');
  }
}

// ─── Workout Player ────────────────────────────────────────
function setupWorkoutPlayer() {
  document.getElementById('workout-start-btn').addEventListener('click', startWorkout);
  document.getElementById('workout-skip-btn').addEventListener('click', skipExercise);
  document.getElementById('workout-previous-btn').addEventListener('click', goPreviousWorkout);
  document.getElementById('workout-pause-btn').addEventListener('click', toggleWorkoutPause);
  document.getElementById('workout-quit-btn').addEventListener('click', quitWorkout);
  document.getElementById('workout-done-btn').addEventListener('click', resetWorkoutView);
  document.getElementById('rest-add-15')?.addEventListener('click', () => addRestTime(15));
  document.getElementById('rest-add-30')?.addEventListener('click', () => addRestTime(30));
}

function resetWorkoutPauseButton() {
  const btn = document.getElementById('workout-pause-btn');
  if (btn) btn.innerHTML = `${icon('pause', 16)} Pause`;
}

function startWorkout() {
  unlockAudio();
  ensureWeekPlan(data, data.profile.startDate, data.logs);
  const today = localDate();
  const week = getWeekNumber(data.profile.startDate, today);
  const workout = getTodaysWorkout(week, data.profile.startDate, data.logs, today, data.workoutPlan);

  resetCoachTimer();
  lastCountdownSpoken = -1;
  resetWorkoutPauseButton();
  preloadWorkoutBlocks(workout.blocks);

  workoutState = {
    workout,
    currentIndex: 0,
    phase: 'work',
    timeLeft: workout.blocks[0].durationSec,
    totalElapsed: 0,
    paused: false,
    completed: [],
    halfwayCoached: false,
    almostDoneCoached: false,
    undo: null,
  };

  document.getElementById('workout-preview').classList.add('hidden');
  document.getElementById('workout-player').classList.remove('hidden');
  document.getElementById('workout-complete').classList.add('hidden');

  playWorkStart();
  const startLine = coachWorkoutStart(workout);
  showCoachText(startLine || `Let's go ${profileName()}!`);

  renderWorkoutExercise(true);
  updatePreviousButton();
  startWorkoutTimer();
}

function startWorkoutTimer() {
  clearInterval(workoutTimer);
  workoutTimer = setInterval(() => {
    if (workoutState.paused) return;

    workoutState.timeLeft--;
    workoutState.totalElapsed++;

    if (workoutState.timeLeft <= 0) {
      advanceWorkoutPhase();
    }

    updateWorkoutUI();
  }, 1000);
}

function advanceWorkoutPhase() {
  const block = workoutState.workout.blocks[workoutState.currentIndex];

  if (workoutState.phase === 'work') {
    workoutState.completed.push({ ...block, completed: true });
    if (block.restSec > 0) {
      workoutState.phase = 'rest';
      workoutState.timeLeft = block.restSec;
      lastCountdownSpoken = -1;
      playRestStart();
      const restLine = coachRest();
      showCoachText(restLine || 'Rest and breathe.');
      renderWorkoutExercise(false);
    } else {
      nextExercise();
    }
  } else {
    playGo();
    nextExercise(true);
  }
}

function nextExercise(clearUndo = true) {
  if (clearUndo) workoutState.undo = null;
  workoutState.currentIndex++;
  if (workoutState.currentIndex >= workoutState.workout.blocks.length) {
    finishWorkout();
    return;
  }
  workoutState.phase = 'work';
  workoutState.timeLeft = workoutState.workout.blocks[workoutState.currentIndex].durationSec;
  lastCountdownSpoken = -1;
  playWorkStart();
  renderWorkoutExercise(true);
}

function addRestTime(seconds) {
  if (!workoutState || workoutState.phase !== 'rest') return;
  workoutState.timeLeft += seconds;
  playTap();
  showCoachText(`+${seconds} seconds. Take your time ${profileName()}.`);
  updateWorkoutUI();
}

function getLiveWorkoutCalories() {
  if (!workoutState) return 0;
  const blocks = workoutState.completed.map(b => ({
    category: b.category,
    durationSec: b.durationSec,
  }));
  if (workoutState.phase === 'work') {
    const block = workoutState.workout.blocks[workoutState.currentIndex];
    const elapsed = Math.max(0, block.durationSec - workoutState.timeLeft);
    if (elapsed > 0) {
      blocks.push({ category: block.category, durationSec: elapsed });
    }
  }
  return calcWorkoutCalories(blocks, data.profile.currentWeight);
}

function pushUndo() {
  if (!workoutState) return;
  workoutState.undo = {
    currentIndex: workoutState.currentIndex,
    phase: workoutState.phase,
    timeLeft: workoutState.timeLeft,
    completedLen: workoutState.completed.length,
  };
}

function goPreviousWorkout() {
  if (!workoutState) return;

  if (workoutState.undo) {
    const u = workoutState.undo;
    workoutState.currentIndex = u.currentIndex;
    workoutState.phase = u.phase;
    workoutState.timeLeft = u.timeLeft;
    workoutState.completed = workoutState.completed.slice(0, u.completedLen);
    workoutState.undo = null;
  } else if (workoutState.phase === 'rest') {
    const block = workoutState.workout.blocks[workoutState.currentIndex];
    workoutState.phase = 'work';
    workoutState.timeLeft = block.durationSec;
    workoutState.undo = null;
    if (workoutState.completed.length > 0) {
      const last = workoutState.completed[workoutState.completed.length - 1];
      if (last.exerciseId === block.exerciseId) workoutState.completed.pop();
    }
  } else if (workoutState.currentIndex > 0) {
    workoutState.currentIndex--;
    workoutState.phase = 'work';
    workoutState.timeLeft = workoutState.workout.blocks[workoutState.currentIndex].durationSec;
    workoutState.undo = null;
  } else {
    return;
  }

  lastCountdownSpoken = -1;
  playTap();
  showCoachText(`Back to your exercise. You got this ${profileName()}.`);
  renderWorkoutExercise(true);
  updateWorkoutUI();
}

function updatePreviousButton() {
  const btn = document.getElementById('workout-previous-btn');
  if (!btn || !workoutState) return;
  const can = !!workoutState.undo
    || workoutState.phase === 'rest'
    || workoutState.currentIndex > 0;
  btn.classList.toggle('hidden', !can);
}

function skipExercise() {
  pushUndo();
  if (workoutState.phase === 'work') {
    workoutState.phase = 'rest';
    workoutState.timeLeft = workoutState.workout.blocks[workoutState.currentIndex].restSec || 5;
    lastCountdownSpoken = -1;
    playRestStart();
    showCoachText('Skipping to rest.');
    renderWorkoutExercise(false);
  } else {
    nextExercise(false);
  }
  updateWorkoutUI();
  updatePreviousButton();
}

function toggleWorkoutPause() {
  workoutState.paused = !workoutState.paused;
  playToggle();
  clearBackgroundPauseHints();
  const btn = document.getElementById('workout-pause-btn');
  btn.innerHTML = workoutState.paused
    ? `${icon('play', 16)} Resume`
    : `${icon('pause', 16)} Pause`;
  if (workoutState.paused) {
    showCoachText('Paused. Tap resume when ready.');
    if (window.speechSynthesis) speechSynthesis.cancel();
  } else {
    showCoachText('Back at it! Let\'s go.');
  }
}

function quitWorkout() {
  if (!confirm('Quit workout? Progress won\'t be saved.')) return;
  clearInterval(workoutTimer);
  workoutState = null;
  if (window.speechSynthesis) speechSynthesis.cancel();
  resetWorkoutPauseButton();
  document.getElementById('workout-preview').classList.remove('hidden');
  document.getElementById('workout-player').classList.add('hidden');
  document.getElementById('workout-complete').classList.add('hidden');
}

function renderWorkoutExercise(announce = false) {
  const block = workoutState.workout.blocks[workoutState.currentIndex];
  const total = workoutState.workout.blocks.length;
  const current = workoutState.currentIndex + 1;
  const isRest = workoutState.phase === 'rest';

  document.getElementById('wp-progress').textContent = `${current} / ${total}`;
  const pct = (current / total) * 100;
  document.getElementById('wp-progress-bar').style.width = `${pct}%`;

  const phaseEl = document.getElementById('wp-phase');
  if (isRest) {
    document.getElementById('wp-next').textContent = '';
  } else {
    phaseEl.textContent = 'GO!';
    phaseEl.className = 'text-sm font-bold uppercase tracking-widest text-lime-400';
    document.getElementById('wp-next').textContent = '';

    if (announce) {
      const line = coachExercise(block.name, block.tips, block.muscles);
      showCoachText(line || `Next: ${block.name}`, { exerciseName: block.name });
    }

    document.getElementById('wp-name').textContent = block.name;
    document.getElementById('wp-muscles').textContent = block.muscles || '';
    document.getElementById('wp-tips').textContent = block.tips || '';

    const mediaEl = document.getElementById('wp-media');
    mountExerciseMedia(mediaEl, block.exerciseId, block.name);

    const nextBlock = workoutState.workout.blocks[workoutState.currentIndex + 1];
    if (nextBlock?.exerciseId) preloadMedia(nextBlock.exerciseId);
  }

  document.getElementById('wp-exercise-card')?.classList.toggle('hidden', isRest);
  document.getElementById('wp-rest-card')?.classList.toggle('hidden', !isRest);
  document.getElementById('wp-phase-timer-block')?.classList.toggle('hidden', isRest);
  document.getElementById('wp-rest-controls')?.classList.toggle('hidden', !isRest);

  if (isRest) {
    document.getElementById('wp-media').innerHTML = '';
    updateRestPanel();
  }

  updatePreviousButton();
}

const REST_RING_C = 326.73;

function updateRestPanel() {
  if (!workoutState || workoutState.phase !== 'rest') return;

  const block = workoutState.workout.blocks[workoutState.currentIndex];
  const totalRest = Math.max(1, block.restSec || 1);
  const elapsed = totalRest - workoutState.timeLeft;
  const breathIn = Math.floor(elapsed / 4) % 2 === 0;

  const restCard = document.getElementById('wp-rest-card');
  restCard?.classList.toggle('breath-in', breathIn);
  restCard?.classList.toggle('breath-out', !breathIn);

  const cueEl = document.getElementById('wp-breath-cue');
  if (cueEl) cueEl.textContent = breathIn ? 'Inhale slowly' : 'Exhale slowly';

  const timerInner = document.getElementById('wp-rest-timer-inner');
  if (timerInner) timerInner.textContent = formatDuration(Math.max(0, workoutState.timeLeft));

  const doneEl = document.getElementById('wp-rest-done');
  if (doneEl) doneEl.textContent = `${block.name} — done`;

  const nextBlock = workoutState.workout.blocks[workoutState.currentIndex + 1];
  const nextName = document.getElementById('wp-rest-next-name');
  const nextMuscles = document.getElementById('wp-rest-next-muscles');
  if (nextName) nextName.textContent = nextBlock?.name || 'Finish strong!';
  if (nextMuscles) nextMuscles.textContent = nextBlock?.muscles || '';

  const ring = document.getElementById('wp-rest-ring');
  if (ring) {
    ring.style.strokeDashoffset = `${REST_RING_C * (1 - workoutState.timeLeft / totalRest)}`;
  }
}

function updateWorkoutUI() {
  const isRest = workoutState.phase === 'rest';

  if (!isRest) {
    document.getElementById('wp-timer').textContent = formatDuration(Math.max(0, workoutState.timeLeft));
  }

  const totalBlocks = workoutState.workout.blocks.length;
  const overallPct = ((workoutState.currentIndex + (1 - workoutState.timeLeft /
    (workoutState.phase === 'work'
      ? workoutState.workout.blocks[workoutState.currentIndex].durationSec
      : workoutState.workout.blocks[workoutState.currentIndex].restSec || 1)
  )) / totalBlocks) * 100;

  document.getElementById('wp-overall-bar').style.width = `${Math.min(100, overallPct)}%`;
  document.getElementById('wp-elapsed').textContent = formatDuration(workoutState.totalElapsed);

  if (isRest) {
    updateRestPanel();
  } else {
    const block = workoutState.workout.blocks[workoutState.currentIndex];
    document.getElementById('wp-phase').textContent = 'GO!';
    document.getElementById('wp-name').textContent = block.name;
  }

  document.getElementById('wp-phase-timer-block')?.classList.toggle('hidden', isRest);
  document.getElementById('wp-rest-controls')?.classList.toggle('hidden', !isRest);
  updatePreviousButton();

  const liveCal = document.getElementById('wp-live-cal');
  const doneCount = document.getElementById('wp-done-count');
  if (liveCal) liveCal.textContent = getLiveWorkoutCalories();
  if (doneCount) doneCount.textContent = workoutState.completed.length;

  const tLeft = workoutState.timeLeft;
  if (tLeft <= 3 && tLeft >= 1 && tLeft !== lastCountdownSpoken) {
    lastCountdownSpoken = tLeft;
    playCountdownTick(tLeft);
    const cdLine = coachCountdown(tLeft, workoutState.phase);
    if (cdLine) showCoachText(cdLine);
  }

  if (overallPct >= 48 && overallPct <= 52 && !workoutState.halfwayCoached) {
    workoutState.halfwayCoached = true;
    const hw = coachHalfway();
    showCoachText(hw || `Halfway! Keep pushing ${profileName()}.`);
  }

  const remaining = totalBlocks - workoutState.currentIndex;
  if (remaining <= 3 && !workoutState.almostDoneCoached && workoutState.phase === 'work') {
    workoutState.almostDoneCoached = true;
    const ad = coachAlmostDone();
    showCoachText(ad || `Final push ${profileName()}!`);
  }

  if (workoutState.phase === 'work' && !workoutState.paused) {
    coachMotivate();
  }
}

function finishWorkout() {
  clearInterval(workoutTimer);

  const calories = getLiveWorkoutCalories();
  const workSec = workoutState.completed.reduce((s, b) => s + (b.durationSec || 0), 0);
  const totalMin = Math.max(1, Math.round(workSec / 60));

  addLog(data, {
    type: 'workout',
    duration: totalMin,
    calories,
    workoutName: workoutState.workout.name,
    exercises: workoutState.completed.length,
    notes: `${workoutState.workout.name} — Week ${workoutState.workout.weekNumber}`,
  });

  const finishedWorkout = workoutState.workout;
  const finishLine = coachFinish(finishedWorkout);

  document.getElementById('workout-player').classList.add('hidden');
  document.getElementById('workout-complete').classList.remove('hidden');
  document.getElementById('wc-calories').textContent = calories;
  document.getElementById('wc-duration').textContent = totalMin;
  document.getElementById('wc-exercises').textContent = workoutState.completed.length;
  document.getElementById('wc-subtitle').textContent =
    `Another step closer to ${data.profile.targetWeight}kg, ${profileName()}!`;
  document.getElementById('wc-coach-msg').textContent = finishLine || 'Crushed it!';

  playComplete();
  showToast('Workout complete! You crushed it!', 'success');
  workoutState = null;
  renderDashboard();
}

function resetWorkoutView() {
  resetWorkoutPauseButton();
  document.getElementById('workout-preview').classList.remove('hidden');
  document.getElementById('workout-player').classList.add('hidden');
  document.getElementById('workout-complete').classList.add('hidden');
  renderWorkoutPreview();
}

// ─── Settings ────────────────────────────────────────────────
function renderSettings() {
  const p = data.profile;
  const nameEl = document.getElementById('settings-name');
  if (!nameEl) return;
  nameEl.value = p.name || '';
  document.getElementById('settings-start-weight').value = p.startWeight ?? '';
  document.getElementById('settings-target-weight').value = p.targetWeight ?? '';
  document.getElementById('settings-height').value = p.heightCm ?? '';
  document.getElementById('settings-start-date').value = p.startDate || '';

  const weightEl = document.getElementById('settings-current-weight');
  if (weightEl && document.activeElement !== weightEl) {
    weightEl.value = p.currentWeight ?? '';
  }

  const summary = document.getElementById('settings-summary');
  if (summary) {
    const lost = Math.round((p.startWeight - p.currentWeight) * 10) / 10;
    const remaining = Math.max(0, Math.round((p.currentWeight - p.targetWeight) * 10) / 10);
    summary.innerHTML = `
      <p class="settings-summary-line"><span>Journey</span><strong>${escapeHtml(p.startWeight)} → ${escapeHtml(p.targetWeight)} kg</strong></p>
      <p class="settings-summary-line"><span>Current</span><strong>${escapeHtml(p.currentWeight)} kg</strong></p>
      <p class="settings-summary-line"><span>Progress</span><strong>${lost > 0 ? `${escapeHtml(lost)} kg lost` : 'Just started'} · ${escapeHtml(remaining)} kg to go</strong></p>
    `;
  }
}

function setupSettings() {
  renderSettings();

  document.getElementById('settings-save-btn')?.addEventListener('click', () => {
    const name = document.getElementById('settings-name').value.trim();
    const startWeight = parseFloat(document.getElementById('settings-start-weight').value);
    const targetWeight = parseFloat(document.getElementById('settings-target-weight').value);
    const heightCm = parseFloat(document.getElementById('settings-height').value);
    const startDate = document.getElementById('settings-start-date').value;

    const currentWeight = parseFloat(document.getElementById('settings-current-weight')?.value);

    if (!name) { showToast('Enter your name', 'error'); return; }
    if (!(currentWeight > 40 && currentWeight < 200)) { showToast('Enter a valid current weight', 'error'); return; }
    if (!(startWeight > 40 && startWeight < 200)) { showToast('Enter a valid start weight', 'error'); return; }
    if (!(targetWeight > 40 && targetWeight < 200)) { showToast('Enter a valid target weight', 'error'); return; }
    if (targetWeight >= startWeight) { showToast('Target should be below start weight', 'error'); return; }
    if (!(heightCm > 120 && heightCm < 230)) { showToast('Enter a valid height (cm)', 'error'); return; }
    if (!startDate) { showToast('Pick a journey start date', 'error'); return; }

    updateProfile(data, { name, startWeight, targetWeight, heightCm, startDate });
    updateWeight(data, currentWeight);

    syncCoachProfile();
    initAudio(data.settings);
    renderAll();
    if (activeTab === 'history') renderWeightChart();
    showToast('Profile saved', 'success');
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

function renderWeightChart() {
  const history = data.weightHistory.slice(-30);
  const chart = document.getElementById('weight-chart');
  if (!chart || history.length < 2) {
    if (chart) chart.innerHTML = '<p class="text-gray-500 text-sm text-center py-8">Log weight for 2+ days to see chart</p>';
    return;
  }

  const weights = history.map(h => h.weight);
  const min = Math.min(...weights) - 2;
  const max = Math.max(...weights) + 2;
  const range = max - min || 1;
  const w = chart.clientWidth || 300;
  const h = 120;

  const points = history.map((entry, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = h - ((entry.weight - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  const targetY = h - ((data.profile.targetWeight - min) / range) * h;

  chart.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="w-full" style="height:${h}px">
      <line x1="0" y1="${targetY}" x2="${w}" y2="${targetY}" stroke="#b8ff0033" stroke-dasharray="4" stroke-width="1"/>
      <polyline points="${points}" fill="none" stroke="url(#grad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff2d95"/>
          <stop offset="100%" stop-color="#00f5ff"/>
        </linearGradient>
      </defs>
    </svg>
    <div class="flex justify-between text-xs text-gray-500 mt-1">
      <span>${history[0].date.slice(5)}</span>
      <span class="text-lime-400">Target: ${data.profile.targetWeight}kg</span>
      <span>${history[history.length-1].date.slice(5)}</span>
    </div>
  `;
}

// ─── History & Calendar ─────────────────────────────────────
function setupCalendar() {
  renderCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
}

function renderCalendar(year, month) {
  const cal = document.getElementById('calendar-grid');
  const label = document.getElementById('calendar-month');
  if (!cal) return;

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  label.textContent = `${monthNames[month - 1]} ${year}`;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthLogs = data.logs.filter(l => l.date.startsWith(`${year}-${String(month).padStart(2,'0')}`));
  const logDates = {};
  monthLogs.forEach(l => {
    if (!logDates[l.date]) logDates[l.date] = [];
    logDates[l.date].push(l);
  });

  let html = '';
  const dayLabels = ['S','M','T','W','T','F','S'];
  dayLabels.forEach(d => {
    html += `<div class="text-center text-xs text-gray-500 font-medium py-1">${d}</div>`;
  });

  for (let i = 0; i < firstDay; i++) {
    html += `<div></div>`;
  }

  const today = localDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const logs = logDates[dateStr];
    const isToday = dateStr === today;

    let bg = 'bg-white/5';
    let dot = '';
    if (logs) {
      const hasCycle = logs.some(l => l.type === 'cycle');
      const hasWorkout = logs.some(l => l.type === 'workout');
      if (hasCycle && hasWorkout) bg = 'bg-gradient-to-br from-cyan-500/30 to-pink-500/30';
      else if (hasCycle) bg = 'bg-cyan-500/20';
      else if (hasWorkout) bg = 'bg-pink-500/20';
      dot = `<span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${hasCycle ? 'bg-cyan-400' : 'bg-pink-400'}"></span>`;
    }

    html += `
      <div class="relative aspect-square flex items-center justify-center rounded-lg ${bg} ${isToday ? 'ring-2 ring-lime-400' : ''} text-sm cursor-pointer hover:bg-white/10 transition"
           data-date="${dateStr}" onclick="window.showDayDetail('${dateStr}')">
        ${day}${dot}
      </div>`;
  }

  cal.innerHTML = html;
}

window.showDayDetail = function(dateStr) {
  const logs = data.logs.filter(l => l.date === dateStr);
  const detail = document.getElementById('day-detail');
  if (!detail) return;

  if (!logs.length) {
    detail.innerHTML = `<p class="text-gray-400 text-sm">${dateStr}: Rest day</p>`;
    return;
  }

  detail.innerHTML = logs.map(l => `
    <div class="glass rounded-xl p-3 mb-2 fade-in">
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-white flex items-center gap-2">${icon(l.type === 'cycle' ? 'bike' : 'dumbbell', 16)} ${l.type === 'cycle' ? 'Cycle' : escapeHtml(l.workoutName || 'Workout')}</p>
          <p class="text-xs text-gray-400 mt-1">${l.duration} min · ${l.calories} kcal burned</p>
          ${l.intensity ? `<p class="text-xs text-cyan-400">${escapeHtml(l.intensity)} intensity</p>` : ''}
        </div>
        <div class="flex flex-col items-end gap-2 flex-shrink-0">
          <span class="text-xs text-gray-500">${new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
          <button onclick="window.deleteSession('${l.id}')" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg" aria-label="Delete session">${icon('trash', 14)}</button>
        </div>
      </div>
    </div>
  `).join('');
};

function renderHistory() {
  renderCalendar(new Date().getFullYear(), new Date().getMonth() + 1);
  renderWeightChart();

  const list = document.getElementById('history-list');
  const recent = data.logs.slice(0, 20);

  if (!recent.length) {
    list.innerHTML = '<p class="text-gray-400 text-center py-8">No sessions yet. Start your journey!</p>';
    return;
  }

  list.innerHTML = recent.map(l => `
    <div class="glass rounded-xl p-4 fade-in">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center ${l.type === 'cycle' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-pink-500/20 text-pink-400'}">
          ${icon(l.type === 'cycle' ? 'bike' : 'dumbbell', 20)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-white">${l.type === 'cycle' ? 'Stationary Cycle' : escapeHtml(l.workoutName || 'Home Workout')}</p>
          <p class="text-xs text-gray-400">${l.date} · ${l.duration} min · ${l.calories} kcal</p>
        </div>
        <div class="text-right flex items-center gap-2 flex-shrink-0">
          <div>
            <p class="text-sm font-bold text-lime-400">${l.calories}</p>
            <p class="text-xs text-gray-500">kcal</p>
          </div>
          <button onclick="window.deleteSession('${l.id}')" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" aria-label="Delete session">${icon('trash', 16)}</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Calendar navigation
document.getElementById('cal-prev')?.addEventListener('click', () => {
  window._calMonth = (window._calMonth || new Date().getMonth() + 1) - 1;
  window._calYear = window._calYear || new Date().getFullYear();
  if (window._calMonth < 1) { window._calMonth = 12; window._calYear--; }
  renderCalendar(window._calYear, window._calMonth);
});

document.getElementById('cal-next')?.addEventListener('click', () => {
  window._calMonth = (window._calMonth || new Date().getMonth() + 1) + 1;
  window._calYear = window._calYear || new Date().getFullYear();
  if (window._calMonth > 12) { window._calMonth = 1; window._calYear++; }
  renderCalendar(window._calYear, window._calMonth);
});

// ─── Data Management ─────────────────────────────────────────
function setupDataManagement() {
  document.getElementById('export-btn')?.addEventListener('click', () => {
    exportJSON(data);
    showToast('Data exported!', 'success');
  });

  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      data = await importJSON(file);
      syncCoachProfile();
      initAudio(data.settings);
      setSoundFx(data.settings.soundFx !== false);
      setCoachVoice(data.settings.coachVoice !== false);
      showToast('Data imported successfully!', 'success');
      renderAll();
    } catch {
      showToast('Invalid JSON file', 'error');
    }
    e.target.value = '';
  });

  document.getElementById('clear-btn')?.addEventListener('click', () => {
    if (confirm('Delete ALL data? This cannot be undone.')) {
      data = clearAllData();
      syncCoachProfile();
      initAudio(data.settings);
      setSoundFx(true);
      setCoachVoice(true);
      showToast('All data cleared', 'warning');
      renderAll();
    }
  });
}

// ─── Log Deletion ────────────────────────────────────────────
function renderLogRow(l) {
  const label = escapeHtml(l.type === 'cycle' ? 'Cycle Session' : (l.workoutName || 'Home Workout'));
  return `
    <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-2">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="text-neon-cyan flex-shrink-0">${icon(l.type === 'cycle' ? 'bike' : 'dumbbell', 18)}</span>
        <div class="min-w-0">
          <p class="text-sm font-medium text-white truncate">${label}</p>
          <p class="text-xs text-gray-400">${l.duration} min · ${l.calories} kcal</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-xs text-green-400 flex items-center gap-1">${icon('check', 14)} Done</span>
        <button onclick="window.deleteSession('${l.id}')" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg" aria-label="Delete session">${icon('trash', 14)}</button>
      </div>
    </div>
  `;
}

function setupLogDeletion() {
  document.getElementById('clear-today-btn')?.addEventListener('click', () => {
    const today = localDate();
    const count = data.logs.filter(l => l.date === today).length;
    if (!count) return;
    if (!confirm(`Remove all ${count} session(s) logged today?`)) return;
    deleteLogsForDate(data, today);
    showToast('Today\'s progress cleared', 'success');
    renderAll();
    if (activeTab === 'history') renderHistory();
  });
}

window.deleteSession = function(logId) {
  if (!confirm('Remove this session from your progress?')) return;
  const log = data.logs.find(l => l.id === logId);
  if (deleteLog(data, logId)) {
    showToast('Session removed', 'success');
    renderAll();
    if (activeTab === 'history') {
      renderHistory();
      if (log?.date) window.showDayDetail(log.date);
    }
  }
};

// ─── Toast Notifications ─────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const colors = {
    success: 'border-lime-400 bg-lime-400/10',
    warning: 'border-orange-400 bg-orange-400/10',
    error: 'border-red-400 bg-red-400/10',
    info: 'border-cyan-400 bg-cyan-400/10',
  };
  toast.className = `fixed top-4 left-4 right-4 z-50 glass-strong rounded-xl p-4 border-l-4 ${colors[type]} fade-in`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ─── Render All ──────────────────────────────────────────────
function renderAll() {
  renderDashboard();
  renderSettings();
  renderWorkoutPreview();
  if (activeTab === 'history') renderWeightChart();
  updateCycleEstimate();
  updateAudioToggleUI();
}

// Expose for inline handlers
window.resetWorkoutView = resetWorkoutView;
