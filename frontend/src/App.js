import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

// Stripe Imports
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure these are all default exports in their respective files!
import Login from './pages/User/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import StoreAdminDashboard from './pages/StoreAdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ProductManagement from './pages/ProductManagement';
import PurchaseHistory from './pages/PurchaseHistory';
import SalesHistory from './pages/SalesHistory';
import TrainerManagement from './pages/TrainerManagement';
import TimeSlotManagement from './pages/TimeSlotManagement';
import Appointments from './pages/Appointments';
import Reviews from './pages/Reviews';
import AppointmentManagement from './pages/AppointmentManagement';
import MyAppointments from './pages/MyAppointments';
import AdminReviews from './pages/AdminReviews';
import WorkoutPlansOverview from './pages/WorkoutPlansOverview';
import MealPlansOverview from './pages/MealPlansOverview';
import UserWorkoutPlans from './pages/UserWorkoutPlans';
import UserMealPlans from './pages/UserMealPlans';
import HomePage from './pages/HomePage'
import CreateWorkoutPlan from './pages/CreateWorkoutPlan';
import UpdateWorkoutPlan from './pages/UpdateWorkoutPlan';
import CreateMealPlan from './pages/CreateMealPlan';
import UpdateMealPlan from './pages/UpdateMealPlan';
import ProgressDashboard from './pages/ProgressDashboard';
import EventManager from './pages/EventManager'; 
import EventPage from './pages/EventPage';
import EventsList from './pages/EventsList';
import Leaderboard from './pages/Leaderboard';
import SignUp from './pages/User/SignUp';
import AdminLogin from './pages/User/AdminLogin';
import AdminUserManagement from './pages/User/AdminUserManagement';
import UserDashboards  from './pages/User/userDashboard';
import UserDraftOrders from './pages/DraftOrders'

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51SI13oBjSsvom7LZPDCCiIdDH82W2Kj00F1cNXwWpDueUmjoN9t61qMSdLahK0EQxZaIQddFgVsCzZxHWDnB8jG000Q5UI7D6k');

const AppRoutes = () => {
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 === APP.JS AUTH CHECK START ===');
    
    // Check all possible authentication sources
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const user = localStorage.getItem('user');
    const adminData = localStorage.getItem('adminData');

    console.log('📦 LocalStorage Contents:');
    console.log('   - token:', token ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - adminToken:', adminToken ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - user:', user ? '✅ EXISTS' : '❌ MISSING');
    console.log('   - adminData:', adminData ? '✅ EXISTS' : '❌ MISSING');

    // Parse user data if exists
    let parsedUser = null;
    let parsedAdminData = null;
    
    try {
      if (user) {
        parsedUser = JSON.parse(user);
        console.log('👤 Parsed User Data:', parsedUser);
      }
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
    }

    try {
      if (adminData) {
        parsedAdminData = JSON.parse(adminData);
        console.log('👑 Parsed Admin Data:', parsedAdminData);
      }
    } catch (error) {
      console.error('❌ Error parsing admin data:', error);
    }

    // Determine authentication status
    const userAuthenticated = !!token && !!parsedUser;
    const adminAuthenticated = !!adminToken && !!parsedAdminData;
    
    console.log('🔐 Authentication Status:');
    console.log('   - User Authenticated:', userAuthenticated);
    console.log('   - Admin Authenticated:', adminAuthenticated);

    // Set authentication states
    setIsAuthenticated(userAuthenticated || adminAuthenticated);
    
    // Determine user role
    if (adminAuthenticated) {
      console.log('🎯 Setting role: admin (from admin authentication)');
      setUserRole('admin');
    } else if (userAuthenticated && parsedUser.role) {
      console.log('🎯 Setting role:', parsedUser.role, '(from user data)');
      setUserRole(parsedUser.role);
    } else if (userAuthenticated) {
      console.log('🎯 Setting role: user (default for authenticated user)');
      setUserRole('user');
    } else {
      console.log('🎯 Setting role: null (not authenticated)');
      setUserRole(null);
    }

    console.log('📊 Final State:');
    console.log('   - isAuthenticated:', userAuthenticated || adminAuthenticated);
    console.log('   - userRole:', userRole);
    console.log('🔍 === APP.JS AUTH CHECK END ===');

    setLoading(false);
  }, [location]);

  const getDashboardRoute = () => {
    console.log('🚀 getDashboardRoute called:');
    console.log('   - Current userRole:', userRole);
    
    if (userRole === 'admin') {
      console.log('   ➡️ Redirecting to /admin-dashboard');
      return '/admin-dashboard';
    }
    if (userRole === 'user') {
      console.log('   ➡️ Redirecting to /udashboard');
      return '/udashboard';
    }
    console.log('   ➡️ Redirecting to /login (fallback)');
    return '/login';
  };

  if (loading) {
    console.log('⏳ App is loading...');
    return <div>Loading...</div>;
  }

  console.log('🎬 Rendering AppRoutes with:');
  console.log('   - isAuthenticated:', isAuthenticated);
  console.log('   - userRole:', userRole);
  console.log('   - current path:', location.pathname);

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{ paddingTop: '60px' }}>
        <Routes>
          <Route
            path="/"
            element={<HomePage />}
          />

          {/* Admin Login Route */}
          <Route
            path="/admin-login"
            element={
              (() => {
                console.log('🛣️ Rendering /admin-login route');
                const adminToken = localStorage.getItem('adminToken');
                console.log('   - adminToken exists:', !!adminToken);
                
                if (adminToken) {
                  console.log('   ➡️ Redirecting to /admin-dashboard');
                  return <Navigate to="/admin-dashboard" />;
                } else {
                  console.log('   ➡️ Rendering AdminLogin component');
                  return <AdminLogin />;
                }
              })()
            }
          />

{/* Admin User Management - Admin only */}
<Route
  path="/admin-user-management"
  element={
    isAuthenticated && userRole === 'admin' ? (
      <AdminUserManagement />
    ) : (
      <Navigate to="/login" />
    )
  }
/>



<Route
  path="/udashboard"
  element={
    isAuthenticated && userRole === 'user' ? (
      <UserDashboards/>
    ) : (
      <Navigate to="/login" />
    )
  }
/>


          {/* User Login Route */}
          <Route
            path="/login"
            element={
              (() => {
                console.log('🛣️ Rendering /login route');
                console.log('   - isAuthenticated:', isAuthenticated);
                
                if (isAuthenticated) {
                  const route = getDashboardRoute();
                  console.log('   ➡️ Redirecting to:', route);
                  return <Navigate to={route} />;
                } else {
                  console.log('   ➡️ Rendering Login component');
                  return <Login />;
                }
              })()
            }
          />

          {/* User Registration */}
          <Route
            path="/signup"
            element={
              (() => {
                console.log('🛣️ Rendering /signup route');
                console.log('   - isAuthenticated:', isAuthenticated);
                
                if (isAuthenticated) {
                  const route = getDashboardRoute();
                  console.log('   ➡️ Redirecting to:', route);
                  return <Navigate to={route} />;
                } else {
                  console.log('   ➡️ Rendering SignUp component');
                  return <SignUp />;
                }
              })()
            }
          />

          {/* Admin Dashboard - Check both authentication methods */}
          <Route
            path="/admin-dashboard"
            element={
              (() => {
                console.log('🛣️ Rendering /admin-dashboard route');
                const adminToken = localStorage.getItem('adminToken');
                const isUserAdmin = isAuthenticated && userRole === 'admin';
                
                console.log('   - adminToken exists:', !!adminToken);
                console.log('   - isUserAdmin (user auth):', isUserAdmin);
                console.log('   - Combined access:', !!adminToken || isUserAdmin);
                
                if (adminToken || isUserAdmin) {
                  console.log('   ➡️ Rendering StoreAdminDashboard');
                  return <StoreAdminDashboard />;
                } else {
                  console.log('   ➡️ Redirecting to /login');
                  return <Navigate to="/login" />;
                }
              })()
            }
          />

          {/* Event Manager - Admin only */}
          <Route
            path="/event-manager"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <EventManager />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Events List - Accessible to all authenticated users */}
          <Route
            path="/events"
            element={
              isAuthenticated ? (
                <EventsList />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Individual Event Page - Accessible to all authenticated users */}
          <Route
            path="/events/:id"
            element={
              isAuthenticated ? (
                <EventPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Leaderboard - Accessible to all authenticated users */}
          <Route
            path="/leaderboard"
            element={
              isAuthenticated ? (
                <Leaderboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Admin - Workout Plans Overview */}
          <Route
            path="/admin-workout-plans/*"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <WorkoutPlansOverview />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* User-facing workout plans (assigned to logged in user) */}
          <Route
            path="/workoutplans"
            element={
              isAuthenticated && userRole === 'user' ? (
                <UserWorkoutPlans />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Admin - Meal Plans Overview */}
          <Route
            path="/admin-meal-plans/*"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <MealPlansOverview />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* User-facing meal plans (assigned to logged in user) */}
          <Route
            path="/mealplans"
            element={
              isAuthenticated && userRole === 'user' ? (
                <UserMealPlans />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Admin - Workout Plans Create */}
          <Route
            path="/admin-workout-plans/create"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <CreateWorkoutPlan />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Admin - Meal Plans Create */}
          <Route
            path="/admin-meal-plans/create"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <CreateMealPlan />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/admin-workout-plans/edit/:id"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <UpdateWorkoutPlan />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin-meal-plans/edit/:id"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <UpdateMealPlan />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Progress Dashboard - User only */}
          <Route
            path="/user-progress-dashboard"
            element={
              isAuthenticated && userRole === 'user' ? (
                <ProgressDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* User only */}
          <Route
            path="/user-dashboard"
            element={
              isAuthenticated && userRole === 'user' ? (
                <UserDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Product Management - Admin only */}
          <Route
            path="/admin-product-management"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <ProductManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Purchase History - User only */}
          <Route
            path="/user-purchase-summary"
            element={
              isAuthenticated && userRole === 'user' ? (
                <PurchaseHistory />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Sales History - Admin only */}
          <Route
            path="/admin-sale-summary"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <SalesHistory />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Trainer Management - Admin only */}
          <Route
            path="/admin-trainer-management"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <TrainerManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Trainer - Time Slots Management - Admin only */}
          <Route
            path="/admin-timeslot-management/:trainerId"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <TimeSlotManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          {/* User Appointments */}
          <Route
            path="/user-appointments"
            element={
              isAuthenticated && userRole === 'user' ? (
                <Appointments />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/user-rate-management/:username/:trainerId"
            element={
              isAuthenticated && userRole === 'user' ? (
                <Reviews />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/admin-appointment-management"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AppointmentManagement />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/user-my-appointments"
            element={
              isAuthenticated && userRole === 'user' ? (
                <MyAppointments />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
          <Route
            path="/admin-reviews"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminReviews />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/my-draft-orders"
            element={
              isAuthenticated && userRole === 'user' ? (
                <UserDraftOrders />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;