import { Link } from 'react-router-dom';

// This is the new, stacked logo component for the public pages
const Logo = () => (
    <div className="flex flex-col items-center -space-y-1">
        <span className="text-xs text-white/80 tracking-widest">THE</span>
        <span className="text-xl font-bold text-white tracking-wider">CRITERION</span>
        <span className="text-sm text-white/80 tracking-widest">MARK</span>
    </div>
);

function Navbar() {
  // Simplified for public pages, no auth context needed here
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="glass-panel max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <Logo />
                <div className="flex items-center space-x-4">
                    <Link to="/" className="text-white/80 hover:text-white font-medium">Home</Link>
                    <Link to="/verify" className="text-white/80 hover:text-white font-medium">Verify Product</Link>
                    <Link to="/login" className="px-4 py-2 rounded-lg text-sm glass-button font-semibold">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
}
export default Navbar;