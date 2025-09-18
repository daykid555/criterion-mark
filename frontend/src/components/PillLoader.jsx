import React from 'react';
import { motion } from 'framer-motion';

const PillLoader = ({ className, text = 'Loading...' }) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="w-16 h-4 rounded-full bg-gray-700 overflow-hidden">
        <motion.div
          className="h-full bg-cyan-400"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
          }}
        />
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
};

export default PillLoader;
