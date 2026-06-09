// src/components/Appointments.jsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  TextField,
  Tooltip,
  Skeleton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Stack,
  Badge,
  Rating,
  Fade,
  Zoom,
  Paper,
  InputAdornment,
  Container,
  alpha,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate, useLocation } from 'react-router-dom';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axiosInstance from '../api/axiosInstance';

import Footer from '../components/Footer';
import UserSidebar from '../components/UserSidebar';

// =============================================================================
// CONSTANTS & HELPER FUNCTIONS
// =============================================================================

const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper function to group time slots by day of the week
const groupSlotsByDay = (slots = []) => {
  const grouped = {};
  daysOrder.forEach((d) => (grouped[d] = []));
  slots.forEach((slot) => {
    const day = slot?.day || 'Unknown';
    if (grouped[day]) grouped[day].push(slot);
    else grouped[day] = [slot];
  });
  return grouped;
};

// Helper function to get day name from date
const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper function to check if a date is in the past
const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Helper function to get next occurrence of a specific day - if day is wednesday,user must select wednesday
const getNextDayOfWeek = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = days.indexOf(dayName);
  const today = new Date();
  const todayIndex = today.getDay();
  
  let daysToAdd = dayIndex - todayIndex;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Move to next week
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate;
};

// =============================================================================
// TRAINER CARD COMPONENT
// =============================================================================

function TrainerCard({ trainer, slots = [], onBook, onContact, onManageRating, index }) {
  const grouped = useMemo(() => groupSlotsByDay(slots), [slots]);

  // Calculate available slots (not booked and not canceled)
  const availableSlots = slots.filter((slot) => {
    const s = slot?.status || 'available';
    return s !== 'booked' && s !== 'canceled';
  }).length;

  return (
    <Zoom in={true} timeout={300 + index * 100}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          height: '100%',
          p: 3,
          background: '#0a1929', // bg-800 for cards
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-8px)',
            borderColor: '#f44336',
            '& .trainer-avatar': {
              transform: 'scale(1.1)',
              boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)',
            },
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: trainer?.available
              ? 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
              : 'linear-gradient(90deg, #f44336 0%, #e57373 100%)',
            borderRadius: '16px 16px 0 0',
          },
        }}
      >
        <CardContent sx={{ pb: 1, flex: 1 }}>
          {/* Trainer Header Section with Avatar and Basic Info */}
          <Stack direction="row" spacing={3} alignItems="center" mb={3}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={trainer?.imageUrl}
                alt={trainer?.name}
                className="trainer-avatar"
                sx={{
                  width: 80,
                  height: 80,
                  border: '3px solid',
                  borderColor: trainer?.available ? 'success.main' : 'error.main',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  background: trainer?.available
                    ? 'linear-gradient(135deg, #4caf50, #81c784)'
                    : 'linear-gradient(135deg, #f44336, #e57373)',
                  color: 'white',
                }}
              >
                {trainer?.name?.[0] || 'T'}
              </Avatar>
              <Badge
                badgeContent={availableSlots}
                color="error"
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    minWidth: 24,
                    height: 24,
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                color="error.light"
                sx={{
                  mb: 1,
                  background: 'linear-gradient(45deg, #f44336, #e57373)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {trainer?.name || 'Unnamed Trainer'}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Chip
                  label={trainer?.available ? '🟢 Available' : '🔴 Unavailable'}
                  color={trainer?.available ? 'success' : 'error'}
                  size="medium"
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    '& .MuiChip-label': { px: 2 },
                  }}
                />
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`${availableSlots} slots`}
                  variant="outlined"
                  size="small"
                  color="error"
                />
              </Stack>

              {/* Rating Display Section */}
              {trainer?.reviewSummary?.averageRating && (
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Rating value={trainer.reviewSummary.averageRating} readOnly size="small" precision={0.1} />
                  <Typography variant="body2" color="white" fontWeight={600}>
                    {trainer.reviewSummary.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                    ({trainer.reviewSummary.totalReviews || 0} reviews)
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {/* Trainer Details Section - Specialization and Experience */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: alpha('#f44336', 0.08),
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha('#f44336', 0.2),
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <FitnessCenterIcon color="error" fontSize="small" />
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" fontWeight={500}>
                    Specialization
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600} color="white">
                  {trainer?.specialization || 'General Fitness'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <StarIcon color="warning" fontSize="small" />
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.8)" fontWeight={500}>
                    Experience
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600} color="white">
                  {trainer?.experience ?? 'N/A'} years
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Time Slots Section with Accordion */}
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              color: 'white',
            }}
          >
            <CalendarTodayIcon color="error" />
            Available Time Slots
          </Typography>

          {slots.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: alpha('#f44336', 0.08),
                border: '1px solid',
                borderColor: alpha('#f44336', 0.2),
                borderRadius: 3,
              }}
            >
              <Typography color="rgba(255, 255, 255, 0.8)" fontStyle="italic" variant="body1">
                🚫 No time slots available at the moment
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {daysOrder.map((day) => {
                const daySlots = grouped[day] || [];
                if (daySlots.length === 0) return null;

                return (
                  <Accordion
                    key={day}
                    sx={{
                      bgcolor: '#111827', // bg-900 for accordion
                      borderRadius: '12px !important',
                      border: '1px solid',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        boxShadow: '0 4px 16px rgba(244, 67, 54, 0.2)',
                        borderColor: '#f44336',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon color="error" />}
                      sx={{
                        minHeight: 56,
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          margin: '12px 0',
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={600} color="white">
                          📅 {day}
                        </Typography>
                        <Chip label={daySlots.length} size="small" color="error" sx={{ minWidth: 32 }} />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Grid container spacing={1.5}>
                        {daySlots.map((slot) => {
                          const isBooked = (slot?.status || '') === 'booked';
                          const isCanceled = (slot?.status || '') === 'canceled';
                          const isAvailable = trainer?.available && !isBooked && !isCanceled;

                          const slotKey = slot?._id || `${trainer?._id || 't'}-${slot?.startTime}-${slot?.endTime}`;

                          return (
                            <Grid item key={slotKey}>
                              <Tooltip
                                title={
                                  !trainer?.available
                                    ? `Trainer is currently unavailable`
                                    : isAvailable
                                    ? `Click to book: ${slot?.startTime} - ${slot?.endTime}`
                                    : `This slot is already booked`
                                }
                                arrow
                              >
                                <Button
                                  variant={isAvailable ? 'contained' : 'outlined'}
                                  size="medium"
                                  onClick={() => {
                                    if (isAvailable) onBook(trainer, slot);
                                  }}
                                  disabled={!isAvailable}
                                  sx={{
                                    textTransform: 'none',
                                    minWidth: 130,
                                    borderRadius: 3,
                                    fontWeight: 600,
                                    py: 1,
                                    px: 2,
                                    background: isAvailable ? 'linear-gradient(135deg, #d32f2f, #f44336)' : 'transparent',
                                    color: isAvailable ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                    border: isAvailable ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                      background: isAvailable
                                        ? 'linear-gradient(135deg, #c62828, #d32f2f)'
                                        : 'transparent',
                                      transform: isAvailable ? 'translateY(-2px)' : 'none',
                                      boxShadow: isAvailable ? '0 6px 20px rgba(244, 67, 54, 0.4)' : 'none',
                                    },
                                    '&:disabled': {
                                      opacity: 1.0,
                                      color: 'rgba(255, 3, 3, 1)',
                                      border: '2px solid rgba(255, 3, 3, 0.75)',
                                      background: 'rgba(255, 3, 3, 0.1)',
                                    },
                                  }}
                                >
                                  <AccessTimeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                  {slot?.startTime} - {slot?.endTime}
                                </Button>
                              </Tooltip>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          )}
        </CardContent>

        {/* Card Actions Section - Rate and Contact Buttons at the bottom */}
        <CardActions sx={{ justifyContent: 'space-between', px: 0, pt: 2, pb: 0, mt: 'auto' }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<StarIcon />}
            onClick={() => onManageRating(trainer)}
            sx={{
              borderRadius: 3,
              fontWeight: 600,
              borderWidth: 2,
              color: 'white',
              borderColor: '#f44336',
              flex: 1,
              mx: 0.5,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                backgroundColor: alpha('#f44336', 0.1),
              },
            }}
          >
            Rate
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<ChatIcon />}
            onClick={() => onContact(trainer)}
            sx={{
              borderRadius: 3,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
              flex: 1,
              mx: 0.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #f57c00, #ff9800)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(255, 152, 0, 0.4)',
              },
            }}
          >
            Contact
          </Button>
        </CardActions>
      </Card>
    </Zoom>
  );
}

// =============================================================================
// STATISTICS CARD COMPONENT
// =============================================================================

function StatCard({ icon, number, title, color }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        p: 2,
        background: '#0a1929', // bg-800 for cards
        border: '1px solid rgba(255, 255, 255, 0.12)',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <CardContent sx={{ textAlign: 'center', p: '12px !important' }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={1}>
          <Box
            sx={{
              color: color,
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              background: `linear-gradient(45deg, ${color}, ${alpha(color, 0.8)})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {number}
          </Typography>
        </Stack>
        <Typography variant="h6" color="white" fontWeight={600} fontSize="1rem">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN APPOINTMENTS COMPONENT
// =============================================================================

export default function Appointments() {
  const navigate = useNavigate();
  const location = useLocation();

  // State Management for User and Trainers Data
  const [user, setUser] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [timeSlots, setTimeSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State Management for Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // State Management for Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Load user data from localStorage on component mount and location change
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);
  }, [location]);

  // Fetch trainers, reviews, and time slots data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch trainers data
        const trainersRes = await axiosInstance.get('/trainers');
        const trainersData = trainersRes.data || [];

        // Fetch review summaries for each trainer
        const summaryPromises = trainersData.map((t) =>
          axiosInstance
            .get(`/reviews/${t._id}/summary`)
            .then((res) => res.data)
            .catch(() => null)
        );
        const summaries = await Promise.all(summaryPromises);

        // Combine trainer info with review summaries
        const enriched = trainersData.map((t, i) => ({
          ...t,
          reviewSummary: summaries[i],
        }));
        setTrainers(enriched);

        // Fetch timeslots for each trainer
        const slotsPromises = enriched.map((t) =>
          axiosInstance.get(`/timeslots/${t._id}`).then((res) => res.data).catch(() => [])
        );
        const slotsArr = await Promise.all(slotsPromises);

        // Map trainer IDs to their timeslots
        const map = {};
        enriched.forEach((t, i) => {
          map[t._id] = Array.isArray(slotsArr[i]) ? slotsArr[i] : [];
        });
        setTimeSlots(map);
      } catch (err) {
        console.error(err);
        setError('Failed to load trainers or time slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter trainers based on search term and availability filter
  const filteredTrainers = useMemo(() => {
    let filtered = trainers;
    
    // Filter by search term (name or specialization)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((t) => {
        const name = (t?.name || '').toLowerCase();
        const spec = (t?.specialization || '').toLowerCase();
        return name.includes(term) || spec.includes(term);
      });
    }
    
    // Filter by availability status
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter((t) => 
        availabilityFilter === 'available' ? t.available : !t.available
      );
    }
    
    return filtered;
  }, [trainers, searchTerm, availabilityFilter]);

  // Calculate statistics for display
  const stats = useMemo(() => ({
    totalTrainers: trainers.length,
    availableSlots: Object.values(timeSlots).flat().length,
    activeTrainers: trainers.filter((t) => t.available).length,
  }), [trainers, timeSlots]);

  // Phone number validation function
  const validatePhone = (phone) => {
    const phoneRegex = /^0\d{9}$/;
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Open booking modal and initialize form with user data
  const handleBook = (trainer, slot) => {
    setSelectedTrainer(trainer);
    setSelectedSlot(slot);
    setClientName(user?.name || '');
    setClientPhone('');
    setClientEmail(user?.email || '');
    
    // Set the initial date to the next occurrence of the selected slot's day
    if (slot?.day) {
      const nextDate = getNextDayOfWeek(slot.day);
      setSelectedDate(nextDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    } else {
      setSelectedDate(null);
    }
    
    setPhoneError('');
    setBookingModalOpen(true);
  };

  // Show trainer contact information in snackbar
  const handleContact = (trainer) => {
    setSnackbar({
      open: true,
      message: `📞 Phone: ${trainer?.contact?.phone || 'N/A'}\n📧 Email: ${trainer?.contact?.email || 'N/A'}`,
      severity: 'info',
    });
  };

  // Navigate to review page for specific trainer
  const handleManageRating = (trainer) => {
    if (user?.name && trainer?._id) {
      const username = user.name;
      navigate(`/user-rate-management/${username}/${trainer._id}`);
    } else {
      setSnackbar({ open: true, message: 'Please log in to rate trainers.', severity: 'warning' });
    }
  };

  // Confirm booking with validation and API call
  const handleConfirmBooking = async () => {
    // Form validation
    if (!clientName.trim()) {
      setSnackbar({ open: true, message: '⚠️ Please enter your name.', severity: 'warning' });
      return;
    }
    if (!selectedDate) {
      setSnackbar({ open: true, message: '⚠️ Please select an appointment date.', severity: 'warning' });
      return;
    }
    if (!validatePhone(clientPhone)) {
      return;
    }
    if (!selectedTrainer?._id || !selectedSlot?._id) {
      setSnackbar({ open: true, message: '⚠️ Invalid selection. Please try again.', severity: 'error' });
      return;
    }

    // Validate that selected date matches the slot's day
    const selectedDateObj = new Date(selectedDate);
    const selectedDayName = getDayName(selectedDateObj);
    
    if (selectedDayName !== selectedSlot.day) {
      setSnackbar({ 
        open: true, 
        message: `⚠️ Please select a ${selectedSlot.day} for this time slot.`, 
        severity: 'warning' 
      });
      return;
    }

    setBookingLoading(true);

    try {
      // Convert selectedDate to ISO string - handle both Date object and string input
      const dateToSend = selectedDate instanceof Date 
        ? selectedDate.toISOString() 
        : new Date(selectedDate).toISOString();

      // API call to create booking
      await axiosInstance.post(`/bookings/${selectedTrainer._id}/${selectedSlot._id}`, {
        clientName: clientName.trim(),
        clientContact: {
          phone: clientPhone.trim(),
          email: clientEmail.trim(),
        },
        date: dateToSend,
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      setSnackbar({
        open: true,
        message: '🎉 Booking confirmed successfully! You will receive a confirmation email.',
        severity: 'success',
      });
      setBookingModalOpen(false);

      // Note: Implement optimistic UI update or refetch data here if needed
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: `❌ ${err?.response?.data?.message || 'Failed to book the appointment. Please try again.'}`,
        severity: 'error',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle phone input change with validation
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setClientPhone(value);
    if (phoneError) {
      validatePhone(value);
    }
  };

  // Handle phone blur for validation
  const handlePhoneBlur = () => {
    validatePhone(clientPhone);
  };

  // Function to check if a date should be disabled in the date picker
  const shouldDisableDate = (date) => {
    // Disable past dates
    if (isPastDate(date)) {
      return true;
    }
    
    // Disable dates that don't match the selected slot's day
    if (selectedSlot?.day) {
      const dayName = getDayName(date);
      return dayName !== selectedSlot.day;
    }
    
    return false;
  };

  return (
    <>
      <UserSidebar />
      <div className="bootstrap-scope" sx={{ display: 'flex', marginLeft: '250px' }}>
      <Box
        sx={{
          minHeight: '100vh',
          background: '#1f2937', // Changed to bg-800 (#1f2937)
          position: 'relative',
          marginLeft: '240px',
        color: 'white',
      }}
    >
      {/* Page Header Section with bg-950 Background */}
      <Box
        sx={{
          background: '#030712', // bg-950 for header
          position: 'relative',
          overflow: 'hidden',
          pb: 4,
        }}
      >
        {/* Background decoration for header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            background: '#030712',
            opacity: 0.1,
            zIndex: 0,
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 4, background: '#030712' }}>
          <Fade in timeout={600}>
            <Box sx={{ mb: 4, background: '#030712' }}>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  mb: 2,
                  textAlign: 'center',
                }}
              >
                <span style={{ color: 'white' }}>🏋️‍♂️ Find Your Perfect </span>
                <span style={{ color: 'red' }}>Trainer</span>
              </Typography>
              <Typography variant="h6" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
                Book appointments with certified fitness trainers and achieve your fitness goals
              </Typography>

              {/* Statistics Cards Section */}
              <Box sx={{ mb: 4, background: '#030712' }}>
                <Grid 
                  container 
                  spacing={3} 
                  sx={{ 
                    mb: 4,
                    justifyContent: 'center'
                  }}
                >
                  <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                    <StatCard
                      icon={<PeopleIcon fontSize="inherit" />}
                      number={stats.totalTrainers}
                      title="Expert Trainers"
                      color="#f44336"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                    <StatCard
                      icon={<ScheduleIcon fontSize="inherit" />}
                      number={stats.availableSlots}
                      title="Total Slots"
                      color="#4caf50"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                    <StatCard
                      icon={<EventAvailableIcon fontSize="inherit" />}
                      number={stats.activeTrainers}
                      title="Active Today"
                      color="#ff9800"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Search and Filter Section */}
              <Box sx={{ mb: 4, background: '#030712' }}>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                  <Grid item xs={12} md={8}>
                    <Paper
                      elevation={8}
                      sx={{
                        borderRadius: 3,
                        background: '#111827', // bg-900 for search background
                        border: '1px solid',
                        width: '300%',
                        height: '48px',
                        borderColor: alpha('#f44336', 0.3),
                        px: 2,
                      }}
                    >
                      <Box display="flex" alignItems="center" height="100%">
                        <TextField
                          placeholder="Search trainers by name or specialization..."
                          variant="outlined"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          fullWidth
                          size="small"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon color="error" />
                              </InputAdornment>
                            ),
                            sx: {
                              borderRadius: 3,
                              color: 'white',
                              height: '100%',
                              '& .MuiOutlinedInput-notchedOutline': {
                                border: 'none',
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: 'rgba(255, 255, 255, 0.6)',
                              },
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          color="error"
                          sx={{
                            borderRadius: 3,
                            ml: 2,
                            height: '36px',
                            minWidth: '100px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Search
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Availability Filter Dropdown */}
                  <Grid item xs={12} md={4}>
                    <FormControl 
                      size="small" 
                      fullWidth
                    >
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Availability</InputLabel>
                      <Select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        label="Availability"
                        sx={{
                          borderRadius: 3,
                          color: 'white',
                          bgcolor: '#111827', // bg-900 for dropdown
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#f44336', 0.3),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha('#f44336', 0.5),
                          },
                        }}
                      >
                        <MenuItem value="all">All Trainers</MenuItem>
                        <MenuItem value="available">Available Trainers</MenuItem>
                        <MenuItem value="unavailable">Unavailable Trainers</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Main Content Section with bg-800 Background */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Trainers Section Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              textAlign: 'left',
              background: 'linear-gradient(45deg, #f44336, #e57373)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 1,
            }}
          >
            Your Trainers ({filteredTrainers.length})
          </Typography>
          <Divider sx={{ borderColor: alpha('#f44336', 0.3) }} />
        </Box>

        {/* Loading State - Skeleton Cards */}
        {loading && (
          <Grid container spacing={3} justifyContent="center">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4, bgcolor: '#111827' }} animation="wave" />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Error State Display */}
        {error && (
          <Fade in>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: alpha('#f44336', 0.1),
                border: '1px solid',
                borderColor: alpha('#f44336', 0.3),
                borderRadius: 4,
              }}
            >
              <Typography color="error.light" variant="h6" gutterBottom>
                ❌ Oops! Something went wrong
              </Typography>
              <Typography color="rgba(255, 255, 255, 0.8)">{error}</Typography>
            </Paper>
          </Fade>
        )}

        {/* No Results State */}
        {!loading && !error && filteredTrainers.length === 0 && trainers.length > 0 && (
          <Fade in>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: alpha('#ff9800', 0.1),
                border: '1px solid',
                borderColor: alpha('#ff9800', 0.3),
                borderRadius: 4,
              }}
            >
              <Typography variant="h6" gutterBottom color="warning.light">
                🔍 No trainers found
              </Typography>
              <Typography color="rgba(255, 255, 255, 0.8)">Try adjusting your search terms or browse all available trainers.</Typography>
            </Paper>
          </Fade>
        )}

        {/* Trainers Grid Display */}
        {!loading && !error && filteredTrainers.length > 0 && (
          <Grid 
            container 
            spacing={3}
            justifyContent="center"
            sx={{ 
              maxWidth: '1400px',
              margin: '0 auto'
            }}
          >
            {filteredTrainers.map((trainer, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6}
                md={4}
                key={trainer._id || `trainer-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{ 
                  width: '100%',
                  maxWidth: 400
                }}>
                  <TrainerCard
                    trainer={trainer}
                    slots={timeSlots[trainer._id] || []}
                    onBook={handleBook}
                    onContact={handleContact}
                    onManageRating={handleManageRating}
                    index={index}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Booking Modal Dialog */}
        <Dialog
          open={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: '#1f2937', // bg-800 for modal background
              border: '1px solid',
              borderColor: alpha('#f44336', 0.2),
              color: 'white',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <BookmarkIcon color="error" />
                <Typography variant="h5" fontWeight={700} color="white">
                  Book Your Session
                </Typography>
              </Stack>
              <IconButton
                onClick={() => setBookingModalOpen(false)}
                sx={{
                  bgcolor: alpha('#f44336', 0.1),
                  color: 'white',
                  '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            {/* Session Details Summary */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: alpha('#f44336', 0.08),
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#f44336', 0.2),
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom color="white">
                🏋️‍♂️ {selectedTrainer?.name || 'Trainer'}
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.8)">
                📅 {selectedSlot?.day || '-'} • ⏰ {selectedSlot?.startTime || '-'} - {selectedSlot?.endTime || '-'}
              </Typography>
              <Typography variant="body2" color="warning.light" sx={{ mt: 1, fontStyle: 'italic' }}>
                ⚠️ Please select a {selectedSlot?.day} for your appointment
              </Typography>
            </Paper>

            {/* Booking Form Fields */}
            <Stack spacing={3}>
              {/* Client Name Field */}
              <TextField
                label="Your Full Name"
                fullWidth
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="error" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3,
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f44336',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />

              {/* Phone Number Field with Validation */}
              <TextField
                label="Phone Number *"
                fullWidth
                value={clientPhone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                error={!!phoneError}
                helperText={phoneError}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="error" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3,
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f44336',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiFormHelperText-root': {
                    color: phoneError ? '#f44336' : 'rgba(255, 255, 255, 0.6)',
                  },
                }}
                placeholder="10-digit phone number"
              />

              {/* Email Field */}
              <TextField
                label="Email Address"
                fullWidth
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="error" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3,
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f44336',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />

              {/* Date Picker Field with Day Restriction */}
              <TextField
                fullWidth
                required
                label={`Select ${selectedSlot?.day || 'Appointment'} Date *`}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: 'white !important' }} />
                    </InputAdornment>
                  ),
                  style: {
                    color: 'white',
                  },
                  inputProps: {
                    min: new Date().toISOString().split('T')[0], // Set min date to today
                    // Note: We can't easily restrict to specific days with native date input
                    // The validation happens in the handleConfirmBooking function
                  },
                }}
                sx={{
                  input: {
                    color: 'white !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3) !important',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5) !important',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f44336 !important',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7) !important',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#f44336 !important',
                  },
                }}
              />
              <Typography variant="caption" color="warning.light" sx={{ mt: -2, ml: 1 }}>
                ⚠️ Only {selectedSlot?.day} dates are allowed for this time slot
              </Typography>
            </Stack>
          </DialogContent>

          {/* Modal Action Buttons */}
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={() => setBookingModalOpen(false)}
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                px: 4,
                borderWidth: 2,
                color: 'white',
                borderColor: '#f44336',
                '&:hover': { 
                  borderWidth: 2,
                  backgroundColor: alpha('#f44336', 0.1),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={bookingLoading || !!phoneError}
              variant="contained"
              size="large"
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                px: 4,
                background: 'linear-gradient(135deg, #4caf50, #81c784)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #616161, #9e9e9e)',
                },
              }}
            >
              {bookingLoading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid currentColor',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <Typography color="white">Booking...</Typography>
                </Stack>
              ) : (
                '🎉 Confirm Booking'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 3,
              fontWeight: 600,
              fontSize: '1rem',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
            }}
          >
            {snackbar.message.split('\n').map((line, idx) => (
              <span key={idx}>
                {line}
                {idx < snackbar.message.split('\n').length - 1 && <br />}
              </span>
            ))}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
    </div>
    <Footer />
    </>
  );
}