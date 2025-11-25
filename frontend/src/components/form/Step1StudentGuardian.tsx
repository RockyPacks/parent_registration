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
            <FeeResponsibility initialData={feeData} onDataChange={onFeeDataChange} />
          </UploadCard>

          {/* Other form sections such as FamilyInformation, FeeResponsibility can be added here similarly with props */}
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm mt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Continue?</h3>
            <p className="text-gray-600 mb-6">Complete step 1 to proceed to document upload.</p>
            <button
              onClick={onSubmitClick}
              disabled={false}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-lg shadow-lg"
            >
              {isSubmitting ? 'Saving...' : !applicationInitialized ? 'Loading...' : 'Save & Continue to Documents'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1StudentGuardian;
