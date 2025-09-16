import React, { useEffect } from 'react';

const Modal = ({ title, children, onClose, isOpen, backdropClass = "bg-black bg-opacity-50" }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null; // Don't render if not open

  return (
    <div
      className={`fixed inset-0 flex justify-center items-center z-50 ${backdropClass}`}
      onClick={onClose} // Tap outside to close
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full border border-gray-700"
        onClick={(e) => e.stopPropagation()} // Prevent tap outside from closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;