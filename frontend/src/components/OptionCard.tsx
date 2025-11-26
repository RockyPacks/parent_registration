import React from 'react';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';
import UsersIcon from './icons/UsersIcon';

// Define the shape of financing option data used in constants
interface FinancingOptionData {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  tag?: { type: string; text: string };
  features: Array<{ text: string; type: 'positive' | 'warning' | 'info' }>; // matches CONFIRMATIONS style
}

interface OptionCardProps {
  option: FinancingOptionData;
  isSelected: boolean;
  onSelect: () => void;
  onMouseEnter?: () => void;
}

const tagStyles: Record<string, string> = {
  save: 'bg-success-light text-success-DEFAULT',
  cost: 'bg-warning-light text-warning-DEFAULT',
  'best-value': 'bg-primary text-white',
  none: 'hidden',
};

const Feature: React.FC<{ feature: { text: string; type: string } }> = ({ feature }) => {
  const Icon = () => {
    switch (feature.type) {
      case 'positive':
        return <CheckIcon className="h-4 w-4 text-success-DEFAULT" />;
      case 'warning':
        return <WarningIcon className="h-5 w-5 text-warning-DEFAULT" />;
      case 'info':
        return <UsersIcon className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };
  return (
    <li className="flex items-center space-x-3">
      <div className="flex-shrink-0"><Icon /></div>
      <span className="text-sm text-gray-600">{feature.text}</span>
    </li>
  );
};

const OptionCard: React.FC<OptionCardProps> = ({ option, isSelected, onSelect, onMouseEnter }) => {
  const cardClasses = `bg-white rounded-xl shadow-md p-6 flex flex-col transition-all duration-300 h-full cursor-pointer ${isSelected ? 'border-2 border-primary ring-2 ring-blue-200' : 'border border-gray-200 hover:border-gray-300'
    }`;

  const buttonClasses = `w-full py-3 rounded-lg font-semibold text-center mt-auto transition-colors duration-200 ${isSelected ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className="relative" onMouseEnter={onMouseEnter}>
      {option.tag && option.tag.type !== 'none' && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 ${tagStyles[option.tag.type]}`}> {option.tag.text} </div>
      )}
      <div className={cardClasses} onClick={onSelect}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{option.title}</h3>
            <p className="text-sm text-gray-500">{option.subtitle}</p>
          </div>
        </div>
        <div className="my-4">
          <span className="text-4xl font-extrabold text-gray-900">{option.price}</span>
          <span className="text-gray-500 ml-1">{option.period}</span>
        </div>
        <ul className="space-y-3 mb-6">
          {option.features.map((feature, idx) => (
            <Feature key={idx} feature={feature} />
          ))}
        </ul>
        <button onClick={e => { e.stopPropagation(); onSelect(); }} className={buttonClasses}>
          {isSelected ? 'Selected (Click to Deselect)' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};

export default OptionCard;
