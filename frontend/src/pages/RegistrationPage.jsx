import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import NodeBackground from '../components/NodeBackground';

function RegistrationPage() {
  // State for form inputs and messages
  const [companyName, setCompanyName] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // Will hold success or error message

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        companyName,
        companyRegNumber, // <-- Add this
        email: email.toLowerCase(),
        password,
      });

      // Set the success message from the API
      setMessage({ type: 'success', text: response.data.message });
      // Clear the form on success
      setCompanyName('');
      setCompanyRegNumber('');
      setEmail('');
      setPassword('');

    } catch (err) {
      const errorText = err.response?.data?.error || 'Registration failed. Please try again.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      <NodeBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Create Manufacturer Account</h2>
          
          {/* This form appears only if no success message is set */}
          {message?.type !== 'success' ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-white/80">Company Name</label>
                <input type="text" id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
              </div>
              {/* ADD THIS NEW DIV */}
              <div>
                <label htmlFor="companyRegNumber" className="block text-sm font-medium text-white/80">Company Registration Number (CAC)</label>
                <input type="text" id="companyRegNumber" required value={companyRegNumber} onChange={(e) => setCompanyRegNumber(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80">Email Address</label>
                <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80">Password (min. 8 characters)</label>
                <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
              </div>
              
              {/* And we check if the message AND the type exist before rendering */}
              {message && message.type === 'error' && (
                <div className="p-3 bg-red-500/20 text-red-200 rounded-lg text-sm border border-red-500/30">{message.text}</div>
              )}

              <div>
                <button type="submit" disabled={isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button flex items-center justify-center">
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          ) : (
            // This success message shows after successful registration
            <div className="text-center p-4 bg-green-500/20 text-green-200 rounded-lg border border-green-500/30">
              <h3 className="font-bold text-lg">Thank You!</h3>
              {/* Here we also check if message exists before trying to read it */}
              <p>{message && message.text}</p>
            </div>
          )}

          <div className="text-center text-white/70 text-sm">
            <p>Already have an account? <Link to="/login" className="font-medium text-white hover:underline">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationPage; 