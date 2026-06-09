import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
    membershipType: "",
    password: "",
    confirmPassword: ""
  });
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleContactNumberChange = (e) => {
    let value = e.target.value.replace(/[^\d]/g, "");
    if (value && !value.startsWith("0")) {
      value = "0" + value;
    }
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    setFormData(prevState => ({
      ...prevState,
      contactNumber: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload only images (JPEG, PNG, GIF) or PDF files", {
          position: "top-right",
          autoClose: 3000,
        });
        e.target.value = "";
        return;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB", {
          position: "top-right",
          autoClose: 3000,
        });
        e.target.value = "";
        return;
      }

      setPaymentReceipt(file);
    }
  };

  const validateForm = () => {
    // Enhanced Name validation
  if (!formData.name.trim()) {
    toast.error("Please enter your full name", { position: "top-right", autoClose: 3000 });
    return false;
  }

  const name = formData.name.trim();
  
  // Check name length
  if (name.length < 2) {
    toast.error("Name must be at least 2 characters long", { position: "top-right", autoClose: 3000 });
    return false;
  }

  if (name.length > 50) {
    toast.error("Name cannot exceed 50 characters", { position: "top-right", autoClose: 3000 });
    return false;
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(name)) {
    toast.error("Name can only contain letters, spaces, hyphens, and apostrophes", {
      position: "top-right",
      autoClose: 3000,
    });
    return false;
  }

  // Check for consecutive special characters
  if (/(\s{2,}|-{2,}|'{2,})/.test(name)) {
    toast.error("Name cannot contain consecutive spaces, hyphens, or apostrophes", {
      position: "top-right",
      autoClose: 3000,
    });
    return false;
  }

  // Check if name starts or ends with special characters
  if (/^[\s'-]|[\s'-]$/.test(name)) {
    toast.error("Name cannot start or end with spaces, hyphens, or apostrophes", {
      position: "top-right",
      autoClose: 3000,
    });
    return false;
  }

  // Check for valid name structure (at least one space for first and last name)
  const nameParts = name.split(/\s+/);
  if (nameParts.length < 2) {
    toast.error("Please enter both first and last name", { position: "top-right", autoClose: 3000 });
    return false;
  }

  // Check each name part length
  if (nameParts.some(part => part.length < 2)) {
    toast.error("Each name part must be at least 2 characters long", {
      position: "top-right",
      autoClose: 3000,
    });
    return false;
  }

  // Check for excessive name parts (more than 4)
  if (nameParts.length > 4) {
    toast.error("Please enter a valid name with reasonable number of parts", {
      position: "top-right",
      autoClose: 3000,
    });
    return false;
  }

    if (!formData.email.trim()) {
      toast.error("Please enter your email", { position: "top-right", autoClose: 3000 });
      return false;
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      toast.error("Please enter a valid email address", { position: "top-right", autoClose: 3000 });
      return false;
    }

    if (!/^0\d{9}$/.test(formData.contactNumber)) {
      toast.error("Contact number must start with 0 and contain exactly 10 digits", {
        position: "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (!formData.gender) {
      toast.error("Please select your gender", { position: "top-right", autoClose: 3000 });
      return false;
    }

    const age = parseInt(formData.age);
    if (!formData.age || age < 1 || age > 100) {
      toast.error("Age must be between 1 and 100", { position: "top-right", autoClose: 3000 });
      return false;
    }

    // Validate height (required)
    if (!formData.height) {
      toast.error("Please enter your height", { position: "top-right", autoClose: 3000 });
      return false;
    }
    const height = parseFloat(formData.height);
    if (isNaN(height) || height < 50 || height > 250) {
      toast.error("Height must be between 50cm and 250cm", { position: "top-right", autoClose: 3000 });
      return false;
    }

    // Validate weight (required)
    if (!formData.weight) {
      toast.error("Please enter your weight", { position: "top-right", autoClose: 3000 });
      return false;
    }
    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight < 20 || weight > 300) {
      toast.error("Weight must be between 20kg and 300kg", { position: "top-right", autoClose: 3000 });
      return false;
    }

    if (!formData.membershipType) {
      toast.error("Please select a membership type", { position: "top-right", autoClose: 3000 });
      return false;
    }

    if (!formData.password) {
      toast.error("Please enter a password", { position: "top-right", autoClose: 3000 });
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long", {
        position: "top-right",
        autoClose: 3000,
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", { position: "top-right", autoClose: 3000 });
      return false;
    }

    if (!paymentReceipt) {
      toast.error("Please upload a payment receipt", { position: "top-right", autoClose: 3000 });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name.trim());
      submitData.append("email", formData.email.trim());
      submitData.append("contactNumber", formData.contactNumber);
      submitData.append("gender", formData.gender);
      submitData.append("age", formData.age);
      submitData.append("height", formData.height || "");
      submitData.append("weight", formData.weight || "");
      submitData.append("membershipType", formData.membershipType);
      submitData.append("password", formData.password);
      submitData.append("paymentReceipt", paymentReceipt);

      const response = await fetch("http://localhost:8088/api/users/register", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        toast.success("🎉 Registration Successful! Check your email for confirmation.", {
          position: "top-right",
          autoClose: 5000,
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          contactNumber: "",
          gender: "",
          age: "",
          height: "",
          weight: "",
          membershipType: "",
          password: "",
          confirmPassword: ""
        });
        setPaymentReceipt(null);
        
        setTimeout(() => navigate("/login"), 3000);
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "An error occurred during registration. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const membershipOptions = [
    { value: "monthly", label: "Monthly", price: "LKR 3,000/month" },
    { value: "3months", label: "3 Months", price: "LKR 8,000/3 months" },
    { value: "6months", label: "6 Months", price: "LKR 15,000/6 months" },
    { value: "annual", label: "Annual", price: "LKR 25,000/year" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-red-600">SUPREME</span>
            <span className="text-white">FITNESS</span>
          </h1>
          <div className="w-32 h-1 bg-red-600 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Transform Your Body, Transform Your Life</p>
        </div>

        <form
          className="bg-gray-800 shadow-2xl rounded-2xl p-8 border border-gray-700 backdrop-blur-sm bg-opacity-90"
          onSubmit={handleSubmit}
        >
          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8">
            {['Account', 'Personal', 'Membership', 'Payment'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className="ml-2 text-gray-300 hidden sm:block">{step}</span>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-600 mx-2 hidden sm:block"></div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Contact & Gender & Age */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contactNumber" className="block text-gray-300 mb-2 font-medium">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleContactNumberChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-gray-300 mb-2 font-medium">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white transition-all duration-200"
                  required
                >
                  <option value="" className="text-gray-400">Select Gender</option>
                  <option value="male" className="text-white">Male</option>
                  <option value="female" className="text-white">Female</option>
                </select>
              </div>
              <div>
                <label htmlFor="age" className="block text-gray-300 mb-2 font-medium">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Age"
                  min="1"
                  max="100"
                  required
                />
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="height" className="block text-gray-300 mb-2 font-medium">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Height in cm"
                  min="50"
                  max="250"
                  step="0.1"
                  required
                />
                <div className="text-xs text-gray-400 mt-1">Enter your height in centimeters</div>
              </div>
              <div>
                <label htmlFor="weight" className="block text-gray-300 mb-2 font-medium">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Weight in kg"
                  min="20"
                  max="300"
                  step="0.1"
                  required
                />
                <div className="text-xs text-gray-400 mt-1">Enter your weight in kilograms</div>
              </div>
            </div>

            {/* Membership Type */}
            <div>
              <label htmlFor="membershipType" className="block text-gray-300 mb-2 font-medium">
                Membership Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {membershipOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.membershipType === option.value
                        ? 'border-red-600 bg-red-600 bg-opacity-10'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, membershipType: option.value }))}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{option.label}</span>
                      <span className="text-red-400 text-sm">{option.price}</span>
                    </div>
                    {formData.membershipType === option.value && (
                      <div className="mt-2 text-green-400 text-sm">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-gray-300 mb-2 font-medium">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-300 mb-2 font-medium">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Confirm your password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* Payment Receipt */}
            <div>
              <label htmlFor="paymentReceipt" className="block text-gray-300 mb-2 font-medium">
                Payment Receipt *
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center transition-all duration-200 hover:border-red-600">
                <input
                  type="file"
                  id="paymentReceipt"
                  name="paymentReceipt"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf"
                  required
                />
                <label htmlFor="paymentReceipt" className="cursor-pointer">
                  {paymentReceipt ? (
                    <div className="text-green-400">
                      <div className="text-2xl mb-2">✓</div>
                      <div className="font-medium">{paymentReceipt.name}</div>
                      <div className="text-sm text-gray-400 mt-1">Click to change file</div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <div className="text-2xl mb-2">📁</div>
                      <div className="font-medium">Upload Payment Receipt</div>
                      <div className="text-sm mt-1">JPG, PNG, GIF, or PDF (Max 5MB)</div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Registration...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center text-gray-300">
            <div className="text-2xl mb-2">🏋️</div>
            <div className="font-medium">Modern Equipment</div>
            <div className="text-sm text-gray-400">State-of-the-art fitness machines</div>
          </div>
          <div className="text-center text-gray-300">
            <div className="text-2xl mb-2">👨‍🏫</div>
            <div className="font-medium">Expert Trainers</div>
            <div className="text-sm text-gray-400">Certified professional coaches</div>
          </div>
          <div className="text-center text-gray-300">
            <div className="text-2xl mb-2">⏰</div>
            <div className="font-medium">24/7 Access</div>
            <div className="text-sm text-gray-400">Flexible workout hours</div>
          </div>
        </div>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default SignUp;