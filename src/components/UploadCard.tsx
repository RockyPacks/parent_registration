
import React, { useState } from 'react';

interface UploadCardProps {
  title: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  status?: 'not-started' | 'in-progress' | 'completed';
}

export const UploadCard: React.FC<UploadCardProps> = ({
  title,
  required,
  children,
  icon,
  collapsible = false,
  defaultOpen = true,
  status = 'not-started'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm transition-all duration-200 ${
      collapsible && !isOpen ? 'border-gray-200' : 'border-gray-200'
    }`}>
      <div
        className={`p-4 sm:p-6 ${collapsible ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
        onClick={toggleOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            {icon && <div className="mr-3 text-gray-500 flex-shrink-0">{icon}</div>}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              <div className="flex items-center mt-1 space-x-2">
                {required && <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">Required</span>}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>
          {collapsible && (
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};
