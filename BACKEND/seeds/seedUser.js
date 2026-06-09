const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/userModel');

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding users...'))
  .catch((err) => console.error(err));

const users = [
  {
    name: 'Zuko Ezio',
    email: 'zukoezioavatar@gmail.com',
    password: '1234',
    age: 23,
    gender: 'Male',
    height: 175,
    weight: 72,
    activityLevel: 'Active',
    fitnessLevel: 'Intermediate',
    role: 'user',
  },
  {
    name: 'Dulran',
    email: 'dulransu@gmail.com',
    password: 'arise',
    age: 23,
    gender: 'Male',
    height: 185,
    weight: 80,
    activityLevel: 'Active',
    fitnessLevel: 'Intermediate',
    role: 'user',
  },
  {
    name: 'Jane Smith',
    email: 'historyf2024@gmail.com',
    password: 'history',
    age: 25,
    gender: 'Female',
    height: 165,
    weight: 60,
    activityLevel: 'Lightly Active',
    fitnessLevel: 'Beginner',
    role: 'user',
  },
  {
    name: 'Alex Johnson',
    email: 'moviesagareviews@gmail.com',
    password: 'movie',
    age: 35,
    gender: 'Male',
    height: 180,
    weight: 90,
    activityLevel: 'Very Active',
    fitnessLevel: 'Advanced',
    role: 'user',
  },
  {
    name: 'Vishma',
    email: 'wish.senevirathne2@gmail.com',
    password: 'wish',
    age: 35,
    gender: 'Male',
    height: 174,
    weight: 70,
    activityLevel: 'Active',
    fitnessLevel: 'Intermediate',
    role: 'user',
  },
  {
    name: 'Dinna Nimwara',
    email: 'nimwara003@gmail.com',
    password: 'Dinna123',
    age: 17,
    gender: 'Female',
    height: 154,
    weight: 47,
    activityLevel: 'Lightly Active',
    fitnessLevel: 'Beginner',
    role: 'user',
  },
  {
    name: 'Admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    age: 32,
    gender: 'Male',
    role: 'admin',
  },
];

const genderMap = {
  male: 'male',
  female: 'female',
  other: 'other',
};

const fitnessMap = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

const activityMap = {
  sedentary: 'sedentary',
  light: 'light',
  'lightly active': 'light',
  moderate: 'moderate',
  'moderately active': 'moderate',
  active: 'active',
  'very active': 'very_active',
};

const normaliseValue = (value = '', map, fallback) => {
  const key = value.toString().trim().toLowerCase();
  return map[key] || fallback;
};

const formatUser = (user) => {
  const username = user.username || user.name || user.email.split('@')[0];
  return {
    ...user,
    username,
    gender: normaliseValue(user.gender, genderMap, 'other'),
    fitnessLevel: normaliseValue(user.fitnessLevel, fitnessMap, 'beginner'),
    activityLevel: normaliseValue(user.activityLevel, activityMap, 'moderate'),
  };
};

const seedUsers = async () => {
  try {
    await User.deleteMany();

    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return formatUser({ ...user, password: hashedPassword });
      })
    );

    await User.insertMany(hashedUsers);

    console.log('? Users seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('? Error seeding users:', error);
    mongoose.connection.close();
  }
};

seedUsers();
