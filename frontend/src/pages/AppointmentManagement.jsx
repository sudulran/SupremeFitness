import React, { useEffect, useState, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Select,
  MenuItem,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  Card,
  FormControl,
  InputLabel,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventIcon from '@mui/icons-material/Event';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axiosInstance from '../api/axiosInstance';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend as PieLegend,
} from 'recharts';

import Footer from '../components/Footer';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Color mapping for different booking statuses in UI components
 */
const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'info',
};

/**
 * Color mapping for chart elements (Pie chart and Bar chart)
 */
const PIE_COLORS = {
  pending: '#f0ad4e',
  confirmed: '#5cb85c',
  cancelled: '#d9534f',
  completed: '#5bc0de',
};

// Memoized constants
const SIDEBAR_WIDTH = 10;
const INITIAL_STATUS_COUNTS = {
  pending: 0,
  confirmed: 0,
  cancelled: 0,
  completed: 0,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates an array of the last n months from current date
 */
const getLastMonths = (n) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }
  return months;
};

/**
 * Formats a date object to display as "MMM YYYY" (e.g., "Jan 2024")
 */
const formatMonth = (dateObj) => {
  return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
};

/**
 * Creates a standardized key for month-based grouping
 */
const monthKey = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Formats booking date for display
 */
const formatBookingDate = (bookingDate) => {
  if (!bookingDate) return 'N/A';
  const date = new Date(bookingDate);
  return date.toLocaleDateString();
};

/**
 * Formats time for display in 12-hour format
 */
const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Checks if an appointment is within the next 24 hours - FIXED VERSION
 */
const isAppointmentWithin24Hours = (booking) => {
  if (!booking.date) return false;
  
  try {
    // Parse the booking date
    const appointmentDate = new Date(booking.date);
    
    // If we have time slot information, combine it with the date
    if (booking.slotId && booking.slotId.startTime) {
      const [hours, minutes] = booking.slotId.startTime.split(':');
      appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      // If no specific time, assume start of day (9 AM as default)
      appointmentDate.setHours(9, 0, 0, 0);
    }
    
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // Return true if appointment is within next 24 hours AND in the future
    return hoursDiff <= 24 && hoursDiff > 0;
  } catch (error) {
    console.error('Error checking appointment time:', error, booking);
    return false;
  }
};

/**
 * Determines allowed status transitions based on current status
 */
const getAllowedStatusOptions = (currentStatus) => {
  const statusOptions = {
    pending: ['pending', 'confirmed', 'cancelled', 'completed'],
    confirmed: ['confirmed', 'completed'],
    cancelled: ['cancelled'],
    completed: ['completed'],
  };
  
  return statusOptions[currentStatus] || ['pending', 'confirmed', 'cancelled', 'completed'];
};

// =============================================================================
// MEMOIZED COMPONENTS
// =============================================================================

/**
 * Modal component for displaying upcoming appointments within 24 hours
 */
const NotificationsModal = React.memo(({ open, onClose, upcomingAppointments }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#062043',
          color: 'white',
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <NotificationsIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ color: 'white' }}>
          Upcoming Appointments (Next 24 Hours)
        </Typography>
        <Chip 
          label={upcomingAppointments.length} 
          size="small" 
          color="primary"
          sx={{ ml: 'auto' }}
        />
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {upcomingAppointments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#9ca3af' }}>
              No upcoming appointments in the next 24 hours
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {upcomingAppointments.map((appointment, index) => (
              <React.Fragment key={appointment._id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <EventIcon color="primary" />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {appointment.clientName}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                          <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                            Trainer: {appointment.trainerId?.name || 'N/A'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <EventIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                          <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                            Date: {formatBookingDate(appointment.date)}
                          </Typography>
                        </Box>
                        
                        {appointment.slotId && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                              Time: {appointment.slotId.day} {formatTime(appointment.slotId.startTime)} - {formatTime(appointment.slotId.endTime)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip 
                            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            size="small"
                            color={STATUS_COLORS[appointment.status] || 'default'}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {appointment.status === 'pending' && (
                            <Chip 
                              label="Action Required"
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                
                {index < upcomingAppointments.length - 1 && (
                  <Divider sx={{ borderColor: '#374151' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid #374151', p: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#9ca3af',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});

/**
 * Floating action button for notifications with badge count
 */
const FloatingNotificationButton = React.memo(({ onClick, notificationCount }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <Tooltip title={`${notificationCount} upcoming appointments in next 24 hours`}>
        <IconButton
          onClick={onClick}
          sx={{
            backgroundColor: '#dc2626',
            color: 'white',
            width: 60,
            height: 60,
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.3)',
            '&:hover': {
              backgroundColor: '#ef4444',
              transform: 'scale(1.1)',
              boxShadow: '0 6px 25px 0 rgba(0,0,0,0.4)',
            },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Badge 
            badgeContent={notificationCount} 
            color="error"
            overlap="circular"
          >
            <NotificationsIcon sx={{ fontSize: 28 }} />
          </Badge>
        </IconButton>
      </Tooltip>
    </Box>
  );
});

/**
 * Status Summary Cards Component
 */
const StatusSummaryCards = React.memo(({ totalStatusCounts }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
      {Object.entries(totalStatusCounts).map(([status, count]) => (
        <Card
          key={status}
          sx={{
            flex: '1 1 200px',
            minWidth: 180,
            px: 2,
            py: 2,
            borderLeft: `6px solid ${PIE_COLORS[status]}`,
            backgroundColor: '#062043',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'scale(1.02)' },
            boxShadow: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: '#d1d5db', textTransform: 'uppercase', fontWeight: 500 }}
          >
            {status}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: PIE_COLORS[status],
              mt: 0.1,
              textTransform: 'capitalize',
            }}
          >
            {count}
          </Typography>
        </Card>
      ))}
    </Box>
  );
});

/**
 * Analytics Charts Component
 */
const AnalyticsCharts = React.memo(({ chartData, currentMonthStatus }) => {
  const pieChartData = useMemo(() => 
    Object.entries(currentMonthStatus)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }))
      .filter(entry => entry.value > 0),
    [currentMonthStatus]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
      {/* BAR CHART: 6-Month Trend */}
      <Card sx={{ flex: 1, height: 300, p: 2, borderRadius: 2, backgroundColor: '#062043', boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
          Appointments Status Over Last 6 Months
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="monthLabel" stroke="#fff" />
            <YAxis allowDecimals={false} stroke="#fff" />
            <ReTooltip 
              contentStyle={{ 
                backgroundColor: '#062043', 
                border: '1px solid #374151',
                borderRadius: '4px',
                color: 'white'
              }}
            />
            <Legend />
            <Bar dataKey="pending" stackId="a" fill={PIE_COLORS.pending} />
            <Bar dataKey="confirmed" stackId="a" fill={PIE_COLORS.confirmed} />
            <Bar dataKey="cancelled" stackId="a" fill={PIE_COLORS.cancelled} />
            <Bar dataKey="completed" stackId="a" fill={PIE_COLORS.completed} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* PIE CHART: Current Month Breakdown */}
      <Card sx={{ flex: '0 0 320px', height: 300, p: 2, borderRadius: 2, backgroundColor: '#062043', boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
          Current Month Status Breakdown
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name.toLowerCase()]} />
              ))}
            </Pie>
            <PieTooltip
              contentStyle={{ 
                backgroundColor: '#062043', 
                border: '1px solid #374151',
                borderRadius: '4px',
                color: 'white'
              }}
            />
            <PieLegend 
              wrapperStyle={{
                color: 'white',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
});

/**
 * Booking Table Row Component
 */
const BookingTableRow = React.memo(({ booking, onStatusChange, onDelete }) => {
  const dayTime = booking.slotId
    ? `${booking.slotId.day} ${booking.slotId.startTime} - ${booking.slotId.endTime}`
    : 'N/A';
  const bookingDate = booking.date ? formatBookingDate(booking.date) : 'N/A';
  const allowedStatusOptions = getAllowedStatusOptions(booking.status);

  return (
    <TableRow 
      hover
      sx={{ 
        '&:hover': { backgroundColor: '#0d2747' },
        borderBottom: '1px solid #374151'
      }}
    >
      <TableCell sx={{ color: 'white' }}>{booking.trainerId?.name || 'N/A'}</TableCell>
      <TableCell sx={{ color: 'white' }}>{dayTime}</TableCell>
      <TableCell sx={{ color: 'white' }}>{booking.clientName}</TableCell>
      <TableCell sx={{ color: 'white' }}>
        {booking.clientContact?.phone}
        <br />
        {booking.clientContact?.email}
      </TableCell>
      <TableCell>
        <Select
          value={booking.status}
          onChange={(e) => onStatusChange(booking._id, e.target.value)}
          size="small"
          variant="outlined"
          sx={{
            minWidth: 120,
            backgroundColor: '#0d2747',
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#374151',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4b5563',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#dc2626',
            }
          }}
        >
          {allowedStatusOptions.map((statusOption) => (
            <MenuItem key={statusOption} value={statusOption}>
              {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </TableCell>
      <TableCell sx={{ color: 'white' }}>{bookingDate}</TableCell>
      <TableCell align="center">
        <Tooltip title="Delete Booking">
          <IconButton
            color="error"
            onClick={() => onDelete(booking)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

// =============================================================================
// MAIN COMPONENT: APPOINTMENT MANAGEMENT
// =============================================================================

function AppointmentManagement() {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  // Analytics states
  const [currentMonthStatus, setCurrentMonthStatus] = useState(INITIAL_STATUS_COUNTS);
  const [totalStatusCounts, setTotalStatusCounts] = useState(INITIAL_STATUS_COUNTS);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Dialog and filter states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Notification states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  // ===========================================================================
  // MEMOIZED VALUES
  // ===========================================================================

  /**
   * Filters bookings based on status filter and search term
   */
  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((b) =>
        b.clientName?.toLowerCase().includes(searchLower) ||
        b.trainerId?.name?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [bookings, searchTerm, statusFilter]);

  // ===========================================================================
  // EVENT HANDLERS (useCallback)
  // ===========================================================================

  /**
   * Fetches all bookings from the backend API
   */
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/bookings');
      const data = res.data || [];
      setBookings(data);
      processChartData(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Processes booking data to generate chart data and statistics
   */
  const processChartData = useCallback((bookingList) => {
    const months = getLastMonths(6);
    const data = months.map((monthDate) => ({
      monthLabel: formatMonth(monthDate),
      monthKey: monthKey(monthDate),
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    }));

    const currentMonthKey = monthKey(new Date());
    const currentStatus = { ...INITIAL_STATUS_COUNTS };
    const totalCounts = { ...INITIAL_STATUS_COUNTS };

    bookingList.forEach((b) => {
      const dateStr = b.createdAt || b.updatedAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const mKey = monthKey(d);
      const status = b.status;

      //add to bar chart count
      const idx = data.findIndex((entry) => entry.monthKey === mKey);
      if (idx >= 0 && status in data[idx]) {
        data[idx][status] = (data[idx][status] || 0) + 1;
      }

      //pie chart count(current month)
      if (mKey === currentMonthKey && status in currentStatus) {
        currentStatus[status] = (currentStatus[status] || 0) + 1;
      }

      //summary card count
      if (status in totalCounts) {
        totalCounts[status]++;
      }
    });

    setChartData(data);
    setCurrentMonthStatus(currentStatus);
    setTotalStatusCounts(totalCounts);
  }, []);

  /**
   * Checks for upcoming appointments within the next 24 hours - FIXED VERSION
   */
  const checkUpcomingAppointments = useCallback(() => {
    try {
      const upcoming = bookings.filter(booking => {
        // Include both confirmed AND pending appointments
        if (booking.status !== 'confirmed' && booking.status !== 'pending') {
          return false;
        }
        return isAppointmentWithin24Hours(booking);
      });
      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Error checking upcoming appointments:', error);
    }
  }, [bookings]);

  /**
   * Updates the status of a booking
   */
  const handleStatusChange = useCallback(async (bookingId, newStatus) => {
    try {
      await axiosInstance.put(`/bookings/status/${bookingId}`, { status: newStatus });
      setSnackbar({ open: true, message: 'Status updated.', severity: 'success' });
      await fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      setSnackbar({ open: true, message: 'Failed to update status.', severity: 'error' });
    }
  }, [fetchBookings]);

  /**
   * Deletes a booking after confirmation
   */
  const handleDeleteBooking = useCallback(async () => {
    try {
      await axiosInstance.delete(`/bookings/${deletingBooking._id}`);
      setSnackbar({ open: true, message: 'Booking deleted.', severity: 'success' });
      setDeleteDialogOpen(false);
      setDeletingBooking(null);
      await fetchBookings();
    } catch (err) {
      console.error('Error deleting booking:', err);
      setSnackbar({ open: true, message: 'Failed to delete booking.', severity: 'error' });
    }
  }, [deletingBooking, fetchBookings]);

  /**
   * Opens delete confirmation dialog
   */
  const handleOpenDelete = useCallback((booking) => {
    setDeletingBooking(booking);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * Closes delete confirmation dialog
   */
  const handleCloseDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingBooking(null);
  }, []);

  /**
   * Opens the notifications modal
   */
  const handleOpenNotifications = useCallback(() => {
    checkUpcomingAppointments();
    setNotificationsOpen(true);
  }, [checkUpcomingAppointments]);

  /**
   * Closes the notifications modal
   */
  const handleCloseNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  /**
   * Generates and downloads a PDF report
   */
  const handleDownloadPdf = useCallback(() => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Appointment Management Report', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Total Appointment Counts by Status', 14, 30);

    const summaryData = Object.entries(totalStatusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString(),
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['Status', 'Count']],
      body: summaryData,
      theme: 'grid',
      styles: { halign: 'center', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 50 },
    });

    const summaryEndY = doc.lastAutoTable.finalY;
    const sectionHeaderY = summaryEndY + 10;
    
    doc.setFontSize(14);
    doc.setTextColor(60);
    doc.text('Bookings in Last 6 Months', 14, sectionHeaderY);

    const tableColumn = ['Trainer', 'Time Slot', 'Client', 'Contact', 'Status', 'Booking Date'];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const filteredLast6Months = bookings.filter((b) => {
      const dateStr = b.createdAt || b.updatedAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);
    });

    const tableRows = filteredLast6Months.map((b) => {
      const dayTime = b.slotId
        ? `${b.slotId.day} ${b.slotId.startTime} - ${b.slotId.endTime}`
        : 'N/A';
      const bookingDate = b.date ? formatBookingDate(b.date) : 'N/A';
      const contact = [b.clientContact?.phone || '', b.clientContact?.email || '']
        .filter(Boolean)
        .join('\n');
      return [
        b.trainerId?.name || 'N/A',
        dayTime,
        b.clientName || '',
        contact,
        b.status.charAt(0).toUpperCase() + b.status.slice(1),
        bookingDate,
      ];
    });

    autoTable(doc, {
      startY: sectionHeaderY + 4,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: 50 },
      columnStyles: { 
        3: { cellWidth: 45 },
        1: { cellWidth: 30 },
        0: { cellWidth: 30 }
      },
      didDrawPage: () => {
        doc.setFontSize(10);
        doc.setTextColor(150);
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, pageHeight - 10);
      },
    });

    doc.save('Appointment_Report.pdf');
  }, [totalStatusCounts, bookings]);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    checkUpcomingAppointments();
    
    const interval = setInterval(() => {
      checkUpcomingAppointments();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkUpcomingAppointments]);

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================

  return (
    <>
      <Box sx={{ display: 'flex', background: '#1f2937' }}>
        {/* SIDEBAR NAVIGATION */}
        <StoreAdminSidebar />
        
        {/* MAIN CONTENT AREA */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            ml: { sm: `${SIDEBAR_WIDTH}px` },
            backgroundColor: '#1f2937',
            minHeight: '100vh',
          }}
        >
          {/* PAGE HEADER */}
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            Appointment Management
          </Typography>

          {/* PDF EXPORT BUTTON */}
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              onClick={handleDownloadPdf}
              sx={{
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: '#ef4444',
                }
              }}
            >
              Download Report as PDF
            </Button>
          </Box>

          {/* STATUS SUMMARY CARDS */}
          <StatusSummaryCards totalStatusCounts={totalStatusCounts} />

          {/* ANALYTICS CHARTS */}
          <AnalyticsCharts chartData={chartData} currentMonthStatus={currentMonthStatus} />

          {/* FILTERS AND SEARCH CONTROLS */}
          <Card sx={{ p: 2, mb: 2, backgroundColor: '#062043', boxShadow: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              
              {/* FILTER: Status Dropdown */}
              <Box sx={{ minWidth: 200 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white' }}>Filter by Status</InputLabel>
                  <Select
                    size="small"
                    value={statusFilter}
                    label="Filter by Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ 
                      backgroundColor: '#0d2747',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#374151',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4b5563',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#dc2626',
                      }
                    }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* SEARCH: Client/Trainer Search */}
              <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Search by client or trainer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ 
                    backgroundColor: '#0d2747',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#374151',
                      },
                      '&:hover fieldset': {
                        borderColor: '#4b5563',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#dc2626',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'white',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#dc2626',
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Card>

          {/* BOOKINGS TABLE */}
          <TableContainer component={Paper} sx={{ mb: 6, backgroundColor: '#062043', boxShadow: 3 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#111827' }}>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Trainer</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Time Slot</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Client</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Contact</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Booking Date</TableCell>
                  <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold', minWidth: 120 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: '#9ca3af', py: 4 }}>
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <BookingTableRow
                      key={booking._id}
                      booking={booking}
                      onStatusChange={handleStatusChange}
                      onDelete={handleOpenDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* DELETE CONFIRMATION DIALOG */}
          <Dialog 
            open={deleteDialogOpen} 
            onClose={handleCloseDelete}
            PaperProps={{
              sx: {
                backgroundColor: '#062043',
                color: 'white'
              }
            }}
          >
            <DialogTitle sx={{ color: 'white' }}>Confirm Delete</DialogTitle>
            <DialogContent sx={{ color: 'white' }}>
              Are you sure you want to delete this booking for{' '}
              <strong>{deletingBooking?.clientName}</strong>?
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={handleCloseDelete}
                sx={{ color: '#9ca3af' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteBooking}
                sx={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#ef4444',
                  }
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* SNACKBAR NOTIFICATIONS */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
      
      {/* NOTIFICATION SYSTEM COMPONENTS */}
      <FloatingNotificationButton 
        onClick={handleOpenNotifications}
        notificationCount={upcomingAppointments.length}
      />
      
      <NotificationsModal 
        open={notificationsOpen}
        onClose={handleCloseNotifications}
        upcomingAppointments={upcomingAppointments}
      />
      
      {/* FOOTER COMPONENT */}
      <Footer />
    </>
  );
}

export default AppointmentManagement;