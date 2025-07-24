import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

const StyledQRCode = ({ code }) => {
  const ref = useRef(null);
  const qrCode = useRef(null);

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: 400,
        height: 400,
        data: code,
        dotsOptions: {
          type: 'rounded',
          color: '#000000', // Solid black dots
          size: 0.8,
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#000000', // Solid black corners
          size: 0.8,
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#000000', // Solid black corner dots
          size: 0.8,
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 10,
        },
      });
      qrCode.current.append(ref.current);
    } else {
      qrCode.current.update({ data: code });
    }
  }, [code]);

  const onDownloadClick = () => {
    if (qrCode.current) {
      qrCode.current.download({ name: `criterion-mark-${code}`, extension: 'png' });
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Clean white container with subtle shadow */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="relative">
          <div ref={ref} />
          
          {/* Clean, straight company name overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white bg-opacity-95 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm font-semibold text-gray-800 text-center">
                The Criterion Mark
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean download button */}
      <button
        onClick={onDownloadClick}
        className="w-full mt-4 bg-gray-800 text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors duration-200"
      >
        Download PNG
      </button>

      {/* Simple info */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Code: {code.substring(0, 8)}...
        </p>
      </div>
    </div>
  );
};

export default StyledQRCode;