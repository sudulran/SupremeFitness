import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MenuIcon,
  XIcon,
  SearchIcon,
  UserIcon,
  ShoppingCartIcon,
  LogOutIcon,
  ShieldIcon,
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      // Check for regular user
      const storedUser = localStorage.getItem('user');
      const userToken = localStorage.getItem('token');
      
      // Check for admin
      const adminData = localStorage.getItem('adminData');
      const adminToken = localStorage.getItem('adminToken');

      if (adminToken && adminData) {
        try {
          const parsedAdmin = JSON.parse(adminData);
          setUser({
            name: parsedAdmin.fullName || parsedAdmin.username,
            email: parsedAdmin.email,
            role: 'admin'
          });
          setUserRole('admin');
        } catch (error) {
          console.error('Error parsing admin data:', error);
        }
      } else if (userToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.name,
            email: parsedUser.email,
            role: parsedUser.role || 'user'
          });
          setUserRole(parsedUser.role || 'user');
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    };

    loadUserData();
  }, [location]);

  // Scroll and outside click handling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    
    setUser(null);
    setUserRole(null);
    setIsDropdownOpen(false);
    
    // Navigate to home or login
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement actual search logic
  };

  const displayName = user?.name || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="bg-gray-900 fixed top-0 left-0 right-0 z-50 shadow-lg py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="font-extrabold text-2xl text-red-500 hover:text-red-400 transition-colors tracking-wider"
            style={{ marginLeft: '150px' }}
          >
            SUPREME<span className="text-white">FITNESS</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm uppercase font-semibold tracking-wide ${isActive('/') ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-300 hover:text-white'}`}>
              Home
            </Link>
            <Link to="/user-dashboard" className={`text-sm uppercase font-semibold tracking-wide ${isActive('/store') ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-300 hover:text-white'}`}>
              Store
            </Link>
            <Link to="/user-appointments" className={`text-sm uppercase font-semibold tracking-wide ${isActive('/appointments') ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-300 hover:text-white'}`}>
              Appointments
            </Link>
            <Link to="/workoutplans" className={`text-sm uppercase font-semibold tracking-wide ${isActive('/workoutplans') ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-300 hover:text-white'}`}>
              Workout Plans
            </Link>
            <Link to="/mealplans" className={`text-sm uppercase font-semibold tracking-wide ${isActive('/mealplans') ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-300 hover:text-white'}`}>
              Meal Plans
            </Link>
            <Link to="/events" className={`text-sm uppercase font-semibold tracking-wide ${isActive('/events') ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-300 hover:text-white'}`}>
              Events
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="absolute right-0 top-0 mt-1 flex items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-gray-800 text-white text-sm rounded-full px-4 py-2 pr-10 w-80 focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="absolute right-12 top-2 text-gray-400 hover:text-white">
                    <SearchIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="absolute right-3 top-2 text-gray-400 hover:text-white" onClick={() => setIsSearchOpen(false)}>
                    <XIcon className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-800">
                  <SearchIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 text-white hover:text-red-500 transition group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all ${
                    userRole === 'admin' 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 group-hover:from-purple-500 group-hover:to-purple-600' 
                      : 'bg-gradient-to-r from-red-600 to-red-700 group-hover:from-red-500 group-hover:to-red-600'
                  }`}>
                    {userRole === 'admin' ? <ShieldIcon className="h-5 w-5" /> : displayInitial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-sm font-semibold block">{displayName}</span>
                    <span className="text-xs text-gray-400 capitalize">{userRole}</span>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-red-600 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-red-800 bg-gradient-to-r from-gray-800 to-gray-900">
                      <p className="text-white font-semibold text-sm flex items-center gap-2">
                        {userRole === 'admin' && <ShieldIcon className="h-4 w-4 text-purple-400" />}
                        {displayName}
                      </p>
                      <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        userRole === 'admin' 
                          ? 'bg-purple-900 text-purple-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {userRole === 'admin' ? '👑 Admin' : '🏋️ Member'}
                      </span>
                    </div>

                    {userRole === 'user' && (
                      <>
                        <Link to="/udashboard" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          📊 User Dashboard
                        </Link>
                        <Link to="/user-purchase-summary" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          📋 Purchase History
                        </Link>
                        <Link to="/user-my-appointments" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          📝 My Appointments
                        </Link>
                        <Link to="/user-progress-dashboard" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          📈 My Progress
                        </Link>
                      </>
                    )}

                    {userRole === 'admin' && (
                      <>
                        <Link to="/admin-dashboard" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          📊 Dashboard
                        </Link>
                        <Link to="/admin-user-management" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          👥 User Management
                        </Link>
                        <Link to="/admin-trainer-management" className="block px-4 py-2 text-sm text-white hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                          🏋️ Trainer Management
                        </Link>
                      </>
                    )}

                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm text-white bg-red-600 hover:bg-red-700">
                      <LogOutIcon className="h-4 w-4 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium">Login</Link>
                <Link to="/signup" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu & search */}
          <div className="md:hidden flex items-center space-x-4">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-gray-300 hover:text-white">
              <SearchIcon className="h-5 w-5" />
            </button>
            <Link to="/cart" className="relative text-gray-300 hover:text-white">
              <ShoppingCartIcon className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">2</span>
            </Link>
            {user && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                userRole === 'admin' ? 'bg-purple-600' : 'bg-red-600'
              }`}>
                {userRole === 'admin' ? <ShieldIcon className="h-4 w-4" /> : displayInitial}
              </div>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white">
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {isSearchOpen && (
        <div className="md:hidden px-4 py-3 bg-black">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-800 text-white text-sm rounded-lg w-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-2 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black bg-opacity-95 absolute w-full">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user && (
              <div className="px-3 py-2 border-b border-gray-700 mb-2">
                <p className="text-white font-semibold text-sm">{displayName}</p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                  userRole === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-red-900 text-red-300'
                }`}>
                  {userRole === 'admin' ? '👑 Admin' : '🏋️ Member'}
                </span>
              </div>
            )}

            <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium uppercase ${isActive('/') ? 'text-red-500' : 'text-white hover:bg-gray-900'}`}>
              Home
            </Link>
            <Link to="/feedbacks" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium uppercase ${isActive('/feedbacks') ? 'text-red-500' : 'text-white hover:bg-gray-900'}`}>
              Testimonials
            </Link>
            <Link to="/equipments" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium uppercase ${isActive('/equipments') ? 'text-red-500' : 'text-white hover:bg-gray-900'}`}>
              Equipment
            </Link>
            <Link to="/plans" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium uppercase ${isActive('/plans') ? 'text-red-500' : 'text-white hover:bg-gray-900'}`}>
              Training Plans
            </Link>
            
            {userRole === 'user' && (
              <Link to="/udashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-900">
                📊 User Dashboard
              </Link>
            )}
            
            {userRole === 'admin' && (
              <Link to="/admin-dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-900">
                📊 Admin Dashboard
              </Link>
            )}
            
            {user ? (
              <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700">
                <LogOutIcon className="h-5 w-5 mr-2" /> Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base text-white hover:bg-gray-900">Login</Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base bg-red-600 text-white hover:bg-red-700 rounded-md">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;