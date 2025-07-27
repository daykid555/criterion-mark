// frontend/src/components/Navbar.jsx

import { useState } from 'react'; // NEW: Import useState
import { Link } from 'react-router-dom';

const Logo = () => (
    <Link to="/" className="flex flex-col items-center -space-y-1">
        <span className="text-xs text-white/80 tracking-widest">THE</span>
        <span className="text-xl font-bold text-white tracking-wider">CRITERION</span>
        <span className="text-sm text-white/80 tracking-widest">MARK</span>
    </Link>
);

// --- NEW: Hamburger Icon Component ---
const HamburgerIcon = ({ open }) => (
  <div className="flex flex-col justify-around w-6 h-6">
    <span className={`h-0.5 w-full bg-white transition-transform duration-300 ${open ? 'rotate-45 translate-y-[0.5rem]' : ''}`}></span>
    <span className={`h-0.5 w-full bg-white transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}></span>
    <span className={`h-0.5 w-full bg-white transition-transform duration-300 ${open ? '-rotate-45 -translate-y-[0.5rem]' : ''}`}></span>
  </div>
);


function Navbar() {
  // NEW: State to manage the mobile menu visibility
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="glass-panel max-w-7xl mx-auto">
            {/* Main navbar container */}
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Logo - always visible */}
                <div className="z-20"> {/* Ensure logo is clickable above mobile menu */}
                  <Logo />
                </div>

                {/* --- MODIFIED: Desktop Menu --- */}
                {/* This div is now hidden on small screens */}
                <div className="hidden md:flex items-center space-x-4">
                    <Link to="/" className="text-white/80 hover:text-white font-medium">Home</Link>
                    <Link to="/verify" className="text-white/80 hover:text-white font-medium">Verify Product</Link>
                    <Link to="/login" className="px-4 py-2 rounded-lg text-sm glass-button font-semibold">
                        Login
                    </Link>
                </div>

                {/* --- NEW: Hamburger Menu Button --- */}
                {/* This button is only visible on small screens (md and below) */}
                <div className="md:hidden z-20">
                  <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                    <HamburgerIcon open={isOpen} />
                  </button>
                </div>
            </div>

            {/* --- NEW: Mobile Menu Panel --- */}
            {/* This panel appears with a transition when isOpen is true */}
            <div 
              className={`
                md:hidden absolute top-0 left-0 w-full h-screen pt-24 px-8 
                bg-gray-900/80 backdrop-blur-xl
                flex flex-col items-center space-y-6 text-2xl
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'transform-none' : '-translate-x-full'}
              `}
            >
              <Link to="/" onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white font-medium">Home</Link>
              <Link to="/verify" onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white font-medium">Verify Product</Link>
              <Link to="/login" onClick={() => setIsOpen(false)} className="mt-4 px-6 py-3 rounded-lg text-lg glass-button font-semibold">
                  Login
              </Link>
            </div>
        </div>
    </div>
  );
}

export default Navbar;