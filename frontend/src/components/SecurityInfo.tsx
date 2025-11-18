
import React from 'react';
import { ShieldCheckIcon } from './Icons';

export const SecurityInfo: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-3">
        <ShieldCheckIcon className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-blue-800">Document Security & Privacy</h3>
      </div>
      <div className="text-sm text-blue-700 space-y-2">
        <p>Your documents are protected with bank-level encryption and are only accessible to authorized school personnel for application review purposes.</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>All files are encrypted during upload and storage.</li>
          <li>Documents are automatically deleted after enrollment completion.</li>
          <li>Access is logged and monitored for security.</li>
        </ul>
      </div>
    </div>
  );
};
