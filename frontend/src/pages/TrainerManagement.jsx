import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axiosInstance from '../api/axiosInstance';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
} from '@mui/material';
import AddTrainerModal from './forms/AddTrainerModal';
import UpdateTrainerModal from './forms/UpdateTrainerModal';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ScheduleIcon from '@mui/icons-material/Schedule';

import Footer from '../components/Footer';

// =============================================================================
// TRAINER MANAGEMENT COMPONENT
// =============================================================================

/**
 * Trainer Management Component for store administrators
 * Features: CRUD operations, filtering, grouping, and time slot management for trainers
 */
function TrainerManagement() {
  // ===========================================================================
  // CONSTANTS AND ROUTING
  // ===========================================================================
  
  const sidebarWidth = 10;
  const navigate = useNavigate();

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  // Data states
  const [trainers, setTrainers] = useState([]);
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Filter and grouping states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [groupBy, setGroupBy] = useState('none');

  // ===========================================================================
  // DATA FETCHING EFFECT
  // ===========================================================================

  /**
   * Fetches all trainers from API on component mount
   */
  useEffect(() => {
    fetchTrainers();
  }, []);

  // ===========================================================================
  // API FUNCTIONS
  // ===========================================================================

  /**
   * Fetches all trainers from the backend API
   */
  const fetchTrainers = async () => {
    try {
      const response = await axiosInstance.get('/trainers');
      setTrainers(response.data);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  /**
   * Handles adding a new trainer with image upload support
   * @param {Object} trainerData - Trainer data including image file
   */
  const handleAddTrainer = async (trainerData) => {
    try {
      await axiosInstance.post('/trainers/add-trainer', trainerData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTrainers();
    } catch (error) {
      console.error('Error adding trainer:', error);
    }
  };

  /**
   * Handles updating an existing trainer
   * @param {Object} trainerData - Updated trainer data
   * @param {string} id - Trainer ID to update
   */
  const handleUpdateTrainer = async (trainerData, id) => {
    try {
      await axiosInstance.put(`/trainers/update-trainer/${id}`, trainerData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTrainers();
    } catch (error) {
      console.error('Error updating trainer:', error);
    }
  };

  /**
   * Handles trainer deletion with confirmation dialog
   * @param {string} id - Trainer ID to delete
   */
  const handleDeleteTrainer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trainer?')) return;

    try {
      await axiosInstance.delete(`/trainers/delete-trainer/${id}`);
      fetchTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
    }
  };

  // ===========================================================================
  // FILTERING AND GROUPING LOGIC
  // ===========================================================================

  /**
   * Filters trainers based on search term and availability
   * Memoized for performance optimization
   */
  const filteredTrainers = useMemo(() => {
    return trainers
      .filter((trainer) => {
        // Filter by availability status
        if (filterAvailability === 'available') return trainer.available === true;
        if (filterAvailability === 'not_available') return trainer.available === false;
        return true;
      })
      .filter((trainer) => {
        // Search across multiple fields
        const lowerTerm = searchTerm.toLowerCase();
        return (
          trainer.name.toLowerCase().includes(lowerTerm) ||
          trainer.specialization.toLowerCase().includes(lowerTerm) ||
          (trainer.contact?.phone?.toLowerCase().includes(lowerTerm) ?? false) ||
          (trainer.contact?.email?.toLowerCase().includes(lowerTerm) ?? false)
        );
      });
  }, [trainers, filterAvailability, searchTerm]);

  /**
   * Groups trainers by specified criteria (specialization or availability)
   * Memoized for performance optimization
   */
  const groupedTrainers = useMemo(() => {
    if (groupBy === 'none') return { all: filteredTrainers };

    return filteredTrainers.reduce((groups, trainer) => {
      let key = '';
      
      // Determine grouping key based on selected criteria
      if (groupBy === 'specialization') key = trainer.specialization || 'Others';
      else if (groupBy === 'available') key = trainer.available ? 'Available' : 'Not Available';
      else key = 'Others';

      // Initialize group array if it doesn't exist
      if (!groups[key]) groups[key] = [];
      groups[key].push(trainer);

      return groups;
    }, {});
  }, [filteredTrainers, groupBy]);

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================

  return (
    <>
    <Box sx={{ display: 'flex', background: '#1f2937' }}> {/* bg-gray-800 */}
      {/* SIDEBAR NAVIGATION */}
      <StoreAdminSidebar />
      
      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: `${sidebarWidth}px` },
          backgroundColor: '#1f2937', // bg-gray-800
          minHeight: '100vh',
        }}
      >
        {/* =====================================================================
        HEADER SECTION: Title and Add Button
        ===================================================================== */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>Trainer Management</Typography>
          <Button 
            variant="contained" 
            onClick={() => setAddModalOpen(true)}
            sx={{
              backgroundColor: '#dc2626', // red-600
              '&:hover': {
                backgroundColor: '#ef4444', // red-500
              }
            }}
          >
            Add Trainer
          </Button>
        </Box>

        {/* =====================================================================
        FILTER AND SEARCH CONTROLS
        ===================================================================== */}
        <Card sx={{ p: 2, mb: 3, backgroundColor: '#062043', boxShadow: 2 }}> {/* navy color */}
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {/* SEARCH INPUT: Search across name, specialization, phone, and email */}
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                minWidth: 250,
                backgroundColor: '#0d2747', // input field color
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
                    borderColor: '#dc2626', // red-600
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#dc2626', // red-600
                }
              }}
            />

            {/* AVAILABILITY FILTER: Filter by available/not available status */}
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150, 
                backgroundColor: '#0d2747', // input field color
                borderRadius: 1,
              }}
            >
              <InputLabel sx={{ color: 'white' }}>Filter Availability</InputLabel>
              <Select
                value={filterAvailability}
                label="Filter Availability"
                onChange={(e) => setFilterAvailability(e.target.value)}
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#374151',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4b5563',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#dc2626', // red-600
                  }
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="not_available">Not Available</MenuItem>
              </Select>
            </FormControl>

            {/* GROUP BY SELECTOR: Organize trainers by criteria */}
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150, 
                backgroundColor: '#0d2747', // input field color
                borderRadius: 1,
              }}
            >
              <InputLabel sx={{ color: 'white' }}>Group By</InputLabel>
              <Select 
                value={groupBy} 
                label="Group By" 
                onChange={(e) => setGroupBy(e.target.value)}
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#374151',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#4b5563',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#dc2626', // red-600
                  }
                }}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="specialization">Specialization</MenuItem>
                <MenuItem value="available">Availability</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>

        {/* =====================================================================
        TRAINERS TABLE DISPLAY - Grouped or Ungrouped
        ===================================================================== */}
        {Object.entries(groupedTrainers).map(([group, trainersInGroup]) => (
          <Box key={group} mb={4}>
            {/* GROUP HEADER: Only show when grouping is enabled */}
            {groupBy !== 'none' && (
              <Typography variant="h6" sx={{ mb: 1, color: 'white', fontWeight: 'bold' }}>
                {group} ({trainersInGroup.length})
              </Typography>
            )}

            {/* TRAINERS TABLE */}
            <TableContainer component={Paper} sx={{ backgroundColor: '#062043', boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#111827' }}> {/* bg-gray-900 */}
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Image</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Specialization</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Experience (years)</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Available</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* EMPTY STATE: No trainers in current group */}
                  {trainersInGroup.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: '#9ca3af', py: 4 }}>
                        No trainers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    /* TRAINERS DATA ROWS */
                    trainersInGroup.map((trainer) => (
                      <TableRow 
                        key={trainer._id}
                        sx={{ 
                          '&:hover': { backgroundColor: '#0d2747' }, // input field color on hover
                          borderBottom: '1px solid #374151'
                        }}
                      >
                        {/* TRAINER IMAGE */}
                        <TableCell sx={{ color: 'white' }}>
                          {trainer.imageUrl ? (
                            <img
                              src={trainer.imageUrl}
                              alt={trainer.name}
                              style={{ width: 50, height: 50, borderRadius: '50%' }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                width: 50, 
                                height: 50, 
                                borderRadius: '50%', 
                                backgroundColor: '#374151',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af'
                              }}
                            >
                              No Image
                            </Box>
                          )}
                        </TableCell>
                        
                        {/* TRAINER BASIC INFORMATION */}
                        <TableCell sx={{ color: 'white' }}>{trainer.name}</TableCell>
                        <TableCell sx={{ color: 'white' }}>{trainer.specialization}</TableCell>
                        <TableCell sx={{ color: 'white' }}>{trainer.experience}</TableCell>
                        <TableCell sx={{ color: trainer.available ? '#10b981' : '#ef4444' }}>
                          {trainer.available ? 'Yes' : 'No'}
                        </TableCell>
                        
                        {/* CONTACT INFORMATION */}
                        <TableCell sx={{ color: 'white' }}>
                          {trainer.contact?.phone} <br />
                          {trainer.contact?.email}
                        </TableCell>
                        
                        {/* ACTION BUTTONS */}
                        <TableCell>
                          {/* EDIT BUTTON: Opens update modal */}
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setSelectedTrainer(trainer);
                              setUpdateModalOpen(true);
                            }}
                            sx={{
                              color: '#3b82f6',
                              '&:hover': {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          
                          {/* DELETE BUTTON: Deletes trainer with confirmation */}
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteTrainer(trainer._id)}
                            sx={{
                              color: '#dc2626',
                              '&:hover': {
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                          
                          {/* TIME SLOTS BUTTON: Navigates to time slot management */}
                          <IconButton
                            color="info"
                            onClick={() => navigate(`/admin-timeslot-management/${trainer._id}`)}
                            title="Manage Time Slots"
                            sx={{
                              color: '#06b6d4',
                              '&:hover': {
                                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                              }
                            }}
                          >
                            <ScheduleIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        {/* =====================================================================
        MODAL COMPONENTS
        ===================================================================== */}
        
        {/* ADD TRAINER MODAL */}
        <AddTrainerModal
          open={addModalOpen}
          handleClose={() => setAddModalOpen(false)}
          onAdd={handleAddTrainer}
        />

        {/* UPDATE TRAINER MODAL */}
        <UpdateTrainerModal
          open={updateModalOpen}
          handleClose={() => setUpdateModalOpen(false)}
          trainerData={selectedTrainer}
          onUpdate={handleUpdateTrainer}
        />
      </Box>
    </Box>
    
    {/* FOOTER COMPONENT */}
    <Footer />
    </>
  );
}

export default TrainerManagement;