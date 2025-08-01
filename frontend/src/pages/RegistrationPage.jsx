// frontend/src/pages/RegistrationPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import NodeBackground from '../components/NodeBackground';

function RegistrationPage() {
  const [role, setRole] = useState('MANUFACTURER');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    let registrationData = { email: email.toLowerCase(), password, role };

    // Logic to handle different form fields based on role
    if (role === 'MANUFACTURER' || role === 'SKINCARE_BRAND') {
      registrationData.companyName = companyName;
      registrationData.companyRegNumber = companyRegNumber;
    } else {
      registrationData.fullName = fullName;
    }

    try {
      const response = await apiClient.post('/api/auth/register', registrationData);
      setMessage({ type: 'success', text: response.data.message });
      setCompanyName(''); setCompanyRegNumber(''); setFullName(''); setEmail(''); setPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  // This function now includes the title for Skincare Brands
  const getPageTitle = () => {
    switch (role) {
      case 'MANUFACTURER': return 'Create Manufacturer Account';
      case 'SKINCARE_BRAND': return 'Create Skincare Brand Account';
      case 'DVA': return 'Create DVA Account';
      case 'PRINTING': return 'Create Printing Account';
      case 'LOGISTICS': return 'Create Logistics Account';
      case 'CUSTOMER': return 'Create Customer Account';
      default: return 'Create an Account';
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      <NodeBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">{getPageTitle()}</h2>
          
          {message?.type !== 'success' ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white/80">I am a...</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input bg-gray-900/50">
                  {/* THIS IS THE FIX: Added Skincare Brand option */}
                  <option className="text-black" value="MANUFACTURER">Pharmaceutical Manufacturer</option>
                  <option className="text-black" value="SKINCARE_BRAND">Skincare Brand</option>
                  <option className="text-black" value="CUSTOMER">Customer / User</option>
                  <option className="text-black" value="DVA">DVA (Regulatory Agency)</option>
                  <option className="text-black" value="PRINTING">Printing</option>
                  <option className="text-black" value="LOGISTICS">Logistics</option>
                </select>
              </div>

              {/* This logic now correctly handles both Manufacturer and Skincare Brand */}
              {(role === 'MANUFACTURER' || role === 'SKINCARE_BRAND') ? (
                <>
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-white/80">{role === 'MANUFACTURER' ? 'Company Name' : 'Brand Name'}</label>
                    <input type="text" id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
                  </div>
                  <div>
                    <label htmlFor="companyRegNumber" className="block text-sm font-medium text-white/80">CAC Registration Number</label>
                    <input type="text" id="companyRegNumber" required value={companyRegNumber} onChange={(e) => setCompanyRegNumber(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white/80">Full Name / Company Name</label>
                  <input type="text" id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80">Email Address</label>
                <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80">Password (min. 8 characters)</label>
                <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 glass-input" />
              </div>
              
              {message && message.type === 'error' && (<div className="p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">{message.text}</div>)}
              <div><button type="submit" disabled={isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button flex items-center justify-center">{isLoading ? 'Registering...' : 'Register'}</button></div>
            </form>
          ) : (
            <div className="text-center p-4 bg-green-500/20 text-green-200 rounded-lg"><h3 className="font-bold text-lg">Thank You!</h3><p>{message && message.text}</p></div>
          )}

          <div className="text-center text-white/70 text-sm"><p>Already have an account? <Link to="/login" className="font-medium text-white hover:underline">Sign In</Link></p></div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationPage;