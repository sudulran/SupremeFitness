import React, { useEffect, useState } from 'react';
import UserStoreDashboard from '../components/UserSidebar';
import axiosInstance from '../api/axiosInstance';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CartModal from './forms/CartModal';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Badge,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Container,
  Skeleton,
  Rating,
  Tooltip,
  Fab,
  useMediaQuery,
  useTheme,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  Autocomplete
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RecommendIcon from '@mui/icons-material/Recommend';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StoreIcon from '@mui/icons-material/Store';

import Footer from '../components/Footer';
import UserSidebar from '../components/UserSidebar';

function UserDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarWidth = 240;
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [favorites, setFavorites] = useState(new Set());
  const [cartItemCount, setCartItemCount] = useState(0);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    categories: [],
    keywords: [],
    priceRange: { min: 0, max: 1000 },
    brands: [],
    enableRecommendations: true
  });
  const [showRecommendations, setShowRecommendations] = useState(true);

  const availableKeywords = [
    'organic', 'premium', 'eco-friendly', 'wireless', 'smart', 'portable',
    'durable', 'lightweight', 'waterproof', 'vintage', 'modern', 'luxury',
    'budget-friendly', 'professional', 'gaming', 'fitness', 'outdoor',
    'indoor', 'kitchen', 'electronic', 'handmade', 'imported', 'local'
  ];

  useEffect(() => {
    fetchAllProducts();
    loadFavorites();
    loadUserPreferences();
    updateCartCount();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, sortBy, userPreferences]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/products/');
      const productsWithRatings = response.data.map(product => ({
        ...product,
        rating: Math.random() * 2 + 3,
        reviewCount: Math.floor(Math.random() * 100) + 10,
        description: product.description || `High-quality ${product.name.toLowerCase()} perfect for your needs. Features excellent build quality and great value for money.`,
        originalQty: product.qty, // Store original quantity
      }));
      
      // Adjust quantities based on current cart items
      const adjustedProducts = adjustProductQuantities(productsWithRatings);
      setProducts(adjustedProducts);

      const initialQuantities = {};
      adjustedProducts.forEach(product => {
        initialQuantities[product._id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  // Adjust product quantities based on what's in the cart
  const adjustProductQuantities = (products) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return products;

    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || { items: [] };
    
    return products.map(product => {
      const cartItem = cart.items.find(item => item.product === product._id);
      if (cartItem) {
        // Reduce available quantity by what's already in cart
        return {
          ...product,
          qty: Math.max(0, product.originalQty - cartItem.quantity)
        };
      }
      return product;
    });
  };

  const loadUserPreferences = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      const prefKey = `preferences_${user.id}`;
      const savedPreferences = JSON.parse(localStorage.getItem(prefKey));
      if (savedPreferences) {
        setUserPreferences(savedPreferences);
      }
    }
  };

  const saveUserPreferences = (preferences) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      const prefKey = `preferences_${user.id}`;
      localStorage.setItem(prefKey, JSON.stringify(preferences));
      setUserPreferences(preferences);
      toast.success('Preferences saved successfully!');
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'relevance':
          return a.name.localeCompare(b.name);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  };

  const loadFavorites = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      const favKey = `favorites_${user.id}`;
      const savedFavorites = JSON.parse(localStorage.getItem(favKey)) || [];
      setFavorites(new Set(savedFavorites));
    }
  };

  const updateCartCount = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) {
      const cartKey = `cart_${user.id}`;
      const cart = JSON.parse(localStorage.getItem(cartKey)) || { items: [] };
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    }
  };

  const handleQuantityChange = (productId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  const toggleFavorite = (productId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      toast.error('Please log in to save favorites.');
      return;
    }

    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
      toast.info('Removed from favorites');
    } else {
      newFavorites.add(productId);
      toast.success('Added to favorites');
    }
    
    setFavorites(newFavorites);
    const favKey = `favorites_${user.id}`;
    localStorage.setItem(favKey, JSON.stringify([...newFavorites]));
  };

  // Handle product quantity updates from cart
  const handleProductQuantityUpdate = (productId, newQuantity, oldQuantity, action) => {
    setProducts(prevProducts => 
      prevProducts.map(p => {
        if (p._id === productId) {
          if (action === 'update') {
            // Calculate the difference and adjust quantity
            const quantityDiff = newQuantity - oldQuantity;
            return { 
              ...p, 
              qty: Math.max(0, p.qty - quantityDiff)
            };
          } else if (action === 'remove') {
            // Restore quantity when items are removed from cart
            return { 
              ...p, 
              qty: p.qty + oldQuantity 
            };
          } else if (action === 'checkout') {
            // Permanently reduce quantity on checkout
            return { 
              ...p, 
              qty: Math.max(0, p.qty - newQuantity),
              originalQty: Math.max(0, (p.originalQty || p.qty) - newQuantity)
            };
          }
        }
        return p;
      })
    );
  };

  const handleAddToCart = (product) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id;

    if (!userId) {
      toast.error('Please log in to add items to cart.');
      return;
    }

    const quantityToAdd = quantities[product._id] || 1;
    
    // Check if requested quantity is available
    if (quantityToAdd > product.qty) {
      toast.error(`Only ${product.qty} "${product.name}" available.`);
      return;
    }

    const cartKey = `cart_${userId}`;
    const existingCart = JSON.parse(localStorage.getItem(cartKey)) || {
      user: userId,
      status: 'draft',
      items: [],
      value: 0
    };

    const itemIndex = existingCart.items.findIndex(item => item.product === product._id);
    
    if (itemIndex > -1) {
      // Item already in cart, check total quantity
      const existingQuantityInCart = existingCart.items[itemIndex].quantity;
      const totalRequestedQuantity = existingQuantityInCart + quantityToAdd;

      if (totalRequestedQuantity > (product.originalQty || product.qty)) {
        toast.error(`Only ${product.originalQty || product.qty} "${product.name}" available. You already have ${existingQuantityInCart} in cart.`);
        return;
      }
      
      // Accumulate the quantity instead of replacing it
      existingCart.items[itemIndex].quantity = totalRequestedQuantity;
    } else {
      // New item to cart
      existingCart.items.push({
        product: product._id,
        quantity: quantityToAdd
      });
    }

    localStorage.setItem(cartKey, JSON.stringify(existingCart));
    
    // Update product quantity in state immediately
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p._id === product._id 
          ? { 
              ...p, 
              qty: p.qty - quantityToAdd,
              originalQty: p.originalQty || p.qty + quantityToAdd // Store original if not set
            }
          : p
      )
    );
    
    const finalQuantity = existingCart.items.find(item => item.product === product._id)?.quantity || quantityToAdd;
    toast.success(`Added ${quantityToAdd} of "${product.name}" to cart. Total in cart: ${finalQuantity}`);
    updateCartCount();
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(products.map(product => product.category))];
    return categories.filter(Boolean);
  };

  const getUniqueBrands = () => {
    const brands = [...new Set(products.map(product => product.brand))];
    return brands.filter(Boolean);
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={2}>
      {[...Array(8)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ 
            width: '100%',
            maxWidth: 300,
            margin: 'auto',
            backgroundColor: "#0a1929",
            border: "1px solid #1e3a5f",
            height: 480 // Increased height for skeleton
          }}>
            <Skeleton variant="rectangular" height={200} sx={{ backgroundColor: "#1e3a5f" }} />
            <CardContent sx={{ p: 2 }}>
              <Skeleton variant="text" sx={{ fontSize: '1.1rem', backgroundColor: "#1e3a5f" }} />
              <Skeleton variant="text" sx={{ backgroundColor: "#1e3a5f" }} />
              <Skeleton variant="text" width="60%" sx={{ backgroundColor: "#1e3a5f" }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const ProductCard = ({ product, isRecommended = false }) => (
    <Card 
      sx={{ 
        width: '100%',
        maxWidth: 300, // Increased width from 260 to 300
        minWidth: 280, // Increased minimum width
        margin: 'auto',
        transition: 'all 0.3s ease',
        backgroundColor: "#0a1929",
        border: isRecommended ? "1px solid #dc2626" : "1px solid #1e3a5f",
        borderRadius: "12px", // Slightly larger border radius
        boxShadow: isRecommended ? "0 0 15px rgba(220, 38, 38, 0.3)" : "none",
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: "0 8px 25px rgba(220, 38, 38, 0.4)",
          borderColor: "#dc2626"
        },
        position: 'relative',
        height: 480, // Increased height from 420 to 480
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {isRecommended && (
        <Chip
          icon={<RecommendIcon sx={{ fontSize: '14px' }} />}
          label="Recommended"
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            zIndex: 2,
            fontWeight: 'bold',
            backgroundColor: "#dc2626",
            color: 'white',
            border: "1px solid #ffffff",
            fontSize: '0.7rem',
            height: '22px'
          }}
        />
      )}
      
      <Chip
        icon={<InventoryIcon sx={{ fontSize: '14px' }} />}
        label={product.qty > 10 ? 'In Stock' : product.qty > 0 ? 'Low Stock' : 'Out of Stock'}
        size="small"
        sx={{ 
          position: 'absolute', 
          top: isRecommended ? 32 : 8, 
          right: 8, 
          zIndex: 1,
          fontWeight: 'bold',
          backgroundColor: product.qty > 10 ? "#22c55e" : product.qty > 0 ? "#f59e0b" : "#dc2626",
          color: product.qty > 10 ? "#000000" : "#ffffff",
          border: "1px solid #ffffff",
          fontSize: '0.7rem',
          height: '22px'
        }}
      />
      
      <IconButton
        onClick={() => toggleFavorite(product._id)}
        sx={{ 
          position: 'absolute', 
          top: 8, 
          left: isRecommended ? 105 : 8, 
          zIndex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: "1px solid #1e3a5f",
          width: '30px',
          height: '30px',
          '&:hover': { 
            backgroundColor: 'rgba(220, 38, 38, 0.9)',
            borderColor: "#dc2626"
          }
        }}
      >
        {favorites.has(product._id) ? 
          <FavoriteIcon sx={{ color: "#dc2626", fontSize: '18px' }} /> : 
          <FavoriteBorderIcon sx={{ color: "#ffffff", fontSize: '18px' }} />
        }
      </IconButton>

      {/* Fixed Image Container with Increased Size */}
      <Box sx={{ 
        width: '100%', 
        height: 200, // Increased height from 160 to 200
        overflow: 'hidden',
        position: 'relative'
      }}>
        <CardMedia
          component="img"
          image={product.img_src || 'https://placehold.co/300x200'}
          alt={product.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'scale(1.05)' },
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            backgroundColor: '#1e3a5f'
          }}
        />
      </Box>
      
      <CardContent sx={{ 
        flexGrow: 1, 
        pb: 1, 
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100% - 200px - 70px)' // Adjusted calculation for increased sizes
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: "#ffffff",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: '1rem', // Slightly larger font
            lineHeight: '1.3',
            minHeight: '2.6rem'
          }}
        >
          {product.name}
        </Typography>
        
        <Typography 
          variant="body2"
          sx={{ 
            mb: 1.5,
            color: "#9ca3af",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: '0.8rem', // Slightly larger font
            minHeight: '2.4rem'
          }}
        >
          {product.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, minHeight: '28px' }}>
          <Rating 
            value={product.rating} 
            precision={0.1} 
            readOnly 
            size="small"
            sx={{ 
              mr: 1,
              '& .MuiRating-iconFilled': {
                color: '#ffd700'
              },
              fontSize: '18px' // Slightly larger rating
            }}
          />
          <Typography variant="body2" sx={{ color: "#9ca3af", fontSize: '0.8rem' }}>
            ({product.reviewCount})
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap', minHeight: '26px' }}>
          <Chip
            icon={<CategoryIcon sx={{ color: "#ffffff !important", fontSize: '13px' }} />}
            label={product.category}
            size="small"
            sx={{
              backgroundColor: "#1e3a5f",
              color: "#ffffff",
              border: "1px solid #dc2626",
              fontWeight: 500,
              fontSize: '0.7rem',
              height: '22px'
            }}
          />
          {product.brand && (
            <Chip
              icon={<BrandingWatermarkIcon sx={{ color: "#ffffff !important", fontSize: '13px' }} />}
              label={product.brand}
              size="small"
              sx={{
                backgroundColor: "#000000",
                color: "#ffffff",
                border: "1px solid #9ca3af",
                fontWeight: 500,
                fontSize: '0.7rem',
                height: '22px'
              }}
            />
          )}
        </Box>
        
        <Box sx={{ mt: 'auto' }}>
          <Typography 
            variant="h5"
            sx={{ 
              mt:-1,
              fontWeight: 700, 
              mb: 0.5,
              color: "#dc2626",
              fontSize: "1.2rem" // Slightly larger price
            }}
          >
            ${product.price}
          </Typography>
          
          <Typography variant="body2" sx={{ color: "#9ca3af", fontSize: '0.8rem' }}>
            <strong style={{ color: "#ffffff" }}>Available:</strong> {product.qty} units
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ 
        justifyContent: 'space-between', 
        padding: '8px 16px 16px',
        borderTop: '1px solid #1e3a5f',
        height: 70, // Increased height for actions area
        minHeight: 70
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
          {/* Quantity controls commented out as per original code */}
        </Box>
        
        <Button
          variant="contained"
          startIcon={<ShoppingCartIcon sx={{ fontSize: '18px' }} />}
          onClick={() => handleAddToCart(product)}
          disabled={product.qty === 0}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 600,
            backgroundColor: "#dc2626",
            color: "#ffffff",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
            fontSize: '0.8rem',
            px: 1.5,
            minWidth: '110px',
            height: '36px',
            "&:hover": {
              backgroundColor: "#b91c1c",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)"
            },
            "&:disabled": {
              backgroundColor: "#4b5563",
              color: "#9ca3af"
            }
          }}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );

  const PreferencesDialog = () => (
    <Dialog 
      open={preferencesOpen} 
      onClose={() => setPreferencesOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#000000",
          border: "1px solid #dc2626",
          borderRadius: "8px",
          maxWidth: '500px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: "#0a1929",
        color: "#ffffff",
        borderBottom: "1px solid #dc2626",
        p: 2,
        fontSize: '1.1rem'
      }}>
        <PersonIcon sx={{ color: "#dc2626", fontSize: '20px' }} />
        Your Shopping Preferences
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: "#000000", pt: 2, pb: 1 }}>
        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={userPreferences.enableRecommendations}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  enableRecommendations: e.target.checked
                }))}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#dc2626',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#dc2626',
                  }
                }}
              />
            }
            label="Enable personalized recommendations"
            sx={{ mb: 2, color: "#ffffff", fontSize: '0.875rem' }}
          />

          <Divider sx={{ my: 1.5, backgroundColor: "#1e3a5f", height: "1px" }} />

          <Typography variant="h6" gutterBottom sx={{ color: "#ffffff", fontSize: '0.95rem', mb: 1 }}>
            Preferred Categories
          </Typography>
          <Autocomplete
            multiple
            options={getUniqueCategories()}
            value={userPreferences.categories}
            onChange={(event, newValue) => {
              setUserPreferences(prev => ({
                ...prev,
                categories: newValue
              }));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip 
                  variant="outlined" 
                  label={option} 
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: "#1e3a5f",
                    color: "#ffffff",
                    border: "1px solid #dc2626",
                    fontSize: '0.75rem'
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select categories you're interested in"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#0a1929",
                    color: "#ffffff",
                    "& fieldset": {
                      borderColor: "#1e3a5f"
                    },
                    "&:hover fieldset": {
                      borderColor: "#dc2626"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#dc2626"
                    }
                  },
                  "& input": {
                    color: "#ffffff",
                    fontSize: '0.875rem'
                  },
                  "& input::placeholder": {
                    color: "#9ca3af",
                    opacity: 1
                  }
                }}
              />
            )}
            sx={{ mb: 2 }}
          />

          <Typography variant="h6" gutterBottom sx={{ color: "#ffffff", fontSize: '0.95rem', mb: 1 }}>
            Preferred Brands
          </Typography>
          <Autocomplete
            multiple
            options={getUniqueBrands()}
            value={userPreferences.brands}
            onChange={(event, newValue) => {
              setUserPreferences(prev => ({
                ...prev,
                brands: newValue
              }));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip 
                  variant="outlined" 
                  label={option} 
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: "#1e3a5f",
                    color: "#ffffff",
                    border: "1px solid #dc2626",
                    fontSize: '0.75rem'
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select preferred brands"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#0a1929",
                    color: "#ffffff",
                    "& fieldset": {
                      borderColor: "#1e3a5f"
                    },
                    "&:hover fieldset": {
                      borderColor: "#dc2626"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#dc2626"
                    }
                  },
                  "& input": {
                    color: "#ffffff",
                    fontSize: '0.875rem'
                  },
                  "& input::placeholder": {
                    color: "#9ca3af",
                    opacity: 1
                  }
                }}
              />
            )}
            sx={{ mb: 2 }}
          />

          <Typography variant="h6" gutterBottom sx={{ color: "#ffffff", fontSize: '0.95rem', mb: 1 }}>
            Interest Keywords
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={availableKeywords}
            value={userPreferences.keywords}
            onChange={(event, newValue) => {
              setUserPreferences(prev => ({
                ...prev,
                keywords: newValue
              }));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip 
                  variant="outlined" 
                  label={option} 
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: "#1e3a5f",
                    color: "#ffffff",
                    border: "1px solid #dc2626",
                    fontSize: '0.75rem'
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Add keywords that interest you"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#0a1929",
                    color: "#ffffff",
                    "& fieldset": {
                      borderColor: "#1e3a5f"
                    },
                    "&:hover fieldset": {
                      borderColor: "#dc2626"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#dc2626"
                    }
                  },
                  "& input": {
                    color: "#ffffff",
                    fontSize: '0.875rem'
                  },
                  "& input::placeholder": {
                    color: "#9ca3af",
                    opacity: 1
                  }
                }}
              />
            )}
            sx={{ mb: 2 }}
          />

          <Typography variant="h6" gutterBottom sx={{ color: "#ffffff", fontSize: '0.95rem', mb: 1 }}>
            Price Range
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <TextField
              label="Min Price"
              type="number"
              value={userPreferences.priceRange.min}
              onChange={(e) => setUserPreferences(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, min: Number(e.target.value) }
              }))}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ color: "#9ca3af" }}>$</InputAdornment>,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#0a1929",
                  color: "#ffffff",
                  "& fieldset": {
                    borderColor: "#1e3a5f"
                  },
                  "&:hover fieldset": {
                    borderColor: "#dc2626"
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#dc2626"
                  }
                },
                "& .MuiInputLabel-root": {
                  color: "#9ca3af",
                  fontSize: '0.875rem'
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#dc2626"
                },
                "& input": {
                  color: "#ffffff",
                  fontSize: '0.875rem'
                }
              }}
            />
            <TextField
              label="Max Price"
              type="number"
              value={userPreferences.priceRange.max}
              onChange={(e) => setUserPreferences(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, max: Number(e.target.value) }
              }))}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ color: "#9ca3af" }}>$</InputAdornment>,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#0a1929",
                  color: "#ffffff",
                  "& fieldset": {
                    borderColor: "#1e3a5f"
                  },
                  "&:hover fieldset": {
                    borderColor: "#dc2626"
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#dc2626"
                  }
                },
                "& .MuiInputLabel-root": {
                  color: "#9ca3af",
                  fontSize: '0.875rem'
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#dc2626"
                },
                "& input": {
                  color: "#ffffff",
                  fontSize: '0.875rem'
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{
        backgroundColor: "#0a1929",
        borderTop: "1px solid #1e3a5f",
        p: 1.5
      }}>
        <Button 
          onClick={() => setPreferencesOpen(false)}
          size="small"
          sx={{
            color: "#ffffff",
            borderColor: "#9ca3af",
            fontSize: '0.875rem',
            "&:hover": {
              borderColor: "#ffffff",
              backgroundColor: "rgba(255, 255, 255, 0.1)"
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => {
            saveUserPreferences(userPreferences);
            setPreferencesOpen(false);
          }}
          variant="contained"
          size="small"
          sx={{
            backgroundColor: "#dc2626",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: '0.875rem',
            "&:hover": {
              backgroundColor: "#b91c1c"
            }
          }}
        >
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
    <div className="bootstrap-scope">
      <UserSidebar  />
      <Box sx={{ 
        marginLeft: !isMobile ? `${sidebarWidth}px` : '0',
        transition: 'margin-left 0.3s ease',
        backgroundColor: "#030712", 
        minHeight: "100vh",
        width: !isMobile ? `calc(100% - ${sidebarWidth}px)` : '100%',
        overflowX: 'auto'
      }}>
        <Container sx={{  
          backgroundColor: "#1f2937", 
          maxWidth: '100% !important',
          padding: '16px',
          margin: 0,
          minWidth: 'auto'
        }}>
          {/* Header Section - Updated with #111827 background and centered items */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              marginTop: -2,
              marginLeft: -5,
              marginRight: -5,
              mb: 3, 
              backgroundColor: "#030712",
              color: 'white',
              borderRadius: 2,
              border: "1px solid #030712",
              maxWidth: '200%'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
               🛍️ Find Your Perfect <span style={{color:'red'}}>Products</span>
              </Typography>
              <Typography variant="h6" sx={{ 
                opacity: 0.9, 
                fontSize: '1.1rem',
                mb: 3,
                fontWeight: 400
              }}>
                Shop from certified sellers and achieve your shopping goals
              </Typography>
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 1, justifyContent: 'center' }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <StorefrontIcon sx={{ fontSize: 40, mb: 1, color: '#dc2626' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>
                    Wide Selection
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: '#9ca3af' }}>
                    Thousands of products from trusted brands
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, mb: 1, color: '#ffee00ff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>
                    Quality Assured
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: '#9ca3af' }}>
                    Verified sellers and product reviews
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 40, mb: 1, color: '#3dff02ff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>
                    Fast Delivery
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem', color: '#9ca3af' }}>
                    Quick shipping and easy returns
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Controls Section - Updated with search bar ending neatly at filtering options */}
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            backgroundColor: "#0a1929",
            border: "1px solid #1e3a5f",
            maxWidth: '100%'
          }}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
              {/* Search Bar - Takes remaining space */}
              <Grid item xs={12} md={7} sx={{width: 800}}>
                <TextField
                  fullWidth
                  placeholder="Search products by name, category, or description..."
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#9ca3af", fontSize: '20px' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: "#dc2626",
                            color: "#ffffff",
                            fontWeight: 600,
                            borderRadius: '6px',
                            textTransform: 'none',
                            minWidth: '80px',
                            "&:hover": {
                              backgroundColor: "#b91c1c"
                            }
                          }}
                          onClick={() => filterAndSortProducts()}
                        >
                          Search
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#000000",
                      color: "#ffffff",
                      borderRadius: "8px",
                      "& fieldset": {
                        borderColor: "#1e3a5f"
                      },
                      "&:hover fieldset": {
                        borderColor: "#dc2626"
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#dc2626",
                        boxShadow: "0 0 0 2px rgba(220, 38, 38, 0.1)"
                      },
                      "& input": {
                        color: "#ffffff",
                        fontSize: '0.9rem',
                        padding: '12px 14px'
                      },
                      "& input::placeholder": {
                        color: "#9ca3af",
                        opacity: 1
                      }
                    }
                  }}
                />
              </Grid>
              
              {/* Filtering and Sorting Options - Fixed width */}
              <Grid item xs={12} md={5}>
                <Grid container spacing={1.5} alignItems="center" justifyContent="flex-end">
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: "#9ca3af", "&.Mui-focused": { color: "#dc2626" }, fontSize: '0.875rem' }}>Category</InputLabel>
                      <Select
                        value={categoryFilter}
                        label="Category"
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        sx={{
                          backgroundColor: "#000000",
                          color: "#ffffff",
                          borderRadius: "6px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1e3a5f"
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#dc2626"
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#dc2626"
                          },
                          "& .MuiSvgIcon-root": {
                            color: "#ffffff"
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: "#0a1929",
                              border: "1px solid #1e3a5f",
                              "& .MuiMenuItem-root": {
                                color: "#ffffff",
                                fontSize: '0.875rem',
                                "&:hover": {
                                  backgroundColor: "#1e3a5f"
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "#dc2626",
                                  "&:hover": {
                                    backgroundColor: "#b91c1c"
                                  }
                                }
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {getUniqueCategories().map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: "#9ca3af", "&.Mui-focused": { color: "#dc2626" }, fontSize: '0.875rem' }}>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{
                          backgroundColor: "#000000",
                          color: "#ffffff",
                          borderRadius: "6px",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#1e3a5f"
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#dc2626"
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#dc2626"
                          },
                          "& .MuiSvgIcon-root": {
                            color: "#ffffff"
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: "#0a1929",
                              border: "1px solid #1e3a5f",
                              "& .MuiMenuItem-root": {
                                color: "#ffffff",
                                fontSize: '0.875rem',
                                "&:hover": {
                                  backgroundColor: "#1e3a5f"
                                },
                                "&.Mui-selected": {
                                  backgroundColor: "#dc2626",
                                  "&:hover": {
                                    backgroundColor: "#b91c1c"
                                  }
                                }
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="relevance">Relevance</MenuItem>
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="price-low">Price: Low to High</MenuItem>
                        <MenuItem value="price-high">Price: High to Low</MenuItem>
                        <MenuItem value="rating">Rating</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    {/* <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SettingsIcon sx={{ fontSize: '18px' }} />}
                      onClick={() => setPreferencesOpen(true)}
                      size="small"
                      sx={{ 
                        height: '40px',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '6px',
                        color: "#ffffff",
                        borderColor: "#9ca3af",
                        fontSize: '0.875rem',
                        "&:hover": {
                          borderColor: "#dc2626",
                          backgroundColor: "rgba(220, 38, 38, 0.1)"
                        }
                      }}
                    >
                      Preferences
                    </Button> */}
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setCartOpen(true)}
                      size="small"
                      sx={{ 
                        height: '40px',
                        background: '#dc2626',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '6px',
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
                        fontSize: '0.875rem',
                        '&:hover': {
                          background: '#b91c1c',
                          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.5)',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      startIcon={
                        <Badge 
                          badgeContent={cartItemCount} 
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#000000',
                              color: '#ffffff',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              minWidth: '18px',
                              height: '18px',
                              border: "1px solid #dc2626"
                            }
                          }}
                        >
                          <ShoppingCartIcon sx={{ fontSize: '18px' }} />
                        </Badge>
                      }
                    >
                      Cart
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>

          {/* Products Section */}
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: "#ffffff", fontSize: '1.2rem', textAlign: 'center' }}>
            {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} Found
          </Typography>

          {loading ? (
            <LoadingSkeleton />
          ) : filteredProducts.length === 0 ? (
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              backgroundColor: "#0a1929",
              border: "1px solid #1e3a5f",
              borderRadius: "8px",
              maxWidth: '400px',
              mx: 'auto'
            }}>
              <Typography variant="body1" sx={{ color: "#9ca3af", mb: 1.5, fontSize: '0.9rem' }}>
                No products found matching your criteria
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
                size="small"
                sx={{ 
                  color: "#ffffff",
                  borderColor: "#dc2626",
                  fontSize: '0.875rem',
                  "&:hover": {
                    borderColor: "#b91c1c",
                    backgroundColor: "rgba(220, 38, 38, 0.1)"
                  }
                }}
              >
                Clear Filters
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filteredProducts.map(product => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>

        {/* Floating buttons */}
        {!isMobile && (
          <>
            <Fab
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000,
                width: 52,
                height: 52,
                background: '#dc2626',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.5)',
                border: "1px solid #ffffff",
                '&:hover': {
                  background: '#b91c1c',
                  boxShadow: '0 6px 16px rgba(220, 38, 38, 0.6)',
                  transform: 'translateY(-2px) scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
              onClick={() => setCartOpen(true)}
            >
              <Badge 
                badgeContent={cartItemCount}
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    minWidth: '18px',
                    height: '18px',
                    border: '1px solid #dc2626'
                  }
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: 22, color: "#ffffff" }} />
              </Badge>
            </Fab>

            <Fab
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 76,
                zIndex: 1000,
                width: 44,
                height: 44,
                background: '#1e3a5f',
                boxShadow: '0 4px 8px rgba(30, 58, 95, 0.5)',
                border: "1px solid #ffffff",
                '&:hover': {
                  background: '#dc2626',
                  boxShadow: '0 6px 12px rgba(220, 38, 38, 0.5)',
                  transform: 'translateY(-2px) scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
              onClick={() => setPreferencesOpen(true)}
            >
              <SettingsIcon sx={{ fontSize: 20, color: 'white' }} />
            </Fab>
          </>
        )}
      </Box>

      <PreferencesDialog />

      <CartModal
        open={cartOpen}
        handleClose={() => {
          setCartOpen(false);
          updateCartCount();
          fetchAllProducts(); // Refresh to get latest quantities
        }}
        products={products.map(p => ({ ...p, image: p.img_src }))}
        onCartUpdate={() => {
          updateCartCount();
          fetchAllProducts(); // Refresh to get latest quantities
        }}
        onProductQuantityUpdate={handleProductQuantityUpdate}
      />
      
      <ToastContainer 
        position="bottom-right"
        theme="dark"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{
          backgroundColor: "#0a1929",
          color: "#ffffff",
          border: "1px solid #dc2626"
        }}
      />
    </div>
    <Footer />
    </>
  );
}

export default UserDashboard;