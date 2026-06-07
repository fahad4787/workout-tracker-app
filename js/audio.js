/**
 * Sound FX + motivational coach voice (Coach Maya)
 * Uses Web Audio API (beeps) + Speech Synthesis (coach)
 */

let ctx = null;
let sfxOn = true;
let coachOn = true;
let lastMotivateAt = 0;
let onSpeakingChange = null;
let coachProfile = {
  name: 'Fahad',
  startWeight: 103,
  currentWeight: 103,
  targetWeight: 80,
};

export function setCoachProfile(profile = {}) {
  coachProfile = { ...coachProfile, ...profile };
}

function cp() {
  const name = coachProfile.name || 'Fahad';
  const target = coachProfile.targetWeight ?? 80;
  const current = coachProfile.currentWeight ?? coachProfile.startWeight ?? 103;
  const remaining = Math.max(0, Math.round((current - target) * 10) / 10);
  return { name, target, current, remaining };
}

export function initAudio(settings = {}) {
  sfxOn = settings.soundFx !== false;
  coachOn = settings.coachVoice !== false;
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }
}

export function setCoachSpeakingListener(fn) {
  onSpeakingChange = fn;
}

export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* silent */ }
}

export function setSoundFx(on) {
  sfxOn = on;
}

export function setCoachVoice(on) {
  coachOn = on;
  if (!on && window.speechSynthesis) speechSynthesis.cancel();
  onSpeakingChange?.(false);
}

function beep(freq, duration, vol = 0.12) {
  if (!sfxOn || !ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playTap() {
  unlockAudio();
  beep(920, 0.05, 0.07);
}

export function playToggle() {
  unlockAudio();
  beep(700, 0.04, 0.06);
  setTimeout(() => beep(850, 0.04, 0.05), 50);
}

export function playWorkStart() {
  unlockAudio();
  beep(440, 0.1, 0.1);
  setTimeout(() => beep(660, 0.12, 0.1), 90);
  setTimeout(() => beep(880, 0.18, 0.12), 180);
}

export function playRestStart() {
  unlockAudio();
  beep(330, 0.25, 0.08);
}

export function playCountdownTick(secondsLeft) {
  unlockAudio();
  if (secondsLeft <= 3 && secondsLeft >= 1) {
    beep(880, 0.08, 0.1);
  }
}

export function playGo() {
  unlockAudio();
  beep(988, 0.25, 0.14);
}

export function playComplete() {
  unlockAudio();
  [523, 659, 784, 988].forEach((f, i) => {
    setTimeout(() => beep(f, 0.22, 0.11), i * 110);
  });
}

function pickVoice() {
  if (!window.speechSynthesis) return null;
  const voices = speechSynthesis.getVoices();
  const female = /female|samantha|victoria|karen|zira|kate|moira|fiona|tessa|serena|ava|allison|susan|sara|jenny|linda|heather|nicky|sophie|google uk english female|google us english female|en-gb.*female|en-us.*female|premium\.en-us\.(ava|allison|samantha)|compact\.en-gb\.Kate|compact\.en-au\.Karen/i;
  const male = /male|daniel|aaron|fred|david|mark|james|tom|alex|gordon|lee|ralph|bruce|nick/i;

  return voices.find(v => v.lang.startsWith('en') && female.test(`${v.name} ${v.voiceURI || ''}`))
    || voices.find(v => v.lang.startsWith('en-US') && !male.test(v.name))
    || voices.find(v => v.lang.startsWith('en-GB') && !male.test(v.name))
    || voices.find(v => v.lang.startsWith('en') && !male.test(v.name))
    || voices.find(v => v.lang.startsWith('en'))
    || null;
}

export function coachSay(text, interrupt = false) {
  if (!coachOn || !text || !window.speechSynthesis) return;
  if (interrupt) speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.97;
  utter.pitch = 1.08;
  utter.volume = 1;
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.onstart = () => onSpeakingChange?.(true);
  utter.onend = () => onSpeakingChange?.(false);
  utter.onerror = () => onSpeakingChange?.(false);
  speechSynthesis.speak(utter);
  return text;
}

function formCue(tips) {
  if (!tips) return 'Focus on form';
  const first = tips.split(/[.!]/)[0].trim();
  if (!first) return 'Focus on form';
  if (first.length > 55) return 'Focus on form';
  return first;
}

function poolStartLines(workout) {
  const { name, tagline, focus, pool } = workout;
  const { name: user, target } = cp();
  const base = [
    `${name}, ${user}. ${tagline || 'Let\'s go'}. Every rep brings you closer to ${target} kilos.`,
    `Starting ${name} now. ${focus ? `${focus}.` : ''} You showed up — let's work.`,
    `${name} time. ${tagline || 'No gym, no excuses'}. I believe in you, ${user}.`,
  ];
  const byPool = {
    core: [`Core day, ${user}. ${name}. Engage that midsection and breathe.`],
    hiit: [`High intensity incoming, ${user}. ${name}. Push hard, recover smart.`],
    legs: [`Leg day, ${user}. ${name}. Build that lower body power.`],
    boxing: [`Hands up, ${user}. ${name}. Stay light on your feet.`],
    dance: [`Let's move, ${user}. ${name}. Have fun and keep the energy up.`],
    savage: [`This one's tough, ${user}. ${name}. You can handle it.`],
  };
  return [...base, ...(byPool[pool] || [])];
}

function restLines() {
  const { name, target } = cp();
  return [
    `Rest and breathe, ${name}. You're doing great.`,
    'Good work. Shake it out, sip water, we go again.',
    'Recovery time. Stay focused, stay strong.',
    `Catch your breath. ${target} kilos is the goal — next round is yours.`,
  ];
}

function motivateLines() {
  const { name, target, remaining } = cp();
  return [
    `Push through, ${name}! You've got this.`,
    `Stay strong! ${target} kilos is waiting for you.`,
    remaining > 0 ? `${remaining} kilos to go. Don't stop now.` : 'You are in the zone. Keep going.',
    'Feel the burn. That\'s progress talking.',
    `One more round, ${name}. Stay locked in.`,
    'Discipline beats motivation. Keep going.',
    'Your future self is proud right now.',
    'Stronger every second. Don\'t quit.',
  ];
}

function halfwayLines() {
  const { name } = cp();
  return [
    `Halfway there, ${name}! Keep that energy up.`,
    '50 percent done. You\'re flying through this.',
    'Midway point. Finish strong, you\'re almost there.',
  ];
}

function finishLines(workoutName) {
  const { name, target } = cp();
  const lines = [
    `Crushed it, ${name}! Another step closer to ${target} kilos.`,
    'Session complete! You earned that sweat today.',
    `Beast mode activated. Great work, ${name}!`,
    'Done! Log it and feel proud. See you next session.',
  ];
  if (workoutName) {
    lines.push(`${workoutName} complete, ${name}! You crushed it.`);
    lines.push(`Amazing work on ${workoutName}. ${target} kilos is getting closer.`);
  }
  return lines;
}

function lastPushLines() {
  const { name } = cp();
  return [
    `Final exercises, ${name}! Empty the tank.`,
    'Last push! Give everything you\'ve got.',
    'Almost done. Finish like a champion.',
  ];
}

export function coachWorkoutStart(workout) {
  const { name, target } = cp();
  const lines = workout ? poolStartLines(workout) : [
    `Let's go, ${name}! Time to burn toward ${target} kilos.`,
    'You showed up. That\'s already half the battle. Let\'s work.',
  ];
  return coachSay(lines[Math.floor(Math.random() * lines.length)], true);
}

export function coachExercise(exName, tips, muscles) {
  const { name } = cp();
  const cue = formCue(tips);
  const lines = [
    `${exName}. ${cue}. You got this, ${name}.`,
    `${exName}. ${cue}. Stay controlled and powerful.`,
    `${exName}. ${muscles ? `Target ${muscles.split(',')[0].trim()}.` : `${cue}.`} You got this, ${name}.`,
  ];
  return coachSay(lines[Math.floor(Math.random() * lines.length)]);
}

export function coachRest() {
  const lines = restLines();
  return coachSay(lines[Math.floor(Math.random() * lines.length)]);
}

export function coachCountdown(secondsLeft, phase) {
  if (secondsLeft === 3) return coachSay('Three');
  if (secondsLeft === 2) return coachSay('Two');
  if (secondsLeft === 1) return coachSay(phase === 'rest' ? 'One. Get ready.' : 'One');
  if (secondsLeft === 0) return coachSay('Go!', true);
  return null;
}

export function coachHalfway() {
  const lines = halfwayLines();
  return coachSay(lines[Math.floor(Math.random() * lines.length)]);
}

export function coachAlmostDone() {
  const lines = lastPushLines();
  return coachSay(lines[Math.floor(Math.random() * lines.length)]);
}

export function coachFinish(workout) {
  const lines = finishLines(workout?.name);
  return coachSay(lines[Math.floor(Math.random() * lines.length)], true);
}

export function coachMotivate(force = false) {
  const now = Date.now();
  if (!force && now - lastMotivateAt < 45000) return null;
  lastMotivateAt = now;
  const lines = motivateLines();
  return coachSay(lines[Math.floor(Math.random() * lines.length)]);
}

export function showCoachText(text, { exerciseName } = {}) {
  const wrap = document.getElementById('wp-coach-wrap');
  const el = document.getElementById('wp-coach');
  if (!el || !text) return;

  if (exerciseName && text.startsWith(exerciseName)) {
    const rest = text.slice(exerciseName.length);
    el.innerHTML = `<span class="coach-exercise">${exerciseName}</span>${escapeHtml(rest)}`;
  } else {
    el.textContent = text;
  }

  wrap?.classList.remove('coach-pop');
  void wrap?.offsetWidth;
  wrap?.classList.add('coach-pop');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function resetCoachTimer() {
  lastMotivateAt = 0;
}

export function getCoachReadyText() {
  const { name } = cp();
  return `Your coach is ready, ${name}.`;
}
