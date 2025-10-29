import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          {isOpen ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          )}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {onEdit && (
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
