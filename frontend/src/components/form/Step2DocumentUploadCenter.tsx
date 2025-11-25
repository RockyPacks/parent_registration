import React from 'react';
import { DocumentUploadCenter } from '../DocumentUploadCenter';

interface Step2DocumentUploadCenterProps {
  applicationId?: string | null;
  onDocumentUploadComplete?: () => void;
  onBack?: () => void;
  onDocumentsChange?: (data: any[]) => void; // Add this prop
}

// /Users/morokolochueu/Desktop/prod-parent/frontend/src/components/form/Step2DocumentUploadCenter.tsx

const Step2DocumentUploadCenter: React.FC<Step2DocumentUploadCenterProps> = ({
  applicationId,
  onDocumentUploadComplete,
  onBack,
  onDocumentsChange // The prop is now correctly destructured here
}) => {
  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
        <DocumentUploadCenter
          applicationId={applicationId}
          onDocumentUploadComplete={onDocumentUploadComplete}
          onBack={onBack}
          onDocumentsChange={onDocumentsChange} // And passed down here
        />
      </div>
    </div>
  );
};


Step2DocumentUploadCenter.displayName = 'Step2DocumentUploadCenter';

export default Step2DocumentUploadCenter;
