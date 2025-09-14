import React from 'react';
import { Link } from 'react-router-dom';
import NodeBackground from '../components/NodeBackground';

// This is the new, stacked logo component, designed to be the hero
const HeroLogo = () => (
  <div className="text-center text-white select-none">
    <span className="block text-xl md:text-3xl font-light tracking-widest text-white/70">THE</span>
    <h1 className="text-5xl md:text-7xl lg:text-9xl font-extrabold tracking-wider text-white drop-shadow-2xl">
      CRITERION
    </h1>
    <span className="block text-2xl md:text-4xl font-light tracking-widest text-white/70">MARK</span>
  </div>
);


function HomePage() {
  return (
    <div className="w-full h-screen relative">
      {/* The node animation sits in the background, filling the entire screen */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <NodeBackground />
      </div>

      {/* All content sits on top of the animation */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-4">

        {/* The Company Name is now the huge, central element */}
        <HeroLogo />

        <p className="mt-8 text-lg md:text-xl text-center text-white/80 max-w-3xl drop-shadow-lg">
          A new standard in digital verification. We provide an unparalleled layer of security, connecting manufacturers, regulators, and consumers through a verified and transparent digital seal.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            to="/verify"
            // THIS IS THE FIX for the button text
            className="text-lg font-semibold py-3 px-8 rounded-lg glass-button flex items-center justify-center"
          >
            Verify a Product
          </Link>
          <Link
            to="/login"
            // THIS IS THE FIX for the button text
            className="text-lg font-semibold py-3 px-8 rounded-lg glass-button flex items-center justify-center"
          >
            Portal Login
          </Link>
        </div>
        
      </div>
    </div>
  );
}

export default HomePage;
