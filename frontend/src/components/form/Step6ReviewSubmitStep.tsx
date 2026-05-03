import React, { useState, useEffect } from 'react';
import { ReviewSubmitStep } from '../ReviewSubmitStep';
import CheckIcon from '../icons/CheckIcon'; // Corrected: CheckIcon is a default export
import ApplicationForm, { ApplicationFormHandle } from '../ApplicationForm'; // Import ApplicationForm
import ConfirmationPage from '../ConfirmationPage'; // Import new ConfirmationPage
import { SummaryData } from '../../types'; // Import SummaryData type
import { useReactToPrint } from 'react-to-print'; // Re-import useReactToPrint for this component
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Step6ReviewSubmitStepProps {
  activeStep: number;
  applicationId?: string | null; // Add applicationId prop
  studentData: any;
  familyData: any;
  medicalData: any;
  feeData: any;
  applicationDetailsData: any;
  academicHistoryData: any;
  subjectsData: any;
  financingData: any;
  declarationData: any;
  documentsData: any[];
  isSubmitted?: boolean;
  onSubmit: () => void;
  nextOfKinData: any;
  onStepChange: (step: number) => void; 
  onStepComplete: (stepNumbers: number | number[]) => void; // Allow single or array
  isEditing: boolean;
  returnStep: number | null;
  setIsEditing: (isEditing: boolean) => void;
  setReturnStep: (step: number | null) => void;
}

interface ApplicationSubmittedCardProps {
  summaryData: SummaryData;
  applicationId: string; // Add applicationId prop
}

const ApplicationSubmittedCard: React.FC<ApplicationSubmittedCardProps> = ({ summaryData, applicationId }) => {
  const applicationFormHandleRef = React.useRef<ApplicationFormHandle>(null);

  const handleDownload = () => {
    if (applicationFormHandleRef.current) {
      applicationFormHandleRef.current.downloadPDF();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-white rounded-lg shadow-lg text-center">
      <div className="bg-green-100 rounded-full p-4 mb-4">
        <CheckIcon className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Application Has Been Successfully Submitted</h2>
      <p className="text-gray-700 mb-4 sm:mb-6">
        Thank you for completing your enrollment application. You can view or download your application below.
      </p>
      <p className="text-gray-600 mt-4 sm:mt-6">
        A confirmation email has been sent to your registered email address.
      </p>

      {/* Application Summary */}
      <div className="mt-8 w-full border rounded-lg p-4" style={{ backgroundColor: 'white', pageBreakInside: 'avoid' }}>
        <ApplicationForm 
          ref={applicationFormHandleRef}
          summaryData={summaryData} 
          applicationId={applicationId} 
          showPrintButton={false}
        />
      </div>

      <div className="mt-8 flex space-x-4">
        <button
          onClick={handleDownload}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
        >
          Download Application
        </button>
        <button
          onClick={() => window.location.reload()} // Or navigate to a dashboard
          className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

const Step6ReviewSubmitStep: React.FC<Step6ReviewSubmitStepProps> = ({
  activeStep,
  applicationId,
  studentData,
  familyData,
  medicalData,
  feeData,
  applicationDetailsData,
  academicHistoryData,
  subjectsData,
  financingData,
  declarationData,
  documentsData,
  onSubmit,
  nextOfKinData,
  onStepChange,
  onStepComplete,
  isEditing,
  returnStep,
  setIsEditing,
  setReturnStep,
  isSubmitted = false,
}) => {
  const [currentData, setCurrentData] = useState<SummaryData>(() => ({
    personalInfo: { // Required by SummaryData
      firstName: studentData?.firstName || '',
      lastName: studentData?.surname || '',
      email: studentData?.email,
    },
    student: {
      name: `${studentData?.firstName || ''} ${studentData?.surname || ''}`,
      email: studentData?.email,
      phone: studentData?.phone,
      dob: studentData?.dob,
      gender: studentData?.gender,
      idNumber: studentData?.idNumber,
      homeLanguage: studentData?.homeLanguage,
      previousGrade: studentData?.previousGrade,
      gradeAppliedFor: studentData?.gradeAppliedFor,
      previousSchool: studentData?.previousSchool,
    },
    applicationDetails: {
      proposedStartTerm: applicationDetailsData?.proposedStartTerm || '',
      year: applicationDetailsData?.year || '',
      gradeApplyingFor: applicationDetailsData?.gradeApplyingFor || '',
      proposedStartDate: applicationDetailsData?.proposedStartDate || '',
    },
    guardian: {
      fatherName: `${familyData?.fatherFirstName || ''} ${familyData?.fatherSurname || ''}`,
      fatherEmail: familyData?.fatherEmail || '',
      fatherPhone: familyData?.fatherMobile || '',
      fatherIdNumber: familyData?.fatherIdNumber || '',
      motherName: `${familyData?.motherFirstName || ''} ${familyData?.motherSurname || ''}`,
      motherEmail: familyData?.motherEmail || '',
      motherPhone: familyData?.motherMobile || '',
      motherIdNumber: familyData?.motherIdNumber || '',
      nextOfKinName: `${nextOfKinData?.firstName || ''} ${nextOfKinData?.surname || ''}`.trim(),
      nextOfKinRelationship: nextOfKinData?.relationship || '',
      nextOfKinEmail: nextOfKinData?.email || '',
      nextOfKinPhone: nextOfKinData?.mobile || '',
      nextOfKinIdNumber: nextOfKinData?.idNumber || '',
    },
    medical: medicalData,
    fee: feeData,
    academicHistory: (academicHistoryData && Object.keys(academicHistoryData).length > 0) ? [{
      schoolName: academicHistoryData.schoolName || '',
      schoolType: academicHistoryData.schoolType || '',
      lastGradeCompleted: academicHistoryData.lastGradeCompleted || '',
      academicYearCompleted: academicHistoryData.academicYearCompleted || '',
      reasonForLeaving: academicHistoryData.reasonForLeaving || '',
      principalName: academicHistoryData.principalName || '',
      schoolPhoneNumber: academicHistoryData.schoolPhoneNumber || '',
      schoolEmail: academicHistoryData.schoolEmail || '',
      schoolAddress: academicHistoryData.schoolAddress || '',
      additionalNotes: academicHistoryData.additionalNotes || '',
    }] : [],
    subjects: subjectsData,
    financing: financingData,
    declaration: declarationData,
    documents: documentsData || [], // Ensure documents is an array of DocumentCategory
  }));
  const [showConfirmationCard, setShowConfirmationCard] = useState(isSubmitted);
  const [generatedApplicationId, setGeneratedApplicationId] = useState(applicationId || ''); 

  // Generate a random-like application ID for demonstration
  const generateApplicationId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    console.log('Step6ReviewSubmitStep: useEffect triggered - updating currentData');
    console.log('Step6ReviewSubmitStep: studentData:', studentData);
    console.log('Step6ReviewSubmitStep: familyData:', familyData);
    console.log('Step6ReviewSubmitStep: medicalData:', medicalData);
    console.log('Step6ReviewSubmitStep: feeData:', feeData);
    console.log('Step6ReviewSubmitStep: nextOfKinData:', nextOfKinData);
    console.log('Step6ReviewSubmitStep: academicHistoryData:', academicHistoryData);
    console.log('Step6ReviewSubmitStep: financingData:', financingData);
    console.log('Step6ReviewSubmitStep: declarationData:', declarationData);
    console.log('Step6ReviewSubmitStep: documentsData:', documentsData);

    const newData = {
      personalInfo: { // Required by SummaryData
        firstName: studentData?.firstName || '',
        lastName: studentData?.surname || '',
        email: studentData?.email,
      },
      student: {
        name: `${studentData?.firstName || ''} ${studentData?.surname || ''}`,
        email: studentData?.email,
        phone: studentData?.phone,
        dob: studentData?.dob,
        gender: studentData?.gender,
        idNumber: studentData?.idNumber,
        homeLanguage: studentData?.homeLanguage,
        previousGrade: studentData?.previousGrade,
        gradeAppliedFor: studentData?.gradeAppliedFor,
        previousSchool: studentData?.previousSchool,
      },
      applicationDetails: {
        proposedStartTerm: applicationDetailsData?.proposedStartTerm || '',
        year: applicationDetailsData?.year || '',
        gradeApplyingFor: applicationDetailsData?.gradeApplyingFor || '',
        proposedStartDate: applicationDetailsData?.proposedStartDate || '',
      },
      guardian: {
        fatherName: `${familyData?.fatherFirstName || ''} ${familyData?.fatherSurname || ''}`,
        fatherEmail: familyData?.fatherEmail || '',
        fatherPhone: familyData?.fatherMobile || '',
        fatherIdNumber: familyData?.fatherIdNumber || '',
        motherName: `${familyData?.motherFirstName || ''} ${familyData?.motherSurname || ''}`,
        motherEmail: familyData?.motherEmail || '',
        motherPhone: familyData?.motherMobile || '',
        motherIdNumber: familyData?.motherIdNumber || '',
        nextOfKinName: `${nextOfKinData?.firstName || ''} ${nextOfKinData?.surname || ''}`.trim(),
        nextOfKinRelationship: nextOfKinData?.relationship || '',
        nextOfKinEmail: nextOfKinData?.email || '',
        nextOfKinPhone: nextOfKinData?.mobile || '',
        nextOfKinIdNumber: nextOfKinData?.idNumber || '',
      },
      medical: medicalData,
      fee: feeData,
      academicHistory: (academicHistoryData && Object.keys(academicHistoryData).length > 0) ? [{
        schoolName: academicHistoryData.schoolName || '',
        schoolType: academicHistoryData.schoolType || '',
        lastGradeCompleted: academicHistoryData.lastGradeCompleted || '',
        academicYearCompleted: academicHistoryData.academicYearCompleted || '',
        reasonForLeaving: academicHistoryData.reasonForLeaving || '',
        principalName: academicHistoryData.principalName || '',
        schoolPhoneNumber: academicHistoryData.schoolPhoneNumber || '',
        schoolEmail: academicHistoryData.schoolEmail || '',
        schoolAddress: academicHistoryData.schoolAddress || '',
        additionalNotes: academicHistoryData.additionalNotes || '',
      }] : [],
      subjects: subjectsData,
      financing: financingData,
      declaration: declarationData,
      documents: documentsData || [],
    };
    
    console.log('Step6ReviewSubmitStep: newData to be set:', newData);
    setCurrentData(newData);
  }, [studentData, familyData, medicalData, feeData, applicationDetailsData, academicHistoryData, subjectsData, financingData, declarationData, documentsData, nextOfKinData]);

  const handleEditStep = (stepNumber: number) => {
    if (setIsEditing) setIsEditing(true);
    if (setReturnStep) setReturnStep(activeStep);
    onStepChange && onStepChange(stepNumber);
  };

  const handleSubmitAndShowConfirmation = () => {
    console.log('Step6ReviewSubmitStep: handleSubmitAndShowConfirmation called');
    // Always use the real applicationId from props
    if (!applicationId) {
      return;
    }
    setGeneratedApplicationId(applicationId);
    setShowConfirmationCard(true);

    // Call onSubmit to trigger backend submission and mark step 6 as complete in MainContent
    console.log('Step6ReviewSubmitStep: Calling onSubmit to submit application to backend');
    onSubmit();
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {showConfirmationCard ? (
        <ConfirmationPage 
          studentName={`${studentData?.firstName || ''} ${studentData?.surname || ''}`.trim() || undefined}
          applicationId={generatedApplicationId}
          summaryData={currentData}
          onClose={() => {
            // Optional: Add navigation logic here (e.g., redirect to dashboard)
            // For now, we'll just hide the confirmation and show the review page again
            setShowConfirmationCard(false);
          }}
        />
      ) : (
        <>
          <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 mt-24">
            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 mb-2">Review and Submit</h1>
                  <p className="text-gray-700 font-medium">Final review of your enrollment application</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {/* Modern Step Indicator */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 shadow-lg animate-pulse">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-blue-600 font-bold text-lg">6</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step 6 of 6</div>
                      <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                        100% Complete
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
            <ReviewSubmitStep
              currentData={currentData}
              onBack={() => onStepChange && onStepChange(5)}
              onEditStep={handleEditStep}
              onSubmit={handleSubmitAndShowConfirmation} // Use the new handler here
              onStepComplete={onStepComplete}
            />
          </div>
        </>
      )}

      {/* Footer component has been removed from this step */}
    </div>
  );
};

export default Step6ReviewSubmitStep;
