// frontend/src/components/CreateUserModal.jsx

import React, { useState } from 'react';
import apiClient from '../api';

const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'MANUFACTURER', // Default role
    companyName: '',
    companyRegNumber: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const { email, password, role, companyName, companyRegNumber, fullName } = formData;
    const payload = { email, password, role };
    
    const rolesRequiringCompanyInfo = ['MANUFACTURER', 'SKINCARE_BRAND', 'PHARMACY'];
    if (rolesRequiringCompanyInfo.includes(role)) {
      payload.companyName = companyName;
      payload.companyRegNumber = companyRegNumber;
    } else {
      payload.fullName = fullName;
    }
    
    try {
      // The backend registration endpoint can be used here directly
      const response = await apiClient.post('/api/auth/register', payload);
      setSuccessMessage(response.data.message || 'User created successfully! The account will be inactive until approved.');
      onSuccess(); // This will trigger a re-fetch of the user list
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const rolesRequiringCompanyInfo = ['MANUFACTURER', 'SKINCARE_BRAND', 'PHARMACY'];
  const showCompanyFields = rolesRequiringCompanyInfo.includes(formData.role);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-white mb-6">Create New User Account</h2>
        
        {successMessage && <p className="text-green-400 mb-4">{successMessage}</p>}
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 glass-input text-white">
            <option value="MANUFACTURER">Manufacturer</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="HEALTH_ADVISOR">Health Advisor</option> {/* <-- ADDED */}
            <option value="DVA">DVA</option>
            <option value="PRINTING">Printing</option>
            <option value="LOGISTICS">Logistics</option>
            <option value="SKINCARE_BRAND">Skincare Brand</option>
          </select>

          {showCompanyFields ? (
            <>
              <input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} className="w-full p-3 glass-input" required />
              <input type="text" name="companyRegNumber" placeholder="Company Registration Number" value={formData.companyRegNumber} onChange={handleChange} className="w-full p-3 glass-input" required />
            </>
          ) : (
            <input type="text" name="fullName" placeholder="Full Name / Company Name" value={formData.fullName} onChange={handleChange} className="w-full p-3 glass-input" required />
          )}

          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full p-3 glass-input" required />
          <input type="password" name="password" placeholder="Temporary Password" value={formData.password} onChange={handleChange} className="w-full p-3 glass-input" required />
          
          <div className="pt-2">
            <button type="submit" className="w-full p-3 glass-button font-bold rounded-lg" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;