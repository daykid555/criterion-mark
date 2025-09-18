
import React from 'react';
import './TapePeelAnimation.css';

const TapePeelAnimation = ({ children }) => {
  return (
    <div className="tape-peel-container">
      {children}
      <div className="tape"></div>
    </div>
  );
};

export default TapePeelAnimation;
