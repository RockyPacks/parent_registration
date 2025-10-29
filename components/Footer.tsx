
import React from 'react';
import { BackArrowIcon, SaveIcon, NextArrowIcon } from './Icons';

interface FooterProps {
  onBack?: () => void;
  onSave?: () => void;
  onNext?: () => void;
  showBack?: boolean;
  showSave?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  onBack,
  onSave,
  onNext,
  showBack = true,
  showSave = true,
  showNext = true,
  nextLabel = "Next: Document Upload",
  isLoading = false
}) => {
  return (
    <footer className="fixed bottom-0 left-0 md:left-[25%] right-0 z-40 bg-white p-6 border-t border-gray-300 flex flex-wrap justify-between items-center gap-4 shadow-xl md:rounded-b-lg">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 hover:shadow-md"
          >
            <BackArrowIcon className="w-4 h-4" />
            Back
          </button>
        )}
        {showSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
          >
            <SaveIcon className="w-4 h-4" />
            Save & Continue Later
          </button>
        )}
      </div>
      {showNext && (
        <button
          onClick={onNext}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              {nextLabel}
              <NextArrowIcon className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </footer>
  );
};

export default Footer;
