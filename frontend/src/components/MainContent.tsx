import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastContainer from './ui/ToastContainer';
import { useToast } from '../hooks/useToast';
import debounce from 'lodash.debounce';
import { storage } from '../utils/storage';  // Import storage utils
import ErrorBoundary from './ErrorBoundary';  // Import ErrorBoundary
import Footer from './Footer';
import { toCamelCase } from '../services/api';

const Step1StudentGuardian = React.lazy(() => import('./form/Step1StudentGuardian'));
const Step2DocumentUploadCenter = React.lazy(() => import('./form/Step2DocumentUploadCenter'));
const Step3AcademicHistoryForm = React.lazy(() => import('./form/Step3AcademicHistoryForm'));
const Step4FeeAgreement = React.lazy(() => import('./form/Step4FeeAgreement'));
const Step5DeclarationStep = React.lazy(() => import('./form/Step5DeclarationStep'));
const Step6ReviewSubmitStep = React.lazy(() => import('./form/Step6ReviewSubmitStep'));

interface MainContentProps {
  activeStep: number;
  applicationId?: string | null;
  applicationStatus?: string | null;
  isSubmitting?: boolean;
  applicationInitialized?: boolean;
  onEnrollmentSubmit?: (data: any) => void;
  onDocumentUploadComplete?: () => void;
  onAcademicHistoryComplete?: () => void;
  onFeeAgreementComplete?: () => void;
  onDeclarationComplete?: () => void;
  onStepChange?: (step: number) => void;
  onStepComplete?: (stepNumber: number) => void;
  completedSteps?: number[];
  userEmail?: string | null;
}

const MainContent: React.FC<MainContentProps> = (props) => {
  const {
    activeStep,
    applicationId,
    applicationStatus,
    isSubmitting: isSubmittingProp,
    applicationInitialized = false,
    onEnrollmentSubmit,
    onAcademicHistoryComplete,
    onFeeAgreementComplete,
    onDeclarationComplete,
    onStepChange,
    onStepComplete,
    completedSteps = [],
    userEmail = null,
  } = props;

  // Helper to generate user-specific localStorage keys
  const getUserKey = useCallback((key: string) => userEmail ? `${userEmail}_${key}` : key, [userEmail]);

  // Track completed steps locally to enforce progression
  const [localCompletedSteps, setLocalCompletedSteps] = useState<number[]>(completedSteps || []);

  // Sync localCompletedSteps with completedSteps prop when it changes
  useEffect(() => {
    setLocalCompletedSteps(completedSteps || []);
  }, [completedSteps]);

  const handleDocumentUploadComplete = useCallback(() => {
    console.log('MainContent: handleDocumentUploadComplete called - navigating from step 2 to step 3');
    // Mark step 2 as complete before moving forward
    if (!localCompletedSteps.includes(2)) {
      setLocalCompletedSteps(prev => [...prev, 2]);
    }
    onStepComplete && onStepComplete(2);

    // IMPORTANT: Always navigate to step 3 (Academic History), never skip ahead
    console.log('MainContent: Explicitly navigating to step 3 (Academic History)');
    onStepChange && onStepChange(3);
  }, [onStepComplete, onStepChange, localCompletedSteps]);

  const [academicHistoryData, setAcademicHistoryData] = useState<any>({});
  const [subjectsData, setSubjectsData] = useState<any>({});
  const [financingData, setFinancingData] = useState<any>({});
  const [declarationData, setDeclarationData] = useState<any>({});
  const [nextOfKinData, setNextOfKinData] = useState<any>({});
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [fullApplicationData, setFullApplicationData] = useState<any>({});

  const firstRender = useRef(true);

  const { toasts, addToast, removeToast } = useToast();

  const [studentData, setStudentData] = useState<any>({});
  const [medicalData, setMedicalData] = useState<any>({});
  const [familyData, setFamilyData] = useState<any>({});
  const [feeData, setFeeData] = useState<any>({});
  const [applicationDetailsData, setApplicationDetailsData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(isSubmittingProp || false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [returnStep, setReturnStep] = useState<number | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [authService, setAuthService] = useState<any>(null);

  // Reset isSubmitting to false after app init and data load to avoid stuck "Saving..." button
  useEffect(() => {
    if (applicationInitialized && dataLoaded && isSubmitting) {
      console.log("Resetting isSubmitting to false after app init and data load");
      setIsSubmitting(false);
    }
  }, [applicationInitialized, dataLoaded, isSubmitting]);

  // Load all data from storage on initial mount
  useEffect(() => {
    console.log(`MainContent: Loading data from storage (initialized: ${applicationInitialized}, userEmail: ${userEmail})`);
    
    // Helper to get and convert data
    const getStoredData = (key: string) => {
      const rawData = storage.get(getUserKey(key), {});
      // Ensure all data from storage is converted to camelCase to match frontend state
      return toCamelCase(rawData);
    };

    setStudentData(getStoredData('studentData'));
    setMedicalData(getStoredData('medicalData'));
    setFamilyData(getStoredData('familyData'));
    setFeeData(getStoredData('feeData'));
    setApplicationDetailsData(getStoredData('applicationDetailsData'));
    
    // Try user-specific key first, then fall back to global uploadedFiles key
    const userDocs = storage.get(getUserKey('documentsData'), null);
    const globalDocs = localStorage.getItem('uploadedFiles');
    setDocumentsData(userDocs || (globalDocs ? JSON.parse(globalDocs) : []));
    
    setAcademicHistoryData(getStoredData('academicHistoryData'));
    setFinancingData(storage.get(getUserKey('financingData'), { plan: 'Pay Once Per Year' }) || { plan: 'Pay Once Per Year' });
    
    const declData = getStoredData('declarationData');
    console.log('MainContent: Loaded declarationData from storage - signature present:', !!declData.signatureImage, 'length:', declData.signatureImage?.length || 0);
    setDeclarationData(declData);
    
    setNextOfKinData(getStoredData('nextOfKinData'));
    setDataLoaded(true);
  }, [getUserKey, applicationInitialized]);

  // Fetch documents from backend when applicationId is available
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!applicationId || !dataLoaded) return;

      try {
        const { apiService } = await import('../services/api');
        const data = await apiService.getUploadedFiles(applicationId);
        if (data.files && data.files.length > 0) {
          console.log("MainContent: Loaded documents from backend:", data.files.length);
          setDocumentsData(data.files);
          storage.set(getUserKey('documentsData'), data.files);
          localStorage.setItem('uploadedFiles', JSON.stringify(data.files));
        }
      } catch (error) {
        console.warn("MainContent: Could not fetch documents from backend:", error);
      }
    };

    fetchDocuments();
  }, [applicationId, dataLoaded, getUserKey]);


  const isStudentInfoCompleted = useMemo(() => {
    return studentData?.surname?.trim() &&
      studentData?.firstName?.trim() &&
      studentData?.idNumber?.trim() &&
      studentData?.dob &&
      studentData?.gender &&
      studentData?.homeLanguage &&
      studentData?.previousGrade &&
      studentData?.gradeAppliedFor &&
      studentData?.previousSchool?.trim();
  }, [studentData]);

  const isMedicalInfoCompleted = useMemo(() => {
    return medicalData?.homeLanguage?.trim() &&
      medicalData?.allergies?.trim() &&
      medicalData?.allergyStatus?.trim() &&
      medicalData?.immunisationsUpToDate?.trim();
  }, [medicalData]);

  const isFamilyInfoCompleted = useMemo(() => {
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
  }, [familyData]);

  const isFeeResponsibilityCompleted = useMemo(() => {
    return feeData?.feePerson &&
      feeData?.relationship &&
      feeData?.feeTermsAccepted &&
      feeData?.bankName?.trim() &&
      feeData?.branchCode?.trim() &&
      feeData?.accountNumber?.trim();
  }, [feeData]);

  const isApplicationDetailsCompleted = useMemo(() => {
    const hasRequiredFields = applicationDetailsData?.proposedStartTerm &&
      applicationDetailsData?.year &&
      applicationDetailsData?.gradeApplyingFor;

    if (!hasRequiredFields) {
      return false;
    }

    if (!applicationDetailsData?.proposedStartDate) {
      return true;
    }

    const startDate = new Date(applicationDetailsData.proposedStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return !Number.isNaN(startDate.getTime()) && startDate >= today;
  }, [applicationDetailsData]);

  const validationErrorsMemo = useMemo(() => {
    const errors: { [key: string]: string } = {};

    if (!studentData?.surname?.trim()) errors.studentSurname = 'Surname is required';
    if (!studentData?.firstName?.trim()) errors.studentFirstName = 'First name is required';
    if (!studentData?.idNumber?.trim()) errors.studentIdNumber = 'ID number is required';
    if (!studentData?.dob) errors.studentDob = 'Date of birth is required';
    if (!studentData?.gender) errors.studentGender = 'Gender is required';
    if (!studentData?.homeLanguage) errors.studentHomeLanguage = 'Home language is required';
    if (!studentData?.previousGrade) errors.studentPreviousGrade = 'Previous grade is required';
    if (!studentData?.gradeAppliedFor) errors.studentGradeAppliedFor = 'Grade applied for is required';
    if (!studentData?.previousSchool?.trim()) errors.studentPreviousSchool = 'Previous school is required';

    const hasFatherInfo = familyData?.fatherSurname?.trim() ||
      familyData?.fatherFirstName?.trim() ||
      familyData?.fatherIdNumber?.trim() ||
      familyData?.fatherMobile?.trim() ||
      familyData?.fatherEmail?.trim();
    const hasMotherInfo = familyData?.motherSurname?.trim() ||
      familyData?.motherFirstName?.trim() ||
      familyData?.motherIdNumber?.trim() ||
      familyData?.motherMobile?.trim() ||
      familyData?.motherEmail?.trim();

    if (!hasFatherInfo && !hasMotherInfo) {
      errors.fatherSurname = 'At least one parent (father or mother) information is required';
    }

    if (hasFatherInfo) {
      if (!familyData?.fatherSurname?.trim()) errors.fatherSurname = 'Father surname is required';
      if (!familyData?.fatherFirstName?.trim()) errors.fatherFirstName = 'Father first name is required';
      if (!familyData?.fatherIdNumber?.trim()) errors.fatherIdNumber = 'Father ID number is required';
      if (!familyData?.fatherMobile?.trim()) errors.fatherMobile = 'Father mobile is required';
      if (!familyData?.fatherEmail?.trim()) errors.fatherEmail = 'Father email is required';
    }
    if (hasMotherInfo) {
      if (!familyData?.motherSurname?.trim()) errors.motherSurname = 'Mother surname is required';
      if (!familyData?.motherFirstName?.trim()) errors.motherFirstName = 'Mother first name is required';
      if (!familyData?.motherIdNumber?.trim()) errors.motherIdNumber = 'Mother ID number is required';
      if (!familyData?.motherMobile?.trim()) errors.motherMobile = 'Mother mobile is required';
      if (!familyData?.motherEmail?.trim()) errors.motherEmail = 'Mother email is required';
    }

    if (!feeData?.feePerson) errors.feePerson = 'Person responsible for fees is required';
    if (!feeData?.relationship) errors.feeRelationship = 'Relationship is required';
    if (!feeData?.feeTermsAccepted) errors.feeTermsAccepted = 'You must accept the fee terms and conditions';

    // Medical required field validation
    if (!medicalData?.homeLanguage?.trim()) errors.medicalHomeLanguage = 'Home Language is required';
    if (!medicalData?.allergies?.trim()) errors.medicalAllergies = 'Allergy information is required';
    if (!medicalData?.allergyStatus?.trim()) errors.medicalAllergyStatus = 'Allergy Status is required';
    if (!medicalData?.immunisationsUpToDate?.trim()) errors.medicalImmunisations = 'Immunisation status is required';

    return errors;
  }, [studentData, familyData, feeData, medicalData]);

  useEffect(() => {
    setValidationErrors(validationErrorsMemo);
  }, [validationErrorsMemo]);

  const handleSaveProgress = useCallback(async (): Promise<boolean> => {
    try {
      setSavingStatus('saving');

      const combinedData = {
        student: studentData,
        medical: medicalData,
        family: familyData,
        fee: feeData,
        applicationDetails: applicationDetailsData
      };

      const authModule = await import('../services/auth');
      const isAuthenticated = await authModule.authService.isAuthenticated();
      if (!isAuthenticated) {
        addToast('Please log in to save your progress.', 'error');
        setSavingStatus('idle');
        return false;
      }

      if (!applicationInitialized) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!applicationInitialized) {
          addToast('Application is still initializing. Please wait.', 'error');
          setSavingStatus('idle');
          return false;
        }
      }

      // Application ID must come from props (backend manages it)
      if (!applicationId) {
        console.log("Auto-save skipped: no application ID available from backend.");
        setSavingStatus('idle');
        return false;
      }

      const { apiService } = await import('../services/api');
      const autoSavePayload = {
        application_id: applicationId,
        student: combinedData.student,
        medical: combinedData.medical,
        family: combinedData.family,
        fee: combinedData.fee,
        application_details: combinedData.applicationDetails,
        next_of_kin: nextOfKinData
      };

      console.log('MainContent: Auto-save payload being sent to backend:', autoSavePayload);
      console.log('MainContent: next_of_kin data specifically:', JSON.stringify(nextOfKinData, null, 2));
      console.log('MainContent: nextOfKinData keys:', Object.keys(nextOfKinData));
      console.log('MainContent: nextOfKinData has data?', Object.keys(nextOfKinData).length > 0);

      const result = await apiService.autoSaveEnrollment(autoSavePayload);

      setSavingStatus('saved');

      // Backend manages application ID, no need to update localStorage
      console.log('Auto-save successful for application:', applicationId);

      setTimeout(() => setSavingStatus('idle'), 2000);
      return true;
    } catch (error: any) {
      if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
        addToast('Your session has expired. Please log in again.', 'error');
        // Don't reload - let user see the error and handle it gracefully
        setSavingStatus('idle');
        return false;
      } else {
        addToast('Failed to save progress. Please try again.', 'error');
      }
      setSavingStatus('idle');
      return false;
    }
  }, [studentData, medicalData, familyData, feeData, applicationDetailsData, nextOfKinData, applicationId, applicationInitialized, addToast]);

  const debouncedAutoSave = useRef(
    debounce(() => {
      handleSaveProgress();
    }, 3000)
  );

  useEffect(() => {
    return () => {
      debouncedAutoSave.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (dataLoaded && applicationInitialized) {
      const hasBasicData = studentData?.surname || studentData?.firstName ||
        familyData?.fatherSurname || familyData?.fatherFirstName ||
        familyData?.motherSurname || familyData?.motherFirstName ||
        feeData?.feePerson;

      if (hasBasicData) {
        debouncedAutoSave.current();
      }
    }
  }, [studentData, medicalData, familyData, feeData, applicationDetailsData, dataLoaded, applicationInitialized]);

  const handleStudentDataChange = useCallback((data: any) => {
    setStudentData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('studentData'), newData);
      return newData;
    });
  }, [getUserKey]);

  const handleMedicalDataChange = useCallback((data: any) => {
    setMedicalData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('medicalData'), newData);
      return newData;
    });
  }, [getUserKey]);

  const handleFamilyDataChange = useCallback((data: any) => {
    setFamilyData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('familyData'), newData);
      return newData;
    });
  }, [getUserKey]);

  const handleFeeDataChange = useCallback((data: any) => {
    setFeeData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('feeData'), newData);
      return newData;
    });
  }, [getUserKey]);

  const handleApplicationDetailsDataChange = useCallback((data: any) => {
    setApplicationDetailsData(prevData => {
      const newData = { ...prevData, ...data };
      if (JSON.stringify(prevData) === JSON.stringify(newData)) {
        return prevData;
      }
      storage.set(getUserKey('applicationDetailsData'), newData);
      return newData;
    });
  }, [getUserKey]);

  const handleNextOfKinDataChange = useCallback((data: any) => {
    console.log("MainContent: Received next of kin data:", data);
    setNextOfKinData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('nextOfKinData'), newData);
      console.log("MainContent: Saved next of kin data to localStorage:", newData);
      console.log("MainContent: localStorage key used:", getUserKey('nextOfKinData'));
      console.log("MainContent: Updated nextOfKinData state:", newData);
      return newData;
    });
  }, [getUserKey]);

  const handleDocumentsDataChange = useCallback((data: any[]) => {
    // Replace documents array entirely (not append) since backend returns full list
    setDocumentsData(data);
    storage.set(getUserKey('documentsData'), data);
  }, [getUserKey]);

  const handleAcademicHistoryDataChange = useCallback((data: any) => {
    setAcademicHistoryData(prevData => {
      const newData = { ...prevData, ...data };
      // Filter out File objects before saving to localStorage (File objects can't be serialized)
      // Keep reportCardUrl but remove reportCard (File object)
      const dataToStore = { ...newData };
      if (dataToStore.reportCard instanceof File || dataToStore.reportCard === null) {
        delete dataToStore.reportCard;
      }
      storage.set(getUserKey('academicHistoryData'), dataToStore);
      return newData;
    });
  }, [getUserKey]);

  const handleFinancingDataChange = useCallback((data: any) => {
    setFinancingData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('financingData'), newData);
      return newData;
    });

    // Also sync with feeData so it's included in auto-saves
    if (data.plan) {
      handleFeeDataChange({ selectedPlan: data.plan });
    }
  }, [getUserKey, handleFeeDataChange]);

  const handleDeclarationDataChange = useCallback((data: any) => {
    console.log('MainContent: handleDeclarationDataChange received - signature present:', !!data.signatureImage, 'length:', data.signatureImage?.length || 0);
    setDeclarationData(prevData => {
      const newData = { ...prevData, ...data };
      storage.set(getUserKey('declarationData'), newData);
      console.log('MainContent: Saved declarationData to storage - signature present:', !!newData.signatureImage);
      return newData;
    });
  }, [getUserKey]);

  const handleFinalSubmit = async () => {
    if (!applicationId) {
      addToast('No application ID found. Please try again.', 'error');
      return;
    }

    console.log('MainContent: Starting final application submission...');
    
    // CRITICAL: Validate required fields before final submission to avoid 422 errors
    if (!isStudentInfoCompleted) {
      console.error('MainContent: Submission blocked - Student info incomplete');
      addToast('Please complete all required Student Information fields before submitting.', 'error');
      return;
    }
    
    if (!isFamilyInfoCompleted) {
      console.error('MainContent: Submission blocked - Family info incomplete');
      addToast('Please provide at least one parent\'s full information before submitting.', 'error');
      return;
    }

    if (!isFeeResponsibilityCompleted) {
      console.error('MainContent: Submission blocked - Fee info incomplete');
      addToast('Please complete the Fee Responsibility section before submitting.', 'error');
      return;
    }

    if (!isApplicationDetailsCompleted) {
      console.error('MainContent: Submission blocked - Application details incomplete');
      addToast('Please complete the Application Details section before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { apiService } = await import('../services/api');
      
      // Prepare full application data including parent/family information
      const fullData = {
        student: studentData,
        family: familyData, // familyData now includes nextOfKin
        medical: medicalData,
        fee: feeData,
        applicationDetails: applicationDetailsData,
        academicHistory: academicHistoryData,
        subjects: subjectsData,
        financing: financingData,
        declaration: declarationData,
        documents: documentsData,
      };
      
      console.log('MainContent: Submitting application with full data including parent info');
      await apiService.submitApplication(applicationId, fullData);
      console.log('MainContent: Application submitted successfully to backend');

      setFullApplicationData(fullData);

      addToast('Application submitted successfully!', 'success');

      // ONLY mark step 6 as complete after successful backend submission
      console.log('MainContent: Marking step 6 as complete');
      onStepComplete && onStepComplete(6);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to submit application. Please try again.';
      addToast(errorMsg, 'error');
      console.error('MainContent: Application submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCombinedSubmit = useCallback(async (submitOnly = false) => {
    console.log('handleCombinedSubmit triggered');
    setIsSubmitting(true);

    try {
      // Validate required fields before submitting
      if (!isStudentInfoCompleted) {
        addToast('Please complete all required Student Information fields.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (!isFamilyInfoCompleted) {
        addToast('Please complete at least one parent\'s information in Family Information section.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (!isFeeResponsibilityCompleted) {
        addToast('Please complete all required Fee Responsibility fields.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (!isApplicationDetailsCompleted) {
        addToast('Please complete all required Application Details fields.', 'error');
        setIsSubmitting(false);
        return;
      }

      const combinedData = {
        student: studentData,
        medical: medicalData,
        family: familyData,
        fee: feeData,
        applicationDetails: applicationDetailsData
      };

      const authModule = await import('../services/auth');
      const isAuthenticated = await authModule.authService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('User not authenticated');
        addToast('Please log in to save your progress.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (!applicationInitialized) {
        console.log('Application not initialized');
        addToast('Application is still initializing. Please wait.', 'error');
        setIsSubmitting(false);
        return;
      }

      let currentApplicationId = applicationId || localStorage.getItem(getUserKey('applicationId'));

      if (!currentApplicationId || currentApplicationId === "unknown") { // Check for "unknown"
        const { apiService } = await import('../services/api');
        const createResponse = await apiService.request('/enrollment/auto-save', {
          method: 'POST',
          body: JSON.stringify({})
        });
        currentApplicationId = (createResponse as any).applicationId;
        localStorage.setItem(getUserKey('applicationId'), currentApplicationId); // Use user-specific key
        console.log('Created new application ID:', currentApplicationId);
      } else {
        console.log('Using existing application ID:', currentApplicationId);
      }

      const { apiService } = await import('../services/api');
      console.log('Calling submitEnrollment API...');
      const result = await apiService.submitEnrollment({
        applicationId: currentApplicationId,
        student: combinedData.student,
        medical: combinedData.medical,
        family: combinedData.family,
        fee: combinedData.fee,
        applicationDetails: combinedData.applicationDetails,
        nextOfKin: nextOfKinData
      } as any);
      console.log('submitEnrollment result:', result);

      // Update applicationId if changed
      if (result.applicationId && result.applicationId !== currentApplicationId) {
        console.log('Updating application ID:', result.applicationId);
        localStorage.setItem(getUserKey('applicationId'), result.applicationId); // Use user-specific key
        currentApplicationId = result.applicationId;
      }

      // Update local states
      setStudentData(combinedData.student);
      setMedicalData(combinedData.medical);
      setFamilyData(combinedData.family);
      setFeeData(combinedData.fee);
      setApplicationDetailsData(combinedData.applicationDetails);

      // Notify successful save
      addToast('Enrollment data saved successfully.', 'success');

      // Mark step 1 as completed and proceed to step 2 (document upload)
      if (!localCompletedSteps.includes(1)) {
        setLocalCompletedSteps(prev => [...prev, 1]);
      }
      onStepComplete && onStepComplete(1);
      onStepChange && onStepChange(2);
      storage.set(getUserKey('activeStep'), 2);
      setIsSubmitting(false);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to submit enrollment data.';
      addToast(errorMsg, 'error');
      setIsSubmitting(false);
    }
  }, [applicationId, applicationInitialized, studentData, medicalData, familyData, feeData, applicationDetailsData, onStepChange, onStepComplete, addToast, isStudentInfoCompleted, isFamilyInfoCompleted, isFeeResponsibilityCompleted, isApplicationDetailsCompleted, nextOfKinData, localCompletedSteps, getUserKey]);

  const handleCombinedSubmitClick = useCallback(() => {
    handleCombinedSubmit();
  }, [handleCombinedSubmit]);

  useEffect(() => {
    if (activeStep === 1 && dataLoaded && applicationInitialized) {
      const hasStudentData = isStudentInfoCompleted;
      const hasFamilyData = isFamilyInfoCompleted;
      const hasFeeData = isFeeResponsibilityCompleted;
      const hasApplicationDetailsData = isApplicationDetailsCompleted;
      const isStep1Completed = completedSteps.includes(1);
      if (hasStudentData && hasFamilyData && hasFeeData && hasApplicationDetailsData && !isStep1Completed) {
        onStepComplete && onStepComplete(1);
      }
    }
  }, [isStudentInfoCompleted, isFamilyInfoCompleted, isFeeResponsibilityCompleted, isApplicationDetailsCompleted, activeStep, dataLoaded, applicationInitialized, completedSteps, onStepComplete]);

  // Show global loading state while application data is being synchronized
  if (!applicationInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Synchronizing application data...</p>
          <p className="text-xs text-gray-400 mt-2">Connecting to secure enrollment server</p>
        </div>
      </div>
    );
  }

  if (activeStep === 1) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 1...</div>}>
          <Step1StudentGuardian
            studentData={studentData}
            medicalData={medicalData}
            familyData={familyData}
            feeData={feeData}
            applicationDetailsData={applicationDetailsData}
            applicationId={applicationId}
            validationErrors={validationErrors}
            savingStatus={savingStatus}
            dataLoaded={dataLoaded}
            isSubmitting={isSubmitting}  // disable only when submitting, initialization enforced above
            applicationInitialized={applicationInitialized}  // pass prop for UI message
            onStudentDataChange={handleStudentDataChange}
            onMedicalDataChange={handleMedicalDataChange}
            onFamilyDataChange={handleFamilyDataChange}
            onNextOfKinDataChange={handleNextOfKinDataChange}
            onFeeDataChange={handleFeeDataChange}
            onApplicationDetailsDataChange={handleApplicationDetailsDataChange}
            onSubmitClick={handleCombinedSubmitClick}
            isStudentInfoCompleted={isStudentInfoCompleted}
            isApplicationDetailsCompleted={isApplicationDetailsCompleted}
            isMedicalInfoCompleted={isMedicalInfoCompleted}
            isFamilyInfoCompleted={isFamilyInfoCompleted}
            isFeeResponsibilityCompleted={isFeeResponsibilityCompleted}
            nextOfKinData={nextOfKinData} // Pass nextOfKinData here
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 2) {
    // Check if Step 1 is completed before allowing Step 2
    if (!localCompletedSteps.includes(1)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1 Not Complete</h2>
            <p className="text-gray-600 mb-6">Please complete Step 1 (Student & Guardian Information) before proceeding to document upload.</p>
            <button
              onClick={() => onStepChange && onStepChange(1)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Go to Step 1
            </button>
          </div>
        </div>
      );
    }
    return (
      <Suspense fallback={<div>Loading Step 2...</div>}>
        <Step2DocumentUploadCenter
          applicationId={applicationId}
          onDocumentUploadComplete={handleDocumentUploadComplete}
          onDocumentsChange={handleDocumentsDataChange}
        />
      </Suspense>
    );
  } else if (activeStep === 3) {
    // Check if Step 2 is completed before allowing Step 3
    if (!localCompletedSteps.includes(2)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2 Not Complete</h2>
            <p className="text-gray-600 mb-6">Please complete Step 2 (Document Upload) before proceeding to academic history.</p>
            <button
              onClick={() => onStepChange && onStepChange(2)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Go to Step 2
            </button>
          </div>
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 3...</div>}>
          <Step3AcademicHistoryForm
            applicationId={applicationId}
            onStepComplete={(step) => {
              // Mark step 3 as complete
              if (!localCompletedSteps.includes(3)) {
                setLocalCompletedSteps(prev => [...prev, 3]);
              }
              onStepComplete && onStepComplete(step);
            }}
            onStepChange={onStepChange}
            onAcademicHistoryComplete={() => {
              if (!localCompletedSteps.includes(3)) {
                setLocalCompletedSteps(prev => [...prev, 3]);
              }
              onStepComplete && onStepComplete(3); // Mark step 3 as complete
              onStepChange && onStepChange(4); // Then move to the next step
            }}
            onDataChange={handleAcademicHistoryDataChange}
            initialData={academicHistoryData}
            isEditing={isEditing}
            returnStep={returnStep}
            setIsEditing={setIsEditing}
            setReturnStep={setReturnStep}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 4) {
    // Check if Step 3 is completed before allowing Step 4
    if (!localCompletedSteps.includes(3)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3 Not Complete</h2>
            <p className="text-gray-600 mb-6">Please complete Step 3 (Academic History) before proceeding to fee agreement.</p>
            <button
              onClick={() => onStepChange && onStepChange(3)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Go to Step 3
            </button>
          </div>
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 4...</div>}>
          <Step4FeeAgreement
            applicationId={applicationId}
            grade={studentData?.gradeAppliedFor}
            onFeeAgreementComplete={onFeeAgreementComplete}
            onStepChange={onStepChange}
            onStepComplete={(step) => {
              if (!localCompletedSteps.includes(4)) {
                setLocalCompletedSteps(prev => [...prev, 4]);
              }
              onStepComplete && onStepComplete(step);
            }}
            onDataChange={handleFinancingDataChange}
            initialData={financingData}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 5) {
    // Check if Step 4 is completed before allowing Step 5
    if (!localCompletedSteps.includes(4)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 4 Not Complete</h2>
            <p className="text-gray-600 mb-6">Please complete Step 4 (Fee Agreement) before proceeding to declaration.</p>
            <button
              onClick={() => onStepChange && onStepChange(4)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Go to Step 4
            </button>
          </div>
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 5...</div>}>
          <Step5DeclarationStep
            applicationId={applicationId}
            onDeclarationComplete={onDeclarationComplete}
            onStepChange={onStepChange}
            onStepComplete={(step) => {
              if (!localCompletedSteps.includes(5)) {
                setLocalCompletedSteps(prev => [...prev, 5]);
              }
              onStepComplete && onStepComplete(step);
            }}
            onDataChange={handleDeclarationDataChange}
            initialData={declarationData}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 6) {
    const isAlreadySubmitted = applicationStatus === 'submitted' || applicationStatus === 'completed';
    
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 6...</div>}>
          <Step6ReviewSubmitStep
            activeStep={activeStep}
            applicationId={applicationId}
            isSubmitted={isAlreadySubmitted}
            studentData={studentData}
            familyData={familyData}
            medicalData={medicalData}
            feeData={feeData}
            applicationDetailsData={applicationDetailsData}
            academicHistoryData={academicHistoryData}
            subjectsData={subjectsData}
            financingData={financingData}
            declarationData={declarationData}
            documentsData={documentsData}
            nextOfKinData={nextOfKinData}
            onSubmit={handleFinalSubmit}
            onStepChange={onStepChange}
            onStepComplete={onStepComplete}
            isEditing={isEditing}
            returnStep={returnStep}
            setIsEditing={setIsEditing}
            setReturnStep={setReturnStep}
          />
        </Suspense>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </ErrorBoundary>
    );
  } else {
    return null;
  }
};

export default MainContent;
