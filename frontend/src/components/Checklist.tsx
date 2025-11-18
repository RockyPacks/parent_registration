
import React from 'react';
import { DocumentCategory, CategoryStatus } from '../types';
import { CheckIcon, AlertTriangleIcon, CircleIcon } from './Icons';

interface ChecklistProps {
  categories: DocumentCategory[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

const CategoryBadge: React.FC<{ category: DocumentCategory; isActive: boolean; onClick: () => void; }> = ({ category, isActive, onClick }) => {
  const getStatusIndicator = () => {
    switch (category.status) {
      case CategoryStatus.Completed:
        return <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mr-2"><CheckIcon className="w-3 h-3 text-white" /></div>;
      case CategoryStatus.InProgress:
        return <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center mr-2"><AlertTriangleIcon className="w-3 h-3 text-white" /></div>;
      case CategoryStatus.NotStarted:
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-400 mr-2"></div>;
    }
  };

  const activeClasses = isActive 
    ? "bg-blue-100 border-blue-500 text-blue-700"
    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50";

  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 border rounded-md font-medium text-sm transition-colors duration-150 ${activeClasses}`}
    >
      {getStatusIndicator()}
      {category.title}
    </button>
  );
};

export const Checklist: React.FC<ChecklistProps> = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-semibold mb-3 text-gray-700">Required Documents Checklist</h3>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {categories.map(cat => (
          <CategoryBadge
            key={cat.id}
            category={cat}
            isActive={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
          />
        ))}
      </div>
    </div>
  );
};
