
import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

const SealQRCode = ({ code, size }) => {
  const ref = useRef(null);
  const qrCode = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    // Initialize QRCodeStyling
    qrCode.current = new QRCodeStyling({
      width: size,
      height: size,
      data: code,
      dotsOptions: {
        type: 'rounded',
        color: '#000000',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
    });

    // Clear the container and append the new QR code
    ref.current.innerHTML = '';
    qrCode.current.append(ref.current);
  }, [code, size]);

  return <div ref={ref} />;
};

export default SealQRCode;
