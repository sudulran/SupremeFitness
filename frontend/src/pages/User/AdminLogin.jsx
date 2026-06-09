import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔄 Sending admin login request...', formData);
      
      const response = await fetch('http://localhost:8088/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📊 Response status:', response.status);
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Admin login successful!');
        
        // Store admin data
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminData', JSON.stringify(data.data.admin));
        
        console.log('🔑 Token stored:', data.data.token.substring(0, 20) + '...');
        console.log('👤 Admin data stored:', data.data.admin);
        
        toast.success('Admin login successful! Redirecting...', {
          position: "top-right",
          autoClose: 2000,
        });
        
        // Navigate after a short delay to show the success message
        setTimeout(() => {
          console.log('🚀 Navigating to /admin-dashboard');
          navigate('/admin-dashboard');
        }, 1500);
        
      } else {
        console.log('❌ Login failed:', data.message);
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      let errorMessage = error.message;
      
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick setup function to create admin (for development)
  const handleQuickSetup = async () => {
    try {
      console.log('🚀 Attempting quick admin setup...');
      const response = await fetch('http://localhost:8088/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'superadmin',
          email: 'admin@supremefit.com',
          password: 'admin123',
          fullName: 'System Administrator'
        }),
      });

      const data = await response.json();
      console.log('Setup response:', data);

      if (data.success) {
        toast.success('Admin created! Use: admin@supremefit.com / admin123', {
          position: "top-right",
          autoClose: 5000,
        });
        // Auto-fill the form
        setFormData({
          email: 'admin@supremefit.com',
          password: 'admin123'
        });
      } else {
        toast.info(data.message, { position: "top-right" });
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Setup failed: ' + error.message, { position: "top-right" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-red-600">SUPREME</span>
            <span className="text-white">FITNESS</span>
          </h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Admin Portal - Restricted Access</p>
        </div>

        <form 
          className="bg-gray-800 shadow-2xl rounded-2xl p-8 border border-gray-700"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white"
                placeholder="admin@supremefit.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Admin Login'
              )}
            </button>

        

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Use your admin credentials to access the dashboard
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Check browser console (F12) for debug info
              </p>
            </div>
          </div>
        </form>
      </div>
      <ToastContainer 
        theme="dark"
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default AdminLogin;