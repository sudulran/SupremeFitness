import React, { useState, useEffect } from 'react';
import Input from '../components/Input';
import colors from '../theme/colors';
import { registerUser } from '../api/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatchError('Passwords do not match');
    } else {
      setPasswordMatchError('');
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setPasswordMatchError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    try {
        const res = await registerUser({ username, email, password });
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
    
        toast.success('Registration Successful!');

        if (res.user.role === 'admin') {
        navigate('/admin-dashboard');
        }
        else if (res.user.role === 'user') {
          navigate('/user-dashboard');
        } 
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed!';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {passwordMatchError && (
          <p style={{ color: 'red', marginTop: '0.25rem' }}>{passwordMatchError}</p>
        )}
        <button type="submit" style={buttonStyle}>Register</button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={linkStyle}>Back to Login</Link>
      </p>
    </div>
  );
};

const containerStyle = {
  maxWidth: '400px',
  margin: 'auto',
  marginTop: '4rem',
  backgroundColor: colors.background,
  color: colors.text,
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: `0 2px 8px ${colors.border}`,
};

const buttonStyle = {
  backgroundColor: colors.primary,
  color: '#fff',
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginTop: '1rem',
  fontSize: '1rem',
};

const linkStyle = {
  color: colors.primary,
  textDecoration: 'underline',
  cursor: 'pointer',
};

export default Register;
