import React from 'react';
import SealQRCode from './SealQRCode';

const SealDisplay = ({ qrCodePair }) => {
  if (!qrCodePair) return null;

  const { code, outerCode } = qrCodePair;

  return (
    <div
      className="bg-white p-2 rounded-lg shadow-lg border border-gray-300 font-sans mx-auto flex flex-col justify-around"
      // Approx 2.5in height, 1in width. Using px for fixed size representation.
      style={{ height: '240px', width: '96px' }}
    >
      {/* Top Section */}
      <div className="text-center">
        <p className="text-xs text-gray-500 font-bold">Logo Placeholder</p>
        <p className="text-xs text-gray-400">Serial Range Placeholder</p>
      </div>

      {/* Middle Section */}
      <div className="text-center">
        <p className="text-[10px] font-bold text-gray-700 mb-1">CUSTOMER QR CODE (INACTIVE)</p>
        <div className="flex justify-center">
            <SealQRCode code={code} size={60} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="text-center">
        <p className="text-[10px] font-bold text-gray-700 mb-1">PHARMACY/MANUFACTURER QR CODE</p>
        <div className="flex justify-center">
            <SealQRCode code={outerCode} size={60} />
        </div>
      </div>
    </div>
  );
};

export default SealDisplay;