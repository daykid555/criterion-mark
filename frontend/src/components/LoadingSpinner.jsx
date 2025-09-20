import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <lord-icon
        src="https://cdn.lordicon.com/ggnoyhfp.json"
        trigger="loop"
        state="loop-line"
        colors="primary:#ffffff,secondary:#c71f16"
        style={{ width: '150px', height: '150px' }}>
      </lord-icon>
      <p className="text-xs text-white/50 mt-2">
        Icons by <a href="https://lordicon.com/" target="_blank" rel="noopener noreferrer" className="underline">Lordicon.com</a>
      </p>
    </div>
  );
};

export default LoadingSpinner;
