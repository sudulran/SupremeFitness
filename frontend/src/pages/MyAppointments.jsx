import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Stack,
  Paper,
  Divider,
  Badge,
  Container,
  alpha,
  Zoom,
  Fade,
  Tooltip,
  ListItemAvatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  DeleteOutline as DeleteOutlineIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  FitnessCenter as FitnessCenterIcon,
  Star as StarIcon,
  Alarm as AlarmIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

import axiosInstance from '../api/axiosInstance';

import Footer from '../components/Footer';
import UserSidebar from '../components/UserSidebar';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper function to get day name from date
const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Helper function to get next occurrence of a specific day
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
// NOTIFICATION DIALOG COMPONENT - UPDATED FOR 24-HOUR FILTER
// =============================================================================

function NotificationDialog({ open, onClose, upcomingAppointments }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: '#1f2937',
          border: '1px solid',
          borderColor: alpha('#f44336', 0.2),
          color: 'white',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <AlarmIcon color="error" />
            <Typography variant="h5" fontWeight={700} color="white">
              Upcoming Appointments (Next 24h)
            </Typography>
          </Stack>
          <IconButton
            onClick={onClose}
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
        {upcomingAppointments.length === 0 ? (
          <Box textAlign="center" py={4}>
            <AlarmIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
            <Typography variant="h6" color="rgba(255, 255, 255, 0.8)">
              No confirmed appointments in the next 24 hours
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {upcomingAppointments.map((appointment, index) => {
              const appointmentDate = new Date(appointment.date);
              const [hours, minutes] = appointment.slotId?.startTime?.split(':') || ['00', '00'];
              const appointmentTime = new Date(appointmentDate);
              appointmentTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
              
              const timeUntilAppointment = appointmentTime.getTime() - new Date().getTime();
              const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));
              const minutesUntil = Math.floor((timeUntilAppointment % (1000 * 60 * 60)) / (1000 * 60));
              
              return (
                <Card
                  key={appointment._id}
                  sx={{
                    borderRadius: 3,
                    background: alpha('#f44336', 0.1),
                    border: '2px solid',
                    borderColor: '#f44336',
                    p: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #f44336, #ff6b6b)',
                    },
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" fontWeight={600} color="white">
                        {appointment.trainerId?.name || 'Unknown Trainer'}
                      </Typography>
                      <Chip
                        label={`in ${hoursUntil}h ${minutesUntil}m`}
                        size="small"
                        sx={{
                          bgcolor: '#f44336',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    </Stack>
                    
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#f44336' }} />
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.9)" fontWeight={500}>
                          {appointmentDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 16, color: '#f44336' }} />
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.9)" fontWeight={500}>
                          {appointment.slotId?.startTime} - {appointment.slotId?.endTime}
                        </Typography>
                      </Stack>
                    </Stack>
                    
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.9)" sx={{ mt: 1 }}>
                      <strong style={{ color: '#f44336' }}>Specialization:</strong> {appointment.trainerId?.specialization || 'N/A'}
                    </Typography>
                    
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="CONFIRMED"
                      size="small"
                      sx={{
                        bgcolor: alpha('#4caf50', 0.2),
                        color: '#4caf50',
                        fontWeight: 600,
                        border: `1px solid ${alpha('#4caf50', 0.3)}`,
                        alignSelf: 'flex-start',
                        '& .MuiChip-icon': { color: '#4caf50' },
                      }}
                    />
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// =============================================================================
// APPOINTMENT CARD COMPONENT 
// =============================================================================

function AppointmentCard({ appointment, onDelete, onEdit, index }) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Check if appointment can be edited/deleted (only pending status)
  const canEditDelete = appointment.status === 'pending';

  // Handle delete appointment with loading state
  const handleDelete = async () => {
    if (!canEditDelete) {
      return;
    }
    setDeleteLoading(true);
    try {
      await onDelete(appointment._id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Get status details for styling and icons
  const getStatusDetails = (status) => {
    const statusMap = {
      pending: {
        color: '#ff9800',
        bgColor: alpha('#ff9800', 0.1),
        icon: <PendingIcon fontSize="small" />,
        label: 'Pending',
      },
      confirmed: {
        color: '#4caf50',
        bgColor: alpha('#4caf50', 0.1),
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Confirmed',
      },
      cancelled: {
        color: '#f44336',
        bgColor: alpha('#f44336', 0.1),
        icon: <CancelIcon fontSize="small" />,
        label: 'Cancelled',
      },
      completed: {
        color: '#2196f3',
        bgColor: alpha('#2196f3', 0.1),
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Completed',
      },
    };
    return statusMap[status] || statusMap.pending;
  };

  const statusDetails = getStatusDetails(appointment.status);
  const appointmentDate = appointment.date ? new Date(appointment.date) : null;
  const isUpcoming = appointmentDate && appointmentDate > new Date();

  // Check if appointment is within next hour
  const isWithinNextHour = () => {
    if (!appointmentDate || !appointment.slotId?.startTime) return false;
    
    const [hours, minutes] = appointment.slotId.startTime.split(':');
    const appointmentTime = new Date(appointmentDate);
    appointmentTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 60 * 60 * 1000; // Within next hour
  };

  const showUrgentBadge = isWithinNextHour();

  return (
    <Zoom in={true} timeout={300 + index * 100}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          height: '100%', // Take full height of parent container
          width: '100%',  // Take full width of parent container
          minHeight: 520, // Minimum height to ensure consistency
          p: 3,
          background: showUrgentBadge 
            ? 'linear-gradient(135deg, #1f2937 0%, #2a1a1a 100%)' 
            : '#1f2937',
          border: '2px solid',
          borderColor: showUrgentBadge ? '#f44336' : 'rgba(255, 255, 255, 0.12)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'visible',
          boxShadow: showUrgentBadge 
            ? '0 8px 32px rgba(244, 67, 54, 0.3)' 
            : 'none',
          '&:hover': {
            boxShadow: showUrgentBadge 
              ? '0 20px 40px rgba(244, 67, 54, 0.4)' 
              : '0 20px 40px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-8px)',
            borderColor: showUrgentBadge ? '#ff6b6b' : '#f44336',
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: showUrgentBadge 
              ? 'linear-gradient(90deg, #f44336, #ff6b6b, #f44336)'
              : `linear-gradient(90deg, ${statusDetails.color}, ${alpha(statusDetails.color, 0.7)})`,
            borderRadius: '16px 16px 0 0',
          },
          display: 'flex', // Enable flexbox for card
          flexDirection: 'column', // Stack content vertically
          background: '#0a1929'
        }}
      >
        {/* Urgent Badge for appointments within next hour */}
        {showUrgentBadge && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: 16,
              bgcolor: '#f44336',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 700,
              zIndex: 2,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { 
                  transform: 'scale(1)', 
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                  bgcolor: '#f44336'
                },
                '50%': { 
                  transform: 'scale(1.05)', 
                  boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                  bgcolor: '#ff6b6b'
                },
                '100%': { 
                  transform: 'scale(1)', 
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                  bgcolor: '#f44336'
                },
              },
            }}
          >
            ⚡ Starting Soon
          </Box>
        )}

        <CardContent sx={{ pb: 1, flex: 1 }}> {/* flex: 1 allows content to grow */}
          {/* Trainer Header Section with Avatar and Basic Info */}
          <Stack direction="row" spacing={3} alignItems="center" mb={3}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: showUrgentBadge 
                  ? 'linear-gradient(135deg, #f44336, #ff6b6b)' 
                  : 'linear-gradient(135deg, #f44336, #e57373)',
                fontSize: '1.5rem',
                fontWeight: 700,
                border: showUrgentBadge 
                  ? '3px solid #ff6b6b' 
                  : '3px solid rgba(255, 255, 255, 0.2)',
                boxShadow: showUrgentBadge 
                  ? '0 4px 20px rgba(244, 67, 54, 0.6)' 
                  : '0 4px 12px rgba(244, 67, 54, 0.4)',
                color: 'white',
              }}
            >
              {appointment.trainerId?.name?.[0] || 'T'}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background: showUrgentBadge 
                    ? 'linear-gradient(45deg, #ff6b6b, #f44336)' 
                    : 'linear-gradient(45deg, #f44336, #e57373)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 0.5,
                }}
              >
                {appointment.trainerId?.name || 'Unknown Trainer'}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={statusDetails.icon}
                  label={statusDetails.label}
                  sx={{
                    bgcolor: showUrgentBadge ? alpha('#f44336', 0.2) : statusDetails.bgColor,
                    color: showUrgentBadge ? '#f44336' : statusDetails.color,
                    fontWeight: 600,
                    border: `1px solid ${showUrgentBadge ? alpha('#f44336', 0.5) : alpha(statusDetails.color, 0.3)}`,
                    '& .MuiChip-icon': { color: showUrgentBadge ? '#f44336' : statusDetails.color },
                  }}
                />
                {isUpcoming && (
                  <Chip
                    icon={<AlarmIcon />}
                    label="Upcoming"
                    size="small"
                    sx={{
                      bgcolor: showUrgentBadge ? alpha('#f44336', 0.2) : alpha('#ff9800', 0.1),
                      color: showUrgentBadge ? '#f44336' : '#ff9800',
                      fontWeight: 600,
                      border: `1px solid ${showUrgentBadge ? alpha('#f44336', 0.5) : alpha('#ff9800', 0.3)}`,
                      animation: showUrgentBadge ? 'pulse 2s infinite' : 'none',
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Trainer Details Section - Specialization and Experience */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              background: showUrgentBadge 
                ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(255, 107, 107, 0.1))' 
                : alpha('#f44336', 0.08),
              borderRadius: 3,
              border: '1px solid',
              borderColor: showUrgentBadge 
                ? alpha('#f44336', 0.4) 
                : alpha('#f44336', 0.2),
              position: 'relative',
              overflow: 'hidden',
              '&::before': showUrgentBadge ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #f44336, #ff6b6b)',
              } : {},
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <FitnessCenterIcon 
                    sx={{ 
                      color: showUrgentBadge ? '#ff6b6b' : '#f44336', 
                      fontSize: 'small' 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color={showUrgentBadge ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)'} 
                    fontWeight={500}
                  >
                    Specialization
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  fontWeight={600} 
                  color={showUrgentBadge ? '#ff6b6b' : 'white'}
                >
                  {appointment.trainerId?.specialization || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <StarIcon 
                    sx={{ 
                      color: showUrgentBadge ? '#ff6b6b' : 'warning.main', 
                      fontSize: 'small' 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color={showUrgentBadge ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)'} 
                    fontWeight={500}
                  >
                    Experience
                  </Typography>
                </Stack>
                <Typography 
                  variant="body1" 
                  fontWeight={600} 
                  color={showUrgentBadge ? '#ff6b6b' : 'white'}
                >
                  {appointment.trainerId?.experience ?? 'N/A'} years
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Appointment Details Section */}
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarTodayIcon 
                sx={{ 
                  color: showUrgentBadge ? '#ff6b6b' : '#f44336', 
                  fontSize: 'small' 
                }} 
              />
              <Typography 
                variant="body2" 
                color={showUrgentBadge ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)'} 
                fontWeight={500}
              >
                Appointment Date
              </Typography>
            </Stack>
            <Typography
              variant="h6"
              fontWeight={600}
              color={showUrgentBadge ? '#ff6b6b' : 'white'}
            >
              {appointmentDate
                ? appointmentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Date not available'}
            </Typography>

            {appointment.slotId && (
              <>
                <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                  <AccessTimeIcon 
                    sx={{ 
                      color: showUrgentBadge ? '#ff6b6b' : '#f44336', 
                      fontSize: 'small' 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color={showUrgentBadge ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)'} 
                    fontWeight={500}
                  >
                    Time Slot
                  </Typography>
                </Stack>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  color={showUrgentBadge ? '#ff6b6b' : 'white'}
                >
                  {appointment.slotId.day} • {appointment.slotId.startTime} - {appointment.slotId.endTime}
                </Typography>
                
                {/* Show time remaining for upcoming appointments */}
                {showUrgentBadge && (
                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <AlarmIcon 
                      sx={{ 
                        color: '#ff6b6b', 
                        fontSize: 'small' 
                      }} 
                    />
                    <Typography variant="body2" color="#ff6b6b" fontWeight={700}>
                      ⚡ Starts in {Math.floor((new Date(appointmentDate).setHours(
                        parseInt(appointment.slotId.startTime.split(':')[0]),
                        parseInt(appointment.slotId.startTime.split(':')[1])
                      ) - new Date().getTime()) / (1000 * 60))} minutes
                    </Typography>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </CardContent>

        {/* Card Actions Section - Edit and Delete Buttons (Only for pending appointments) */}
        <CardActions sx={{ 
          px: 3, 
          pt: 2, 
          pb: 2, 
          justifyContent: 'flex-end',
          mt: 'auto', // Push actions to bottom of card
        }}>
          {appointment.status === 'pending' ? (
            <>
              <Tooltip title="Edit Appointment">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit(appointment)}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    mr: 1,
                    borderWidth: 2,
                    color: showUrgentBadge ? '#ff6b6b' : 'white',
                    borderColor: showUrgentBadge ? '#ff6b6b' : '#f44336',
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: showUrgentBadge 
                        ? '0 4px 12px rgba(255, 107, 107, 0.4)' 
                        : '0 4px 12px rgba(244, 67, 54, 0.3)',
                      backgroundColor: showUrgentBadge 
                        ? alpha('#ff6b6b', 0.1) 
                        : alpha('#f44336', 0.1),
                      borderColor: showUrgentBadge ? '#ff5252' : '#d32f2f',
                    },
                  }}
                >
                  Edit
                </Button>
              </Tooltip>

              <Tooltip title="Delete Appointment">
                <Button
                  variant="contained"
                  color="error"
                  startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
                  disabled={deleteLoading}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this appointment?')) {
                      handleDelete();
                    }
                  }}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    background: showUrgentBadge 
                      ? 'linear-gradient(135deg, #ff6b6b, #f44336)' 
                      : 'linear-gradient(135deg, #d32f2f, #f44336)',
                    '&:hover': {
                      background: showUrgentBadge 
                        ? 'linear-gradient(135deg, #ff5252, #e53935)' 
                        : 'linear-gradient(135deg, #c62828, #d32f2f)',
                      transform: 'translateY(-2px)',
                      boxShadow: showUrgentBadge 
                        ? '0 6px 20px rgba(255, 107, 107, 0.5)' 
                        : '0 6px 20px rgba(244, 67, 54, 0.4)',
                    },
                  }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </Tooltip>
            </>
          ) : (
            <Typography 
              variant="body2" 
              color="rgba(255, 255, 255, 0.6)" 
              fontStyle="italic"
              sx={{ mr: 2 }}
            >
              {appointment.status === 'confirmed' && '✅ Confirmed - Contact admin for changes'}
              {appointment.status === 'completed' && '✅ Completed'}
              {appointment.status === 'cancelled' && '❌ Cancelled'}
            </Typography>
          )}
        </CardActions>
      </Card>
    </Zoom>
  );
}

// =============================================================================
// LOADING SKELETON COMPONENT - UPDATED FOR FIXED WIDTH AND HEIGHT
// =============================================================================

function AppointmentSkeleton({ index }) {
  return (
    <Zoom in={true} timeout={300 + index * 100}>
      <Card 
        sx={{ 
          borderRadius: 4, 
          p: 3,
          background: '#1f2937',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          height: '100%', // Match card height
          width: '100%',  // Match card width
          minHeight: 520, // Minimum height to match cards
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" mb={3}>
          <Box sx={{ width: 64, height: 64 }}>
            <CircularProgress />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ height: 32, width: '60%', backgroundColor: '#111827', mb: 1, borderRadius: 1 }} />
            <Box sx={{ height: 24, width: '40%', backgroundColor: '#111827', borderRadius: 1 }} />
          </Box>
        </Stack>
        <Box sx={{ height: 120, backgroundColor: '#111827', borderRadius: 3, mb: 2, flex: 1 }} />
        <Box sx={{ height: 24, width: '80%', backgroundColor: '#111827', mb: 1, borderRadius: 1 }} />
        <Box sx={{ height: 24, width: '60%', backgroundColor: '#111827', borderRadius: 1, mt: 'auto' }} />
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
        background: '#0d1b2a',
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
// EDIT APPOINTMENT DIALOG COMPONENT
// =============================================================================

function EditAppointmentDialog({ open, onClose, appointment, onUpdated, user, existingAppointments }) {
  const [form, setForm] = useState({
    _id: '',
    clientName: '',
    clientContact: { phone: '', email: '' },
    date: '',
    slotId: ''
  });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedSlotDay, setSelectedSlotDay] = useState('');

  // Initialize form and fetch slots when appointment changes
  useEffect(() => {
    if (appointment && open) {
      if (appointment.status !== 'pending') {
        setSnackbar({
          open: true,
          message: 'Only pending appointments can be edited.',
          severity: 'warning'
        });
        onClose();
        return;
      }
      
      console.log('Editing appointment data:', appointment);
      
      // Set form with current appointment data and user data
      setForm({
        _id: appointment._id,
        clientName: user?.name || appointment.clientName || '',
        clientContact: {
          phone: appointment.clientContact?.phone || '',
          email: appointment.clientContact?.email || user?.email || ''
        },
        date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '',
        slotId: appointment.slotId?._id || appointment.slotId || ''
      });
      
      // Set the selected slot day for validation
      if (appointment.slotId?.day) {
        setSelectedSlotDay(appointment.slotId.day);
      }
      
      // Fetch available slots for the trainer
      if (appointment.trainerId?._id) {
        fetchSlots(appointment.trainerId._id);
      }
    }
  }, [appointment, user, onClose, open]);

  // Fetch available time slots for the trainer
  const fetchSlots = async (trainerId) => {
    setLoadingSlots(true);
    try {
      const res = await axiosInstance.get(`/timeslots/${trainerId}`);
      console.log('Fetched slots:', res.data);
      setSlots(res.data || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

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

  // Check if the selected date and slot conflicts with existing appointments
  const hasConflictWithExistingAppointments = (date, slotId, currentAppointmentId) => {
    if (!existingAppointments || !date || !slotId) return false;

    const selectedDate = new Date(date).toISOString().split('T')[0];
    
    return existingAppointments.some(appt => {
      // Skip the current appointment we're editing
      if (appt._id === currentAppointmentId) return false;
      
      // For completed appointments, allow conflicts (they can be rescheduled)
      if (appt.status === 'completed') return false;
      
      // For all other statuses (pending, confirmed, cancelled), check for conflicts
      // Only check active appointments (not cancelled)
      if (appt.status === 'cancelled') return false;
      
      const existingDate = appt.date ? new Date(appt.date).toISOString().split('T')[0] : null;
      const existingSlotId = appt.slotId?._id || appt.slotId;
      
      // Check if same date and same time slot
      return existingDate === selectedDate && existingSlotId === slotId;
    });
  };

  // Handle phone input change with validation
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setForm(prev => ({
      ...prev,
      clientContact: { ...prev.clientContact, phone: value }
    }));
    if (phoneError) {
      validatePhone(value);
    }
  };

  // Handle phone blur for validation
  const handlePhoneBlur = () => {
    validatePhone(form.clientContact.phone);
  };

  // Handle slot selection
  const handleSlotChange = (slotId) => {
    const selectedSlot = slots.find(slot => slot._id === slotId);
    if (selectedSlot) {
      setSelectedSlotDay(selectedSlot.day);
      
      // If a date is already selected, validate it against the slot's day
      if (form.date) {
        const selectedDate = new Date(form.date);
        const selectedDayName = getDayName(selectedDate);
        
        if (selectedDayName !== selectedSlot.day) {
          // Reset date if it doesn't match the selected slot's day
          setForm(prev => ({ ...prev, date: '' }));
          setSnackbar({
            open: true,
            message: `⚠️ Please select a ${selectedSlot.day} for this time slot.`,
            severity: 'warning'
          });
        }
      }
    }
    
    setForm(prev => ({ ...prev, slotId }));
  };

  // Handle date selection with day validation
  const handleDateChange = (date) => {
    if (!date) {
      setForm(prev => ({ ...prev, date: '' }));
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

    // Check if selected date is in the past
    if (selectedDate < today) {
      setSnackbar({
        open: true,
        message: '❌ Cannot select past dates. Please choose today or a future date.',
        severity: 'error'
      });
      return;
    }

    const selectedDayName = getDayName(selectedDate);
    
    // Validate that selected date matches the selected slot's day
    if (selectedSlotDay && selectedDayName !== selectedSlotDay) {
      setSnackbar({
        open: true,
        message: `⚠️ Please select a ${selectedSlotDay} for the chosen time slot.`,
        severity: 'warning'
      });
      return;
    }

    setForm(prev => ({ ...prev, date }));
  };

  // Handle save appointment with API call
  const handleSave = async () => {
    if (!form._id) {
      console.error('No appointment ID found');
      setSnackbar({
        open: true,
        message: '❌ Error: Appointment ID missing',
        severity: 'error'
      });
      return;
    }
    
    console.log('Saving appointment with data:', form);
    
    // Form validation
    if (!form.clientName.trim()) {
      setSnackbar({
        open: true,
        message: '⚠️ Please enter your name.',
        severity: 'warning'
      });
      return;
    }
    if (!form.date) {
      setSnackbar({
        open: true,
        message: '⚠️ Please select an appointment date.',
        severity: 'warning'
      });
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setSnackbar({
        open: true,
        message: '❌ Cannot select past dates. Please choose today or a future date.',
        severity: 'error'
      });
      return;
    }

    if (!validatePhone(form.clientContact.phone)) {
      return;
    }
    if (!form.slotId) {
      setSnackbar({
        open: true,
        message: '⚠️ Please select a time slot.',
        severity: 'warning'
      });
      return;
    }

    // Validate that selected date matches the slot's day
    const selectedDateForValidation = new Date(form.date);
    const selectedDayName = getDayName(selectedDateForValidation);
    const selectedSlot = slots.find(slot => slot._id === form.slotId);
    
    if (selectedSlot && selectedDayName !== selectedSlot.day) {
      setSnackbar({ 
        open: true, 
        message: `⚠️ Please select a ${selectedSlot.day} for this time slot.`, 
        severity: 'warning' 
      });
      return;
    }

    // Check if the selected date and slot is the same as current appointment
    const currentAppointmentDate = appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '';
    const currentSlotId = appointment.slotId?._id || appointment.slotId || '';
    const selectedDateStr = new Date(form.date).toISOString().split('T')[0];
    
    // If date and slot are unchanged, show warning
    if (currentAppointmentDate === selectedDateStr && currentSlotId === form.slotId) {
      setSnackbar({
        open: true,
        message: '⚠️ No changes detected. Please modify date or time slot to update.',
        severity: 'warning'
      });
      return;
    }

    // Check for conflicts with other pending/confirmed appointments
    if (hasConflictWithExistingAppointments(form.date, form.slotId, form._id)) {
      setSnackbar({
        open: true,
        message: '❌ This time slot is already booked. Please choose a different date or time.',
        severity: 'error'
      });
      return;
    }

    setUpdating(true);

    try {
      // Prepare payload according to your backend expectations
      const payload = {
        slotId: form.slotId,
        date: new Date(form.date).toISOString(),
        clientContact: {
          phone: form.clientContact.phone.trim(),
          email: form.clientContact.email.trim()
        }
      };

      console.log('Sending update payload:', payload);
      console.log('API endpoint:', `/bookings/reschedule/${form._id}`);

      // API call to update appointment details
      const response = await axiosInstance.put(`/bookings/reschedule/${form._id}`, payload);
      
      console.log('Update response:', response.data);

      if (response.data && response.data.booking) {
        // Success - update the local state
        const updatedAppointment = response.data.booking;
        
        // Pass updated data back to parent component
        onUpdated(updatedAppointment);
        
        // Show success message
        setSnackbar({
          open: true,
          message: '✅ Appointment updated successfully!',
          severity: 'success'
        });
        
        // Close the dialog after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
        
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Update failed:', err);
      console.error('Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update the appointment. Please try again.';
      setSnackbar({
        open: true,
        message: `❌ ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: '#1f2937',
            border: '1px solid',
            borderColor: alpha('#f44336', 0.2),
            color: 'white',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700} color="white">
              Edit Appointment {form._id ? `(#${form._id.slice(-6)})` : ''}
            </Typography>
            <IconButton
              onClick={onClose}
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
          <Stack spacing={3}>
            {/* Client Name Field - Non-editable */}
            <TextField
              label="Your Name"
              fullWidth
              value={form.clientName}
              InputProps={{
                readOnly: true,
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
              helperText="Name cannot be changed"
            />

            {/* Phone Number Field with Validation */}
            <TextField
              label="Phone Number *"
              fullWidth
              value={form.clientContact.phone}
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
              value={form.clientContact.email}
              onChange={(e) => setForm(prev => ({
                ...prev,
                clientContact: { ...prev.clientContact, email: e.target.value }
              }))}
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

            {/* Time Slot Selector */}
            <FormControl fullWidth disabled={loadingSlots}>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select Time Slot *</InputLabel>
              <Select
                value={form.slotId}
                label="Select Time Slot *"
                onChange={(e) => handleSlotChange(e.target.value)}
                required
                sx={{
                  borderRadius: 3,
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f44336',
                  },
                }}
              >
                {slots.length === 0 ? (
                  <MenuItem disabled value="">
                    {loadingSlots ? 'Loading slots...' : 'No slots available'}
                  </MenuItem>
                ) : (
                  slots.map((slot) => (
                    <MenuItem key={slot._id} value={slot._id}>
                      {slot.day} • {slot.startTime} - {slot.endTime}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Date Picker Field */}
            <TextField
              label={`Appointment Date * ${selectedSlotDay ? `(Must be ${selectedSlotDay})` : ''}`}
              type="date"
              fullWidth
              value={form.date}
              onChange={(e) => handleDateChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon color="error" />
                  </InputAdornment>
                ),
                inputProps: {
                  min: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
                }
              }}
              sx={{ 
                fontColor: 'white',
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
            {selectedSlotDay && (
              <Typography variant="caption" color="warning.light" sx={{ mt: -2, ml: 1 }}>
                ⚠️ Only {selectedSlotDay} dates are allowed for the selected time slot
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          {/* Cancel Button */}
          <Button 
            onClick={onClose}
            variant="outlined"
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
          
          {/* Update Button */}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updating || loadingSlots || !!phoneError}
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
            {updating ? <CircularProgress size={18} /> : 'Update Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// =============================================================================
// AUTO NOTIFICATION SYSTEM - UPDATED FOR 24-HOUR FILTER
// =============================================================================

function useAutoNotifications(upcomingAppointments) {
  const [showNotification, setShowNotification] = useState(false);
  const [notifiedAppointments, setNotifiedAppointments] = useState(new Set());

  useEffect(() => {
    if (upcomingAppointments.length === 0) return;

    // Check for appointments that are within 24 hours and haven't been notified yet
    const newAppointmentsToNotify = upcomingAppointments.filter(appt => 
      !notifiedAppointments.has(appt._id)
    );

    if (newAppointmentsToNotify.length > 0) {
      // Show notification
      setShowNotification(true);
      
      // Add these appointments to the notified set
      const newNotifiedSet = new Set(notifiedAppointments);
      newAppointmentsToNotify.forEach(appt => newNotifiedSet.add(appt._id));
      setNotifiedAppointments(newNotifiedSet);

      // Auto-hide notification after 8 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [upcomingAppointments, notifiedAppointments]);

  return { showNotification, setShowNotification };
}

// =============================================================================
// MAIN MY APPOINTMENTS COMPONENT -  FIXED CARD SIZES AND 24-HOUR NOTIFICATIONS
// =============================================================================

function MyAppointments() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // State Management for Editing and Notifications
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);
  }, []);

  // Fetch appointments data from API when user changes
  useEffect(() => {
    if (!user?.name) {
      setLoading(false);
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get('/bookings');
        const filtered = res.data.filter((b) => b.clientName === user.name);
        console.log('Fetched appointments:', filtered);
        
        setAppointments(filtered);
      } catch (err) {
        setError('Failed to load appointments.');
        setSnackbar({
          open: true,
          message: 'Failed to load appointments.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  // Get upcoming appointments (within next 24 hours) - Only CONFIRMED status
  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter((appt) => {
      // Filter only confirmed status appointments
      if (appt.status !== 'confirmed') return false;
      
      if (!appt.date || !appt.slotId?.startTime) return false;
      
      const [hours, minutes] = appt.slotId.startTime.split(':');
      const apptDate = new Date(appt.date);
      apptDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      const timeDiff = apptDate.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Within next 24 hours
    });
  };

  const upcomingAppointments = getUpcomingAppointments();

  // Auto notification system
  const { showNotification, setShowNotification } = useAutoNotifications(upcomingAppointments);

  // Handle delete appointment with API call
  const handleDelete = async (bookingId) => {
    const appointment = appointments.find(a => a._id === bookingId);
    if (appointment && appointment.status !== 'pending') {
      setSnackbar({
        open: true,
        message: `Cannot delete ${appointment.status} appointments. Only pending appointments can be deleted.`,
        severity: 'warning'
      });
      return;
    }

    try {
      await axiosInstance.delete(`/bookings/${bookingId}`);
      setAppointments((prev) => prev.filter((a) => a._id !== bookingId));
      setSnackbar({
        open: true,
        message: '✅ Appointment deleted successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Delete error', err);
      setSnackbar({
        open: true,
        message: '❌ Failed to delete appointment.',
        severity: 'error'
      });
      throw err;
    }
  };

  // Handle edit appointment click
  const handleEditClick = (appointment) => {
    if (appointment.status !== 'pending') {
      setSnackbar({
        open: true,
        message: `Cannot edit ${appointment.status} appointments. Only pending appointments can be modified.`,
        severity: 'warning'
      });
      return;
    }
    setEditingAppointment(appointment);
    setEditDialogOpen(true);
  };

  // Handle appointment update
  const handleUpdated = (updatedAppt) => {
    setAppointments((prev) =>
      prev.map((a) => (a._id === updatedAppt._id ? { ...a, ...updatedAppt } : a))
    );
    setSnackbar({
      open: true,
      message: '✅ Appointment updated successfully!',
      severity: 'success'
    });
  };

  // Calculate statistics for display
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
  const upcomingCount = appointments.filter((a) => {
    const apptDate = new Date(a.date);
    return apptDate > new Date() && a.status !== 'cancelled';
  }).length;

  return (
    <>
    <UserSidebar />
    <Box
      sx={{
        minHeight: '100vh',
        background: '#1f2937',
        position: 'relative',
        color: 'white',
        marginLeft: '240px'
      }}
    >
      {/* Auto Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={8000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: 8,
          '& .MuiSnackbarContent-root': {
            background: 'linear-gradient(135deg, #d32f2f, #f44336)',
            borderRadius: 3,
            fontSize: '1rem',
            fontWeight: 600,
          },
        }}
      >
        <Alert
          severity="warning"
          onClose={() => setShowNotification(false)}
          variant="filled"
          sx={{
            marginTop: -4,
            width: '100%',
            borderRadius: 3,
            fontWeight: 600,
            fontSize: '1rem',
            backgroundColor: 'transparent',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              color: 'white',
            },
            '& .MuiAlert-message': {
              color: 'red',
            },
          }}
        >
          🔔 You have {upcomingAppointments.length} confirmed appointment(s) in the next 24 hours!
        </Alert>
      </Snackbar>

      {/* Page Header Section with bg-950 Background */}
      <Box
        sx={{
          background: '#030712',
          position: 'relative',
          overflow: 'hidden',
          pb: 4,
        }}
      >
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
                <span style={{ color: 'white' }}>📅 My Fitness </span>
                <span style={{ color: '#f44336' }}>Journey</span>
              </Typography>
              <Typography variant="h6" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
                Track your appointments, monitor progress, and stay on top of your fitness schedule
              </Typography>

              {/* Statistics Cards Section */}
              {!loading && totalAppointments > 0 && (
                <Box sx={{ mb: 4, background: '#030712' }}>
                  <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
                    <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                      <StatCard
                        icon={<EventNoteIcon fontSize="inherit" />}
                        number={totalAppointments}
                        title="Total Sessions"
                        color="#f44336"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                      <StatCard
                        icon={<TrendingUpIcon fontSize="inherit" />}
                        number={completedAppointments}
                        title="Completed"
                        color="#4caf50"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
                      <StatCard
                        icon={<ScheduleIcon fontSize="inherit" />}
                        number={upcomingCount}
                        title="Upcoming"
                        color="#ff9800"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Main Content Section with bg-800 Background */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Appointments Section Header */}
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
            Your Appointments ({appointments.length})
          </Typography>
          <Divider sx={{ borderColor: alpha('#f44336', 0.3) }} />
        </Box>

        {/* Loading State - Skeleton Cards */}
        {loading && (
          <Grid container spacing={4} justifyContent="center">
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={10} md={6} lg={5.5} key={i} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 520, height: '100%', display: 'flex' }}>
                  <AppointmentSkeleton index={i} />
                </Box>
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

        {/* No Appointments State */}
        {!loading && !error && appointments.length === 0 && (
          <Fade in>
            <Paper
              elevation={8}
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: alpha('#f44336', 0.08),
                border: '1px solid',
                borderColor: alpha('#f44336', 0.2),
                borderRadius: 4,
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.7)', mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight={700} color="white">
                🌟 Start Your Fitness Journey!
              </Typography>
              <Typography color="rgba(255, 255, 255, 0.8)" sx={{ mb: 3, fontSize: '1.1rem' }}>
                You haven't booked any appointments yet. Ready to take the first step?
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #d32f2f, #f44336)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #c62828, #d32f2f)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)',
                  },
                }}
              >
                Book Your First Session
              </Button>
            </Paper>
          </Fade>
        )}

        {/* Appointments Grid Display - FIXED WIDTH AND HEIGHT */}
        {!loading && !error && appointments.length > 0 && (
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}>
            <Grid 
              container 
              spacing={2}
              sx={{ 
                justifyContent: 'center',
                maxWidth: '1400px',
                margin: '0 auto'
              }}
            >
              {appointments.map((appointment, index) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={10}
                  md={6}
                  lg={5.5}
                  key={appointment._id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ 
                    width: '100%',           // Fixed width container
                    maxWidth: 520,           // Maximum fixed width
                    minWidth: 450,           // Minimum fixed width
                    height: '100%',          // Full height
                    display: 'flex',
                  }}>
                    <AppointmentCard
                      appointment={appointment}
                      onDelete={handleDelete}
                      onEdit={handleEditClick}
                      index={index}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Upcoming Notifications Fab */}
        <Tooltip
          title={
            upcomingAppointments.length > 0
              ? `${upcomingAppointments.length} confirmed appointment(s) in next 24h`
              : "No confirmed appointments in next 24h"
          }
          arrow
        >
          <Box
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 1300,
            }}
          >
            <Badge
              badgeContent={upcomingAppointments.length}
              color="error"
              invisible={upcomingAppointments.length === 0}
              overlap="circular"
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{
                '& .MuiBadge-badge': {
                  top: -6,
                  right: -6,
                },
              }}
            >
              <Fab
                color="error"
                onClick={() => setNotificationDialogOpen(true)}
                sx={{
                  background: upcomingAppointments.length > 0
                    ? 'linear-gradient(135deg, #ff6b6b, #f44336)'
                    : 'linear-gradient(135deg, #d32f2f, #f44336)',
                  boxShadow: upcomingAppointments.length > 0
                    ? '0 8px 25px rgba(255, 107, 107, 0.6)'
                    : '0 8px 25px rgba(244, 67, 54, 0.4)',
                  animation: upcomingAppointments.length > 0 ? 'pulse 2s infinite' : 'none',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: upcomingAppointments.length > 0
                      ? '0 12px 35px rgba(255, 107, 107, 0.8)'
                      : '0 12px 35px rgba(244, 67, 54, 0.5)',
                  },
                }}
              >
                <NotificationsIcon />
              </Fab>
            </Badge>
          </Box>
        </Tooltip>
      </Container>

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        appointment={editingAppointment}
        onUpdated={handleUpdated}
        user={user}
        existingAppointments={appointments}
      />

      {/* Notification Dialog */}
      <NotificationDialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        upcomingAppointments={upcomingAppointments}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    <Footer />
    </>
  );
}

export default MyAppointments;