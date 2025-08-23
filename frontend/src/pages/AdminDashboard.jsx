// frontend/src/pages/AdminDashboard.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// This is the new, self-contained animated title component.
const AnimatedTitle = ({ text }) => {
  // An array of different animation class names to apply to the letters.
  const animations = ['animate-font-1', 'animate-font-2', 'animate-font-3'];
  
  return (
    <div className="text-center">
      <h2 className="animated-title-text">
        {text.split('').map((char, index) => (
          <span 
            key={index}
            className={`animated-letter ${animations[index % animations.length]}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {char === ' ' ? '\u00A0' : char} {/* Handle spaces correctly */}
          </span>
        ))}
      </h2>
    </div>
  );
};

function AdminDashboard() {
  const { user } = useContext(AuthContext);

  // Fallback in case the user object or company name is not available
  const companyName = user?.companyName || 'Welcome';

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center">
        <AnimatedTitle text={companyName} />
        <p className="text-white/70 mt-6 max-w-md mx-auto">
          This dashboard will host the secure communication channel. Chat functionality is pending implementation.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;