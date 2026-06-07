/**
 * Bodyweight exercise library — zero equipment (floor & body only)
 */

import { getMediaUrl } from './exercise-media.js';

export const EXERCISES = {
  armCircles: {
    id: 'armCircles', name: 'Arm Circles', category: 'warmup', muscles: 'Shoulders',
    tips: 'Large controlled circles, forward then backward.',
  },
  jumpingJacks: {
    id: 'jumpingJacks', name: 'Jumping Jacks', category: 'warmup', muscles: 'Full Body',
    tips: 'Land softly, keep core tight.',
  },
  highKnees: {
    id: 'highKnees', name: 'High Knees', category: 'warmup', muscles: 'Legs, Core',
    tips: 'Drive knees to hip height, pump arms.',
  },
  hipCircles: {
    id: 'hipCircles', name: 'Hip Circles', category: 'warmup', muscles: 'Hips',
    tips: 'Slow controlled rotations both directions.',
  },
  starJumps: {
    id: 'starJumps', name: 'Star Jumps', category: 'warmup', muscles: 'Full Body',
    tips: 'Explode up, spread arms and legs wide.',
  },
  fastFeet: {
    id: 'fastFeet', name: 'Fast Feet', category: 'warmup', muscles: 'Legs, Cardio',
    tips: 'Quick short steps on the balls of your feet.',
  },
  pushUps: {
    id: 'pushUps', name: 'Push Ups', category: 'strength', muscles: 'Chest, Triceps',
    tips: 'Keep body straight. Drop to knees if needed.',
  },
  kneePushUps: {
    id: 'kneePushUps', name: 'Knee Push Ups', category: 'strength', muscles: 'Chest',
    tips: 'Modified on knees — still keep straight line hip to shoulder.',
  },
  widePushUps: {
    id: 'widePushUps', name: 'Wide Push Ups', category: 'strength', muscles: 'Chest',
    tips: 'Hands wider than shoulders, elbows at 45°.',
  },
  diamondPushUps: {
    id: 'diamondPushUps', name: 'Diamond Push Ups', category: 'strength', muscles: 'Triceps',
    tips: 'Hands form diamond shape under chest.',
  },
  pikePushUps: {
    id: 'pikePushUps', name: 'Pike Push Ups', category: 'strength', muscles: 'Shoulders',
    tips: 'Hips high, head toward floor.',
  },
  closeGripPushUps: {
    id: 'closeGripPushUps', name: 'Close Grip Push Ups', category: 'strength', muscles: 'Triceps',
    tips: 'Hands shoulder-width, elbows tight to body.',
  },
  shoulderTaps: {
    id: 'shoulderTaps', name: 'Plank Shoulder Taps', category: 'strength', muscles: 'Core, Shoulders',
    tips: 'Hips still — tap opposite shoulder in plank.',
  },
  inchworm: {
    id: 'inchworm', name: 'Inchworm Walkout', category: 'strength', muscles: 'Core, Shoulders',
    tips: 'Walk hands out to plank, walk back.',
  },
  walkout: {
    id: 'walkout', name: 'Walkout to Plank', category: 'strength', muscles: 'Core, Hamstrings',
    tips: 'Hinge forward, walk hands out and back.',
  },
  squats: {
    id: 'squats', name: 'Bodyweight Squats', category: 'strength', muscles: 'Quads, Glutes',
    tips: 'Knees track over toes, chest up.',
  },
  pulseSquats: {
    id: 'pulseSquats', name: 'Pulse Squats', category: 'strength', muscles: 'Quads, Glutes',
    tips: 'Small bounces at the bottom — constant tension.',
  },
  frogSquats: {
    id: 'frogSquats', name: 'Frog Squats', category: 'strength', muscles: 'Glutes, Inner Thigh',
    tips: 'Wide stance, toes out, sit deep.',
  },
  lunges: {
    id: 'lunges', name: 'Forward Lunges', category: 'strength', muscles: 'Quads, Glutes',
    tips: '90° angles at both knees.',
  },
  reverseLunges: {
    id: 'reverseLunges', name: 'Reverse Lunges', category: 'strength', muscles: 'Glutes, Hamstrings',
    tips: 'Step back, front knee stable.',
  },
  lateralLunges: {
    id: 'lateralLunges', name: 'Lateral Lunges', category: 'strength', muscles: 'Glutes, Adductors',
    tips: 'Step wide to the side, sit into the hip.',
  },
  curtsyLunges: {
    id: 'curtsyLunges', name: 'Curtsy Lunges', category: 'strength', muscles: 'Glutes, Quads',
    tips: 'Cross back leg behind, drop into curtsy.',
  },
  gluteBridge: {
    id: 'gluteBridge', name: 'Glute Bridge', category: 'strength', muscles: 'Glutes, Hamstrings',
    tips: 'Squeeze glutes at top, hold 2 sec.',
  },
  singleLegBridge: {
    id: 'singleLegBridge', name: 'Single Leg Glute Bridge', category: 'strength', muscles: 'Glutes',
    tips: 'One foot planted, drive hip up evenly.',
  },
  calfRaises: {
    id: 'calfRaises', name: 'Standing Calf Raises', category: 'strength', muscles: 'Calves',
    tips: 'Full range on flat floor, pause at top.',
  },
  donkeyKick: {
    id: 'donkeyKick', name: 'Donkey Kicks', category: 'strength', muscles: 'Glutes',
    tips: 'On all fours, kick heel toward ceiling.',
  },
  fireHydrant: {
    id: 'fireHydrant', name: 'Fire Hydrants', category: 'strength', muscles: 'Glutes, Hips',
    tips: 'Lift knee out to the side, keep core tight.',
  },
  burpees: {
    id: 'burpees', name: 'Burpees', category: 'hiit', muscles: 'Full Body',
    tips: 'Chest to floor, explosive jump up.',
  },
  sprawl: {
    id: 'sprawl', name: 'Sprawls', category: 'hiit', muscles: 'Full Body',
    tips: 'Drop hips to floor fast, snap back up — no jump needed.',
  },
  mountainClimbers: {
    id: 'mountainClimbers', name: 'Mountain Climbers', category: 'hiit', muscles: 'Core, Cardio',
    tips: 'Fast knees, hips low.',
  },
  squatJumps: {
    id: 'squatJumps', name: 'Squat Jumps', category: 'hiit', muscles: 'Legs, Cardio',
    tips: 'Explosive up, soft landing.',
  },
  tuckJumps: {
    id: 'tuckJumps', name: 'Tuck Jumps', category: 'hiit', muscles: 'Legs, Cardio',
    tips: 'Drive knees up on jump, land softly.',
  },
  skaterHops: {
    id: 'skaterHops', name: 'Skater Hops', category: 'hiit', muscles: 'Legs, Cardio',
    tips: 'Leap side to side, touch floor.',
  },
  plankJacks: {
    id: 'plankJacks', name: 'Plank Jacks', category: 'hiit', muscles: 'Core, Cardio',
    tips: 'Plank position, jump feet in/out.',
  },
  runningInPlace: {
    id: 'runningInPlace', name: 'Running in Place', category: 'cardio', muscles: 'Cardio',
    tips: 'Pump arms, quick feet.',
  },
  buttKicks: {
    id: 'buttKicks', name: 'Butt Kicks', category: 'cardio', muscles: 'Hamstrings, Cardio',
    tips: 'Heels to glutes, stay upright.',
  },
  shadowBox: {
    id: 'shadowBox', name: 'Shadow Boxing', category: 'cardio', muscles: 'Arms, Core, Cardio',
    tips: 'Light on feet — jab, cross, hook. Stay moving.',
  },
  crossPunches: {
    id: 'crossPunches', name: 'Cross Punches', category: 'cardio', muscles: 'Arms, Core',
    tips: 'Rotate hips into each cross, guard up.',
  },
  bearCrawl: {
    id: 'bearCrawl', name: 'Bear Crawl', category: 'hiit', muscles: 'Full Body',
    tips: 'Knees hover, move opposite hand and foot.',
  },
  crabWalk: {
    id: 'crabWalk', name: 'Crab Walk', category: 'strength', muscles: 'Triceps, Glutes',
    tips: 'Hips up, walk forward and back.',
  },
  plank: {
    id: 'plank', name: 'Plank Hold', category: 'core', muscles: 'Core',
    tips: 'Straight line head to heels. Breathe.',
  },
  sidePlank: {
    id: 'sidePlank', name: 'Side Plank', category: 'core', muscles: 'Obliques',
    tips: 'Hips up, body in straight line.',
  },
  commandoPlank: {
    id: 'commandoPlank', name: 'Commando Plank', category: 'core', muscles: 'Core, Arms',
    tips: 'Drop elbow by elbow, push back up.',
  },
  crunches: {
    id: 'crunches', name: 'Crunches', category: 'core', muscles: 'Abs',
    tips: 'Chin off chest, squeeze at top.',
  },
  bicycleCrunches: {
    id: 'bicycleCrunches', name: 'Bicycle Crunches', category: 'core', muscles: 'Abs, Obliques',
    tips: 'Elbow to opposite knee, slow and controlled.',
  },
  legRaises: {
    id: 'legRaises', name: 'Lying Leg Raises', category: 'core', muscles: 'Lower Abs',
    tips: 'Lower back pressed to floor.',
  },
  russianTwists: {
    id: 'russianTwists', name: 'Russian Twists', category: 'core', muscles: 'Obliques',
    tips: 'Feet off floor, rotate fully each side.',
  },
  deadBug: {
    id: 'deadBug', name: 'Dead Bug', category: 'core', muscles: 'Core',
    tips: 'Opposite arm/leg extend, back flat.',
  },
  hollowHold: {
    id: 'hollowHold', name: 'Hollow Body Hold', category: 'core', muscles: 'Abs',
    tips: 'Lower back glued down, arms and legs extended.',
  },
  vUps: {
    id: 'vUps', name: 'V-Ups', category: 'core', muscles: 'Abs',
    tips: 'Touch toes at top, control the descent.',
  },
  flutterKicks: {
    id: 'flutterKicks', name: 'Flutter Kicks', category: 'core', muscles: 'Lower Abs',
    tips: 'Small fast kicks, lower back down.',
  },
  toeTouches: {
    id: 'toeTouches', name: 'Toe Touch Crunches', category: 'core', muscles: 'Abs',
    tips: 'Reach for toes, exhale on the crunch.',
  },
  superman: {
    id: 'superman', name: 'Superman Hold', category: 'strength', muscles: 'Lower Back, Glutes',
    tips: 'Lift arms and legs, squeeze glutes at top.',
  },
  birdDog: {
    id: 'birdDog', name: 'Bird Dog', category: 'core', muscles: 'Core, Back',
    tips: 'Extend opposite arm and leg, hold steady.',
  },
  childPose: {
    id: 'childPose', name: "Child's Pose", category: 'cooldown', muscles: 'Back, Hips',
    tips: 'Breathe deep, relax shoulders.',
  },
  catCow: {
    id: 'catCow', name: 'Cat-Cow Stretch', category: 'cooldown', muscles: 'Spine',
    tips: 'Slow arch and round, sync with breath.',
  },
  hamstringStretch: {
    id: 'hamstringStretch', name: 'Hamstring Stretch', category: 'cooldown', muscles: 'Hamstrings',
    tips: 'Hinge at hips, keep back flat.',
  },
  quadStretch: {
    id: 'quadStretch', name: 'Quad Stretch', category: 'cooldown', muscles: 'Quads',
    tips: 'Stand on one leg, pull heel to glute.',
  },
};

for (const key of Object.keys(EXERCISES)) {
  EXERCISES[key].gif = getMediaUrl(key);
}

export function getExercise(id) {
  return EXERCISES[id] || null;
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
