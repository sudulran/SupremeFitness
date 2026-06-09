import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Sentiment from 'sentiment';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Stack,
  Paper,
  Divider,
  alpha,
  Fade,
  Zoom,
  Tooltip,
  CircularProgress,
  Alert,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  FitnessCenter as FitnessCenterIcon,
  Schedule as ScheduleIcon,
  SentimentSatisfiedAlt as SentimentPositiveIcon,
  SentimentDissatisfied as SentimentNegativeIcon,
  SentimentNeutral as SentimentNeutralIcon,
  Close as CloseIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import Footer from '../components/Footer';

// =============================================================================
// STAR RATING COMPONENT
// =============================================================================

/**
 * StarRating Component - Displays interactive star rating
 * @param {number} rating - Current rating value
 * @param {function} setRating - Function to update rating
 */
const StarRating = ({ rating, setRating }) => (
  <Box>
    {[1, 2, 3, 4, 5].map((i) => (
      <IconButton
        key={i}
        onClick={() => setRating(i.toString())}
        sx={{
          color: i <= Number(rating) ? '#ffc107' : 'rgba(255, 255, 255, 0.3)',
          fontSize: '2rem',
          p: 0.5,
          '&:hover': {
            color: i <= Number(rating) ? '#ffb300' : 'rgba(255, 255, 255, 0.5)',
            transform: 'scale(1.1)',
          },
        }}
      >
        {i <= Number(rating) ? <StarIcon fontSize="inherit" /> : <StarBorderIcon fontSize="inherit" />}
      </IconButton>
    ))}
  </Box>
);

// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();

// =============================================================================
// MAIN REVIEWS COMPONENT
// =============================================================================

function Reviews() {
  // Router hooks
  const { trainerId } = useParams();
  const navigate = useNavigate();
  
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  // State for trainer and reviews data
  const [trainer, setTrainer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Modal & form state management
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentReview, setCurrentReview] = useState(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  // Filter & Sort state
  const [filterRating, setFilterRating] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [sortOption, setSortOption] = useState(''); // '', 'low-to-high', 'high-to-low'

  // =============================================================================
  // COMPUTED VALUES & MEMOIZED DATA
  // =============================================================================

  /**
   * Calculate average rating from reviews
   */
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  /**
   * Fetch trainer details and reviews from API
   */
  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Fetch trainer data
      const trainerRes = await api.get(`/trainers/${trainerId}`);
      setTrainer(trainerRes.data);

      // Fetch reviews for the trainer
      const reviewsRes = await api.get(`/reviews/${trainerId}`);
      setReviews(reviewsRes.data);
    } catch (err) {
      setErrors([err.response?.data?.message || err.message || 'Failed to fetch data']);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReviews();
  }, [trainerId]);

  /**
   * Filter and sort reviews based on user selection
   */
  const filteredReviews = useMemo(() => {
    let filtered = reviews.filter((r) => {
      const matchRating = filterRating ? r.rating === Number(filterRating) : true;
      const matchKeyword = filterKeyword ? r.comment?.toLowerCase().includes(filterKeyword.toLowerCase()) : true;
      return matchRating && matchKeyword;
    });

    // Apply sorting based on selected option
    if (sortOption === 'low-to-high') {
      filtered = [...filtered].sort((a, b) => a.rating - b.rating);
    } else if (sortOption === 'high-to-low') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [reviews, filterRating, filterKeyword, sortOption]);

  // =============================================================================
  // FORM VALIDATION & HANDLERS
  // =============================================================================

  /**
   * Validate review form inputs
   * @returns {Array} Array of error messages
   */
  const validateForm = () => {
    const errs = [];
    const r = Number(rating);
    
    // Rating validation
    if (!rating) errs.push('Rating is required');
    else if (!Number.isInteger(r) || r < 1 || r > 5) errs.push('Rating must be 1-5');
    
    // Comment length validation
    if (comment.length > 500) errs.push('Comment max 500 characters');
    
    return errs;
  };

  /**
   * Open add/edit review modal
   * @param {string} mode - 'add' or 'edit'
   * @param {Object} review - Review object for edit mode
   */
  const openModal = (mode, review = null) => {
    setModalMode(mode);
    setCurrentReview(review);
    setRating(review?.rating?.toString() || '');
    setComment(review?.comment || '');
    setErrors([]);
    setSuccessMessage('');
    setModalOpen(true);
  };

  /**
   * Close review modal and reset form
   */
  const closeModal = () => setModalOpen(false);

  /**
   * Handle review form submission (add/edit)
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');
    
    // Validate form inputs
    const errs = validateForm();
    if (errs.length) return setErrors(errs);

    try {
      // Prepare payload based on mode
      const payload = modalMode === 'add'
        ? { 
            rating: Number(rating), 
            comment, 
            clientName: currentUser.name || currentUser.username || 'Anonymous' 
          }
        : { 
            rating: Number(rating), 
            comment 
          };

      // Determine API endpoint and method
      const url = modalMode === 'add' ? `/reviews/${trainerId}` : `/reviews/${currentReview._id}`;
      const method = modalMode === 'add' ? api.post : api.put;

      // Make API call
      await method(url, payload);
      
      // Refresh reviews and show success message
      await fetchReviews();
      setSuccessMessage(modalMode === 'add' ? 'Review added!' : 'Review updated!');
      closeModal();
    } catch (err) {
      setErrors(err.response?.data?.errors?.map(e => e.msg) || [err.response?.data?.message || 'Failed']);
    }
  };

  /**
   * Handle review deletion
   */
  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await api.delete(`/reviews/${reviewToDelete._id}`);
      await fetchReviews();
      setSuccessMessage('Review deleted!');
      setDeleteModalOpen(false);
    } catch (err) {
      setErrors(err.response?.data?.errors?.map(e => e.msg) || [err.response?.data?.message || 'Failed to delete']);
    }
  };

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Check if current user can edit/delete a review
   * @param {Object} review - Review object
   * @returns {boolean} True if user can edit/delete
   */
  const canEdit = (review) => review.clientName === (currentUser.name || currentUser.username);

  /**
   * Get first letter for user avatar
   * @param {string} name - User name
   * @returns {string} First letter uppercase
   */
  const getFirstLetter = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  /**
   * Analyze comment sentiment
   * @param {string} comment - Review comment
   * @returns {string} Sentiment label
   */
  const getSentimentLabel = (comment) => {
    if (!comment) return 'Neutral';
    const result = sentimentAnalyzer.analyze(comment);
    if (result.score > 0) return 'Positive';
    if (result.score < 0) return 'Negative';
    return 'Neutral';
  };

  /**
   * Get sentiment color for display
   * @param {string} sentiment - Sentiment label
   * @returns {string} Color code
   */
  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Positive') return '#4caf50';
    if (sentiment === 'Negative') return '#f44336';
    return '#9e9e9e';
  };

  /**
   * Get sentiment icon for display
   * @param {string} sentiment - Sentiment label
   * @returns {JSX.Element} Sentiment icon
   */
  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'Positive') return <SentimentPositiveIcon />;
    if (sentiment === 'Negative') return <SentimentNegativeIcon />;
    return <SentimentNeutralIcon />;
  };

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          background: '#1f2937', // bg-800 background
          position: 'relative',
          color: 'white',
        }}
      >
        {/* Main Container with reduced width */}
        <Container maxWidth="md" sx={{ py: 4 }}> {/* Changed from maxWidth="lg" to "md" for reduced width */}
          
          {/* Back Navigation Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 3,
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
            variant="outlined"
          >
            Back
          </Button>

          {/* Main Card with Navy Blue Background - Reduced Width */}
          <Card
            sx={{
              borderRadius: 4,
              background: 'linear-gradient(135deg, #1e3a5f, #2d4a7c)', // Navy blue background
              border: '2px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              maxWidth: '100%', // Ensure it doesn't exceed container
              mx: 'auto', // Center the card
            }}
          >
            <CardContent sx={{ p: 4 }}>
              
              {/* Error and Success Messages Display */}
              {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                  {errors.map((e, idx) => (
                    <div key={idx}>{e}</div>
                  ))}
                </Alert>
              )}
              
              {successMessage && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
                  {successMessage}
                </Alert>
              )}

              {/* Trainer Information Card */}
              {trainer && (
                <Fade in timeout={600}>
                  <Card
                    sx={{
                      mb: 4,
                      borderRadius: 4,
                      background: '#0d1b2a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      overflow: 'hidden',
                      p: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={4}
                      alignItems="center"
                    >
                      {/* Trainer Profile Image */}
                      <Box
                        component="img"
                        src={trainer.imageUrl || '/default-trainer.png'}
                        alt={trainer.name}
                        sx={{
                          width: 150, // Slightly reduced for better proportion
                          height: 150,
                          borderRadius: '10%',
                          objectFit: 'cover',
                          border: '4px solid #fff',
                          boxShadow: 3,
                        }}
                      />

                      {/* Trainer Details Section */}
                      <CardContent sx={{ flex: 1, p: 0 }}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          sx={{
                            mb: 2,
                            background: 'white',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {trainer.name}
                        </Typography>

                        <Stack spacing={2}>
                          {/* Specialization */}
                          <Box display="flex" alignItems="center" gap={1}>
                            <FitnessCenterIcon sx={{ color: '#64b5f6' }} />
                            <Typography variant="body1" color="rgba(255, 255, 255, 0.9)">
                              <strong>Specialization:</strong> {trainer.specialization || 'N/A'}
                            </Typography>
                          </Box>

                          {/* Experience */}
                          <Box display="flex" alignItems="center" gap={1}>
                            <ScheduleIcon sx={{ color: '#ffb74d' }} />
                            <Typography variant="body1" color="rgba(255, 255, 255, 0.9)">
                              <strong>Experience:</strong> {trainer.experience || 'N/A'} years
                            </Typography>
                          </Box>

                          {/* Average Rating */}
                          <Box display="flex" alignItems="center" gap={1}>
                            <StarIcon sx={{ color: '#ffd54f' }} />
                            <Typography variant="body1" color="rgba(255, 255, 255, 0.9)">
                              <strong>Average Rating:</strong> {averageRating} / 5 ({reviews.length} reviews)
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Stack>
                  </Card>
                </Fade>
              )}

              {/* Search and Filtering Section */}
              <Paper
                sx={{
                  p: 3,
                  mb: 4,
                  background: '#0d1b2a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 4,
                }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight={600} 
                  sx={{ 
                    mb: 3, 
                    color: 'white',
                    textAlign: 'center'
                  }}
                >
                  Filter & Search Reviews
                </Typography>
                
                {/* Filter Controls Row */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  
                  {/* Rating Filter Dropdown */}
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Rating</InputLabel>
                    <Select
                      value={filterRating}
                      label="Rating"
                      onChange={e => setFilterRating(e.target.value)}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(13, 27, 42, 0.7)',
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    >
                      <MenuItem value="">All Ratings</MenuItem>
                      {[1, 2, 3, 4, 5].map(r => (
                        <MenuItem key={r} value={r}>
                          {r} ★
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Sort Options Dropdown */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Sort By</InputLabel>
                    <Select
                      value={sortOption}
                      label="Sort By"
                      onChange={e => setSortOption(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <SortIcon sx={{ color: '#64b5f6', fontSize: '1.2rem' }} />
                        </InputAdornment>
                      }
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(13, 27, 42, 0.7)',
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    >
                      <MenuItem value="">Default</MenuItem>
                      <MenuItem value="low-to-high">Rating: Low to High</MenuItem>
                      <MenuItem value="high-to-low">Rating: High to Low</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Search Input Field */}
                  <TextField
                    size="small"
                    placeholder="Search reviews..."
                    value={filterKeyword}
                    onChange={e => setFilterKeyword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#64b5f6' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        bgcolor: 'rgba(13, 27, 42, 0.7)',
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Paper>

              {/* Reviews Section */}
              <Box>
                
                {/* Reviews Header with Add Button */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{
                      background: 'linear-gradient(45deg, #64b5f6, #90caf9)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Reviews ({filteredReviews.length})
                  </Typography>
                  
                  {/* Add Review Button - Only show if user is logged in */}
                  {currentUser && (
                    <Button
                      variant="contained"
                      onClick={() => openModal('add')}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #d21919ff, #f54242ff)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #c01515ff, #d21919ff)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                        },
                      }}
                    >
                      Add Review
                    </Button>
                  )}
                </Box>

                {/* Reviews List Content */}
                {loading ? (
                  // Loading State
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress sx={{ color: '#041727ff' }} />
                  </Box>
                ) : filteredReviews.length === 0 ? (
                  // Empty State
                  <Paper
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      bgcolor: alpha('#64b5f6', 0.08),
                      border: '1px solid',
                      borderColor: alpha('#64b5f6', 0.2),
                      borderRadius: 4,
                    }}
                  >
                    <Typography variant="h6" color="rgba(255, 255, 255, 0.8)">
                      No reviews found.
                    </Typography>
                  </Paper>
                ) : (
                  // Reviews List
                  <Stack spacing={3}>
                    {filteredReviews.map((r, index) => {
                      const sentiment = getSentimentLabel(r.comment);
                      return (
                        <Zoom in={true} key={r._id} timeout={300 + index * 100}>
                          <Card
                            sx={{
                              borderRadius: 4,
                              background: '#0d1b2a',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Stack spacing={2}>
                                
                                {/* Review Header with User Avatar and Actions */}
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                  <Box display="flex" alignItems="flex-start" gap={2}>
                                    {/* User Avatar with First Letter */}
                                    <Avatar
                                      sx={{
                                        bgcolor: '#64b5f6',
                                        width: 48,
                                        height: 48,
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      {getFirstLetter(r.clientName)}
                                    </Avatar>
                                    
                                    {/* User Rating and Name */}
                                    <Box>
                                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        {[...Array(5)].map((_, i) => (
                                          <StarIcon
                                            key={i}
                                            sx={{
                                              color: i < r.rating ? '#ffd54f' : 'rgba(255, 255, 255, 0.3)',
                                              fontSize: '1.5rem',
                                            }}
                                          />
                                        ))}
                                      </Box>
                                      <Typography variant="body1" fontWeight={600} color="white">
                                        {r.clientName || 'User'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  {/* Edit/Delete Actions - Only show if user owns the review */}
                                  {canEdit(r) && (
                                    <Box display="flex" gap={1}>
                                      <Tooltip title="Edit Review">
                                        <IconButton
                                          onClick={() => openModal('edit', r)}
                                          sx={{
                                            color: '#4fc3f7',
                                            bgcolor: alpha('#4fc3f7', 0.1),
                                            '&:hover': {
                                              bgcolor: alpha('#4fc3f7', 0.2),
                                              transform: 'translateY(-2px)',
                                            },
                                          }}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </Tooltip>
                                      
                                      <Tooltip title="Delete Review">
                                        <IconButton
                                          onClick={() => { setReviewToDelete(r); setDeleteModalOpen(true); }}
                                          sx={{
                                            color: '#f44336',
                                            bgcolor: alpha('#f44336', 0.1),
                                            '&:hover': {
                                              bgcolor: alpha('#f44336', 0.2),
                                              transform: 'translateY(-2px)',
                                            },
                                          }}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>

                                {/* Review Comment Text */}
                                <Typography variant="body1" color="white" sx={{ lineHeight: 1.6, ml: 7 }}>
                                  {r.comment || <em style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No comment</em>}
                                </Typography>

                                {/* Sentiment Analysis Chip */}
                                <Box display="flex" alignItems="center" gap={1} sx={{ ml: 7 }}>
                                  <Chip
                                    icon={getSentimentIcon(sentiment)}
                                    label={`Sentiment: ${sentiment}`}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha(getSentimentColor(sentiment), 0.1),
                                      color: getSentimentColor(sentiment),
                                      border: `1px solid ${alpha(getSentimentColor(sentiment), 0.3)}`,
                                      fontWeight: 600,
                                    }}
                                  />
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Zoom>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* ============================================================================= */}
          {/* ADD/EDIT REVIEW MODAL */}
          {/* ============================================================================= */}
          
          <Dialog
            open={modalOpen}
            onClose={closeModal}
            maxWidth="sm"
            fullWidth
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
                  {modalMode === 'add' ? 'Add Review' : 'Edit Review'}
                </Typography>
                <IconButton onClick={closeModal} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            {/* Review Form */}
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Stack spacing={3}>
                  
                  {/* Star Rating Input */}
                  <Box>
                    <Typography variant="body1" fontWeight={600} mb={1}>
                      Rating *
                    </Typography>
                    <StarRating rating={rating} setRating={setRating} />
                  </Box>

                  {/* Comment Text Area */}
                  <TextField
                    label="Comment"
                    multiline
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    inputProps={{ maxLength: 500 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#64b5f6',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    }}
                  />
                  
                  {/* Character Counter */}
                  <Typography variant="caption" textAlign="right" color="rgba(255, 255, 255, 0.7)">
                    {comment.length}/500 characters
                  </Typography>
                </Stack>
              </DialogContent>
              
              {/* Form Actions */}
              <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                  onClick={closeModal}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    borderWidth: 2,
                    color: 'white',
                    borderColor: '#64b5f6',
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: alpha('#f66464ff', 0.1),
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
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
                  {modalMode === 'add' ? 'Submit Review' : 'Update Review'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* ============================================================================= */}
          {/* DELETE CONFIRMATION MODAL */}
          {/* ============================================================================= */}
          
          <Dialog
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
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
              <Typography variant="h6" fontWeight={700}>
                Confirm Delete
              </Typography>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" mb={2}>
                Are you sure you want to delete this review?
              </Typography>
              
              {/* Review Preview for Confirmation */}
              {reviewToDelete && (
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight={600}>Rating:</Typography>
                    <Box display="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          sx={{
                            color: i < reviewToDelete.rating ? '#ffd54f' : 'rgba(255, 255, 255, 0.3)',
                            fontSize: '1.2rem',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Comment:</Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.8)">
                      {reviewToDelete.comment || <em>No comment</em>}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </DialogContent>
            
            {/* Delete Confirmation Actions */}
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button
                onClick={() => setDeleteModalOpen(false)}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  borderWidth: 2,
                  color: 'white',
                  borderColor: '#f66464ff',
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: alpha('#f66464ff', 0.1),
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="contained"
                color="error"
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
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
      <Footer />
    </>
  );
}

export default Reviews;