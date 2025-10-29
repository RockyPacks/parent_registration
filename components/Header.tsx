
import React from 'react';
import { CollegeIcon, CheckCircleIcon } from './Icons';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  lastSaved?: string;
  showAutoSave?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = "Links Combined College",
  subtitle = "Student Enrollment Application",
  lastSaved = "2 minutes ago",
  showAutoSave = true,
  onLogout
}) => {
  return (
    <header className="fixed top-0 left-0 md:left-[25%] right-0 z-50 bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm md:rounded-t-lg">
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 rounded-xl shadow-sm">
          <CollegeIcon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">

        {onLogout && (
          <button
            onClick={onLogout}
            className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
