import React from 'react';
import { BackArrowIcon, NextArrowIcon } from './Icons';

interface FooterProps {
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  showNext?: boolean;
  showSkip?: boolean;
  nextLabel?: string;
  skipLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const SELECTED_SCHOOL_NAME_KEY = 'selectedSchoolName';

const isMoloSchool = () => {
  const selectedSchoolName = localStorage.getItem(SELECTED_SCHOOL_NAME_KEY) || '';
  const normalized = selectedSchoolName.toLowerCase();

  return (
    normalized.includes('molo') ||
    normalized.includes('mhlaba') ||
    normalized.includes('tennyson')
  );
};

const Footer: React.FC<FooterProps> = ({
  onBack,
  onNext,
  onSkip,
  showBack = true,
  showNext = true,
  showSkip = false,
  nextLabel = 'Next: Document Upload',
  skipLabel = 'Skip',
  isLoading = false,
  disabled = false
}) => {
  const showMoloFooter = isMoloSchool();

  return (
    <footer className="fixed bottom-0 left-0 md:left-[25%] right-0 z-40 bg-white border-t border-gray-300 shadow-xl md:rounded-b-lg">
      {showMoloFooter && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 text-xs sm:text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-4">
              <a href="mailto:tennyson@molomhlaba.org" className="font-medium text-gray-700 hover:text-blue-600">
                tennyson@molomhlaba.org
              </a>
              <a href="tel:+27637958328" className="font-medium text-gray-700 hover:text-blue-600">
                063 795 8328
              </a>
              <a href="https://molomhlaba.org/" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-700 hover:text-blue-600">
                molomhlaba.org
              </a>
            </div>

            <div className="text-gray-600">
              28 Tennyson Street, Mandalay, Cape Town, 7785
            </div>
          </div>
        </div>
      )}

      <div className="p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {showBack && (
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
              <BackArrowIcon className="w-4 h-4" />
              Back
            </button>
          )}

          {showSkip && (
            <button onClick={onSkip} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-300 rounded-md">
              {skipLabel}
            </button>
          )}
        </div>

        {showNext && (
          <button
            onClick={onNext}
            disabled={isLoading || disabled}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : nextLabel}
            {!isLoading && <NextArrowIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;