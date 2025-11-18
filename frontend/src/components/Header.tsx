
import React from 'react';
import knitIcon from '../../assets/knit-icon.png';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  lastSaved?: string;
  showAutoSave?: boolean;
  onLogout?: () => void;
  onNavigate?: (view: 'enrollment') => void;
  currentView?: 'enrollment' | 'payment-confirmation';
}

const Header: React.FC<HeaderProps> = ({
  title = "Knit.",
  subtitle = "Student Enrollment Application",
  lastSaved = "2 minutes ago",
  showAutoSave = true,
  onLogout,
  onNavigate,
  currentView = 'enrollment'
}) => {
  return (
    <header className="fixed top-0 left-0 md:left-[25%] right-0 z-50 bg-white border-b border-gray-200 p-2 md:p-3 lg:p-4 flex justify-between items-center shadow-sm md:rounded-t-lg">
      <div className="flex items-center gap-2 md:gap-4">
        <img src={knitIcon} alt="Knit Icon" className="h-6 w-6 md:h-8 md:w-8 object-contain" />
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-xs md:text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {onNavigate && (
          <button
            onClick={() => onNavigate('enrollment')}
            className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
              currentView === 'enrollment'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            Enrollment
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className="ml-2 md:ml-4 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
