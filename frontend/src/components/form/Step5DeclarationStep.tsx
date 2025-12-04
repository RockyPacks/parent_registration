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
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 mt-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">Declaration</h1>
              <p className="text-gray-700 font-medium">Review and sign the enrollment declaration</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Modern Step Indicator */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-lg">5</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step 5 of 6</div>
                  <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    83% Complete
                  </div>
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
