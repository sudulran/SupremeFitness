import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const UpdateProductModal = ({ open, onClose, product, onProductUpdated }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isSmallScreen ? '90vw' : 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: 'background.paper',
    borderRadius: '12px',
    boxShadow: 24,
    p: 4,
  };

  const [updatedProduct, setUpdatedProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    qty: '',
    expiry_date: '',
  });

  const [restockLevel, setRestockLevel] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setUpdatedProduct({
        name: product.name || '',
        price: product.price || '',
        description: product.description || '',
        category: product.category || '',
        qty: product.qty || '',
        expiry_date: product.expiry_date?.split('T')[0] || '',
      });
      setRestockLevel(product.restock_level || '');
      setImagePreview(product.img_src || null); // Use the correct image key
      setImageFile(null);
      setErrors({});
    }
  }, [product]);

  const validate = () => {
    const errs = {};
    if (!updatedProduct.name.trim()) errs.name = 'Name is required';
    if (!updatedProduct.price || parseFloat(updatedProduct.price) <= 0)
      errs.price = 'Price must be a positive number';
    if (!updatedProduct.description.trim()) errs.description = 'Description is required';
    if (!updatedProduct.category.trim()) errs.category = 'Category is required';
    if (!updatedProduct.qty || parseInt(updatedProduct.qty, 10) <= 0)
      errs.qty = 'Quantity must be a positive number';
    if (!updatedProduct.expiry_date) errs.expiry_date = 'Expiry date is required';
    if (!restockLevel || parseInt(restockLevel, 10) < 0)
      errs.restockLevel = 'Restock level must be 0 or higher';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProduct((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setErrors((prev) => ({ ...prev, img: '' }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', updatedProduct.name.trim());
      formData.append('price', parseFloat(updatedProduct.price));
      formData.append('description', updatedProduct.description.trim());
      formData.append('category', updatedProduct.category.trim());
      formData.append('qty', parseInt(updatedProduct.qty, 10));
      formData.append('expiry_date', updatedProduct.expiry_date);

      // ✅ Append restock level
      formData.append('restock_level', parseInt(restockLevel, 10));

      if (imageFile) {
        formData.append('img', imageFile);
      }

      const token = localStorage.getItem('token');

      const response = await axiosInstance.put(`/products/update/${product._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      onProductUpdated(response.data, true);

      setTimeout(() => {
        onClose();
        navigate('/admin-dashboard/');
      }, 1000);
    } catch (error) {
      console.error('Error updating product:', error);
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update product. Please check your input.';
      alert(msg);
      setTimeout(() => {
        navigate('/admin-dashboard/');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={loading ? null : onClose} aria-labelledby="update-product-modal-title">
      <Box component="form" sx={modalStyle} onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" mb={3} fontWeight={600}>
          Update Product
        </Typography>

        <Box display="flex" gap={2} flexDirection={isSmallScreen ? 'column' : 'row'}>
          <TextField
            label="Name"
            name="name"
            value={updatedProduct.name}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />
          <TextField
            label="Category"
            name="category"
            value={updatedProduct.category}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!!errors.category}
            helperText={errors.category}
            disabled={loading}
          />
        </Box>

        <Box display="flex" gap={2} flexDirection={isSmallScreen ? 'column' : 'row'}>
          <TextField
            label="Price"
            name="price"
            type="number"
            value={updatedProduct.price}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!!errors.price}
            helperText={errors.price || 'In USD'}
            disabled={loading}
          />
          <TextField
            label="Quantity"
            name="qty"
            type="number"
            value={updatedProduct.qty}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!!errors.qty}
            helperText={errors.qty}
            disabled={loading}
          />
        </Box>

        <TextField
          label="Description"
          name="description"
          value={updatedProduct.description}
          onChange={handleInputChange}
          fullWidth
          required
          margin="normal"
          multiline
          minRows={3}
          error={!!errors.description}
          helperText={errors.description}
          disabled={loading}
        />

        <TextField
          label="Expiry Date"
          name="expiry_date"
          type="date"
          value={updatedProduct.expiry_date}
          onChange={handleInputChange}
          fullWidth
          required
          margin="normal"
          InputLabelProps={{ shrink: true }}
          error={!!errors.expiry_date}
          helperText={errors.expiry_date}
          disabled={loading}
        />

        <TextField
          label="Restock Level"
          type="number"
          value={restockLevel}
          onChange={(e) => {
            setRestockLevel(e.target.value);
            setErrors((prev) => ({ ...prev, restockLevel: '' }));
          }}
          fullWidth
          required
          margin="normal"
          error={!!errors.restockLevel}
          helperText={errors.restockLevel}
          disabled={loading}
        />

        <Box mt={2}>
          <Button variant="outlined" component="label" fullWidth={isSmallScreen} disabled={loading}>
            {imagePreview ? 'Change Image' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
              disabled={loading}
            />
          </Button>
          {errors.img && (
            <Typography color="error" variant="body2" mt={0.5}>
              {errors.img}
            </Typography>
          )}
        </Box>

        {imagePreview && (
          <Box mt={2} display="flex" justifyContent="center">
            <img
              src={imagePreview}
              alt="Preview"
              style={{ maxHeight: 150, objectFit: 'contain', borderRadius: 8 }}
            />
          </Box>
        )}

        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button onClick={onClose} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UpdateProductModal;
