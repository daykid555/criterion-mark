import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      
      login(user, token);
      
      // The redirect logic now works because the routes exist.
      // I have removed the obsolete VALIDATOR case as requested.
      switch (user.role) {
        case 'MANUFACTURER': navigate('/manufacturer/dashboard'); break;
        case 'DVA': navigate('/dva/dashboard'); break;
        case 'ADMIN': navigate('/admin/dashboard'); break;
        case 'PRINTING': navigate('/printing/dashboard'); break;
        case 'LOGISTICS': navigate('/logistics/dashboard'); break;
        case 'PHARMACY': navigate('/pharmacy/dashboard'); break; // This will now work correctly
        case 'SKINCARE_BRAND': navigate('/skincare/dashboard'); break;
        default: navigate('/');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      <NodeBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80">Email</label>
              <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80">Password</label>
              <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
            </div>
            {error && (<div className="p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">{error}</div>)}
            <div>
              <button type="submit" disabled={isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button flex items-center justify-center">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          <div className="text-center text-white/70 text-sm pt-4 border-t border-white/20">
            <p>Don't have an account? <Link to="/register" className="font-medium text-white hover:underline">Register Here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;