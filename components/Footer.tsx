
import React from 'react';
import { BackArrowIcon, SaveIcon, NextArrowIcon } from './Icons';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white p-6 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4">
      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
        <BackArrowIcon className="w-4 h-4" />
        Back
      </button>
      <div className="flex flex-wrap items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <SaveIcon className="w-4 h-4" />
          Save & Continue Later
        </button>
        <button className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Next: Document Upload
          <NextArrowIcon className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
