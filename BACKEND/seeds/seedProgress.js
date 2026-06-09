/* BACKEND/seeds/seedProgress.js
 * Seeds ProgressTracking docs for a few users, plus minimal Exercises (with metValue)
 * so calories can be computed the same way your controller does.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/userModel');
const ProgressTracking = require('../models/ProgressTracking');
const Exercise = require('../models/Exercise');        // expects a 'metValue' field
// const WorkoutPlan = require('../models/WorkoutPlan'); // optional; sessions can omit workoutPlan

dotenv.config();

const USERS_BY_EMAIL = [
  'zukoezioavatar@gmail.com',
  'dulransu@gmail.com',
  'historyf2024@gmail.com',
  'moviesagareviews@gmail.com',
  'wish.senevirathne2@gmail.com',
  'nimwara003@gmail.com',
];

/** Utility: days ago → Date at noon (stable, easier to read in DB) */
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
};

/** Ensure a few baseline exercises exist (looked up by name) */
async function ensureExercises() {
  const catalog = [
    { name: 'Running (moderate)', metValue: 9.8 },
    { name: 'Cycling (light)',   metValue: 6.0 },
    { name: 'Push Ups',          metValue: 4.0 },
  ];

  const byName = {};
  for (const item of catalog) {
    const found = await Exercise.findOne({ name: item.name });
    if (found) {
      byName[item.name] = found;
    } else {
      byName[item.name] = await Exercise.create(item);
    }
  }
  return byName;
}

/** Compute totals like your controller does */
function computeTotalsFromSessions(workoutSessions) {
  const totalWorkouts = workoutSessions.length;
  const totalCaloriesBurned = workoutSessions.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const totalWorkoutTime = workoutSessions.reduce((s, w) => s + (w.duration || 0), 0);

  // streaks (consecutive days based on the *last* sessions)
  const sorted = [...workoutSessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  let currentStreak = 0;
  let longestStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      currentStreak = 1;
      longestStreak = 1;
      continue;
    }
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } // same-day entries don’t affect streaks
  }

  return { totalWorkouts, totalCaloriesBurned, totalWorkoutTime, currentStreak, longestStreak };
}

/** Make a small, realistic progress dataset for one user */
function makeSampleProgressForUser(user, ex) {
  // choose a weight to compute calories (fall back to 70kg if missing)
  const weight = user?.weight || 70;

  // 3 recent sessions to create a small streak:
  // calories = (MET * weight * duration) / 60
  const s1Dur = 40; // minutes
  const s1Cal = Math.round((ex['Running (moderate)'].metValue * weight * s1Dur) / 60);

  const s2Dur = 25;
  const s2Cal = Math.round((ex['Cycling (light)'].metValue * weight * s2Dur) / 60);

  const s3Dur = 15;
  const s3Cal = Math.round((ex['Push Ups'].metValue * weight * s3Dur) / 60);

  const workoutSessions = [
    {
      // workoutPlan: somePlanId, // optional
      date: daysAgo(3),
      duration: s1Dur,
      caloriesBurned: s1Cal,
      exercises: [
        { exercise: ex['Running (moderate)']._id, durationCompleted: s1Dur },
      ],
      notes: 'Steady run, felt good.',
    },
    {
      date: daysAgo(2),
      duration: s2Dur,
      caloriesBurned: s2Cal,
      exercises: [
        { exercise: ex['Cycling (light)']._id, durationCompleted: s2Dur },
      ],
      notes: 'Easy recovery ride.',
    },
    {
      date: daysAgo(1),
      duration: s3Dur,
      caloriesBurned: s3Cal,
      exercises: [
        { exercise: ex['Push Ups']._id, setsCompleted: 5, repsCompleted: 20, durationCompleted: s3Dur },
      ],
      notes: 'Upper body focus.',
    },
  ];

  // A few body metrics (BMI is auto-calculated by pre-save hook)
  const h = user?.height || 175;       // cm
  const w0 = user?.weight || 72;       // kg
  const w1 = Math.max(20, w0 - 0.8);   // slight decrease
  const w2 = Math.max(20, w1 - 0.6);

  const bodyMetrics = [
    { date: daysAgo(21), height: h, weight: w0, bodyFat: 20, muscleMass: 35, measurements: { chest: 95, waist: 82 } },
    { date: daysAgo(10), height: h, weight: w1, bodyFat: 19.5, muscleMass: 35.5, measurements: { chest: 96, waist: 81 } },
    { date: daysAgo(1),  height: h, weight: w2, bodyFat: 19.0, muscleMass: 36, measurements: { chest: 97, waist: 80 } },
  ];

  const totals = computeTotalsFromSessions(workoutSessions);

  return {
    user: user._id,
    workoutSessions,
    bodyMetrics,
    ...totals,
  };
}

async function run() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI missing in .env');

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected…');

    // Make sure we have exercises with METs so calories make sense
    const exercisesByName = await ensureExercises();

    // Load target users by email
    const users = await User.find({ email: { $in: USERS_BY_EMAIL } })
      .select('_id email weight height role username name');
    if (!users.length) {
      throw new Error('No matching users found. Did you seed users first?');
    }

    // Clear existing progress docs for these users only (keeps others, if any)
    const userIds = users.map(u => u._id);
    await ProgressTracking.deleteMany({ user: { $in: userIds } });

    // Prepare docs
    const docs = users.map(u => makeSampleProgressForUser(u, exercisesByName));

    // Insert and done
    await ProgressTracking.insertMany(docs);
    console.log(`✅ Seeded progress for ${docs.length} user(s).`);

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

run();
