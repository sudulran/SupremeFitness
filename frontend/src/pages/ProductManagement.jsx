import React, { useEffect, useState } from 'react';
import { Typography, IconButton, Tooltip, Button } from '@mui/material';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axiosInstance from '../api/axiosInstance';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import AddProductModal from './forms/AddProductModal';
import UpdateProductModal from './forms/UpdateProductModal';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';

// =============================================================================
// MAIN PRODUCT MANAGEMENT COMPONENT
// =============================================================================

/**
 * Product Management Component for store administrators
 * Features: View, add, edit, delete products with inventory management
 */
function ProductManagement() {
  // ===========================================================================
  // CONSTANTS AND STYLING
  // ===========================================================================
  
  const sidebarWidth = 100;
  
  /**
   * Responsive dashboard content styling
   * Adjusts margin based on screen width for sidebar compatibility
   */
  const dashboardContentStyle = {
    padding: '20px',
    marginLeft: window.innerWidth >= 768 ? `${sidebarWidth}px` : '0',
    transition: 'margin-left 0.3s',
    overflowX: 'auto',
  };

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  // Data state
  const [products, setProducts] = useState([]);
  
  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [productToUpdate, setProductToUpdate] = useState(null);

  // ===========================================================================
  // DATA FETCHING EFFECT
  // ===========================================================================

  /**
   * Fetch all products from the API on component mount
   */
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // ===========================================================================
  // API FUNCTIONS
  // ===========================================================================

  /**
   * Fetches all products from the backend API
   * Updates the products state with fetched data
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
  // PRODUCT MANAGEMENT ACTIONS
  // ===========================================================================

  /**
   * Handles product deletion with confirmation dialog
   * @param {string} id - Product ID to delete
   */
  const handleDelete = async (id) => {
    // Confirmation dialog using SweetAlert2
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
        // API CALL: Delete product
        await axiosInstance.delete(`/products/delete/${id}`);
        
        // Update local state by filtering out deleted product
        setProducts((prev) => prev.filter((product) => product._id !== id));
        
        // Success notification
        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Error', 'Failed to delete product.', 'error');
      }
    }
  };

  /**
   * Opens the edit modal for a specific product
   * @param {Object} product - Product object to edit
   */
  const handleEdit = (product) => {
    setProductToUpdate(product);
    setOpenUpdateModal(true);
  };

  // ===========================================================================
  // MODAL HANDLERS
  // ===========================================================================

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
   * Updates local state and refetches products
   * @param {Object} newProduct - Newly added product
   */
  const handleProductAdded = (newProduct) => {
    setProducts((prev) => [...prev, newProduct]);
    fetchAllProducts(); // Refetch to ensure data consistency
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
      fetchAllProducts(); // Refetch to get latest data
    }
  };

  /**
   * Closes the Update Product modal and resets state
   */
  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setProductToUpdate(null);
  };

  // ===========================================================================
  // INVENTORY MANAGEMENT LOGIC
  // ===========================================================================

  /**
   * Checks if any products are below their restock level
   * Used to show low stock warnings
   */
  const hasLowStock = products.some((product) => product.qty < product.restock_level);

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================

  return (
    <div className="bootstrap-scope">
      {/* SIDEBAR NAVIGATION */}
      <StoreAdminSidebar />
      
      {/* MAIN CONTENT AREA */}
      <div style={dashboardContentStyle}>
        {/* PAGE HEADER */}
        <Typography variant="h5" gutterBottom>
          Product Management
        </Typography>

        {/* =====================================================================
        LOW STOCK WARNING BANNER
        Shows when any product quantity is below restock level
        ===================================================================== */}
        {hasLowStock && (
          <div className="alert alert-warning" role="alert">
            ⚠ Some products are below their restock levels!
          </div>
        )}

        {/* =====================================================================
        ADD PRODUCT BUTTON
        ===================================================================== */}
        <Button
          variant="contained"
          onClick={handleOpenAddModal}
          sx={{ 
            mb: 2,
            backgroundColor: '#d32f2f',
            '&:hover': {
              backgroundColor: '#b71c1c',
            }
          }}
        >
          Add Product
        </Button>

        {/* =====================================================================
        PRODUCTS TABLE
        ===================================================================== */}
        <div className="table-responsive">
          <table className="table table-striped table-bordered table-hover mt-3">
            <thead className="thead-dark">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price ($)</th>
                <th>Description</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Restock Level</th>
                <th>Expiry Date</th>
                <th>Purchase Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* PRODUCTS DATA ROWS */}
              {products.length > 0 ? (
                products.map((product) => {
                  // Determine if product has low stock
                  const isLowStock = product.qty < product.restock_level;

                  return (
                    <tr 
                      key={product._id} 
                      className={isLowStock ? 'table-danger' : ''} // Highlight low stock rows
                    >
                      {/* PRODUCT IMAGE */}
                      <td>
                        {product.img_src ? (
                          <img
                            src={product.img_src}
                            alt={product.name}
                            width="80"
                            height="100"
                          />
                        ) : (
                          'No Image'
                        )}
                      </td>
                      
                      {/* PRODUCT BASIC INFO */}
                      <td>{product.name}</td>
                      <td>{product.price != null ? product.price.toFixed(2) : 'N/A'}</td>
                      <td>{product.description}</td>
                      <td>{product.category}</td>
                      
                      {/* INVENTORY INFORMATION */}
                      <td>{product.qty}</td>
                      <td>{product.restock_level ?? 'N/A'}</td>
                      
                      {/* DATE INFORMATION */}
                      <td>
                        {product.expiry_date
                          ? new Date(product.expiry_date).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        {product.date_of_purchase
                          ? new Date(product.date_of_purchase).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      
                      {/* ACTION BUTTONS */}
                      <td>
                        {/* EDIT BUTTON */}
                        <Tooltip title="Edit">
                          <IconButton color="primary" onClick={() => handleEdit(product)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {/* DELETE BUTTON */}
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(product._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* EMPTY STATE */
                <tr>
                  <td colSpan={10} className="text-center">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================================
        MODAL COMPONENTS
        ===================================================================== */}
        
        {/* ADD PRODUCT MODAL */}
        <AddProductModal
          open={openAddModal}
          onClose={handleCloseAddModal}
          onProductAdded={handleProductAdded}
        />

        {/* UPDATE PRODUCT MODAL - Conditionally rendered when productToUpdate exists */}
        {productToUpdate && (
          <UpdateProductModal
            open={openUpdateModal}
            onClose={handleCloseUpdateModal}
            product={productToUpdate}
            onProductUpdated={handleProductUpdated}
          />
        )}

        {/* =====================================================================
        NOTIFICATION SYSTEM
        ===================================================================== */}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}

export default ProductManagement;