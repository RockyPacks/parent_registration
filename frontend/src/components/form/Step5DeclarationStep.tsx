import React from 'react';
import DeclarationStep from './DeclarationStep';
import Footer from '../Footer';

interface Step5DeclarationStepProps {
  applicationId?: string | null;
  onStepChange?: (step: number) => void;
  onStepComplete?: (stepNumber: number) => void;
  onDeclarationComplete?: () => void;
  onDataChange?: (data: any) => void; // Add this prop
}

const Step5DeclarationStep: React.FC<Step5DeclarationStepProps> = ({
  applicationId,
  onStepChange,
  onStepComplete,
  onDeclarationComplete,
  onDataChange // Destructure onDataChange prop
}) => {
  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Declaration</h1>
              <p className="text-gray-700 font-medium">Review and sign the enrollment declaration</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Step 5 of 6</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '83%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
        <DeclarationStep
          applicationId={applicationId}
          onBack={() => onStepChange && onStepChange(4)}
          onStepChange={onStepChange}
          onStepComplete={onStepComplete}
          onDataChange={onDataChange}
        />
      </div>

      <Footer
        onBack={() => onStepChange && onStepChange(4)}
        onSave={() => {}}
        onNext={() => onStepChange && onStepChange(6)}
        showBack={true}
        showSave={false}
        showNext={true}
        nextLabel="Next: Review and Submit"
      />
    </div>
  );
};

Step5DeclarationStep.displayName = 'Step5DeclarationStep';

export default Step5DeclarationStep;
