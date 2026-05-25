import React, { useState } from 'react';
import { UploadCard } from '../UploadCard';
import StudentInformation from './StudentInformation';
import ApplicationDetails from './ApplicationDetails';
import MedicalInformation from './MedicalInformation';
import FamilyInformation from './FamilyInformation';
import FeeResponsibility from './FeeResponsibility';
import SupportingDocuments from './SupportingDocuments';
import { MedicalIcon, FamilyIcon, FeeIcon } from '../Icons';

interface Step1StudentGuardianProps {
  studentData: any;
  medicalData: any;
  familyData: any; // Now includes nextOfKin data
  feeData: any;
  applicationDetailsData: any;
  applicationId?: string | null;
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
  onApplicationDetailsDataChange: (data: any) => void;
  onSubmitClick: () => void;
  isStudentInfoCompleted: boolean;
  isApplicationDetailsCompleted: boolean;
  isMedicalInfoCompleted: boolean;
  isFamilyInfoCompleted: boolean;
  isFeeResponsibilityCompleted: boolean;
  nextOfKinData: any; // Add nextOfKinData to the interface
}

const getIncompleteRequirements = (
  isStudentCompleted: boolean,
  isApplicationDetailsCompleted: boolean,
  isMedicalCompleted: boolean,
  isFamilyCompleted: boolean,
  isFeeCompleted: boolean
): string[] => {
  const incomplete: string[] = [];
  if (!isStudentCompleted) incomplete.push('Student Information');
  if (!isApplicationDetailsCompleted) incomplete.push('Application Details');
  if (!isMedicalCompleted) incomplete.push('Medical & Learner Health Details');
  if (!isFamilyCompleted) incomplete.push('Family Information (at least one parent)');
  if (!isFeeCompleted) incomplete.push('Fee Responsibility');
  return incomplete;
};

// Get detailed missing fields for better error messages
const getDetailedMissingFields = (studentData: any, applicationDetailsData: any, medicalData: any, familyData: any, feeData: any) => {
  const missingFields: { section: string; fields: string[] }[] = [];
  
  // Student Information required fields
  const studentMissing: string[] = [];
  if (!studentData?.surname || studentData.surname.trim().length < 2) studentMissing.push('Surname');
  if (!studentData?.firstName || studentData.firstName.trim().length < 2) studentMissing.push('First Name');
  if (!studentData?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) studentMissing.push('Email Address');
  if (!studentData?.phone || !/^(\+27|0)[6-8][0-9]{8}$/.test(studentData.phone)) studentMissing.push('Phone Number');
  if (!studentData?.dob) studentMissing.push('Date of Birth');
  if (!studentData?.gender) studentMissing.push('Gender');
  if (!studentData?.homeLanguage) studentMissing.push('Home Language');
  if (!studentData?.idNumber || !/^\d{13}$/.test(studentData.idNumber)) studentMissing.push('ID Number');
  if (!studentData?.previousGrade) studentMissing.push('Previous Class Name');
  if (!studentData?.gradeAppliedFor) studentMissing.push('Class Name Applied For');
  if (!studentData?.previousSchool || studentData.previousSchool.trim().length < 3) studentMissing.push('Previous School');
  if (studentMissing.length > 0) {
    missingFields.push({ section: 'Student Information', fields: studentMissing });
  }

  const applicationDetailsMissing: string[] = [];
  if (!applicationDetailsData?.proposedStartTerm) applicationDetailsMissing.push('Proposed Start Term');
  if (!applicationDetailsData?.year) applicationDetailsMissing.push('Year');
  if (!applicationDetailsData?.gradeApplyingFor) applicationDetailsMissing.push('Class Name Applying For');
  if (applicationDetailsData?.proposedStartDate) {
    const startDate = new Date(applicationDetailsData.proposedStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!Number.isNaN(startDate.getTime()) && startDate < today) {
      applicationDetailsMissing.push('Proposed Start Date cannot be in the past');
    }
  }
  if (applicationDetailsMissing.length > 0) {
    missingFields.push({ section: 'Application Details', fields: applicationDetailsMissing });
  }
  
  // Family Information required fields (at least one parent)
  const familyMissing: string[] = [];
  const hasFather = familyData?.fatherSurname && familyData?.fatherFirstName;
  const hasMother = familyData?.motherSurname && familyData?.motherFirstName;
  if (!hasFather && !hasMother) {
    familyMissing.push('At least one parent\'s information (Father or Mother)');
  }
  if (familyMissing.length > 0) {
    missingFields.push({ section: 'Family Information', fields: familyMissing });
  }
  
  // Fee Responsibility required fields
  const feeMissing: string[] = [];
  if (!feeData?.feePerson || feeData.feePerson.trim().length === 0) feeMissing.push('Fee Payer Name');
  if (!feeData?.relationship) feeMissing.push('Relationship to Student');
  if (!feeData?.feeTermsAccepted) feeMissing.push('Fee Terms Acceptance');
  if (feeMissing.length > 0) {
    missingFields.push({ section: 'Fee Responsibility', fields: feeMissing });
  }
  
  // Medical Information required fields
  const medicalMissing: string[] = [];
  if (!medicalData?.homeLanguage) medicalMissing.push('Home Language');
  if (!medicalData?.allergies || medicalData.allergies.trim().length === 0) medicalMissing.push('Allergy Information');
  if (!medicalData?.allergyStatus) medicalMissing.push('Allergy Status');
  if (!medicalData?.immunisationsUpToDate) medicalMissing.push('Compulsory Immunisations Up to Date');
  if (medicalMissing.length > 0) {
    missingFields.push({ section: 'Medical & Learner Health Details', fields: medicalMissing });
  }

  return missingFields;
};

const Step1StudentGuardian: React.FC<Step1StudentGuardianProps> = ({
  studentData,
  medicalData,
  familyData,
  feeData,
  applicationDetailsData,
  applicationId,
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
  onApplicationDetailsDataChange,
  onSubmitClick,
  isStudentInfoCompleted,
  isApplicationDetailsCompleted,
  isMedicalInfoCompleted,
  isFamilyInfoCompleted,
  isFeeResponsibilityCompleted,
  nextOfKinData, // Destructure nextOfKinData here
}) => {
  const [supportingDocsCount, setSupportingDocsCount] = useState(0);

  const incompleteRequirements = getIncompleteRequirements(
    isStudentInfoCompleted,
    isApplicationDetailsCompleted,
    isMedicalInfoCompleted,
    isFamilyInfoCompleted,
    isFeeResponsibilityCompleted
  );
  
  const detailedMissingFields = getDetailedMissingFields(studentData, applicationDetailsData, medicalData, familyData, feeData);
  const canProceed = incompleteRequirements.length === 0;
  
  const handleSubmitClick = () => {
    if (!canProceed) {
      // Scroll to the first incomplete section
      const firstIncompleteSection = detailedMissingFields[0]?.section;
      if (firstIncompleteSection) {
        const sectionMap: { [key: string]: string } = {
          'Student Information': 'student-information',
          'Application Details': 'application-details',
          'Medical & Learner Health Details': 'medical-information',
          'Family Information': 'family-information',
          'Fee Responsibility': 'fee-responsibility'
        };
        const elementId = sectionMap[firstIncompleteSection];
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else {
      onSubmitClick();
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 mt-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">Student & Guardian Information</h1>
              <p className="text-gray-700 font-medium">Complete your enrollment by filling out the required information below</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Modern Step Indicator */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-lg">1</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step 1 of 6</div>
                  <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    17% Complete
                  </div>
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
        {/* Update Notice for Existing Users - only shown if medical info is not complete */}
        {!isMedicalInfoCompleted && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-start gap-4 shadow-sm animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-indigo-900 mb-1">Important: Enrollment Requirements Updated</h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                To ensure the highest level of learner support and safety, we have updated our health records requirements. 
                <strong> Please review the "Medical & Learner Health Details" section below and complete any missing required fields (*)</strong> to proceed with your application.
              </p>
            </div>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-6">
          <UploadCard
            id="student-information"
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
            id="medical-information"
            title="Medical & Learner Health Details"
            required
            collapsible={true}
            defaultOpen={false}
            status={isMedicalInfoCompleted ? 'completed' : 'not-started'}
            icon={
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            }
          >
            <MedicalInformation initialData={medicalData} onDataChange={onMedicalDataChange} />
          </UploadCard>

          <UploadCard
            id="family-information"
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
            id="application-details"
            title="Application Details"
            required
            collapsible={true}
            defaultOpen={false}
            status={isApplicationDetailsCompleted ? 'completed' : 'not-started'}
            icon={
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            }
          >
            <ApplicationDetails initialData={applicationDetailsData} onDataChange={onApplicationDetailsDataChange} />
          </UploadCard>

          <UploadCard
            id="fee-responsibility"
            title="Fee Responsibility"
            required
            collapsible={true}
            defaultOpen={false}
            status={isFeeResponsibilityCompleted ? 'completed' : 'not-started'}
            icon={<FeeIcon className="w-8 h-8 text-yellow-400" />}
          >
            <FeeResponsibility
              initialData={feeData}
              familyData={{ ...familyData, ...nextOfKinData }}
              onDataChange={onFeeDataChange}
            />
          </UploadCard>

          <UploadCard
            id="supporting-documents"
            title="Supporting Documents"
            collapsible={true}
            defaultOpen={false}
            status={supportingDocsCount > 0 ? 'in-progress' : 'not-started'}
            currentCount={supportingDocsCount}
            requiredCount={6}
            icon={
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            }
          >
            <SupportingDocuments
              applicationId={applicationId}
              onUploadedCountChange={setSupportingDocsCount}
            />
          </UploadCard>
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
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-amber-800 mb-3">Please complete the following required fields:</p>
                    {detailedMissingFields.map((section, idx) => (
                      <div key={idx} className="mb-3 last:mb-0">
                        <p className="text-sm font-medium text-amber-700 mb-1">{section.section}:</p>
                        <ul className="text-sm text-amber-600 space-y-1 ml-4">
                          {section.fields.map((field, fieldIdx) => (
                            <li key={fieldIdx} className="flex items-start">
                              <span className="mr-2 text-amber-500">•</span>
                              <span>{field}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {canProceed && (
              <p className="text-gray-600 mb-6">All required fields are complete. Continue to document upload.</p>
            )}
            
            <button
              onClick={handleSubmitClick}
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
