import React from 'react';
import { UploadCard } from '../UploadCard';
import StudentInformation from './StudentInformation';

import MedicalInformation from './MedicalInformation';
import FamilyInformation from './FamilyInformation';
import FeeResponsibility from './FeeResponsibility';
import { MedicalIcon, FamilyIcon, FeeIcon } from '../Icons';

interface Step1StudentGuardianProps {
  studentData: any;
  medicalData: any;
  familyData: any; // Now includes nextOfKin data
  feeData: any;
  validationErrors: {[key: string]: string};
  savingStatus: 'idle' | 'saving' | 'saved';
  dataLoaded: boolean;
  isSubmitting: boolean;
  applicationInitialized: boolean;
  onStudentDataChange: (data: any) => void;
  onMedicalDataChange: (data: any) => void;
  onFamilyDataChange: (data: any) => void;
  onNextOfKinDataChange: (data: any) => void; // Add this prop
  onFeeDataChange: (data: any) => void;
  onSubmitClick: () => void;
  isStudentInfoCompleted: boolean;
  isMedicalInfoCompleted: boolean;
  isFamilyInfoCompleted: boolean;
  isFeeResponsibilityCompleted: boolean;
  nextOfKinData: any; // Add nextOfKinData to the interface
}

const getIncompleteRequirements = (isStudentCompleted: boolean, isFamilyCompleted: boolean, isFeeCompleted: boolean): string[] => {
  const incomplete: string[] = [];
  if (!isStudentCompleted) incomplete.push('Student Information');
  if (!isFamilyCompleted) incomplete.push('Family Information (at least one parent)');
  if (!isFeeCompleted) incomplete.push('Fee Responsibility');
  return incomplete;
};

const Step1StudentGuardian: React.FC<Step1StudentGuardianProps> = ({
  studentData,
  medicalData,
  familyData,
  feeData,
  validationErrors,
  savingStatus,
  dataLoaded,
  isSubmitting,
  applicationInitialized,
  onStudentDataChange,
  onMedicalDataChange,
  onFamilyDataChange,
  onNextOfKinDataChange, 
  onFeeDataChange,
  onSubmitClick,
  isStudentInfoCompleted,
  isMedicalInfoCompleted,
  isFamilyInfoCompleted,
  isFeeResponsibilityCompleted,
  nextOfKinData, // Destructure nextOfKinData here
}) => {
  const incompleteRequirements = getIncompleteRequirements(
    isStudentInfoCompleted,
    isFamilyInfoCompleted,
    isFeeResponsibilityCompleted
  );
  
  const canProceed = incompleteRequirements.length === 0;

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student & Guardian Information</h1>
              <p className="text-gray-700 font-medium">Complete your enrollment by filling out the required information below</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Step 1 of 6</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '17%'}}></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Saving Status Indicator */}
                {savingStatus === 'saving' && (
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </div>
                )}
                {savingStatus === 'saved' && (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    All changes saved
                  </div>
                )}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-6 md:pt-10 pb-24 md:pb-32">
        {/* Form Sections */}
        <div className="space-y-6">
          <UploadCard
            title="Student Information"
            required
            collapsible={true}
            defaultOpen={true}
            status={isStudentInfoCompleted ? 'completed' : 'not-started'}
            icon={
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            }
          >
            <StudentInformation initialData={studentData} onDataChange={onStudentDataChange} onNext={onSubmitClick} />
          </UploadCard>

          <UploadCard
            title="Medical Information"
            required={false}
            collapsible={true}
            defaultOpen={false}
            status={isMedicalInfoCompleted ? 'completed' : 'not-started'}
            icon={
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            }
          >
            <MedicalInformation initialData={medicalData} onDataChange={onMedicalDataChange} />
          </UploadCard>

          <UploadCard
            title="Family Information"
            required
            collapsible={true}
            defaultOpen={false}
            status={isFamilyInfoCompleted ? 'completed' : 'not-started'}
            icon={<FamilyIcon className="w-8 h-8 text-green-500" />}
          >
            <FamilyInformation
              initialFamilyData={familyData}
              initialNextOfKinData={nextOfKinData} // Pass nextOfKinData separately
              onFamilyDataChange={onFamilyDataChange}
              onNextOfKinDataChange={onNextOfKinDataChange}
            />
          </UploadCard>

          <UploadCard
            title="Fee Responsibility"
            required
            collapsible={true}
            defaultOpen={false}
            status={isFeeResponsibilityCompleted ? 'completed' : 'not-started'}
            icon={<FeeIcon className="w-8 h-8 text-yellow-400" />}
          >
            <FeeResponsibility initialData={feeData} familyData={familyData} onDataChange={onFeeDataChange} />
          </UploadCard>

          {/* Other form sections such as FamilyInformation, FeeResponsibility can be added here similarly with props */}
        </div>

        <div className={`rounded-xl p-6 border shadow-sm mt-6 ${
          canProceed 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
        }`}>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {canProceed ? 'Ready to Continue?' : 'Complete Required Fields'}
            </h3>
            
            {!canProceed && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-amber-300">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-800 mb-2">Please complete the following required sections:</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {incompleteRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="mr-2">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {canProceed && (
              <p className="text-gray-600 mb-6">All required fields are complete. Continue to document upload.</p>
            )}
            
            <button
              onClick={onSubmitClick}
              disabled={!canProceed || isSubmitting || !applicationInitialized}
              className={`w-full py-4 px-8 rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg ${
                canProceed && !isSubmitting && applicationInitialized
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Saving...' : !applicationInitialized ? 'Loading...' : canProceed ? 'Save & Continue to Documents' : 'Complete Required Fields First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1StudentGuardian;
