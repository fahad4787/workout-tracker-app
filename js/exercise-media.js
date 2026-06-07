/**
 * Exercise media — bodyweight-only GIFs from ExerciseDB
 * No CDN fallback (prevents old equipment demos from loading)
 * Source: https://oss.exercisedb.dev
 */

import { icon } from './icons.js';

const EDB = 'https://static.exercisedb.dev/media';
const MEDIA_VERSION = 4;

/** Verified bodyweight-only exercise IDs — no barbells, benches, or machines */
export const EXERCISE_MEDIA = {
  armCircles: `${EDB}/1LVFcEn.gif`,
  jumpingJacks: `${EDB}/1g5bPpA.gif`,
  highKnees: `${EDB}/J9zIWig.gif`,
  hipCircles: `${EDB}/01qpYSe.gif`,
  starJumps: `${EDB}/1g5bPpA.gif`,
  fastFeet: `${EDB}/6FMU51h.gif`,
  pushUps: `${EDB}/7E06s6d.gif`,
  kneePushUps: `${EDB}/4Jt8QsQ.gif`,
  widePushUps: `${EDB}/epOSYUZ.gif`,
  diamondPushUps: `${EDB}/soIB2rj.gif`,
  pikePushUps: `${EDB}/epOSYUZ.gif`,
  closeGripPushUps: `${EDB}/soIB2rj.gif`,
  shoulderTaps: `${EDB}/h1ezqSu.gif`,
  inchworm: `${EDB}/ZgsNQ6d.gif`,
  walkout: `${EDB}/ZgsNQ6d.gif`,
  squats: `${EDB}/75Bgtjy.gif`,
  pulseSquats: `${EDB}/75Bgtjy.gif`,
  frogSquats: `${EDB}/75Bgtjy.gif`,
  lunges: `${EDB}/kMzUs9Y.gif`,
  reverseLunges: `${EDB}/9E25EOx.gif`,
  lateralLunges: `${EDB}/J9zIWig.gif`,
  curtsyLunges: `${EDB}/9E25EOx.gif`,
  gluteBridge: `${EDB}/u0cNiij.gif`,
  singleLegBridge: `${EDB}/u0cNiij.gif`,
  calfRaises: `${EDB}/bJYHBIN.gif`,
  donkeyKick: `${EDB}/u0cNiij.gif`,
  fireHydrant: `${EDB}/VO2qeJg.gif`,
  burpees: `${EDB}/dK9394r.gif`,
  sprawl: `${EDB}/dK9394r.gif`,
  mountainClimbers: `${EDB}/RJgzwny.gif`,
  squatJumps: `${EDB}/LIlE5Tn.gif`,
  tuckJumps: `${EDB}/LIlE5Tn.gif`,
  skaterHops: `${EDB}/zfNHMN9.gif`,
  plankJacks: `${EDB}/CosupLu.gif`,
  runningInPlace: `${EDB}/J9zIWig.gif`,
  buttKicks: `${EDB}/J9zIWig.gif`,
  shadowBox: `${EDB}/1g5bPpA.gif`,
  crossPunches: `${EDB}/1g5bPpA.gif`,
  bearCrawl: `${EDB}/0Yz8WdV.gif`,
  crabWalk: `${EDB}/0Yz8WdV.gif`,
  plank: `${EDB}/CosupLu.gif`,
  sidePlank: `${EDB}/VO2qeJg.gif`,
  commandoPlank: `${EDB}/4Jt8QsQ.gif`,
  crunches: `${EDB}/dTg95eZ.gif`,
  bicycleCrunches: `${EDB}/cJgSTmh.gif`,
  legRaises: `${EDB}/6kSxYnw.gif`,
  russianTwists: `${EDB}/XVDdcoj.gif`,
  deadBug: `${EDB}/hrVQWvE.gif`,
  hollowHold: `${EDB}/BMMolZ3.gif`,
  vUps: `${EDB}/BMMolZ3.gif`,
  flutterKicks: `${EDB}/6kSxYnw.gif`,
  toeTouches: `${EDB}/dTg95eZ.gif`,
  superman: `${EDB}/hrVQWvE.gif`,
  birdDog: `${EDB}/hrVQWvE.gif`,
  childPose: `${EDB}/01qpYSe.gif`,
  catCow: `${EDB}/01qpYSe.gif`,
  hamstringStretch: `${EDB}/u0cNiij.gif`,
  quadStretch: `${EDB}/01qpYSe.gif`,
};

const preloadCache = new Set();
let persistentWrap = null;
let persistentImg = null;
let persistentLoader = null;

function mediaSrc(exerciseId) {
  const base = EXERCISE_MEDIA[exerciseId];
  if (!base) return null;
  return `${base}?v=${MEDIA_VERSION}`;
}

export function getMediaUrl(exerciseId) {
  return mediaSrc(exerciseId);
}

export function preloadMedia(exerciseId) {
  const url = mediaSrc(exerciseId);
  if (!url || preloadCache.has(url)) return;
  preloadCache.add(url);
  const img = new Image();
  img.src = url;
}

export function preloadWorkoutBlocks(blocks, limit = 8) {
  if (!blocks?.length) return;
  blocks.slice(0, limit).forEach((block) => {
    if (block.exerciseId) preloadMedia(block.exerciseId);
  });
}

function ensurePersistentElements(container) {
  if (persistentWrap && persistentWrap.parentElement === container) return;

  container.innerHTML = '';
  persistentWrap = document.createElement('div');
  persistentWrap.className = 'exercise-media-wrap';

  persistentLoader = document.createElement('div');
  persistentLoader.className = 'exercise-media-loader media-loader';

  persistentImg = document.createElement('img');
  persistentImg.className = 'exercise-media-img loading';
  persistentImg.alt = 'Exercise demonstration';
  persistentImg.decoding = 'async';
  persistentImg.loading = 'eager';

  persistentWrap.appendChild(persistentLoader);
  persistentWrap.appendChild(persistentImg);
  container.appendChild(persistentWrap);
}

export function mountExerciseMedia(container, exerciseId, exerciseName) {
  if (!container) return;

  const url = mediaSrc(exerciseId);

  if (!url) {
    container.innerHTML = `
      <div class="exercise-media-fallback">
        <span class="text-3xl">${icon('dumbbell', 32)}</span>
        <p class="font-medium text-white">${exerciseName}</p>
        <p class="text-xs text-muted mt-1">Follow the form tips below</p>
      </div>`;
    persistentWrap = null;
    return;
  }

  ensurePersistentElements(container);
  persistentImg.alt = `${exerciseName} — bodyweight demo`;

  const showLoaded = () => {
    persistentImg.classList.remove('loading');
    persistentLoader.style.display = 'none';
  };

  const showLoading = () => {
    persistentLoader.style.display = 'flex';
    persistentImg.classList.add('loading');
  };

  if (persistentImg.dataset.currentUrl === url) {
    showLoaded();
    return;
  }

  showLoading();

  const onLoad = () => {
    persistentImg.dataset.currentUrl = url;
    showLoaded();
    persistentImg.removeEventListener('load', onLoad);
    persistentImg.removeEventListener('error', onError);
  };

  const onError = () => {
    persistentImg.removeEventListener('load', onLoad);
    persistentImg.removeEventListener('error', onError);
    container.innerHTML = `
      <div class="exercise-media-fallback">
        <span class="text-3xl">${icon('dumbbell', 32)}</span>
        <p class="font-medium text-white">${exerciseName}</p>
        <p class="text-xs text-muted mt-1">Demo loading — follow tips below</p>
      </div>`;
    persistentWrap = null;
  };

  persistentImg.addEventListener('load', onLoad);
  persistentImg.addEventListener('error', onError);
  preloadMedia(exerciseId);
  persistentImg.src = url;
  if (persistentImg.complete) onLoad();
}
