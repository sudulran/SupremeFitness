# SupremeFitness

SupremeFitness is a full-stack fitness management platform built to support gym members, trainers, and administrators in a single system. The application combines membership management, trainer booking, personalized workout and meal planning, progress tracking, events, and e-commerce features in one web application.

## Overview

The project is designed to improve both gym operations and member experience by providing:

- Member registration, login, and profile management
- Membership approval, renewal, and expiry tracking
- Trainer management, time slot scheduling, and appointment booking
- Workout plan and meal plan management
- Exercise and food management
- Progress tracking with workout history and body metrics
- Event creation, participant enrollment, and leaderboard reporting
- Fitness product store, cart handling, and payment workflows
- Admin-focused management and dashboard functionality

## Tech Stack

### Frontend

- React
- React Router
- Axios
- Material UI
- Bootstrap
- Tailwind CSS
- Recharts
- Stripe React SDK

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer
- Nodemailer
- PDFKit
- Stripe

## Project Structure

```text
SupremeFitness/
|-- BACKEND/
|   |-- configs/
|   |-- controllers/
|   |-- helpers/
|   |-- middlewares/
|   |-- models/
|   |-- public/
|   |-- routes/
|   |-- seeds/
|   |-- services/
|   |-- uploads/
|   `-- server.js
|-- frontend/
|   |-- public/
|   `-- src/
`-- README.md
```

## Core Features

### User and Membership Management

- User registration and login
- Profile management
- Membership status handling
- Expiry and renewal tracking
- Email-based notifications

### Trainer and Booking Management

- Trainer listing and profile management
- Trainer review system
- Time slot management
- Appointment booking and rescheduling

### Fitness Planning

- Create and manage workout plans
- Create and manage meal plans
- Exercise and food catalog management

### Progress Tracking

- Workout session logging
- Body metrics tracking
- Progress history and reporting
- Visual analytics support

### Events and Engagement

- Event creation and management
- Participant enrollment
- Score updates
- Leaderboard generation and PDF export

### Store and Payments

- Product management
- Shopping cart workflows
- Payment handling
- Purchase history support

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- MongoDB connection string

### 1. Clone the repository

```bash
git clone https://github.com/sudulran/SupremeFitness.git
cd SupremeFitness
```

### 2. Install backend dependencies

```bash
cd BACKEND
npm install
```

### 3. Install frontend dependencies

Open a new terminal from the project root:

```bash
cd frontend
npm install
```

### 4. Configure environment variables

Create a `BACKEND/.env` file and add your own values:

```env
PORT=8088
MONGO_URI=your_mongodb_connection_string
MONGO_URI_FALLBACK=mongodb://localhost:27017/supreme_dev
JWT_SECRET=your_jwt_secret
SYSTEM_EMAIL=your_email_address
SYSTEM_EMAIL_PASSWORD=your_email_app_password
ADMIN_EMAIL=your_admin_email
STRIPE_SECRET_KEY=your_stripe_secret_key
```

If needed, create a `frontend/.env` file:

```env
REACT_APP_API_URL=http://localhost:8088/api
```

### 5. Run the backend

```bash
cd BACKEND
npm run dev
```

### 6. Run the frontend

In a separate terminal:

```bash
cd frontend
npm start
```

### 7. Open the application

Frontend:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:8088/api
```

## Available Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm start
npm run build
npm test
```

## API Modules

The backend includes modules for:

- Users
- Admins
- Trainers
- Time slots
- Bookings
- Reviews
- Workout plans
- Meal plans
- Exercises
- Foods
- Progress
- Events
- Products
- Cart
- Payments

## Author

Suchara Dulran

## Repository

GitHub: https://github.com/sudulran/SupremeFitness
