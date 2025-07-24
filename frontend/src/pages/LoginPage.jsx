import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NodeBackground from '../components/NodeBackground';
import apiClient from '../api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/login', {
        email: email.toLowerCase(),
        password: password,
      });
      
      const { token, user } = response.data;

      // --- THIS IS THE KEY CHANGE ---
      // Instead of console.log, we now call our global login function
      login(user, token);
      
      // The rest of the logic remains the same
      switch (user.role) {
        case 'MANUFACTURER':
          navigate('/manufacturer/dashboard');
          break;
        case 'DVA':
          navigate('/dva/dashboard');
          break;
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // The JSX for the form remains exactly the same, so we'll omit it here for brevity.
  // The code you had before for the return (...) part is still correct.
  return (
    // THIS IS THE FIX: The outer container is now a full-height flex container
    <div className="min-h-screen w-full relative flex items-center justify-center">
      <NodeBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80">Email Address</label>
              <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80">Password</label>
              <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
            </div>
            {error && (<div className="p-3 bg-red-500/20 text-red-200 rounded-lg text-sm border border-red-500/30">{error}</div>)}
            <div>
              <button type="submit" disabled={isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button flex items-center justify-center">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          {/* ADD THIS DIV AT THE BOTTOM */}
          <div className="text-center text-white/70 text-sm pt-4 border-t border-white/20">
            <p>Don't have an account? <a href="/register" className="font-medium text-white hover:underline">Register Here</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;