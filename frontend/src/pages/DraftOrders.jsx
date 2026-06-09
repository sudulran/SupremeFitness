import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Payment as PaymentIcon,
  ShoppingCart as CartIcon,
  CalendarToday as DateIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';
import PaymentModal from '../pages/forms/PaymentModal';
import Footer from '../components/Footer';
import UserSidebar from '../components/UserSidebar';

// Color constants
const NAVY = '#062043';
const FIELD = '#0d2747';
const RED_600 = '#dc2626';
const RED_500 = '#ef4444';
const GRAY_800 = '#1f2937';
const GRAY_900 = '#111827';

const DraftOrders = () => {
  const [draftOrders, setDraftOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCart, setSelectedCart] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [updatingCart, setUpdatingCart] = useState(null);

  const fetchDraftOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/cart/draft-orders');
      // Filter to show only draft orders (not paid ones)
      const draftCarts = response.data.filter(cart => cart.status === 'draft');
      setDraftOrders(draftCarts);
      setError('');
    } catch (err) {
      console.error('Error fetching draft orders:', err);
      setError('Failed to load draft orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftOrders();
  }, []);

  const handleDeleteDraft = async (cartId) => {
    if (!window.confirm('Are you sure you want to delete this draft order?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/cart/remove/${cartId}`);
      setSuccess('Draft order deleted successfully');
      fetchDraftOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting draft order:', err);
      setError('Failed to delete draft order');
    }
  };

  // Function to update cart status to 'paid'
  const updateCartStatusToPaid = async (cartId) => {
    try {
      setUpdatingCart(cartId);
      await axiosInstance.put(`/cart/update/${cartId}`, {
        status: 'paid'
      });
      return true;
    } catch (err) {
      console.error('Error updating cart status:', err);
      setError('Failed to update order status');
      return false;
    } finally {
      setUpdatingCart(null);
    }
  };

  const handlePayment = (cart) => {
    setSelectedCart(cart);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      if (selectedCart) {
        // Update the cart status to 'paid' after successful payment
        const updateSuccess = await updateCartStatusToPaid(selectedCart._id);
        
        if (updateSuccess) {
          setSuccess('Payment completed successfully! Order status updated to paid.');
          setPaymentModalOpen(false);
          setSelectedCart(null);
          fetchDraftOrders(); // Refresh the list to remove the paid order
          setTimeout(() => setSuccess(''), 5000);
        } else {
          setError('Payment completed but failed to update order status. Please contact support.');
        }
      }
    } catch (err) {
      console.error('Error in payment success handling:', err);
      setError('An error occurred after payment. Please contact support.');
    }
  };

  // Calculate total amount for a cart
  const calculateTotal = (cart) => {
    if (cart.value) return cart.value;
    
    if (!cart.items || !Array.isArray(cart.items)) return 0;
    
    return cart.items.reduce((total, item) => {
      const itemPrice = item.product?.price || item.price || 0;
      const itemQuantity = item.quantity || 1;
      return total + (itemPrice * itemQuantity);
    }, 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get item count for a cart
  const getItemCount = (cart) => {
    if (!cart.items || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Get status chip color and label
  const getStatusChip = (status) => {
    const statusConfig = {
      draft: { color: 'warning', label: 'Draft', bgColor: '#f59e0b' },
      paid: { color: 'success', label: 'Paid', bgColor: '#10b981' },
      completed: { color: 'info', label: 'Completed', bgColor: '#3b82f6' },
      cancelled: { color: 'error', label: 'Cancelled', bgColor: RED_600 }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Chip 
        label={config.label} 
        size="small"
        sx={{ 
          fontWeight: 'bold',
          bgcolor: config.bgColor,
          color: '#ffffff',
          fontSize: '0.7rem',
          height: 24
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ bgcolor: GRAY_800 }}
      >
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: GRAY_800, minHeight: '100vh' }}>
      <UserSidebar />
      <Box sx={{ p: 3, marginLeft: { xs: 0, md: '250px' }, minHeight: '100vh' }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: { xs: 'center', md: 'left' },
              background: 'linear-gradient(45deg, #f44336, #e57373)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🛒 Draft Orders
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#d1d5db',
              textAlign: { xs: 'center', md: 'left' }
            }}
          >
            Manage your pending orders and complete payments
          </Typography>
        </Box>

        {/* Alerts Section */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              bgcolor: RED_600,
              color: '#ffffff',
              borderRadius: 2,
              '& .MuiAlert-icon': { color: '#ffffff' }
            }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              bgcolor: '#10b981',
              color: '#ffffff',
              borderRadius: 2,
              '& .MuiAlert-icon': { color: '#ffffff' }
            }} 
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Draft Orders Grid */}
        {draftOrders.length === 0 ? (
          <Card 
            sx={{ 
              bgcolor: NAVY,
              border: `1px solid ${FIELD}`,
              borderRadius: 3,
              textAlign: 'center',
              py: 8,
              maxWidth: 400,
              mx: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#d1d5db', mb: 1, fontWeight: 600 }}>
              No Draft Orders
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              All your orders have been processed or no draft orders available
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {draftOrders.map((cart) => (
              <Grid item xs={12} sm={6} md={4} key={cart._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: NAVY,
                    border: `1px solid ${FIELD}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: `0 8px 32px ${RED_600}33`,
                      transform: 'translateY(-4px)',
                      borderColor: RED_600
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    {/* Header Section */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="h2"
                          sx={{ 
                            color: '#ffffff', 
                            fontWeight: '600',
                            fontSize: '1rem',
                            lineHeight: 1.2
                          }}
                        >
                          Order #{cart._id.slice(-6).toUpperCase()}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <DateIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                            {formatDate(cart.createdAt)}
                          </Typography>
                        </Stack>
                      </Box>
                      {getStatusChip(cart.status || 'draft')}
                    </Stack>

                    {/* Quick Stats */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, p: 1, bgcolor: FIELD, borderRadius: 2 }}>
                      <Box textAlign="center">
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                          Items
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {getItemCount(cart)}
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                          Total
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#60a5fa', fontWeight: 'bold' }}>
                          ${calculateTotal(cart).toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Items Preview */}
                    {cart.items && cart.items.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: '600', display: 'block', mb: 1 }}>
                          ITEMS:
                        </Typography>
                        <Stack spacing={0.5}>
                          {cart.items.slice(0, 3).map((item, index) => {
                            const productName = item.product?.name || `Product ${index + 1}`;
                            const quantity = item.quantity || 1;
                            
                            return (
                              <Stack 
                                key={item._id || index} 
                                direction="row" 
                                justifyContent="space-between" 
                                alignItems="center"
                                sx={{ 
                                  px: 1, 
                                  py: 0.5, 
                                  borderRadius: 1,
                                  bgcolor: index % 2 === 0 ? FIELD : 'transparent'
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {productName}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#d1d5db',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    ml: 1
                                  }}
                                >
                                  x{quantity}
                                </Typography>
                              </Stack>
                            );
                          })}
                          {cart.items.length > 3 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#9ca3af',
                                textAlign: 'center',
                                fontStyle: 'italic'
                              }}
                            >
                              +{cart.items.length - 3} more items
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>

                  {/* Action Buttons */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Complete Payment">
                        <Button
                          variant="contained"
                          startIcon={<PaymentIcon />}
                          onClick={() => handlePayment(cart)}
                          disabled={updatingCart === cart._id}
                          fullWidth
                          sx={{ 
                            bgcolor: RED_600,
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            py: 1,
                            borderRadius: 2,
                            minHeight: '36px',
                            '&:hover': {
                              bgcolor: RED_500,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${RED_500}66`
                            },
                            '&:disabled': {
                              bgcolor: '#6b7280',
                              color: '#d1d5db'
                            }
                          }}
                        >
                          {updatingCart === cart._id ? 'Updating...' : 'Pay Now'}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete Draft">
                        <IconButton
                          onClick={() => handleDeleteDraft(cart._id)}
                          disabled={updatingCart === cart._id}
                          sx={{ 
                            bgcolor: RED_600,
                            color: '#ffffff',
                            borderRadius: 2,
                            minWidth: '36px',
                            minHeight: '36px',
                            '&:hover': {
                              bgcolor: RED_500,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${RED_500}66`
                            },
                            '&:disabled': {
                              bgcolor: '#6b7280',
                              color: '#d1d5db'
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Payment Modal */}
        {selectedCart && (
          <PaymentModal
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            totalAmount={calculateTotal(selectedCart)}
            cartId={selectedCart._id}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default DraftOrders;