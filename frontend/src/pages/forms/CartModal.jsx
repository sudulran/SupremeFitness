import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  Tooltip,
  DialogActions,
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  Chip,
  Fade,
  Slide,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  ShoppingBag as BagIcon,
} from "@mui/icons-material";
import axiosInstance from "../../api/axiosInstance";
import PaymentModal from "./PaymentModal";

// Slide transition for modal animation
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function CartModal({ open, handleClose, products, onCartUpdate, onProductQuantityUpdate }) {
  const navigate = useNavigate();
  
  // State management
  const [cartItems, setCartItems] = useState([]); // Items in the cart
  const [buyQuantities, setBuyQuantities] = useState({}); // Quantities user wants to buy
  const [confirmClear, setConfirmClear] = useState(false); // Confirmation for clearing cart
  const [paymentModalOpen, setPaymentModalOpen] = useState(false); // Payment modal visibility
  const [cartId, setCartId] = useState(null); // Cart ID for backend reference
  const [checkoutTotal, setCheckoutTotal] = useState(0); // Total amount for checkout
  const [loading, setLoading] = useState(false); // Loading state during operations
  const [error, setError] = useState(null); // Error messages

  // Constants for better UX
  const FREE_SHIPPING_THRESHOLD = 100; // Minimum amount for free shipping
  const SHIPPING_COST = 9.99; // Standard shipping cost

  /**
   * Get current user ID from localStorage
   * @returns {string|null} User ID or null if not logged in
   */
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id;
  };

  /**
   * Generate cart key for localStorage based on user ID
   * @returns {string|null} Cart key or null if user not logged in
   */
  const getCartKey = useCallback(() => {
    const userId = getUserId();
    return userId ? `cart_${userId}` : null;
  }, []);

  /**
   * Save cart items to localStorage and notify parent component
   * @param {Array} items - Cart items to save
   */
  const saveCart = (items) => {
    const cartKey = getCartKey();
    if (!cartKey) return;
    
    const cartData = {
      items: items.map((i) => ({ product: i.productId, quantity: i.quantity })),
    };
    localStorage.setItem(cartKey, JSON.stringify(cartData));
    
    // Notify parent component about cart update
    if (onCartUpdate) {
      onCartUpdate();
    }
  };

  /**
   * Update quantity of a specific cart item
   * @param {string} productId - ID of the product to update
   * @param {number} newQuantity - New quantity for the product
   */
  const updateCartItemQuantity = (productId, newQuantity) => {
    const updatedItems = cartItems.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            quantity: newQuantity,
            total: item.price * newQuantity
          }
        : item
    );
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  /**
   * Get real-time available quantity for a product
   * @param {string} productId - Product ID to check
   * @returns {number} Available quantity
   */
  const getAvailableQuantity = (productId) => {
    const product = products.find(p => p._id === productId);
    return product?.qty || 0;
  };

  /**
   * Sync cart with current product availability from products prop
   * Removes out-of-stock items and adjusts quantities
   */
  const syncCartWithAvailability = useCallback(() => {
    const cartKey = getCartKey();
    if (!cartKey) {
      setCartItems([]);
      setBuyQuantities({});
      return;
    }

    const storedCart = JSON.parse(localStorage.getItem(cartKey));
    if (storedCart?.items) {
      const enrichedItems = storedCart.items.map((item) => {
        const product = products.find((p) => p._id === item.product);
        const availableQty = getAvailableQuantity(item.product);
        
        // If product is not found in products array, it might be out of stock or deleted
        if (!product) {
          return null;
        }
        
        return {
          productId: item.product,
          name: product?.name || `Product ID: ${item.product}`,
          price: product?.price || 0,
          quantity: item.quantity,
          total: (product?.price || 0) * item.quantity,
          image: product?.img_src || null,
          category: product?.category || 'General',
          availableQuantity: availableQty
        };
      }).filter(item => item !== null && item.availableQuantity > 0); // Remove null and out-of-stock items
      
      setCartItems(enrichedItems);
      
      // Initialize buy quantities with the actual cart quantities, adjusted for availability
      const initialBuyQuantities = {};
      enrichedItems.forEach((item) => {
        const availableQty = getAvailableQuantity(item.productId);
        // Use the minimum of cart quantity and available quantity
        initialBuyQuantities[item.productId] = Math.min(item.quantity, availableQty);
      });
      setBuyQuantities(initialBuyQuantities);
    } else {
      setCartItems([]);
      setBuyQuantities({});
    }
  }, [open, products, getCartKey]);

  // Sync cart when modal opens or products change
  useEffect(() => {
    if (!open) return;
    setError(null);
    syncCartWithAvailability();
  }, [open, products, syncCartWithAvailability]);

  /**
   * Update cart items state and save to localStorage
   * @param {Array} newItems - New cart items array
   */
  const updateCartItems = (newItems) => {
    setCartItems(newItems);
    saveCart(newItems);
  };

  /**
   * Handle manual quantity input change
   * @param {string} productId - Product ID to update
   * @param {string} value - New quantity value
   */
  const handleQtyChange = (productId, value) => {
    const availableQty = getAvailableQuantity(productId);
    const parsed = parseInt(value, 10);
    let newQuantity;
    
    // Validate and constrain quantity
    if (isNaN(parsed) || parsed < 1) {
      newQuantity = 1;
    } else if (parsed > availableQty) {
      newQuantity = availableQty;
    } else {
      newQuantity = parsed;
    }
    
    setBuyQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
    updateCartItemQuantity(productId, newQuantity);
  };

  /**
   * Increment quantity for a product
   * @param {string} productId - Product ID to increment
   */
  const incrementQty = (productId) => {
    const availableQty = getAvailableQuantity(productId);
    setBuyQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.min(current + 1, availableQty);
      updateCartItemQuantity(productId, next);
      return { ...prev, [productId]: next };
    });
  };

  /**
   * Decrement quantity for a product
   * @param {string} productId - Product ID to decrement
   */
  const decrementQty = (productId) => {
    setBuyQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(current - 1, 1);
      updateCartItemQuantity(productId, next);
      return { ...prev, [productId]: next };
    });
  };

  /**
   * Remove item from cart completely and restore product quantity
   * @param {string} productId - Product ID to remove
   */
  const handleRemoveItem = (productId) => {
    const itemToRemove = cartItems.find(item => item.productId === productId);
    const updated = cartItems.filter((item) => item.productId !== productId);
    updateCartItems(updated);
    setBuyQuantities((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    
    // Notify parent to restore product quantity
    if (itemToRemove && onProductQuantityUpdate) {
      onProductQuantityUpdate(productId, itemToRemove.quantity, 'add');
    }
  };

  /**
   * Clear entire cart and restore all product quantities
   */
  const handleClearCart = () => {
    // Notify parent to restore all product quantities
    if (onProductQuantityUpdate) {
      cartItems.forEach(item => {
        onProductQuantityUpdate(item.productId, item.quantity, 'add');
      });
    }
    
    updateCartItems([]);
    setConfirmClear(false);
    setBuyQuantities({});
  };

  /**
   * Memoized calculations for cart summary
   * Optimized to prevent unnecessary recalculations
   */
  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const buyQty = buyQuantities[item.productId] || item.quantity;
      return sum + (item.price * buyQty);
    }, 0);
    
    const itemCount = cartItems.reduce((sum, item) => {
      const buyQty = buyQuantities[item.productId] || item.quantity;
      return sum + buyQty;
    }, 0);
    
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;
    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

    return {
      subtotal,
      shipping,
      total,
      itemCount,
      freeShippingRemaining,
      qualifiesForFreeShipping: subtotal >= FREE_SHIPPING_THRESHOLD,
    };
  }, [cartItems, buyQuantities]);

  /**
   * Handle checkout process
   * Validates quantities, creates cart draft, and opens payment modal
   */
  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getUserId();
      
      // Check if user is logged in
      if (!userId) {
        setError("Please log in to continue checkout");
        return;
      }

      // Validate all quantities before checkout using real-time data
      const validationErrors = [];
      const checkoutItems = [];

      for (const item of cartItems) {
        const availableQty = getAvailableQuantity(item.productId);
        const buyQty = buyQuantities[item.productId] || item.quantity;
        
        if (buyQty > availableQty) {
          validationErrors.push(`Not enough stock for "${item.name}". Only ${availableQty} available.`);
        } else if (buyQty > 0) {
          checkoutItems.push({
            product: item.productId,
            quantity: buyQty,
          });
        }
      }

      // Show validation errors if any
      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        setLoading(false);
        return;
      }

      // Check if there are items to checkout
      if (checkoutItems.length === 0) {
        setError("No items to checkout");
        setLoading(false);
        return;
      }

      const total = cartSummary.total;
      
      // Create cart with 'draft' status initially
      const payload = {
        userId,
        items: checkoutItems,
        value: total,
        status: "draft", // Always start as draft
      };

      // Create cart in backend
      const response = await axiosInstance.post("/cart/add", payload);
      setCartId(response.data._id);
      setCheckoutTotal(total);
      
      // Open payment modal - DON'T clear cart yet
      setPaymentModalOpen(true);
      
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.response?.data?.error || "Failed to process checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful payment
   * Confirms payment with backend and clears cart
   */
  const handlePaymentSuccess = async () => {
    try {
      if (!cartId) {
        console.error("No cart ID available for payment confirmation");
        return;
      }

      // Confirm payment and update cart status to 'paid'
      await axiosInstance.post(`/cart/confirm-payment/${cartId}`);
      
      // Clear cart after successful payment confirmation
      handleClearCart();
      
      setPaymentModalOpen(false);
      handleClose();
      navigate("/user-dashboard");
      
    } catch (error) {
      console.error("Payment confirmation error:", error);
      // If payment confirmation fails, keep the cart as draft
      setError("Payment processed but confirmation failed. Your order is saved as draft.");
      setPaymentModalOpen(false);
    }
  };

  /**
   * Handle payment error or cancellation
   * Clears cart when payment fails or is canceled
   */
  const handlePaymentError = () => {
    // Payment failed or canceled - clear cart automatically
    handleClearCart();
    setError("Payment was canceled or failed. Your cart has been cleared.");
    setPaymentModalOpen(false);
  };

  /**
   * Handle explicit payment modal close (user cancellation)
   */
  const handlePaymentCancel = () => {
    // User explicitly closed/canceled payment - clear cart
    handleClearCart();
    setError("Payment was canceled. Your cart has been cleared.");
    setPaymentModalOpen(false);
  };

  /**
   * Empty cart component shown when cart is empty
   */
  const EmptyCart = () => (
    <Box 
      sx={{ 
        textAlign: "center", 
        py: 8, 
        px: 4,
        backgroundColor: "white",
        borderRadius: 2,
        mx: 2,
        mb: 2,
        border: 1,
        borderColor: "divider"
      }}
    >
      <BagIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Your cart is empty
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Discover amazing products and add them to your cart
      </Typography>
      <Button 
        variant="contained" 
        size="large"
        onClick={handleClose}
        sx={{ 
          px: 4, 
          py: 1.5,
          backgroundColor: "#d32f2f",
          "&:hover": {
            backgroundColor: "#b71c1c",
          }
        }}
      >
        Continue Shopping
      </Button>
    </Box>
  );

  /**
   * Cart summary component showing totals and shipping info
   */
  const CartSummary = () => (
    <Paper elevation={2} sx={{ p: 3, backgroundColor: "white" }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Order Summary
      </Typography>
      
      <Stack spacing={2}>
        {/* Free shipping progress */}
        {!cartSummary.qualifiesForFreeShipping && cartSummary.freeShippingRemaining > 0 && (
          <Alert severity="info" icon={<ShippingIcon />}>
            Add ${cartSummary.freeShippingRemaining.toFixed(2)} more for free shipping!
          </Alert>
        )}

        {cartSummary.qualifiesForFreeShipping && (
          <Alert severity="success" icon={<ShippingIcon />}>
            🎉 You qualify for free shipping!
          </Alert>
        )}

        {/* Subtotal */}
        <Stack direction="row" justifyContent="space-between">
          <Typography>Items ({cartSummary.itemCount}):</Typography>
          <Typography>${cartSummary.subtotal.toFixed(2)}</Typography>
        </Stack>

        {/* Shipping cost */}
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <ShippingIcon fontSize="small" />
            <Typography>Shipping:</Typography>
          </Stack>
          <Typography color={cartSummary.shipping === 0 ? "success.main" : "text.primary"}>
            {cartSummary.shipping === 0 ? "FREE" : `$${cartSummary.shipping.toFixed(2)}`}
          </Typography>
        </Stack>

        <Divider />

        {/* Total */}
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Total:
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
            ${cartSummary.total.toFixed(2)}
          </Typography>
        </Stack>

        {/* Security badge */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <SecurityIcon fontSize="small" color="success" />
          <Typography variant="caption" color="text.secondary">
            Secure checkout with 256-bit SSL encryption
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );

  /**
   * Individual cart item component
   * @param {Object} props - Component props
   * @param {Object} props.item - Cart item data
   */
  const CartItem = ({ item }) => {
    const availableQty = getAvailableQuantity(item.productId);
    const buyQty = buyQuantities[item.productId] || item.quantity;

    return (
      <Card 
        elevation={0} 
        sx={{ 
          mb: 2, 
          border: 1, 
          borderColor: availableQty === 0 ? "error.main" : "divider",
          backgroundColor: "white",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: availableQty === 0 ? "error.main" : "primary.main",
            boxShadow: availableQty === 0 ? 0 : 2,
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Product image */}
            <Grid item xs={3} sm={2}>
              {item.image ? (
                <Box
                  component="img"
                  src={item.image}
                  alt={item.name}
                  sx={{
                    width: "100%",
                    maxWidth: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    opacity: availableQty === 0 ? 0.5 : 1
                  }}
                />
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    width: 80,
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "grey.100",
                    borderRadius: 2,
                    opacity: availableQty === 0 ? 0.5 : 1
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    No Image
                  </Typography>
                </Paper>
              )}
            </Grid>
            
            {/* Product details and controls */}
            <Grid item xs={9} sm={10}>
              <Stack spacing={2}>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      color: availableQty === 0 ? "error.main" : "text.primary"
                    }}
                  >
                    {item.name}
                    {availableQty === 0 && (
                      <Chip 
                        label="Out of Stock" 
                        size="small" 
                        color="error"
                        sx={{ ml: 1, fontSize: '0.6rem' }}
                      />
                    )}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      label={item.category} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ${item.price.toFixed(2)} each
                    </Typography>
                  </Stack>
                </Box>

                {/* Quantity controls and price */}
                <Stack 
                  direction={{ xs: "column", sm: "row" }} 
                  spacing={2} 
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ minWidth: 60 }}>
                      Quantity:
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => decrementQty(item.productId)}
                      disabled={buyQty <= 1 || availableQty === 0}
                      sx={{ 
                        border: 1, 
                        borderColor: "divider",
                        backgroundColor: "white",
                        "&:hover": { borderColor: "primary.main" }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      size="small"
                      value={buyQty}
                      onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                      inputProps={{ 
                        style: { textAlign: "center", width: 50 },
                        min: 1,
                        max: availableQty 
                      }}
                      disabled={availableQty === 0}
                      sx={{ 
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-root": {
                          height: 32,
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => incrementQty(item.productId)}
                      disabled={buyQty >= availableQty || availableQty === 0}
                      sx={{ 
                        border: 1, 
                        borderColor: "divider",
                        backgroundColor: "white",
                        "&:hover": { borderColor: "primary.main" }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                      variant="caption" 
                      color={availableQty === 0 ? "error" : "text.secondary"}
                    >
                      (Available: {availableQty})
                    </Typography>
                  </Stack>

                  {/* Item total and remove button */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: availableQty === 0 ? "error.main" : "primary.main" 
                      }}
                    >
                      ${(buyQty * item.price).toFixed(2)}
                    </Typography>
                    <Tooltip title="Remove Item Completely">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(item.productId)}
                        color="error"
                        sx={{ 
                          border: 1, 
                          borderColor: "error.main",
                          backgroundColor: "white",
                          "&:hover": { backgroundColor: "error.light", color: "white" }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Main Cart Modal */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: { 
            borderRadius: 3,
            maxHeight: "90vh",
            backgroundColor: "white"
          }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle sx={{ 
          backgroundColor: "#d32f2f",
          color: "white",
          py: 2
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <CartIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Shopping Cart
                </Typography>
                {cartItems.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'item' : 'items'} to buy
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton 
              onClick={handleClose}
              sx={{ 
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent sx={{ p: 0, backgroundColor: "white" }}>
          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ m: 2, mb: 1 }}>
              {error}
            </Alert>
          )}

          {/* Empty Cart or Cart Items */}
          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <Grid container spacing={3} sx={{ p: 3 }}>
              {/* Cart Items Column */}
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Cart Items
                </Typography>
                {cartItems.map((item) => (
                  <Fade in key={item.productId} timeout={300}>
                    <Box>
                      <CartItem item={item} />
                    </Box>
                  </Fade>
                ))}
                
                {/* Clear Cart Button */}
                {!confirmClear ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setConfirmClear(true)}
                    startIcon={<DeleteIcon />}
                    sx={{ mt: 2 }}
                  >
                    Clear All Items
                  </Button>
                ) : (
                  <Paper elevation={1} sx={{ p: 2, mt: 2, backgroundColor: "error.light" }}>
                    <Typography variant="body1" sx={{ mb: 2, color: "error.dark" }}>
                      Are you sure you want to clear your entire cart?
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleClearCart}
                      >
                        Yes, Clear Cart
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setConfirmClear(false)}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Grid>

              {/* Cart Summary Column */}
              <Grid item xs={12} lg={4}>
                <CartSummary />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        {/* Dialog Footer - Checkout Actions */}
        {cartItems.length > 0 && (
          <DialogActions sx={{ p: 3, backgroundColor: "white", borderTop: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                size="large"
                onClick={handleClose}
                sx={{ flex: 1 }}
              >
                Continue Shopping
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleCheckout}
                disabled={loading || cartItems.some(item => getAvailableQuantity(item.productId) === 0)}
                startIcon={loading ? <CircularProgress size={20} /> : <MoneyIcon />}
                sx={{ 
                  flex: 2,
                  backgroundColor: "#d32f2f",
                  "&:hover": {
                    backgroundColor: "#b71c1c",
                  }
                }}
              >
                {loading ? "Processing..." : `Checkout - $${cartSummary.total.toFixed(2)}`}
              </Button>
            </Stack>
          </DialogActions>
        )}
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={handlePaymentCancel} // Clear cart on payment cancellation
        totalAmount={checkoutTotal}
        cartId={cartId}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError} // Clear cart on payment error
      />
    </>
  );
}   

export default CartModal;