import React from 'react';
import { qualifications, requiredDocuments } from '../constants';
import CheckIcon from './icons/CheckIcon';
import WarningIcon from './icons/WarningIcon';

const InfoSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">You Qualify For</h3>
        <ul className="space-y-3">
          {qualifications.map((item) => (
            <li key={item} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckIcon className="h-5 w-5 text-success-DEFAULT" />
              </div>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Required Documents</h3>
        <ul className="space-y-3">
          {requiredDocuments.map((doc) => (
            <li key={doc.text} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {doc.type === 'positive' ? (
                  <CheckIcon className="h-5 w-5 text-success-DEFAULT" />
                ) : (
                  <WarningIcon className="h-5 w-5 text-warning-DEFAULT" />
                )}
              </div>
              <span className="text-gray-700">{doc.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InfoSection;
