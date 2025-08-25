import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp && !isAdmin) {
        // Student Sign Up
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        await register(formData.username, formData.password, 'student');
        navigate('/');
      } else {
        // Admin Sign In or Student Sign In
        const role = isAdmin ? 'admin' : 'student';
        const response = await login(formData.username, formData.password);
        
        // Redirect based on role
        if (response.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Glass Card */}
        <div className="backdrop-blur-lg bg-white/70 rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Career Guidance Portal
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin ? 'Admin Access' : (isSignUp ? 'Create Student Account' : 'Student Login')}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsSignUp(true);
                setIsAdmin(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isSignUp && !isAdmin
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Student Sign Up
            </button>
            <button
              onClick={() => {
                setIsSignUp(false);
                setIsAdmin(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isSignUp && !isAdmin
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Student Sign In
            </button>
            <button
              onClick={() => {
                setIsAdmin(true);
                setIsSignUp(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isAdmin
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Admin Sign In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder={isAdmin ? "Admin username" : "Choose a username"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter password"
              />
            </div>

            {isSignUp && !isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Confirm password"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white transition-all transform hover:scale-105 ${
                isAdmin
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'}`}
            >
              {loading ? 'Processing...' : (isSignUp && !isAdmin ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {/* Info Text */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isAdmin ? (
              <p>Admin access for authorized personnel only</p>
            ) : (
              <p>Join our career guidance community today!</p>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
