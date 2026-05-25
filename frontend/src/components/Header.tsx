import React, { useEffect, useState } from 'react';
import knitIcon from '../../assets/knit-icon.png';

interface HeaderProps {
  onLogout?: () => void;
  onNavigate?: (view: 'enrollment' | 'payment-confirmation') => void;
  currentView?: 'enrollment' | 'payment-confirmation';
  userName?: string;
  userEmail?: string;
  schoolName?: string;
}

const SELECTED_SCHOOL_LOGO_KEY = 'selectedSchoolLogo';
const SELECTED_SCHOOL_NAME_KEY = 'selectedSchoolName';

const Header: React.FC<HeaderProps> = ({
  onLogout,
  schoolName
}) => {
  const [logo, setLogo] = useState(knitIcon);
  const [displayName, setDisplayName] = useState(schoolName || 'Knit');

  useEffect(() => {
    const savedLogo = localStorage.getItem(SELECTED_SCHOOL_LOGO_KEY);
    const savedSchoolName = localStorage.getItem(SELECTED_SCHOOL_NAME_KEY);

    if (savedLogo) setLogo(savedLogo);
    if (savedSchoolName) setDisplayName(savedSchoolName);
    else if (schoolName) setDisplayName(schoolName);
  }, [schoolName]);

  return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm md:ml-[25%]">
        <div className="h-16 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt={`${displayName} logo`}
              className="w-9 h-9 object-contain"
            />
          </div>

          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {displayName}
            </h1>
            <p className="text-xs text-slate-500">
              powered by Knit · Student Enrollment Application
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;