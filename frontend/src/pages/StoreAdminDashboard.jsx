import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axiosInstance from '../api/axiosInstance';

// Material UI Components
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Skeleton,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

import GroupIcon from '@mui/icons-material/Group';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import AddProductModal from './forms/AddProductModal';
import UpdateProductModal from './forms/UpdateProductModal';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';

import Footer from '../components/Footer';

// =============================================================================
// STORE ADMIN DASHBOARD COMPONENT
// =============================================================================

/**
 * Main Dashboard Component for Store Administrators
 * Features: Business metrics, product management, inventory tracking, and sales overview
 */
function StoreAdminDashboard() {
  // ===========================================================================
  // ROUTING AND REFS
  // ===========================================================================
  
  const navigate = useNavigate();
  const sidebarWidth = 70;
  const productManagementRef = useRef(null); // For smooth scrolling to products section

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  // Dashboard Metrics States
  const [userCount, setUserCount] = useState(null);
  const [productCount, setProductCount] = useState(null);
  const [productCategoryCount, setProductCategoryCount] = useState(null);
  const [sellsCount, setSellsCount] = useState(null);
  const [draftCount, setDraftCount] = useState(null);

  // Product Management States
  const [products, setProducts] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [productToUpdate, setProductToUpdate] = useState(null);

  // Filtering and Sorting States
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // ===========================================================================
  // STYLING CONSTANTS
  // ===========================================================================

  /**
   * Dashboard content styling with responsive sidebar margin
   */
  const dashboardContentStyle = {
    padding: '20px',
    marginLeft: '150px',
    transition: 'margin-left 0.3s',
    backgroundColor: '#1f2937', // bg-gray-800
    minHeight: '100vh',
    overflowX: 'auto',
  };

  // ===========================================================================
  // DATA FETCHING EFFECTS
  // ===========================================================================

  /**
   * Fetches all dashboard data on component mount
   * Includes user counts, product metrics, sales data, and inventory
   */
  useEffect(() => {
    /**
     * Fetches total user count from authentication API
     */
    const fetchUserCount = async () => {
      try {
        const response = await axiosInstance.get('/auth/get-user-count');
        setUserCount(response.data.userCount);
      } catch (error) {
        console.error('Failed to fetch user count:', error);
      }
    };

    /**
     * Fetches total product count from products API
     */
    const fetchProductCount = async () => {
      try {
        const response = await axiosInstance.get('/products/get-product-count');
        setProductCount(response.data.allProductCount);
      } catch (error) {
        console.error('Failed to fetch product count:', error);
      }
    };

    /**
     * Fetches product categories and their counts
     * Also extracts category names for filter dropdown
     */
    const fetchProductsCountByCategory = async () => {
      try {
        const response = await axiosInstance.get('/products/get-product-count-by-category');
        setProductCategoryCount(response.data.counts.length);
        setCategories(response.data.counts.map((c) => c.category));
      } catch (error) {
        console.error('Failed to fetch product count by category:', error);
      }
    };

    /**
     * Fetches total sales count from payment API
     */
    const fetchSellsCount = async () => {
      try {
        const response = await axiosInstance.get('/payment/get-sells-count');
        setSellsCount(response.data.sellsCount);
      } catch (error) {
        console.error('Failed to fetch sells count:', error);
      }
    };

    /**
     * Fetches draft order count from cart API
     */
    const fetchDraftCount = async () => {
      try {
        const response = await axiosInstance.get('/cart/get-draft-count');
        setDraftCount(response.data);
      } catch (error) {
        console.error('Failed to fetch draft count:', error);
      }
    };

    /**
     * Fetches all products for management table
     */
    const fetchAllProducts = async () => {
      try {
        const response = await axiosInstance.get('/products/');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Failed to fetch products.');
      }
    };

    // Execute all data fetching functions
    fetchDraftCount();
    fetchSellsCount();
    fetchProductsCountByCategory();
    fetchUserCount();
    fetchProductCount();
    fetchAllProducts();
  }, []);

  // ===========================================================================
  // PRODUCT MANAGEMENT HANDLERS
  // ===========================================================================

  /**
   * Handles product deletion with confirmation dialog
   * @param {string} id - Product ID to delete
   */
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/products/delete/${id}`);
        setProducts((prev) => prev.filter((product) => product._id !== id));
        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Error', 'Failed to delete product.', 'error');
      }
    }
  };

  /**
   * Opens edit modal for a specific product
   * @param {Object} product - Product object to edit
   */
  const handleEdit = (product) => {
    setProductToUpdate(product);
    setOpenUpdateModal(true);
  };

  /**
   * Opens the Add Product modal
   */
  const handleOpenAddModal = () => setOpenAddModal(true);
  
  /**
   * Closes the Add Product modal
   */
  const handleCloseAddModal = () => setOpenAddModal(false);

  /**
   * Handles successful product addition
   * Refreshes product list after addition
   */
  const handleProductAdded = () => {
    fetchAllProducts();
  };

  /**
   * Handles product update completion
   * @param {Object} updatedProduct - Updated product data
   * @param {boolean} success - Whether the update was successful
   */
  const handleProductUpdated = (updatedProduct, success) => {
    setOpenUpdateModal(false);
    setProductToUpdate(null);

    if (success) {
      toast.success('Product updated successfully!');
      fetchAllProducts();
    }
  };

  /**
   * Closes the Update Product modal and resets state
   */
  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setProductToUpdate(null);
  };

  /**
   * Fetches all products for the management table
   */
  const fetchAllProducts = async () => {
    try {
      const response = await axiosInstance.get('/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to fetch products.');
    }
  };

  // ===========================================================================
  // INVENTORY MANAGEMENT UTILITIES
  // ===========================================================================

  /**
   * Checks if any products have low stock levels
   * Used to display inventory warnings
   */
  const hasLowStock = products.some((product) => product.qty < product.restock_level);

  /**
   * Smooth scrolls to the product management section
   */
  const scrollToProducts = () => {
    productManagementRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ===========================================================================
  // PRODUCT FILTERING AND SORTING
  // ===========================================================================

  /**
   * Applies category filter, search query, and price sorting to products
   * @returns {Array} - Filtered and sorted product list
   */
  const filteredProducts = products
    .filter((product) =>
      selectedCategory ? product.category === selectedCategory : true
    )
    .filter((product) =>
      searchQuery
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      return 0;
    });

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================

  return (
    <>
    <Box sx={{ display: 'flex', background: '#1f2937' }}>
      {/* SIDEBAR NAVIGATION */}
      <StoreAdminSidebar />
      
      {/* MAIN CONTENT AREA */}
      <Box style={dashboardContentStyle}>
        {/* PAGE HEADER */}
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Store Admin Dashboard
        </Typography>

        {/* =====================================================================
        TOP METRICS SECTION: Business Overview Cards
        ===================================================================== */}
        <Box
          sx={{
            marginTop: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
          }}
        >
          {[
            {
              title: 'Users',
              value: userCount,
              icon: <GroupIcon sx={{ fontSize: 48, color: 'white', mr: 3 }} />,
              color: 'red', // First card - Red
            },
            {
              title: 'Products',
              value: productCount,
              icon: <Inventory2Icon sx={{ fontSize: 48, color: 'white', mr: 3 }} />,
              scroll: true, // Makes card clickable to scroll to products
              color: 'blue', // Second card - Blue
            },
            {
              title: 'Categories',
              value: productCategoryCount,
              icon: <CategoryIcon sx={{ fontSize: 48, color: 'white', mr: 3 }} />,
              color: 'red', // Third card - Red
            },
            {
              title: 'Sales',
              value: sellsCount,
              icon: <MonetizationOnIcon sx={{ fontSize: 48, color: 'white', mr: 3 }} />,
              color: 'blue', // Fourth card - Blue
            },
            {
              title: 'Draft Orders',
              value: draftCount,
              icon: <DescriptionIcon sx={{ fontSize: 48, color: 'white', mr: 3 }} />,
              color: 'red', // Fifth card - Red
            },
          ].map((card, index) => {
            // Determine colors based on card color type
            const backgroundColor = card.color === 'red' ? '#7f1d1d' : '#1e3a8a'; // red-900 : blue-900
            const hoverColor = card.color === 'red' ? '#991b1b' : '#1e40af'; // red-800 : blue-800
            const shadowColor = card.color === 'red' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(37, 99, 235, 0.3)';
            const hoverShadowColor = card.color === 'red' ? 'rgba(220, 38, 38, 0.5)' : 'rgba(37, 99, 235, 0.5)';

            return (
              <Card
                key={index}
                onClick={card.scroll ? scrollToProducts : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 3,
                  borderRadius: 3,
                  cursor: card.scroll ? 'pointer' : 'default',
                  boxShadow: `0 4px 12px ${shadowColor}`,
                  backgroundColor: backgroundColor,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 8px 20px ${hoverShadowColor}`,
                    transform: card.scroll ? 'translateY(-4px)' : 'none',
                    backgroundColor: hoverColor,
                  },
                }}
              >
                {/* CARD ICON */}
                {card.icon}
                
                {/* CARD CONTENT */}
                <CardContent sx={{ padding: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: '500', mb: 0.5, color: 'white' }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: '700', color: 'white', letterSpacing: '0.05em' }}
                  >
                    {/* LOADING STATE: Show skeleton while data loads */}
                    {card.value !== null ? (
                      card.value
                    ) : (
                      <Skeleton variant="text" width={40} height={30} sx={{ bgcolor: '#374151' }} />
                    )}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* =====================================================================
        PRODUCT MANAGEMENT SECTION: Inventory Control and Management
        ===================================================================== */}
        <Box ref={productManagementRef}>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: 'white', fontWeight: 'bold' }}>
            Product Management
          </Typography>

          {/* LOW STOCK WARNING BANNER */}
          {hasLowStock && (
            <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#fef3c7', color: '#92400e' }}>
              ⚠️ Some products are below their restock levels!
            </Alert>
          )}

          {/* ===================================================================
          FILTERS AND SEARCH CONTROLS
          =================================================================== */}
          <Card
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: '#062043', // navy color
              boxShadow: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* SEARCH INPUT: By product name or category */}
              <TextField
                label="Search by name"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  backgroundColor: '#0d2747', // input field color
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    borderRadius: 1,
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

              {/* CATEGORY FILTER DROPDOWN */}
              <FormControl
                size="small"
                sx={{
                  minWidth: 180,
                  backgroundColor: '#0d2747', // input field color
                  borderRadius: 1,
                }}
              >
                <InputLabel sx={{ color: 'white' }}>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
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
                  <MenuItem value="">All</MenuItem>
                  {categories.map((cat, idx) => (
                    <MenuItem key={idx} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* PRICE SORTING DROPDOWN */}
              <FormControl
                size="small"
                sx={{
                  minWidth: 180,
                  backgroundColor: '#0d2747', // input field color
                  borderRadius: 1,
                }}
              >
                <InputLabel sx={{ color: 'white' }}>Sort by Price</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  label="Sort by Price"
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
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="asc">Low to High</MenuItem>
                  <MenuItem value="desc">High to Low</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Card>

          {/* ===================================================================
          ACTION BUTTONS: Add Product and Sales Summary
          =================================================================== */}
          <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {/* ADD PRODUCT BUTTON */}
            <Button
              variant="contained"
              onClick={handleOpenAddModal}
              sx={{
                backgroundColor: '#dc2626', // red-600
                '&:hover': { 
                  backgroundColor: '#ef4444', // red-500
                },
              }}
            >
              Add Product
            </Button>

            {/* SALES SUMMARY NAVIGATION BUTTON */}
            <Button
              variant="outlined"
              onClick={() => navigate('/admin-sale-summary')}
              sx={{
                borderColor: '#dc2626', // red-600
                color: 'white',
                '&:hover': { 
                  backgroundColor: '#dc2626', // red-600
                  borderColor: '#dc2626',
                },
              }}
            >
              View Sales Summary
            </Button>
          </Box>

          {/* ===================================================================
          PRODUCTS TABLE: Inventory Display with Actions
          =================================================================== */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: '500px', 
              overflow: 'auto',
              backgroundColor: '#062043', // navy color
              boxShadow: 3,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#111827' }}> {/* bg-gray-900 */}
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Image</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Name</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Price ($)</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Description</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Category</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Quantity</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Restock Level</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Expiry Date</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Purchase Date</TableCell>
                  <TableCell sx={{ color: 'black', fontWeight: 'bold', borderBottom: '1px solid #374151' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isLowStock = product.qty < product.restock_level;
                    return (
                      <TableRow 
                        key={product._id}
                        sx={{ 
                          backgroundColor: isLowStock ? 'rgba(220, 38, 38, 0.1)' : '#062043',
                          '&:hover': {
                            backgroundColor: isLowStock ? 'rgba(220, 38, 38, 0.2)' : '#0d2747',
                          },
                          borderBottom: '1px solid #374151'
                        }}
                      >
                        {/* PRODUCT IMAGE */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.img_src ? (
                            <img
                              src={product.img_src}
                              alt={product.name}
                              style={{ 
                                width: 100, 
                                height: 100, 
                                borderRadius: '8px', 
                                objectFit: 'cover' 
                              }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                width: 80, 
                                height: 100, 
                                borderRadius: '8px', 
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
                        
                        {/* PRODUCT NAME WITH LOW STOCK INDICATOR */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {product.name}
                            {isLowStock && (
                              <Box 
                                sx={{ 
                                  backgroundColor: '#dc2626', 
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                Low Stock
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        
                        {/* PRODUCT PRICE */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.price != null ? product.price.toFixed(2) : 'N/A'}
                        </TableCell>
                        
                        {/* PRODUCT DESCRIPTION */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.description}
                        </TableCell>
                        
                        {/* PRODUCT CATEGORY */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.category}
                        </TableCell>
                        
                        {/* INVENTORY QUANTITY */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.qty}
                        </TableCell>
                        
                        {/* RESTOCK LEVEL */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.restock_level ?? 'N/A'}
                        </TableCell>
                        
                        {/* EXPIRY DATE */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.expiry_date
                            ? new Date(product.expiry_date).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        
                        {/* PURCHASE DATE */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          {product.date_of_purchase
                            ? new Date(product.date_of_purchase).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        
                        {/* ACTION BUTTONS */}
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid #374151' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* EDIT BUTTON */}
                            <Tooltip title="Edit">
                              <IconButton 
                                onClick={() => handleEdit(product)}
                                sx={{
                                  color: '#3b82f6',
                                  '&:hover': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {/* DELETE BUTTON */}
                            <Tooltip title="Delete">
                              <IconButton 
                                onClick={() => handleDelete(product._id)}
                                sx={{
                                  color: '#dc2626',
                                  '&:hover': {
                                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  /* EMPTY STATE */
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ color: '#9ca3af', py: 4, borderBottom: '1px solid #374151' }}>
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* =====================================================================
        MODAL COMPONENTS
        ===================================================================== */}
        
        {/* ADD PRODUCT MODAL */}
        <AddProductModal
          open={openAddModal}
          onClose={handleCloseAddModal}
          onProductAdded={handleProductAdded}
        />

        {/* UPDATE PRODUCT MODAL - Conditionally rendered when editing */}
        {productToUpdate && (
          <UpdateProductModal
            open={openUpdateModal}
            onClose={handleCloseUpdateModal}
            product={productToUpdate}
            onProductUpdated={handleProductUpdated}
          />
        )}

        {/* NOTIFICATION CONTAINER */}
        <ToastContainer position="top-right" autoClose={3000} />
      </Box>
    </Box>
    
    {/* FOOTER COMPONENT */}
    <Footer />
    </>
  );
}

export default StoreAdminDashboard;