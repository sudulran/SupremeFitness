// Server File
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Import routes
const productRoutes = require('./routes/productRoute');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoute');
const trainerRoutes = require('./routes/trainerRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const workoutPlanRoutes = require('./routes/WorkoutPlanRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const foodRoutes = require('./routes/foodRoutes');
const progressRoutes = require('./routes/progressRoutes');
const aiPlanRoutes = require('./routes/aiPlanRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoute');

// Import the connectDB function from db.js
const connectDB = require('./configs/db');

dotenv.config();

connectDB(); // Connect to MongoDB using the connectDB function from db.js

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3003',
    'http://localhost:5173',
    'http://localhost:8088'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

// ADD THIS LINE - Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));


// ADD THIS LINE - Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// ADD THIS - Serve uploaded payment receipts
app.use('/uploads/payments', express.static(path.join(__dirname, 'uploads', 'payments')));

app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/timeslots', timeSlotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/workout-plans', workoutPlanRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai-plans', aiPlanRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes); // ✅ Add this
app.use('/api/admin', require('./routes/adminRoutes'));

// Server Run
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));