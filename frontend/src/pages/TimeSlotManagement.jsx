import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Paper,
  Card,
  Container,
  alpha,
  Fade,
  Zoom,
  IconButton,
  Chip,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axiosInstance from '../api/axiosInstance';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Days of the week for time slot management
 */
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// =============================================================================
// TIME SLOT MANAGEMENT COMPONENT
// =============================================================================

/**
 * Time Slot Management Component for store administrators
 * Features: Create, read, update, delete time slots with conflict detection
 */
function TimeSlotManagement() {
  // ===========================================================================
  // ROUTING AND CONSTANTS
  // ===========================================================================
  
  const sidebarWidth = 10;
  const { trainerId } = useParams(); // Get trainer ID from URL parameters

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  // Data states
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal states
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({ day: '', startTime: '', endTime: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);

  // Delete confirmation states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);

  // Notification state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ===========================================================================
  // DATA FETCHING EFFECT
  // ===========================================================================

  /**
   * Fetches time slots for the specified trainer from API
   */
  const fetchTimeSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/timeslots/${trainerId}`);
      setTimeSlots(res.data);
    } catch (err) {
      setError('Failed to fetch time slots');
    }
    setLoading(false);
  };

  /**
   * Fetch time slots when component mounts or trainerId changes
   */
  useEffect(() => {
    if (trainerId) {
      fetchTimeSlots();
    }
  }, [trainerId]);

  // ===========================================================================
  // VALIDATION FUNCTIONS
  // ===========================================================================

  /**
   * Validates form data including time conflicts and logical checks
   * @returns {boolean} - True if validation passes, false otherwise
   */
  const validate = () => {
    let errors = {};
    const { day, startTime, endTime } = formData;

    // Basic required field validation
    if (!day) errors.day = 'Day is required';
    if (!startTime) errors.startTime = 'Start time is required';
    if (!endTime) errors.endTime = 'End time is required';

    // Time logic validation
    if (startTime && endTime && startTime >= endTime) {
      errors.endTime = 'End time must be after start time';
    }

    // =======================================================================
    // CONFLICT DETECTION LOGIC
    // Checks for overlapping time slots on the same day
    // =======================================================================
    if (day && startTime && endTime) {
      const slotsForSameDay = timeSlots.filter(
        (slot) => slot.day === day && slot._id !== editingSlotId
      );

      const hasConflict = slotsForSameDay.some((slot) => {
        return startTime < slot.endTime && endTime > slot.startTime;
      });

      if (hasConflict) {
        errors.startTime = 'Time slot conflicts with an existing one';
        errors.endTime = 'Time slot conflicts with an existing one';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===========================================================================
  // FORM HANDLERS
  // ===========================================================================

  /**
   * Handles form input changes and clears corresponding errors
   * @param {Object} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  /**
   * Opens the add time slot form with empty state
   */
  const openAddForm = () => {
    setFormMode('add');
    setFormData({ day: '', startTime: '', endTime: '' });
    setFormErrors({});
    setEditingSlotId(null);
    setOpenForm(true);
  };

  /**
   * Opens the edit time slot form with existing data
   * @param {Object} slot - Time slot object to edit
   */
  const openEditForm = (slot) => {
    setFormMode('edit');
    setFormData({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setFormErrors({});
    setEditingSlotId(slot._id);
    setOpenForm(true);
  };

  /**
   * Handles form submission for both add and edit operations
   */
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axiosInstance.post(`/timeslots/${trainerId}`, formData);
        setSnackbar({ open: true, message: 'Time slot added successfully', severity: 'success' });
      } else if (formMode === 'edit') {
        await axiosInstance.put(`/timeslots/slot/${editingSlotId}`, formData);
        setSnackbar({ open: true, message: 'Time slot updated successfully', severity: 'success' });
      }
      setOpenForm(false);
      fetchTimeSlots();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save time slot', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ===========================================================================
  // DELETE OPERATION HANDLERS
  // ===========================================================================

  /**
   * Opens delete confirmation dialog
   * @param {Object} slot - Time slot object to delete
   */
  const confirmDelete = (slot) => {
    setSlotToDelete(slot);
    setOpenDeleteDialog(true);
  };

  /**
   * Handles time slot deletion after confirmation
   */
  const handleDelete = async () => {
    if (!slotToDelete) return;

    setSubmitting(true);
    try {
      await axiosInstance.delete(`/timeslots/slot/${slotToDelete._id}`);
      setSnackbar({ open: true, message: 'Time slot deleted successfully', severity: 'success' });
      fetchTimeSlots();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete time slot', severity: 'error' });
    } finally {
      setOpenDeleteDialog(false);
      setSubmitting(false);
      setSlotToDelete(null);
    }
  };

  // ===========================================================================
  // NOTIFICATION HANDLERS
  // ===========================================================================

  /**
   * Closes the snackbar notification
   */
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      background: '#1f2937', // bg-800 background
    }}>
      {/* SIDEBAR NAVIGATION */}
      <StoreAdminSidebar />
      
      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: `${sidebarWidth}px` },
          backgroundColor: '#1f2937', // bg-800 background
          minHeight: '100vh',
          color: 'white',
        }}
      >
        {/* =====================================================================
        HEADER SECTION: Page Title and Add Button
        ===================================================================== */}
        <Box
          sx={{
            background: '#030712', // bg-950 for header
            p: 4,
            mb: 4,
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Fade in timeout={600}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography 
                  variant="h3" 
                  fontWeight={800}
                  sx={{
                    background: 'linear-gradient(45deg, #f44336, #e57373)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ⏰ Time Slot Management
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={openAddForm}
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #d32f2f, #f44336)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #c62828, #d32f2f)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                    },
                  }}
                >
                  Add New Time Slot
                </Button>
              </Box>

              <Typography variant="h6" color="rgba(255, 255, 255, 0.8)">
                Manage available time slots for your trainer
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* =====================================================================
        CONTENT SECTION: Time Slots Display
        ===================================================================== */}
        
        {/* LOADING STATE */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress color="error" />
          </Box>
        ) : 
        
        /* ERROR STATE */
        error ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: alpha('#f44336', 0.1),
              border: '1px solid',
              borderColor: alpha('#f44336', 0.3),
              borderRadius: 4,
            }}
          >
            <Typography color="error.light" variant="h6">
              ❌ {error}
            </Typography>
          </Paper>
        ) : 
        
        /* EMPTY STATE */
        timeSlots.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: alpha('#f44336', 0.08),
              border: '1px solid',
              borderColor: alpha('#f44336', 0.2),
              borderRadius: 4,
            }}
          >
            <ScheduleIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.7)', mb: 3 }} />
            <Typography variant="h5" gutterBottom fontWeight={700} color="white">
              📅 No Time Slots Found
            </Typography>
            <Typography color="rgba(255, 255, 255, 0.8)" sx={{ mb: 3 }}>
              Start by adding your first time slot to manage availability.
            </Typography>
          </Paper>
        ) : 
        
        /* TIME SLOTS LIST */
        (
          <Stack spacing={2}>
            {timeSlots.map((slot, index) => (
              <Zoom in={true} key={slot._id} timeout={300 + index * 100}>
                <Card
                  sx={{
                    p: 3,
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                      borderColor: '#f44336',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    {/* TIME SLOT INFORMATION */}
                    <Box display="flex" alignItems="center" gap={3}>
                      <Chip
                        icon={<CalendarTodayIcon />}
                        label={slot.day}
                        sx={{
                          bgcolor: alpha('#f44336', 0.2),
                          color: '#f44336',
                          fontWeight: 700,
                          fontSize: '1rem',
                          px: 2,
                          py: 2,
                          border: `2px solid ${alpha('#f44336', 0.3)}`,
                        }}
                      />
                      <Box display="flex" alignItems="center" gap={2}>
                        <AccessTimeIcon color="error" />
                        <Typography 
                          variant="h6" 
                          fontWeight={700}
                          sx={{
                            background: 'linear-gradient(45deg, #42a5f5, #90caf9)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {slot.startTime} - {slot.endTime}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* ACTION BUTTONS */}
                    <Box display="flex" gap={1}>
                      {/* EDIT BUTTON */}
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => openEditForm(slot)}
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          fontWeight: 600,
                          borderWidth: 2,
                          color: '#2196f3',
                          borderColor: '#2196f3',
                          '&:hover': {
                            borderWidth: 2,
                            backgroundColor: alpha('#2196f3', 0.1),
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        Edit
                      </Button>
                      
                      {/* DELETE BUTTON */}
                      <Button
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => confirmDelete(slot)}
                        disabled={submitting}
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          fontWeight: 600,
                          borderWidth: 2,
                          color: '#f44336',
                          borderColor: '#f44336',
                          '&:hover': {
                            borderWidth: 2,
                            backgroundColor: alpha('#f44336', 0.1),
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Zoom>
            ))}
          </Stack>
        )}

        {/* =====================================================================
        ADD/EDIT TIME SLOT DIALOG
        ===================================================================== */}
        <Dialog 
          open={openForm} 
          onClose={() => !submitting && setOpenForm(false)} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: '#1f2937',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
            },
          }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight={700}>
                {formMode === 'add' ? '➕ Add Time Slot' : '✏️ Edit Time Slot'}
              </Typography>
              <IconButton 
                onClick={() => !submitting && setOpenForm(false)} 
                disabled={submitting}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* =================================================================
              DAY SELECTION FIELD
              ================================================================= */}
              <FormControl fullWidth error={Boolean(formErrors.day)}>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select Day *</InputLabel>
                <Select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  displayEmpty
                  sx={{
                    color: 'white',
                    borderRadius: 3,
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
                  <MenuItem value="" disabled>
                    Select Day
                  </MenuItem>
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.day && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {formErrors.day}
                  </Typography>
                )}
              </FormControl>

              {/* =================================================================
              START TIME FIELD
              ================================================================= */}
              <TextField
                label="Start Time *"
                name="startTime"
                type="time"
                fullWidth
                value={formData.startTime}
                onChange={handleChange}
                error={Boolean(formErrors.startTime)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5-minute intervals
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon color="error" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    borderRadius: 3,
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
              {formErrors.startTime && (
                <Typography color="error" variant="caption">
                  {formErrors.startTime}
                </Typography>
              )}

              {/* =================================================================
              END TIME FIELD
              ================================================================= */}
              <TextField
                label="End Time *"
                name="endTime"
                type="time"
                fullWidth
                value={formData.endTime}
                onChange={handleChange}
                error={Boolean(formErrors.endTime)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }} // 5-minute intervals
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon color="error" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    borderRadius: 3,
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
              {formErrors.endTime && (
                <Typography color="error" variant="caption">
                  {formErrors.endTime}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            {/* CANCEL BUTTON */}
            <Button
              onClick={() => !submitting && setOpenForm(false)}
              disabled={submitting}
              variant="outlined"
              sx={{
                borderRadius: 3,
                fontWeight: 600,
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
            
            {/* SAVE BUTTON */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={20} color="inherit" />}
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4caf50, #81c784)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                },
              }}
            >
              {submitting ? 'Saving...' : (formMode === 'add' ? 'Add Time Slot' : 'Update Time Slot')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* =====================================================================
        DELETE CONFIRMATION DIALOG
        ===================================================================== */}
        <Dialog 
          open={openDeleteDialog} 
          onClose={() => !submitting && setOpenDeleteDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: '#1f2937',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
            },
          }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={700}>
              🗑️ Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" mb={2}>
              Are you sure you want to delete this time slot?
            </Typography>
            {slotToDelete && (
              <Paper
                sx={{
                  p: 2,
                  bgcolor: alpha('#f44336', 0.1),
                  border: `1px solid ${alpha('#f44336', 0.3)}`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  📅 {slotToDelete.day}
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                  ⏰ {slotToDelete.startTime} - {slotToDelete.endTime}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            {/* CANCEL DELETE BUTTON */}
            <Button
              onClick={() => !submitting && setOpenDeleteDialog(false)}
              disabled={submitting}
              variant="outlined"
              sx={{
                borderRadius: 3,
                fontWeight: 600,
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
            
            {/* CONFIRM DELETE BUTTON */}
            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
              sx={{
                borderRadius: 3,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #d32f2f, #f44336)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #c62828, #d32f2f)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                },
              }}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* =====================================================================
        SNACKBAR NOTIFICATION SYSTEM
        ===================================================================== */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ 
              width: '100%',
              borderRadius: 3,
              fontWeight: 600,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default TimeSlotManagement;