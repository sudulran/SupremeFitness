import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Avatar,
  Tooltip,
  Rating,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { SentimentSatisfied, SentimentVeryDissatisfied, SentimentNeutral } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axios from '../api/axiosInstance';
import Sentiment from 'sentiment';

import Footer from '../components/Footer';

// =============================================================================
// SENTIMENT ANALYSIS UTILITIES
// =============================================================================

// Initialize sentiment analyzer
const sentiment = new Sentiment();

/**
 * Determines sentiment type based on sentiment score
 * @param {number} score - Sentiment score from sentiment analysis
 * @returns {string} - 'positive', 'negative', or 'neutral'
 */
function getSentimentType(score) {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

/**
 * Returns appropriate sentiment icon based on sentiment type
 * @param {string} type - Sentiment type ('positive', 'negative', 'neutral')
 * @returns {JSX.Element} - Material-UI sentiment icon component
 */
function getSentimentIcon(type) {
  switch (type) {
    case 'positive':
      return <SentimentSatisfied sx={{ color: '#4caf50' }} />;
    case 'negative':
      return <SentimentVeryDissatisfied sx={{ color: '#f44336' }} />;
    default:
      return <SentimentNeutral sx={{ color: '#9e9e9e' }} />;
  }
}

/**
 * Returns sentiment chip with appropriate color
 * @param {string} type - Sentiment type ('positive', 'negative', 'neutral')
 * @returns {JSX.Element} - Material-UI chip component
 */
function getSentimentChip(type) {
  const sentimentConfig = {
    positive: { color: 'success', label: 'Positive' },
    negative: { color: 'error', label: 'Negative' },
    neutral: { color: 'default', label: 'Neutral' }
  };

  const config = sentimentConfig[type] || sentimentConfig.neutral;
  
  return (
    <Chip
      icon={getSentimentIcon(type)}
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}

// Sentiment filter labels for UI
const sentimentLabels = {
  all: 'All',
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

// =============================================================================
// MAIN COMPONENT: ADMIN REVIEWS
// =============================================================================

function AdminReviews() {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  const sidebarWidth = 10;

  // Data states
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [trainers, setTrainers] = useState([]);

  // Filter states
  const [selectedTrainer, setSelectedTrainer] = useState('all');
  const [sortOrder, setSortOrder] = useState('highToLow');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  // UI states
  const [loading, setLoading] = useState(true);

  // ===========================================================================
  // DATA FETCHING EFFECT
  // ===========================================================================

  /**
   * Fetches reviews data from API and processes sentiment analysis
   */
  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const response = await axios.get('/reviews/');
        const reviewsData = response.data;

        // Validation: Check if data is in expected format
        if (!Array.isArray(reviewsData)) {
          console.error('Unexpected data format for reviews:', reviewsData);
          return;
        }

        // Extract unique trainers from reviews data
        const trainersMap = {};
        reviewsData.forEach((r) => {
          const t = r.trainerId;
          if (t && t._id && !trainersMap[t._id]) {
            trainersMap[t._id] = { _id: t._id, name: t.name || 'Unknown' };
          }
        });

        const uniqueTrainers = Object.values(trainersMap);

        // Add sentiment analysis to each review
        const reviewsWithSentiment = reviewsData.map((r) => ({
          ...r,
          sentimentScore: sentiment.analyze(r.comment || '').comparative,
          sentimentType: getSentimentType(sentiment.analyze(r.comment || '').comparative),
        }));

        // Update state with processed data
        setTrainers(uniqueTrainers);
        setReviews(reviewsWithSentiment);
        setFilteredReviews(reviewsWithSentiment);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // ===========================================================================
  // FILTERING AND SORTING EFFECT
  // ===========================================================================

  /**
   * Applies filters and sorting whenever filter criteria change
   * Filters by: trainer, sentiment, search text
   * Sorts by: rating (high to low or low to high)
   */
  useEffect(() => {
    let updated = [...reviews];

    // FILTER: By selected trainer
    if (selectedTrainer !== 'all') {
      updated = updated.filter(
        (r) => r.trainerId && r.trainerId._id === selectedTrainer
      );
    }

    // FILTER: By sentiment type
    if (sentimentFilter !== 'all') {
      updated = updated.filter((r) => r.sentimentType === sentimentFilter);
    }

    // FILTER: By search text (client name or comment)
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      updated = updated.filter(
        (r) =>
          (r.comment || '').toLowerCase().includes(lowerSearch) ||
          (r.clientName || '').toLowerCase().includes(lowerSearch)
      );
    }

    // SORT: By rating (high to low or low to high)
    if (sortOrder === 'highToLow') {
      updated.sort((a, b) => b.rating - a.rating);
    } else {
      updated.sort((a, b) => a.rating - b.rating);
    }

    setFilteredReviews(updated);
  }, [selectedTrainer, sortOrder, reviews, sentimentFilter, searchText]);

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
            p: 4,
            ml: { sm: `${sidebarWidth}px` },
            backgroundColor: '#1f2937', // bg-gray-800
            minHeight: '100vh',
          }}
        >
          {/* PAGE HEADER */}
          <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            Reviews Management
          </Typography>

          {/* ===================================================================
          FILTERS AND CONTROLS CARD
          =================================================================== */}
          <Card sx={{ p: 2, mb: 4, boxShadow: 2, backgroundColor: '#062043' }}> {/* navy color */}
            <Grid container spacing={2} alignItems="center">
              
              {/* FILTER: By Trainer Dropdown */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white' }}>Filter by Trainer</InputLabel>
                  <Select
                    value={selectedTrainer}
                    label="Filter by Trainer"
                    onChange={(e) => setSelectedTrainer(e.target.value)}
                    sx={{ 
                      backgroundColor: '#0d2747', // input field color
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
                    <MenuItem value="all">All Trainers</MenuItem>
                    {trainers.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* FILTER: By Sentiment Toggle Buttons */}
              <Grid item xs={12} md={3}>
                <ToggleButtonGroup
                  value={sentimentFilter}
                  exclusive
                  onChange={(_, value) => value && setSentimentFilter(value)}
                  aria-label="sentiment filter"
                  fullWidth
                >
                  {Object.entries(sentimentLabels).map(([key, label]) => (
                    <ToggleButton 
                      key={key} 
                      value={key} 
                      aria-label={label}
                      sx={{ 
                        backgroundColor: '#0d2747', // input field color
                        color: 'white',
                        borderColor: '#374151',
                        '&.Mui-selected': {
                          backgroundColor: '#dc2626', // red-600
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#ef4444', // red-500
                          }
                        },
                        '&:hover': {
                          backgroundColor: '#1e3a5f',
                        }
                      }}
                    >
                      {key !== 'all' && getSentimentIcon(key)}
                      {` ${label}`}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>

              {/* SORT: By Rating Dropdown */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white' }}>Sort by Rating</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Sort by Rating"
                    onChange={(e) => setSortOrder(e.target.value)}
                    sx={{ 
                      backgroundColor: '#0d2747', // input field color
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
                    <MenuItem value="highToLow">High to Low</MenuItem>
                    <MenuItem value="lowToHigh">Low to High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* SEARCH: Text Input */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Search by client or comment"
                  variant="outlined"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={{ 
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
              </Grid>
            </Grid>

            {/* RESET FILTERS BUTTON - Shows only when filters are active */}
            {(selectedTrainer !== 'all' || sentimentFilter !== 'all' || searchText) && (
              <Box mt={2} textAlign="right">
                <Button 
                  variant="contained" 
                  onClick={() => {
                    setSelectedTrainer('all');
                    setSentimentFilter('all');
                    setSearchText('');
                    setSortOrder('highToLow');
                  }}
                  sx={{
                    backgroundColor: '#dc2626', // red-600
                    '&:hover': {
                      backgroundColor: '#ef4444', // red-500
                    }
                  }}
                >
                  Reset Filters
                </Button>
              </Box>
            )}
          </Card>

          {/* ===================================================================
          REVIEWS TABLE
          =================================================================== */}
          
          {/* LOADING STATE */}
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 10,
              }}
            >
              <CircularProgress sx={{ color: '#dc2626' }} /> {/* red-600 */}
            </Box>
          ) : 
          
          /* NO RESULTS STATE */
          filteredReviews.length === 0 ? (
            <Card sx={{ backgroundColor: '#062043', p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="white" mt={4}>
                No reviews found matching your criteria.
              </Typography>
            </Card>
          ) : 
          
          /* REVIEWS TABLE */
          (
            <TableContainer 
              component={Paper} 
              sx={{ 
                backgroundColor: '#062043', // navy color
                boxShadow: 3,
                borderRadius: 2,
                border: '1px solid #374151'
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="reviews table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#111827' }}> {/* bg-gray-900 */}
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Client</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Trainer</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Comment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }} align="center">Rating</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }} align="center">Sentiment</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }} align="center">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow 
                      key={review._id}
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: '#0d2747' }, // input field color on hover
                        transition: 'background-color 0.2s',
                        borderBottom: '1px solid #374151'
                      }}
                    >
                      {/* CLIENT CELL */}
                      <TableCell sx={{ color: 'white' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar 
                            sx={{ 
                              bgcolor: review.sentimentType === 'positive' ? '#4caf50' : 
                                      review.sentimentType === 'negative' ? '#f44336' : '#9e9e9e',
                              fontWeight: 'bold'
                            }}
                          >
                            {review.clientName ? review.clientName[0].toUpperCase() : '?'}
                          </Avatar>
                          <Typography variant="body1" fontWeight="500">
                            {review.clientName || 'Anonymous'}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* TRAINER CELL */}
                      <TableCell sx={{ color: 'white' }}>
                        {review.trainerId?.name || 'Unknown Trainer'}
                      </TableCell>

                      {/* COMMENT CELL */}
                      <TableCell sx={{ color: 'white', maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ 
                          whiteSpace: 'pre-wrap',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {review.comment || <em style={{ color: '#9ca3af' }}>No comment provided.</em>}
                        </Typography>
                      </TableCell>

                      {/* RATING CELL */}
                      <TableCell align="center" sx={{ color: 'white' }}>
                        <Tooltip title={`Rating: ${review.rating}/5`} placement="top">
                          <Box>
                            <Rating
                              value={review.rating || 0}
                              readOnly
                              precision={0.5}
                              size="medium"
                              sx={{
                                color:
                                  review.rating >= 4
                                    ? '#4caf50'
                                    : review.rating <= 2
                                    ? '#f44336'
                                    : '#ffb400',
                              }}
                            />
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#d1d5db' }}>
                              {review.rating}/5
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* SENTIMENT CELL */}
                      <TableCell align="center" sx={{ color: 'white' }}>
                        <Tooltip 
                          title={`Sentiment score: ${review.sentimentScore.toFixed(2)}`} 
                          placement="top"
                        >
                          <Box>
                            {getSentimentChip(review.sentimentType)}
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* DATE CELL */}
                      <TableCell align="center" sx={{ color: '#d1d5db' }}>
                        <Typography variant="body2">
                          {review.createdAt
                            ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                            : 'Date unknown'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
      
      {/* FOOTER COMPONENT */}
      <Footer />
    </>
  );
}

export default AdminReviews;