import React from 'react';
import { motion } from 'framer-motion';

const pillVariants = {
  initial: { y: -20, opacity: 0, scale: 0.8 },
  animate: {
    y: [ -20, 0, 100, 120 ], // Drop down and go off screen
    opacity: [ 0, 1, 1, 0 ], // Fade in, stay, fade out
    scale: [ 0.8, 1, 1, 0.8 ],
    rotate: [0, 90, 180, 270], // Add some rotation
  },
};

const PillLoader = ({ className }) => {
  const pills = Array.from({ length: 5 }); // Number of pills

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {pills.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-4 bg-cyan-400 rounded-full"
          variants={pillVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.3,
            repeatDelay: 0.5,
          }}
          style={{
            left: `${10 + (i * 18)}%`,
            top: '-10%',
          }}
        />
      ))}
    </div>
  );
};

export default PillLoader;