
import React from 'react';
import { CollegeIcon, CheckCircleIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="p-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <CollegeIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Links Combined College</h1>
          <p className="text-sm text-gray-500">Student Enrollment Application</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Auto-saved 2 minutes ago</span>
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      </div>
    </header>
  );
};

export default Header;
