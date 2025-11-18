import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  disabled?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, onEdit, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border border-gray-200 rounded-lg ${disabled ? 'opacity-60' : ''}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 text-left bg-gray-50 transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
      >
        <div className="flex items-center space-x-3">
          {isOpen ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          )}
          <h3 className={`text-lg font-semibold ${disabled ? 'text-gray-500' : 'text-gray-800'}`}>{title}</h3>
        </div>
        {onEdit && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        )}
        {disabled && (
          <span className="text-gray-400 text-sm font-medium">Read-only</span>
        )}
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;
