import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfileDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    age: '',
    height: '',
    weight: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const colorTheme = {
    background: 'bg-gray-800',
    card: 'bg-[#062043]',
    navbar: 'bg-gray-900',
    inputField: 'bg-[#0d2747]',
    button: 'bg-red-600 hover:bg-red-500',
    text: 'text-white',
    textMuted: 'text-gray-300'
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        showMessage('User data not found. Please login again.', 'error');
        return;
      }

      const userData = JSON.parse(storedUser);
      
      // Use the user ID from the stored user data
      const userId = userData.id;
      
      if (!userId) {
        showMessage('User ID not found. Please login again.', 'error');
        return;
      }

      // Use the correct route with URL parameter
      const response = await axios.get(`http://localhost:8088/api/users/profile/${userId}`);

      const updatedUserData = response.data.data.user;
      setUser(updatedUserData);
      
      // Pre-fill form data
      setFormData({
        name: updatedUserData.name || '',
        contactNumber: updatedUserData.contactNumber || '',
        age: updatedUserData.age || '',
        height: updatedUserData.height || '',
        weight: updatedUserData.weight || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('Error loading profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const validateForm = () => {
    const newErrors = {};

      // Enhanced Name validation
  if (!formData.name.trim()) {
    newErrors.name = 'Full name is required';
  } else if (formData.name.trim().length < 2) {
    newErrors.name = 'Name must be at least 2 characters long';
  } else if (formData.name.trim().length > 50) {
    newErrors.name = 'Name cannot exceed 50 characters';
  } else {
    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!nameRegex.test(formData.name)) {
      newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    // Check for consecutive special characters
    if (/(\s{2,}|-{2,}|'{2,})/.test(formData.name)) {
      newErrors.name = 'Name cannot contain consecutive spaces, hyphens, or apostrophes';
    }
    
    // Check if name starts or ends with special characters
    if (/^[\s'-]|[\s'-]$/.test(formData.name)) {
      newErrors.name = 'Name cannot start or end with spaces, hyphens, or apostrophes';
    }
    
    // Check for valid name structure (at least one space for first and last name)
    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      newErrors.name = 'Please enter both first and last name';
    } else if (nameParts.some(part => part.length < 2)) {
      newErrors.name = 'Each name part must be at least 2 characters long';
    }
  }

    // Contact number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^0\d{9}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must start with 0 and contain exactly 10 digits';
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 100) {
        newErrors.age = 'Age must be between 1 and 100';
      }
    }

    // Height validation (optional)
    if (formData.height) {
      const height = parseFloat(formData.height);
      if (isNaN(height) || height < 50 || height > 250) {
        newErrors.height = 'Height must be between 50cm and 250cm';
      }
    }

    // Weight validation (optional)
    if (formData.weight) {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight < 20 || weight > 300) {
        newErrors.weight = 'Weight must be between 20kg and 300kg';
      }
    }

    // Password validations
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }

      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters long';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'New passwords do not match';
      }
    }

    // If only current password is provided without new password
    if (formData.currentPassword && !formData.newPassword) {
      newErrors.newPassword = 'New password is required when providing current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Special handling for contact number
    if (name === 'contactNumber') {
      let formattedValue = value.replace(/[^\d]/g, "");
      if (formattedValue && !formattedValue.startsWith("0")) {
        formattedValue = "0" + formattedValue;
      }
      if (formattedValue.length > 10) {
        formattedValue = formattedValue.slice(0, 10);
      }
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showMessage('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      // Get user ID from localStorage
      const storedUser = localStorage.getItem('user');
      const userData = JSON.parse(storedUser);
      const userId = userData.id;

      const updateData = {
        userId: userId,
        name: formData.name.trim(),
        contactNumber: formData.contactNumber,
        age: parseInt(formData.age),
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };

      // Only include password fields if new password is provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put('http://localhost:8088/api/users/profile', updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      
      // Update localStorage with updated user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setEditing(false);
      showMessage('Profile updated successfully!', 'success');
      
      // Clear password fields and errors
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setErrors({});
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Error updating profile';
      
      // Handle specific backend validation errors
      if (error.response?.data?.message?.includes('Contact number')) {
        setErrors(prev => ({ ...prev, contactNumber: error.response.data.message }));
      } else if (error.response?.data?.message?.includes('password')) {
        setErrors(prev => ({ ...prev, currentPassword: error.response.data.message }));
      } else {
        showMessage(errorMsg, 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setErrors({});
    // Reset form data to current user data
    if (user) {
      setFormData({
        name: user.name || '',
        contactNumber: user.contactNumber || '',
        age: user.age || '',
        height: user.height || '',
        weight: user.weight || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getMembershipStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getExpirationStatus = () => {
    if (!user?.membershipEndDate) return null;
    
    const today = new Date();
    const endDate = new Date(user.membershipEndDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { text: 'Membership Expired', color: 'text-red-400' };
    } else if (diffDays <= 7) {
      return { text: `Expires in ${diffDays} days`, color: 'text-orange-400' };
    } else {
      return { text: `Active - ${diffDays} days remaining`, color: 'text-green-400' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colorTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${colorTheme.background} flex items-center justify-center`}>
        <div className="text-white text-center">
          <p className="text-xl mb-4">Unable to load user profile</p>
          <button 
            onClick={loadUserProfile}
            className={`${colorTheme.button} text-white px-6 py-3 rounded-lg transition duration-200 mr-3`}
          >
            Try Again
          </button>
          <button 
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const expirationStatus = getExpirationStatus();

  return (
    <div className={`min-h-screen ${colorTheme.background} py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-white">
              <span className="text-red-600">SUPREME</span>
              <span className="text-white">FITNESS</span>
            </h1>
            <p className="text-gray-300 mt-2">Your Personal Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className={`${colorTheme.card} rounded-xl shadow-lg p-6 border border-gray-700`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className={`${colorTheme.button} text-white px-4 py-2 rounded-lg text-sm transition duration-200 flex items-center gap-2`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full ${colorTheme.inputField} border ${
                          errors.name ? 'border-red-500' : 'border-gray-600'
                        } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className={`w-full ${colorTheme.inputField} border ${
                          errors.contactNumber ? 'border-red-500' : 'border-gray-600'
                        } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                        maxLength={10}
                      />
                      {errors.contactNumber && (
                        <p className="text-red-400 text-sm mt-1">{errors.contactNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Age *
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        min="1"
                        max="100"
                        className={`w-full ${colorTheme.inputField} border ${
                          errors.age ? 'border-red-500' : 'border-gray-600'
                        } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                        required
                      />
                      {errors.age && (
                        <p className="text-red-400 text-sm mt-1">{errors.age}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        min="50"
                        max="250"
                        step="0.1"
                        className={`w-full ${colorTheme.inputField} border ${
                          errors.height ? 'border-red-500' : 'border-gray-600'
                        } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                        placeholder="Optional"
                      />
                      {errors.height && (
                        <p className="text-red-400 text-sm mt-1">{errors.height}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        min="20"
                        max="300"
                        step="0.1"
                        className={`w-full ${colorTheme.inputField} border ${
                          errors.weight ? 'border-red-500' : 'border-gray-600'
                        } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                        placeholder="Optional"
                      />
                      {errors.weight && (
                        <p className="text-red-400 text-sm mt-1">{errors.weight}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className={`w-full ${colorTheme.inputField} border ${
                            errors.currentPassword ? 'border-red-500' : 'border-gray-600'
                          } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                          placeholder="Enter current password to change"
                        />
                        {errors.currentPassword && (
                          <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className={`w-full ${colorTheme.inputField} border ${
                              errors.newPassword ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                            placeholder="Min. 6 characters"
                          />
                          {errors.newPassword && (
                            <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full ${colorTheme.inputField} border ${
                              errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500`}
                            placeholder="Confirm new password"
                          />
                          {errors.confirmPassword && (
                            <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className={`flex-1 ${colorTheme.button} text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={updating}
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                      <p className="text-white text-lg">{user.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <p className="text-white text-lg">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Contact Number</label>
                      <p className="text-white text-lg">{user.contactNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                      <p className="text-white text-lg">{user.age}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                      <p className="text-white text-lg capitalize">{user.gender}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
                      <p className="text-white text-lg">{user.height ? `${user.height} cm` : 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Weight</label>
                      <p className="text-white text-lg">{user.weight ? `${user.weight} kg` : 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Membership Info */}
          <div className="space-y-6">
            {/* Membership Status Card */}
            <div className={`${colorTheme.card} rounded-xl shadow-lg p-6 border border-gray-700`}>
              <h2 className="text-xl font-semibold text-white mb-4">Membership Status</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <p className={`text-lg font-medium ${getMembershipStatusColor(user.paymentStatus)}`}>
                    {user.paymentStatus?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Membership Type</label>
                  <p className="text-white text-lg capitalize">{user.membershipType}</p>
                </div>
                {expirationStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Expiration</label>
                    <p className={`text-lg font-medium ${expirationStatus.color}`}>
                      {expirationStatus.text}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <p className="text-white">{formatDate(user.membershipStartDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <p className="text-white">{formatDate(user.membershipEndDate)}</p>
                </div>
              </div>
            </div>

            {/* Account Info Card */}
            <div className={`${colorTheme.card} rounded-xl shadow-lg p-6 border border-gray-700`}>
              <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Member Since</label>
                  <p className="text-white">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Updated</label>
                  <p className="text-white">{formatDate(user.updatedAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email Verified</label>
                  <p className={`text-lg font-medium ${user.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                    {user.emailVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileDashboard;