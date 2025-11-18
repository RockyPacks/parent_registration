
import React from 'react';
import { ArrowLeftIcon, SaveIcon, ArrowRightIcon } from './Icons';

interface ActionButtonsProps {
  disabled?: boolean;
  onContinue?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ disabled = false, onContinue }) => {
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div></div>
  );
};
