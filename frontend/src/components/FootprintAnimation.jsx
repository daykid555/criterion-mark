import React from 'react';

const FootprintAnimation = () => {
  return (
    <div className="footprint-container">
      <div className="footprint boot-print">
        {/* Boot Print SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.1)">
          <path d="M19.1,4.2c-0.6-0.5-1.4-0.8-2.3-0.8H7.2C6.4,3.4,5.5,3.7,4.9,4.2C4.4,4.8,4,5.5,4,6.3v11.4c0,0.8,0.3,1.6,0.9,2.1 c0.6,0.5,1.4,0.8,2.3,0.8h9.6c0.8,0,1.6-0.3,2.3-0.8c0.6-0.5,0.9-1.3,0.9-2.1V6.3C20,5.5,19.6,4.8,19.1,4.2z M18.2,18.6 c-0.3,0.3-0.7,0.4-1.1,0.4H7.2c-0.4,0-0.8-0.2-1.1-0.4c-0.3-0.3-0.4-0.7-0.4-1.1V6.3c0-0.4,0.2-0.8,0.4-1.1C6.4,5,6.8,4.8,7.2,4.8 h9.6c0.4,0,0.8,0.2,1.1,0.4c0.3,0.3,0.4,0.7,0.4,1.1V17.5C18.6,17.9,18.5,18.3,18.2,18.6z"/>
        </svg>
      </div>
      <div className="footprint chicken-print">
        {/* Chicken Print SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.1)">
          <path d="M12,2C9.2,2,7,4.2,7,7c0,1.2,0.4,2.3,1.2,3.2L12,15l3.8-4.8C16.6,9.3,17,8.2,17,7C17,4.2,14.8,2,12,2z M12,9 c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,9,12,9z"/>
          <path d="M12,16c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S14.2,16,12,16z"/>
        </svg>
      </div>
    </div>
  );
};

export default FootprintAnimation;