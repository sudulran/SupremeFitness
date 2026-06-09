import React, { useState } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Stack,
  InputAdornment,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 420 },
  bgcolor: 'background.paper',
  borderRadius: 3,
  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
  p: 5,
  transition: 'all 0.3s ease-in-out',
};

export default function AddTrainerModal({ open, handleClose, onAdd }) {
  const [trainer, setTrainer] = useState({
    name: '',
    specialization: '',
    experience: '',
    available: true,
    contact: { phone: '', email: '' },
    image: null,
    imagePreview: null,
  });

  const fileInputRef = React.useRef();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (files && files.length > 0) {
      const file = files[0];
      const preview = URL.createObjectURL(file);

      setTrainer((prev) => ({
        ...prev,
        image: file,
        imagePreview: preview,
      }));
    } else if (name === 'phone' || name === 'email') {
      setTrainer((prev) => ({
        ...prev,
        contact: { ...prev.contact, [name]: value },
      }));
    } else if (type === 'checkbox') {
      setTrainer((prev) => ({ ...prev, [name]: checked }));
    } else {
      setTrainer((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', trainer.name);
    formData.append('specialization', trainer.specialization);
    formData.append('experience', trainer.experience);
    formData.append('available', trainer.available);
    formData.append('phone', trainer.contact.phone);
    formData.append('email', trainer.contact.email);
    if (trainer.image) {
      formData.append('image', trainer.image);
    }
    onAdd(formData);
    handleClose();
    resetForm();
  };

  const resetForm = () => {
    setTrainer({
      name: '',
      specialization: '',
      experience: '',
      available: true,
      contact: { phone: '', email: '' },
      image: null,
      imagePreview: null,
    });
  };

  const handleRemoveImage = () => {
    setTrainer((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleEditImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit} noValidate>
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight="bold">Add Trainer</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          <TextField
            name="name"
            label="Full Name"
            fullWidth
            required
            value={trainer.name}
            onChange={handleChange}
          />
          <TextField
            name="specialization"
            label="Specialization"
            fullWidth
            required
            value={trainer.specialization}
            onChange={handleChange}
          />
          <TextField
            name="experience"
            label="Experience (years)"
            type="number"
            fullWidth
            required
            value={trainer.experience}
            onChange={handleChange}
            inputProps={{ min: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={trainer.available}
                name="available"
                onChange={handleChange}
              />
            }
            label="Available"
          />
          <TextField
            name="phone"
            label="Phone"
            fullWidth
            value={trainer.contact.phone}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            name="email"
            label="Email"
            fullWidth
            value={trainer.contact.email}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Image Upload / Preview / Actions */}
          {!trainer.imagePreview ? (
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleChange}
                ref={fileInputRef}
              />
            </Button>
          ) : (
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={trainer.imagePreview}
                alt="Trainer"
                sx={{ width: 56, height: 56 }}
              />
              <Stack direction="row" spacing={1}>
                <Tooltip title="Update Image">
                  <IconButton onClick={handleEditImage} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove Image">
                  <IconButton onClick={handleRemoveImage} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <input
                type="file"
                hidden
                accept="image/*"
                ref={fileInputRef}
                onChange={handleChange}
              />
            </Box>
          )}
        </Stack>

        <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
          <Button onClick={handleClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            Add Trainer
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
