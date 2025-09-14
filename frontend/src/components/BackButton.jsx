import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)} 
      className={`glass-button p-3 rounded-lg flex items-center justify-center ${className}`}
      aria-label="Go back"
    >
      <FiArrowLeft />
    </button>
  );
};

export default BackButton;
