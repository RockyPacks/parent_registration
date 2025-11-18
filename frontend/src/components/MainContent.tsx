import React from 'react';
import DeclarationStep from './form/DeclarationStep';
import StudentInformation from './form/StudentInformation';
import MedicalInformation from './form/MedicalInformation';
import FamilyInformation from './form/FamilyInformation';
import FeeResponsibility from './form/FeeResponsibility';
import FeeAgreement from './form/FeeAgreement';
import ReviewSubmitStep from './ReviewSubmitStep';
import { DocumentUploadCenter } from './DocumentUploadCenter';
import { UploadCard } from './UploadCard';
import AcademicHistoryForm from './AcademicHistoryForm';
import ToastContainer from './ui/ToastContainer';
import { useToast } from '../hooks/useToast';
import Footer from './Footer';
import debounce from 'lodash.debounce';


interface MainContentProps {
  activeStep: number;
  applicationId?: string | null;
  onEnrollmentSubmit?: (data: any) => void;
  onDocumentUploadComplete?: () => void;
  onAcademicHistoryComplete?: () => void;
  onFeeAgreementComplete?: () => void;
  onDeclarationComplete?: () => void;
  onStepChange?: (step: number) => void;
  onStepComplete?: (stepNumber: number) => void;
  completedSteps?: number[];
}

const MainContent: React.FC<MainContentProps> = ({
  activeStep,
  applicationId,
  onEnrollmentSubmit,
  onDocumentUploadComplete,
  onAcademicHistoryComplete,
  onFeeAgreementComplete,
  onDeclarationComplete,
  onStepChange,
  onStepComplete,
  completedSteps = []
}) => {
  const { toasts, addToast, removeToast } = useToast();
  const [studentData, setStudentData] = React.useState<any>({});
  const [medicalData, setMedicalData] = React.useState<any>({});
  const [familyData, setFamilyData] = React.useState<any>({});
  const [feeData, setFeeData] = React.useState<any>({});
  const [validationErrors, setValidationErrors] = React.useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [returnStep, setReturnStep] = React.useState<number | null>(null);
  const [savingStatus, setSavingStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [authService, setAuthService] = React.useState<any>(null);
  const [applicationInitialized, setApplicationInitialized] = React.useState(false);
  const firstRender = React.useRef(true);


  // Listen for save progress event
  React.useEffect(() => {
    const handleSaveEvent = () => {
      handleSaveProgress();
    };

    window.addEventListener('saveProgress', handleSaveEvent);
    return () => window.removeEventListener('saveProgress', handleSaveEvent);
  }, []);

  // Load saved data from backend on component mount
  React.useEffect(() => {
    const initializeApplication = async () => {
      console.log("MainContent.tsx: initializeApplication called with applicationId:", applicationId);
      try {
        // Check authentication first before attempting any API calls
        const { authService: authSvc } = await import('../services/auth');
        setAuthService(authSvc);
        console.log("MainContent.tsx: authService loaded, checking authentication");
        if (!authSvc.isAuthenticated()) {
          console.log("MainContent.tsx: User not authenticated, setting dataLoaded=true");
          setDataLoaded(true);
          setApplicationInitialized(true);
          return;
        }
        console.log("MainContent.tsx: User is authenticated");

        // Use the applicationId passed from parent component
        if (applicationId && !applicationId.startsWith('temp_')) {
          console.log("MainContent.tsx: Loading application data for ID:", applicationId);
          try {
            const { apiService } = await import('../services/api');
            const response = await apiService.request(`/enrollment/get-application/${applicationId}`);
            console.log("MainContent.tsx: Application data loaded successfully");
            // Populate form data from response
            if ((response as any).student) {
              setStudentData((response as any).student);
            }
            if ((response as any).medical) {
              setMedicalData((response as any).medical);
            }
            if ((response as any).family) {
              setFamilyData((response as any).family);
            }
            if ((response as any).fee) {
              setFeeData((response as any).fee);
            }
            setDataLoaded(true);
            setApplicationInitialized(true);
            console.log("MainContent.tsx: Application initialized successfully");
            return;
          } catch (error: any) {
            // If 404, application doesn't exist - this is fine, we'll create new data
            if (error.message?.includes('404') || error.message?.includes('Not Found')) {
              console.warn("MainContent.tsx: Application not found, will use empty form data...");
            } else {
              // Other error, log and continue
              console.error("MainContent.tsx: Error loading application:", error);
            }
          }
        } else {
          console.log("MainContent.tsx: No valid application ID provided, initializing with empty data");
        }

        // If no application ID or loading failed, just initialize with empty data
        console.log("MainContent.tsx: Initializing with empty data");
        setDataLoaded(true);
        setApplicationInitialized(true);
      } catch (error) {
        console.error("MainContent.tsx: Error in initializeApplication:", error);
        setDataLoaded(true);
        setApplicationInitialized(true);
      }
    };

    // Only initialize if we haven't already initialized or if applicationId changed
    if (!applicationInitialized || (applicationId && !applicationInitialized)) {
      initializeApplication();
    }
  }, [applicationId]); // Removed applicationInitialized from dependencies to prevent re-initialization loops



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

    // Family validation - at least one parent must be filled, and if filled, all fields for that parent are required
    const hasFatherInfo = familyData?.fatherSurname?.trim() || familyData?.fatherFirstName?.trim() || familyData?.fatherIdNumber?.trim() || familyData?.fatherMobile?.trim() || familyData?.fatherEmail?.trim();
    const hasMotherInfo = familyData?.motherSurname?.trim() || familyData?.motherFirstName?.trim() || familyData?.motherIdNumber?.trim() || familyData?.motherMobile?.trim() || familyData?.motherEmail?.trim();

    if (!hasFatherInfo && !hasMotherInfo) {
      errors.fatherSurname = 'At least one parent (father or mother) information is required';
    }

    // If father info is partially filled, require all father fields
    if (hasFatherInfo) {
      if (!familyData?.fatherSurname?.trim()) errors.fatherSurname = 'Father surname is required';
      if (!familyData?.fatherFirstName?.trim()) errors.fatherFirstName = 'Father first name is required';
      if (!familyData?.fatherIdNumber?.trim()) errors.fatherIdNumber = 'Father ID number is required';
      if (!familyData?.fatherMobile?.trim()) errors.fatherMobile = 'Father mobile is required';
      if (!familyData?.fatherEmail?.trim()) errors.fatherEmail = 'Father email is required';
    }

    // If mother info is partially filled, require all mother fields
    if (hasMotherInfo) {
      if (!familyData?.motherSurname?.trim()) errors.motherSurname = 'Mother surname is required';
      if (!familyData?.motherFirstName?.trim()) errors.motherFirstName = 'Mother first name is required';
      if (!familyData?.motherIdNumber?.trim()) errors.motherIdNumber = 'Mother ID number is required';
      if (!familyData?.motherMobile?.trim()) errors.motherMobile = 'Mother mobile is required';
      if (!familyData?.motherEmail?.trim()) errors.motherEmail = 'Mother email is required';
    }

    // Fee validation
    if (!feeData?.feePerson) errors.feePerson = 'Person responsible for fees is required';
    if (!feeData?.relationship) errors.feeRelationship = 'Relationship is required';
    if (!feeData?.feeTermsAccepted) errors.feeTermsAccepted = 'You must accept the fee terms and conditions';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProgress = async (): Promise<boolean> => {
    try {
      setSavingStatus('saving');

      const combinedData = {
        student: studentData,
        medical: medicalData,
        family: familyData,
        fee: feeData
      };

      // Check authentication before making API call
      const { authService } = await import('../services/auth');
      if (!authService.isAuthenticated()) {
        addToast('Please log in to save your progress.', 'error');
        setSavingStatus('idle');
        return false;
      }

      // Wait for application initialization if not yet done
      if (!applicationInitialized) {
        console.log("MainContent.tsx: Application not yet initialized, waiting...");
        // Wait a bit for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!applicationInitialized) {
          console.log("MainContent.tsx: Application still not initialized after wait");
          addToast('Application is still initializing. Please wait.', 'error');
          setSavingStatus('idle');
          return false;
        }
      }

      let currentApplicationId = applicationId || localStorage.getItem('applicationId');

      // CRITICAL: If no application ID exists, create one FIRST before any saving
      if (!currentApplicationId) {
        console.warn("No application ID available. Creating a new application first...");
        try {
          const { apiService } = await import('../services/api');
          const createResponse = await apiService.request('/enrollment/auto-save', {
            method: 'POST',
            body: JSON.stringify({})
          });
          currentApplicationId = (createResponse as any).application_id;
          localStorage.setItem('applicationId', currentApplicationId);
          console.log("Created new application:", currentApplicationId);
        } catch (createError) {
          console.error('Failed to create application:', createError);
          addToast('Failed to create application. Please try again.', 'error');
          setSavingStatus('idle');
          return false;
        }
      }

      // Now save the progress with the guaranteed application ID
      const { apiService } = await import('../services/api');
      const result = await apiService.autoSaveEnrollment({
        application_id: currentApplicationId,
        student: combinedData.student,
        medical: combinedData.medical,
        family: combinedData.family,
        fee: combinedData.fee
      });

      setSavingStatus('saved');

      // Update applicationId if it's a new application
      if (result.application_id && result.application_id !== currentApplicationId) {
        localStorage.setItem('applicationId', result.application_id);
        currentApplicationId = result.application_id;
      }

      // Reset to idle after showing "saved" for a moment
      setTimeout(() => setSavingStatus('idle'), 2000);
      return true;
    } catch (error: any) {
      // Handle authentication errors specifically
      if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
        addToast('Your session has expired. Please log in again.', 'error');
        // Optionally redirect to login
        window.location.reload();
      } else {
        addToast('Failed to save progress. Please try again.', 'error');
      }

      setSavingStatus('idle');
      return false;
    }
  };

  // Auto-save functionality - properly debounced to prevent overwhelming backend
  const debouncedAutoSave = React.useRef(
    debounce(() => {
      handleSaveProgress();
    }, 3000) // Wait 3 seconds after user stops typing
  ).current;

  // Auto-save when form data changes - only if there's meaningful data and not first render
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (dataLoaded && applicationInitialized) {
      // Only auto-save if we have at least some basic data
      const hasBasicData = studentData?.surname || studentData?.firstName ||
                          familyData?.fatherSurname || familyData?.fatherFirstName ||
                          familyData?.motherSurname || familyData?.motherFirstName ||
                          feeData?.feePerson;

      if (hasBasicData) {
        debouncedAutoSave();
      }
    }
  }, [studentData, medicalData, familyData, feeData, dataLoaded, applicationInitialized, debouncedAutoSave]);

  const handleCombinedSubmit = async (submitOnly = false) => {
    if (submitOnly) {
      // Just navigate to step 2 without submitting - but still validate for step 1
      if (activeStep === 1) {
        const isValid = validateAllForms();
        if (!isValid) {
          addToast('Please complete all required fields before proceeding.', 'error');
          return;
        }
      }
      onStepChange && onStepChange(2);
      return;
    }

    // For step 1, validate first, then save progress and advance
    if (activeStep === 1) {
      // Force validation before proceeding
      const isValid = validateAllForms();

      if (!isValid) {
        addToast('Please complete all required fields before proceeding.', 'error');
        return;
      }

      try {
        const saveSuccess = await handleSaveProgress();
        if (saveSuccess) {
          // Mark step 1 as completed and advance to step 2
          onStepComplete && onStepComplete(1);
          onStepChange && onStepChange(2);
          addToast('Step 1 completed successfully!', 'success');
        }
      } catch (error) {
        addToast('Failed to save progress. Please try again.', 'error');
      }
      return;
    }

    // For other steps, the submit logic
    // Check authentication before proceeding
    const { authService } = await import('../services/auth');
    if (!authService.isAuthenticated()) {
      addToast('Please log in to submit your enrollment.', 'error');
      return;
    }

    // Force save before validation and submission
    await handleSaveProgress();

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

      // If editing, return to the return step (e.g., step 7)
      if (isEditing && returnStep) {
        onStepChange && onStepChange(returnStep);
        setIsEditing(false);
        setReturnStep(null);
      }
    } catch (error: any) {

      // Handle authentication errors specifically
      if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
        addToast('Your session has expired. Please log in again.', 'error');
        // Optionally redirect to login
        window.location.reload();
      } else {
        addToast('An error occurred while submitting your enrollment. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions to check completion status of individual forms
  const isStudentInfoCompleted = () => {
    return studentData?.surname?.trim() &&
           studentData?.firstName?.trim() &&
           studentData?.idNumber?.trim() &&
           studentData?.dob &&
           studentData?.gender &&
           studentData?.homeLanguage &&
           studentData?.previousGrade &&
           studentData?.gradeAppliedFor &&
           studentData?.previousSchool?.trim();
  };

  const isMedicalInfoCompleted = () => {
    // Medical info is optional, but if any data is filled, consider it completed
    return medicalData?.medicalAidName?.trim() ||
           medicalData?.memberNumber?.trim() ||
           (medicalData?.conditions && medicalData.conditions.length > 0) ||
           medicalData?.allergies?.trim();
  };

  const isFamilyInfoCompleted = () => {
    // At least one parent must be fully filled
    const hasFatherInfo = familyData?.fatherSurname?.trim() &&
                         familyData?.fatherFirstName?.trim() &&
                         familyData?.fatherIdNumber?.trim() &&
                         familyData?.fatherMobile?.trim() &&
                         familyData?.fatherEmail?.trim();

    const hasMotherInfo = familyData?.motherSurname?.trim() &&
                         familyData?.motherFirstName?.trim() &&
                         familyData?.motherIdNumber?.trim() &&
                         familyData?.motherMobile?.trim() &&
                         familyData?.motherEmail?.trim();

    return hasFatherInfo || hasMotherInfo;
  };

  const isFeeResponsibilityCompleted = () => {
    return feeData?.feePerson &&
           feeData?.relationship &&
           feeData?.feeTermsAccepted &&
           feeData?.bankName?.trim() &&
           feeData?.branchCode?.trim() &&
           feeData?.accountNumber?.trim();
  };

  // Update sidebar completion status when step 1 data changes
  React.useEffect(() => {
    if (activeStep === 1 && dataLoaded && applicationInitialized) {
      // Check if step 1 should be marked as completed
      const hasStudentData = isStudentInfoCompleted();
      const hasFamilyData = isFamilyInfoCompleted();
      const hasFeeData = isFeeResponsibilityCompleted();

      // Only call onStepComplete if step 1 is not already completed
      const isStep1Completed = completedSteps?.includes(1);
      if (hasStudentData && hasFamilyData && hasFeeData && !isStep1Completed) {
        onStepComplete && onStepComplete(1);
      }
    }
  }, [studentData, familyData, feeData, medicalData, activeStep, dataLoaded, applicationInitialized, completedSteps, onStepComplete]);

  const handleEditStep = (stepNumber: number) => {
    setIsEditing(true);
    setReturnStep(activeStep); // Return to the current step after editing
    onStepChange && onStepChange(stepNumber);
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                )}
                {savingStatus === 'saved' && (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
              status={isStudentInfoCompleted() ? 'completed' : 'not-started'}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              }
            >
            <StudentInformation initialData={studentData} onDataChange={handleStudentDataChange} onNext={() => handleCombinedSubmit(true)} />
            </UploadCard>

            <UploadCard
              title="Medical Information"
              required={false}
              collapsible={true}
              defaultOpen={false}
              status={isMedicalInfoCompleted() ? 'completed' : 'not-started'}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              }
            >
              <MedicalInformation initialData={medicalData} onDataChange={handleMedicalDataChange} />
            </UploadCard>

            <UploadCard
              title="Family Information"
              required
              collapsible={true}
              defaultOpen={false}
              status={isFamilyInfoCompleted() ? 'completed' : 'not-started'}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              }
            >
              <FamilyInformation initialData={familyData} onDataChange={handleFamilyDataChange} />
            </UploadCard>

            <UploadCard
              title="Fee Responsibility"
              required
              collapsible={true}
              defaultOpen={false}
              status={isFeeResponsibilityCompleted() ? 'completed' : 'not-started'}
              icon={
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              }
            >
              <FeeResponsibility initialData={feeData} onDataChange={handleFeeDataChange} />
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Continue?</h3>
              <p className="text-gray-600 mb-6">Complete step 1 to proceed to document upload.</p>
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
                    Saving Progress...
                  </div>
                ) : (
                  'Save & Continue to Documents'
                )}
              </button>
              {!dataLoaded && (
                <p className="mt-4 text-sm text-blue-600 font-medium">
                  {authService?.isAuthenticated() ? 'Loading your saved information...' : 'Please log in to load your saved information.'}
                </p>
              )}
              {Object.keys(validationErrors).length > 0 && dataLoaded && (
                <p className="mt-4 text-sm text-red-600 font-medium">
                  Please complete all required fields before proceeding.
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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
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
                  <div className="text-sm font-medium text-gray-500">Step 3 of 6</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '50%'}}></div>
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

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="h-full overflow-y-auto">
          <AcademicHistoryForm
              onSubmit={() => {
                onStepComplete && onStepComplete(3);
                if (isEditing && returnStep) {
                  onStepChange && onStepChange(returnStep);
                  setIsEditing(false);
                  setReturnStep(null);
                } else {
                  onAcademicHistoryComplete && onAcademicHistoryComplete();
                }
              }}
              onBack={() => onStepChange && onStepChange(2)}
            />
          </div>
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(2)}
          onSave={() => {}}
          onNext={() => onStepChange && onStepChange(4)}
          showBack={true}
          showSave={false}
          showNext={true}
          nextLabel="Next: Fee Agreement"
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Agreement</h1>
                <p className="text-gray-700 font-medium">Review and agree to the school fee structure</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Step 4 of 6</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '67%'}}></div>
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

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
          <FeeAgreement applicationId={applicationId} onBack={() => onStepChange && onStepChange(3)} onNext={() => {
            onFeeAgreementComplete && onFeeAgreementComplete();
          }} />
        </div>
        <Footer
          onBack={() => onStepChange && onStepChange(3)}
          onSave={() => {}}
          onNext={() => {
            onStepComplete && onStepComplete(4);
            onStepChange && onStepChange(5);
          }}
          showBack={true}
          showSave={false}
          showNext={true}
          nextLabel="Next: Declaration"
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
          <DeclarationStep onBack={() => onStepChange && onStepChange(4)} onNext={() => {
            onStepComplete && onStepComplete(5);
            onDeclarationComplete && onDeclarationComplete();
          }} />
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
  }

  // Prepare current data for ReviewSubmitStep
  const currentData = {
    student: studentData,
    family: familyData,
    medical: medicalData,
    fee: feeData,
    academicHistory: JSON.parse(localStorage.getItem('academicHistoryFormData') || '{}'),
    subjects: {
      core: JSON.parse(localStorage.getItem('selectedSubjects') || '{}').core || [],
      electives: []
    },
    financing: JSON.parse(localStorage.getItem('financingPlan') || '{}'),
    declaration: JSON.parse(localStorage.getItem('declarationData') || '{}'),
    documents: JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
  };

  if (activeStep === 6) {
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
                  <div className="text-sm font-medium text-gray-500">Step 6 of 6</div>
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

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
          <ReviewSubmitStep
            currentData={currentData}
            onBack={() => onStepChange && onStepChange(6)}
            onEditStep={handleEditStep}
            onStepComplete={onStepComplete}
          />
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
