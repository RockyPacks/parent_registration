import React from 'react';
import DeclarationStep from './form/DeclarationStep';
import StudentInformation from './form/StudentInformation';
import MedicalInformation from './form/MedicalInformation';
import FamilyInformation from './form/FamilyInformation';
import FeeResponsibility from './form/FeeResponsibility';
import FeeAgreement from './form/FeeAgreement';
import ReviewSubmitStep from './ReviewSubmitStep';
import { DocumentUploadCenter } from '../src/components/DocumentUploadCenter';
import { UploadCard } from '../src/components/UploadCard';
import AcademicHistoryForm from './AcademicHistoryForm';
import SubjectSelection from '../src/components/SubjectSelection';
import ToastContainer from './ui/ToastContainer';
import { useToast } from '../hooks/useToast';
import Footer from './Footer';

interface MainContentProps {
  activeStep: number;
  applicationId?: string | null;
  onEnrollmentSubmit?: (data: any) => void;
  onDocumentUploadComplete?: () => void;
  onStepChange?: (step: number) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeStep,
  applicationId,
  onEnrollmentSubmit,
  onDocumentUploadComplete,
  onStepChange
}) => {
  const { toasts, addToast, removeToast } = useToast();
  const [studentData, setStudentData] = React.useState<any>({});
  const [medicalData, setMedicalData] = React.useState<any>({});
  const [familyData, setFamilyData] = React.useState<any>({});
  const [feeData, setFeeData] = React.useState<any>({});
  const [validationErrors, setValidationErrors] = React.useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dataLoaded, setDataLoaded] = React.useState(false);

  // Listen for save progress event
  React.useEffect(() => {
    const handleSaveEvent = () => {
      handleSaveProgress();
    };

    window.addEventListener('saveProgress', handleSaveEvent);
    return () => window.removeEventListener('saveProgress', handleSaveEvent);
  }, []);

  // Load saved data from localStorage on component mount
  React.useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedStudentData = localStorage.getItem('studentInformation');
        const savedMedicalData = localStorage.getItem('medicalInformation');
        const savedFamilyData = localStorage.getItem('familyInformation');
        const savedFeeData = localStorage.getItem('feeResponsibility');

        if (savedStudentData) {
          const parsed = JSON.parse(savedStudentData);
          setStudentData(parsed);
        }
        if (savedMedicalData) {
          const parsed = JSON.parse(savedMedicalData);
          setMedicalData(parsed);
        }
        if (savedFamilyData) {
          const parsed = JSON.parse(savedFamilyData);
          setFamilyData(parsed);
        }
        if (savedFeeData) {
          const parsed = JSON.parse(savedFeeData);
          setFeeData(parsed);
        }

        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading saved data:', error);
        setDataLoaded(true);
      }
    };

    loadSavedData();
  }, []);



  const handleStudentDataChange = (data: any) => {
    setStudentData(data);
  };

  const handleMedicalDataChange = (data: any) => {
    setMedicalData(data);
  };

  const handleFamilyDataChange = (data: any) => {
    setFamilyData(data);
  };

  const handleFeeDataChange = (data: any) => {
    setFeeData(data);
  };

  const validateAllForms = () => {
    const errors: {[key: string]: string} = {};

    // Student validation
    if (!studentData?.surname?.trim()) errors.studentSurname = 'Surname is required';
    if (!studentData?.firstName?.trim()) errors.studentFirstName = 'First name is required';
    if (!studentData?.idNumber?.trim()) errors.studentIdNumber = 'ID number is required';
    if (!studentData?.dob) errors.studentDob = 'Date of birth is required';
    if (!studentData?.gender) errors.studentGender = 'Gender is required';
    if (!studentData?.homeLanguage) errors.studentHomeLanguage = 'Home language is required';
    if (!studentData?.previousGrade) errors.studentPreviousGrade = 'Previous grade is required';
    if (!studentData?.gradeAppliedFor) errors.studentGradeAppliedFor = 'Grade applied for is required';
    if (!studentData?.previousSchool?.trim()) errors.studentPreviousSchool = 'Previous school is required';

    // Family validation
    if (!familyData?.fatherSurname?.trim()) errors.fatherSurname = 'Father surname is required';
    if (!familyData?.fatherFirstName?.trim()) errors.fatherFirstName = 'Father first name is required';
    if (!familyData?.fatherIdNumber?.trim()) errors.fatherIdNumber = 'Father ID number is required';
    if (!familyData?.fatherMobile?.trim()) errors.fatherMobile = 'Father mobile is required';
    if (!familyData?.fatherEmail?.trim()) errors.fatherEmail = 'Father email is required';
    if (!familyData?.motherSurname?.trim()) errors.motherSurname = 'Mother surname is required';
    if (!familyData?.motherFirstName?.trim()) errors.motherFirstName = 'Mother first name is required';
    if (!familyData?.motherIdNumber?.trim()) errors.motherIdNumber = 'Mother ID number is required';
    if (!familyData?.motherMobile?.trim()) errors.motherMobile = 'Mother mobile is required';
    if (!familyData?.motherEmail?.trim()) errors.motherEmail = 'Mother email is required';

    // Fee validation
    if (!feeData?.feePerson) errors.feePerson = 'Person responsible for fees is required';
    if (!feeData?.relationship) errors.feeRelationship = 'Relationship is required';
    if (!feeData?.feeTermsAccepted) errors.feeTermsAccepted = 'You must accept the fee terms and conditions';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProgress = async () => {
    try {
      setIsSubmitting(true);
      const combinedData = {
        student: studentData,
        medical: medicalData,
        family: familyData,
        fee: feeData
      };

      // Call the auto-save endpoint
      const response = await fetch('http://localhost:8000/enrollment/auto-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: applicationId || 'temp_' + Date.now(),
          ...combinedData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      const result = await response.json();
      console.log('Progress saved successfully:', result);
      addToast('Progress saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving progress:', error);
      addToast('Failed to save progress. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProgressForStep = async (stepNumber: number) => {
    try {
      // Save current step data to localStorage
      const stepData = {
        student: stepNumber >= 1 ? studentData : {},
        medical: stepNumber >= 1 ? medicalData : {},
        family: stepNumber >= 1 ? familyData : {},
        fee: stepNumber >= 1 ? feeData : {}
      };

      // Save to localStorage for persistence
      localStorage.setItem('enrollmentProgress', JSON.stringify({
        currentStep: stepNumber,
        data: stepData,
        lastSaved: new Date().toISOString()
      }));

      addToast('Progress saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving progress:', error);
      addToast('Failed to save progress. Please try again.', 'error');
    }
  };

  const handleCombinedSubmit = async () => {
    // Force validation before submission
    const isValid = validateAllForms();

    if (!isValid) {
      addToast('Please complete all required fields before submitting.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const combinedData = {
        student: studentData,
        medical: medicalData,
        family: familyData,
        fee: feeData
      };

      if (onEnrollmentSubmit) {
        await onEnrollmentSubmit(combinedData);
        // Clear validation errors after successful submission
        setValidationErrors({});
      }
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      addToast('An error occurred while submitting your enrollment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeStep === 1) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Student & Guardian Information</h1>
                <p className="text-gray-700 font-medium">Complete your enrollment by filling out the required information below</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 1 of 7</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '14%'}}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-10 pb-32">


          {/* Form Sections */}
          <div className="space-y-6">
            <UploadCard
              title="Student Information"
              required
              collapsible={true}
              defaultOpen={true}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              }
            >
              <StudentInformation onDataChange={handleStudentDataChange} onNext={handleCombinedSubmit} />
            </UploadCard>

            <UploadCard
              title="Medical Information"
              required={false}
              collapsible={true}
              defaultOpen={false}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              }
            >
              <MedicalInformation onDataChange={handleMedicalDataChange} />
            </UploadCard>

            <UploadCard
              title="Family Information"
              required
              collapsible={true}
              defaultOpen={false}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              }
            >
              <FamilyInformation onDataChange={handleFamilyDataChange} />
            </UploadCard>

            <UploadCard
              title="Fee Responsibility"
              required
              collapsible={true}
              defaultOpen={false}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              }
            >
              <FeeResponsibility onDataChange={handleFeeDataChange} />
            </UploadCard>
          </div>





          {/* Enhanced Validation Errors Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-sm animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-red-800 mb-1">
                      Required Information Missing
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {Object.keys(validationErrors).length} field{Object.keys(validationErrors).length !== 1 ? 's' : ''} required
                    </span>
                  </div>
                  <p className="text-red-700 mb-4 text-sm">
                    Please complete all required fields below before proceeding to the next step.
                  </p>

                  {/* Group errors by form sections */}
                  <div className="space-y-4">
                    {/* Student Information Errors */}
                    {Object.entries(validationErrors).some(([key]) =>
                      key.includes('student') || key.includes('surname') || key.includes('firstName') ||
                      key.includes('idNumber') || key.includes('dob') || key.includes('gender') ||
                      key.includes('homeLanguage') || key.includes('previousGrade') ||
                      key.includes('gradeAppliedFor') || key.includes('previousSchool')
                    ) && (
                      <div className="bg-white/50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center mb-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <h5 className="font-semibold text-red-800 text-sm">Student Information</h5>
                        </div>
                        <ul className="space-y-2">
                          {Object.entries(validationErrors)
                            .filter(([key]) =>
                              key.includes('student') || key.includes('surname') || key.includes('firstName') ||
                              key.includes('idNumber') || key.includes('dob') || key.includes('gender') ||
                              key.includes('homeLanguage') || key.includes('previousGrade') ||
                              key.includes('gradeAppliedFor') || key.includes('previousSchool')
                            )
                            .map(([key, message]) => (
                              <li key={key} className="flex items-start text-sm">
                                <span className="text-red-500 mr-2 mt-1">•</span>
                                <span className="text-red-700">{message}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Family Information Errors */}
                    {Object.entries(validationErrors).some(([key]) =>
                      key.includes('father') || key.includes('mother')
                    ) && (
                      <div className="bg-white/50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center mb-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <h5 className="font-semibold text-red-800 text-sm">Family Information</h5>
                        </div>
                        <ul className="space-y-2">
                          {Object.entries(validationErrors)
                            .filter(([key]) => key.includes('father') || key.includes('mother'))
                            .map(([key, message]) => (
                              <li key={key} className="flex items-start text-sm">
                                <span className="text-red-500 mr-2 mt-1">•</span>
                                <span className="text-red-700">{message}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Fee Responsibility Errors */}
                    {Object.entries(validationErrors).some(([key]) =>
                      key.includes('fee') || key.includes('relationship')
                    ) && (
                      <div className="bg-white/50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center mb-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <h5 className="font-semibold text-red-800 text-sm">Fee Responsibility</h5>
                        </div>
                        <ul className="space-y-2">
                          {Object.entries(validationErrors)
                            .filter(([key]) => key.includes('fee') || key.includes('relationship'))
                            .map(([key, message]) => (
                              <li key={key} className="flex items-start text-sm">
                                <span className="text-red-500 mr-2 mt-1">•</span>
                                <span className="text-red-700">{message}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-red-200">
                    <p className="text-xs text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Complete all required fields to continue with your enrollment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Enrollment Button */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Submit?</h3>
              <p className="text-gray-600 mb-6">Once you submit your enrollment, you'll proceed to document upload.</p>
              <button
                onClick={handleCombinedSubmit}
                disabled={isSubmitting || !dataLoaded}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-600"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Enrollment...
                  </div>
                ) : (
                  'Submit Enrollment & Continue'
                )}
              </button>
              {!dataLoaded && (
                <p className="mt-4 text-sm text-blue-600 font-medium">
                  Loading your saved information...
                </p>
              )}
              {Object.keys(validationErrors).length > 0 && dataLoaded && (
                <p className="mt-4 text-sm text-red-600 font-medium">
                  Please complete all required fields before submitting.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeStep === 2) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <DocumentUploadCenter
            applicationId={applicationId}
            onDocumentUploadComplete={onDocumentUploadComplete}
            onBack={() => onStepChange && onStepChange(1)}
          />
        </div>
      </div>
    );
  }

  if (activeStep === 3) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic History</h1>
                <p className="text-gray-700 font-medium">Provide details of your previous academic performance</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 3 of 7</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '43%'}}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <div className="h-full overflow-y-auto">
            <AcademicHistoryForm onSubmit={() => onStepChange && onStepChange(4)} onBack={() => onStepChange && onStepChange(2)} />
          </div>
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(2)}
          onSave={() => {}}
          onNext={() => onStepChange && onStepChange(4)}
          showBack={true}
          showSave={false}
          showNext={true}
          nextLabel="Next: Subjects Selection"
        />
      </div>
    );
  }

  if (activeStep === 4) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Subjects Selection</h1>
                <p className="text-gray-700 font-medium">Choose the subjects you wish to study</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 4 of 7</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '57%'}}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <div className="h-full overflow-y-auto">
            <SubjectSelection
              onContinue={() => onStepChange && onStepChange(5)}
              onBack={() => onStepChange && onStepChange(3)}
            />
          </div>
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(3)}
          onSave={() => {}}
          onNext={() => onStepChange && onStepChange(5)}
          showBack={true}
          showSave={false}
          showNext={true}
          nextLabel="Next: Fee Agreement"
        />
      </div>
    );
  }

  if (activeStep === 5) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Agreement</h1>
                <p className="text-gray-700 font-medium">Review and agree to the school fee structure</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 5 of 7</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '71%'}}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <FeeAgreement onBack={() => onStepChange && onStepChange(4)} onNext={() => onStepChange && onStepChange(6)} />
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(4)}
          onSave={() => {}}
          onNext={() => onStepChange && onStepChange(6)}
          showBack={true}
          showSave={false}
          showNext={true}
          nextLabel="Next: Declaration"
        />
      </div>
    );
  }

  if (activeStep === 6) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Declaration</h1>
                <p className="text-gray-700 font-medium">Review and sign the enrollment declaration</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 6 of 7</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '86%'}}></div>
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

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <DeclarationStep onBack={() => onStepChange && onStepChange(5)} onNext={() => onStepChange && onStepChange(7)} />
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(5)}
          onSave={() => {}}
          onNext={() => onStepChange && onStepChange(7)}
          showBack={true}
          showSave={false}
          showNext={true}
          nextLabel="Next: Review and Submit"
        />
      </div>
    );
  }

  if (activeStep === 7) {
    return (
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review and Submit</h1>
                <p className="text-gray-700 font-medium">Final review of your enrollment application</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 7 of 7</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '100%'}}></div>
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

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <ReviewSubmitStep onBack={() => onStepChange && onStepChange(6)} />
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(6)}
          onSave={() => {}}
          onNext={() => {}}
          showBack={true}
          showSave={false}
          showNext={false}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-gray-50 p-6 sm:p-8 pt-10">
        <div className="max-w-6xl mx-auto mt-16 mb-16 min-h-0">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step {activeStep}</h2>
            <p className="text-gray-600">This step is under development.</p>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default MainContent;
