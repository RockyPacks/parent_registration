import React from 'react';
import OptionCard from './OptionCard';
import { financingOptionsData } from '../constants';

interface FinancingOptionsProps {
  selectedPlan: string;
  onSelectPlan: (title: string) => void;
}

const FinancingOptions: React.FC<FinancingOptionsProps> = ({ selectedPlan, onSelectPlan }) => {
  const handleSelectPlan = (title: string) => {
    // If clicking on the already selected plan, deselect it
    if (selectedPlan === title) {
      onSelectPlan('');
    } else {
      onSelectPlan(title);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Financing Options</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {financingOptionsData.map((option) => (
          <OptionCard
            key={option.title}
            option={option}
            isSelected={selectedPlan === option.title}
            onSelect={() => handleSelectPlan(option.title)}
          />
        ))}
      </div>
    </div>
  );
};

export default FinancingOptions;
