
import React from 'react';
import { BuildingIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
          <BuildingIcon className="h-8 w-8 text-blue-600" />
          <span className="ml-3 text-xl sm:text-2xl font-semibold text-gray-800">SchoolRegister</span>
        </div>
        <div className="flex items-center">
          <div className="relative w-20 sm:w-24 h-2 bg-gray-200 rounded-full mr-2">
            <div className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full" style={{ width: '25%' }}></div>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-600">Application in progress</span>
        </div>
      </div>
    </header>
  );
};
