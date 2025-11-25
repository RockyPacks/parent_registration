import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastContainer from './ui/ToastContainer';
import { useToast } from '../hooks/useToast';
import debounce from 'lodash.debounce';
import { storage } from '../utils/storage';  // Import storage utils
import ErrorBoundary from './ErrorBoundary';  // Import ErrorBoundary

const Step1StudentGuardian = React.lazy(() => import('./form/Step1StudentGuardian'));
const Step2DocumentUploadCenter = React.lazy(() => import('./form/Step2DocumentUploadCenter'));
const Step3AcademicHistoryForm = React.lazy(() => import('./form/Step3AcademicHistoryForm'));
const Step4FeeAgreement = React.lazy(() => import('./form/Step4FeeAgreement'));
const Step5DeclarationStep = React.lazy(() => import('./form/Step5DeclarationStep'));
const Step6ReviewSubmitStep = React.lazy(() => import('./form/Step6ReviewSubmitStep'));

import Footer from './Footer';

interface MainContentProps {
  activeStep: number;
  applicationId?: string | null;
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
}

const MainContent: React.FC<MainContentProps> = (props) => {
  const {
    activeStep,
    applicationId,
    isSubmitting: isSubmittingProp,
    applicationInitialized = false,
  onEnrollmentSubmit,
  onAcademicHistoryComplete,
  onFeeAgreementComplete,
  onDeclarationComplete,
  onStepChange,
  onStepComplete,
  completedSteps = [],
} = props;

  const handleDocumentUploadComplete = useCallback(() => {
    onStepComplete && onStepComplete(2); // Mark step 2 as complete
    onStepChange && onStepChange(3); // Then move to the next step (Academic History)
  }, [onStepComplete, onStepChange]);

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
    console.log("MainContent: Initializing and loading all data from storage.");
    setStudentData(storage.get('studentData', {}) || {});
    setMedicalData(storage.get('medicalData', {}) || {});
    setFamilyData(storage.get('familyData', {}) || {}); // Ensure default is an empty object
    setFeeData(storage.get('feeData', {}) || {});
    setDocumentsData(storage.get('documentsData', []) || []);
    setAcademicHistoryData(storage.get('academicHistoryData', {}) || {});
    setFinancingData(storage.get('financingData', { plan: 'Pay Once Per Year' }) || { plan: 'Pay Once Per Year' }); // Ensure financingData has a default plan
    setDeclarationData(storage.get('declarationData', { signed: false }) || { signed: false }); // Ensure declarationData has a default signed status
    setNextOfKinData(storage.get('nextOfKinData', {}) || {});
    setDataLoaded(true);
  }, []);


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
    return medicalData?.medicalAidName?.trim() ||
      medicalData?.memberNumber?.trim() ||
      (medicalData?.conditions && medicalData.conditions.length > 0) ||
      medicalData?.allergies?.trim();
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

    return errors;
  }, [studentData, familyData, feeData]);

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
        fee: feeData
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

      let currentApplicationId = applicationId || localStorage.getItem('application_id');

      // Auto-save skipped: no valid data to save if appId is null or 'unknown'
      if (!currentApplicationId || currentApplicationId === "unknown") {
        console.log("Auto-save skipped: no valid application ID to save against.");
        setSavingStatus('idle');
        return false;
      }

      const { apiService } = await import('../services/api');
      const result = await apiService.autoSaveEnrollment({
        application_id: currentApplicationId,
        student: combinedData.student,
        medical: combinedData.medical,
        family: combinedData.family,
        fee: combinedData.fee
      });

      setSavingStatus('saved');

      if (result.application_id && result.application_id !== currentApplicationId) {
        localStorage.setItem('application_id', result.application_id);
        // Note: For auto-save, we're not immediately updating the applicationId state here,
        // as the source of truth for `applicationId` prop comes from `App.tsx`.
        // `App.tsx` will eventually reload and pick up the new ID if needed.
        currentApplicationId = result.application_id; // Update local variable for consistency
      }

      setTimeout(() => setSavingStatus('idle'), 2000);
      return true;
    } catch (error: any) {
      if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
        addToast('Your session has expired. Please log in again.', 'error');
        window.location.reload();
      } else {
        addToast('Failed to save progress. Please try again.', 'error');
      }
      setSavingStatus('idle');
      return false;
    }
  }, [studentData, medicalData, familyData, feeData, applicationId, applicationInitialized, addToast]);

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
  }, [studentData, medicalData, familyData, feeData, dataLoaded, applicationInitialized]);

  const handleStudentDataChange = useCallback((data: any) => {
    setStudentData(prevData => ({ ...prevData, ...data }));
    storage.set('studentData', { ...studentData, ...data });
  }, []);

  const handleMedicalDataChange = useCallback((data: any) => {
    setMedicalData(prevData => ({ ...prevData, ...data }));
    storage.set('medicalData', { ...medicalData, ...data });
  }, []);

  const handleFamilyDataChange = useCallback((data: any) => {
    setFamilyData(prevData => ({ ...prevData, ...data }));
    storage.set('familyData', { ...familyData, ...data });
  }, []);

  const handleFeeDataChange = useCallback((data: any) => {
    setFeeData(prevData => ({ ...prevData, ...data }));
    storage.set('feeData', { ...feeData, ...data });
  }, []);

  const handleNextOfKinDataChange = useCallback((data: any) => {
    setNextOfKinData(prevData => ({ ...prevData, ...data }));
    storage.set('nextOfKinData', { ...nextOfKinData, ...data });
  }, []);

  const handleDocumentsDataChange = useCallback((data: any[]) => {
    setDocumentsData(prevData => ([...prevData, ...data]));
    storage.set('documentsData', [...documentsData, ...data]);
  }, []);

  const handleAcademicHistoryDataChange = useCallback((data: any) => {
    setAcademicHistoryData(prevData => ({ ...prevData, ...data }));
    storage.set('academicHistoryData', { ...academicHistoryData, ...data });
  }, []);

  const handleFinancingDataChange = useCallback((data: any) => {
    setFinancingData(prevData => ({ ...prevData, ...data }));
    storage.set('financingData', { ...financingData, ...data });
  }, []);

  const handleDeclarationDataChange = useCallback((data: any) => {
    setDeclarationData(prevData => ({ ...prevData, ...data }));
    storage.set('declarationData', { ...declarationData, ...data });
  }, []);

const handleFinalSubmit = () => { // Made synchronous as no API call
  const data = {
    student: studentData,
    family: familyData, // familyData now includes nextOfKin
    nextOfKin: nextOfKinData,
    medical: medicalData,
    fee: feeData,
    academicHistory: academicHistoryData,
    subjects: subjectsData,
    financing: financingData,
    declaration: declarationData,
    documents: documentsData,
  };
  setFullApplicationData(data);
  // As per user feedback, this function should not handle actual API submissions.
  // It only prepares the data and marks the step as complete locally.
  addToast('Application data prepared for review and PDF generation.', 'success');
  onStepComplete && onStepComplete(6); // Mark step 6 as complete
};

const handleCombinedSubmit = useCallback(async (submitOnly = false) => {
  console.log('handleCombinedSubmit triggered');
  setIsSubmitting(true);

    try {
      // Validate form - using validationErrors state, ensure no errors
      if (Object.keys(validationErrorsMemo).length > 0) {
        addToast('Please complete all required fields before submitting.', 'error');
        setIsSubmitting(false);
        return;
      }

      const combinedData = {
        student: studentData,
        medical: medicalData,
        family: familyData,
        fee: feeData
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

      let currentApplicationId = applicationId || localStorage.getItem('application_id');

      if (!currentApplicationId || currentApplicationId === "unknown") { // Check for "unknown"
        const { apiService } = await import('../services/api');
        const createResponse = await apiService.request('/enrollment/auto-save', {
          method: 'POST',
          body: JSON.stringify({})
        });
        currentApplicationId = (createResponse as any).application_id;
        localStorage.setItem('application_id', currentApplicationId); // Use application_id
        console.log('Created new application ID:', currentApplicationId);
      } else {
        console.log('Using existing application ID:', currentApplicationId);
      }

      const { apiService } = await import('../services/api');
      console.log('Calling submitEnrollment API...');
      const result = await apiService.submitEnrollment({
        application_id: currentApplicationId,
        student: combinedData.student,
        medical: combinedData.medical,
        family: combinedData.family,
        fee: combinedData.fee
      });
      console.log('submitEnrollment result:', result);

      // Update applicationId if changed
      if (result.application_id && result.application_id !== currentApplicationId) {
        console.log('Updating application ID:', result.application_id);
        localStorage.setItem('application_id', result.application_id); // Use application_id
        currentApplicationId = result.application_id;
      }

      // Update local states
      setStudentData(combinedData.student);
      setMedicalData(combinedData.medical);
      setFamilyData(combinedData.family);
      setFeeData(combinedData.fee);

      // Notify successful save
      addToast('Enrollment data saved successfully.', 'success');

      // Mark step 1 as completed and proceed to step 2 (document upload)
      onStepComplete && onStepComplete(1);
      onStepChange && onStepChange(2);
      storage.set('activeStep', 2);
      setIsSubmitting(false);
    } catch (error: any) {
      console.error('Error in handleCombinedSubmit:', error);
      const errorMsg = error.message || 'Failed to submit enrollment data.';
      addToast(errorMsg, 'error');
      setIsSubmitting(false);
    }
  }, [applicationId, applicationInitialized, studentData, medicalData, familyData, feeData, onStepChange, onStepComplete, addToast, validationErrors]);

  const handleCombinedSubmitClick = useCallback(() => {
    handleCombinedSubmit();
  }, [handleCombinedSubmit]);

  useEffect(() => {
    if (activeStep === 1 && dataLoaded && applicationInitialized) {
      const hasStudentData = isStudentInfoCompleted;
      const hasFamilyData = isFamilyInfoCompleted;
      const hasFeeData = isFeeResponsibilityCompleted;
      const isStep1Completed = completedSteps.includes(1);
      if (hasStudentData && hasFamilyData && hasFeeData && !isStep1Completed) {
        onStepComplete && onStepComplete(1);
      }
    }
  }, [isStudentInfoCompleted, isFamilyInfoCompleted, isFeeResponsibilityCompleted, activeStep, dataLoaded, applicationInitialized, completedSteps, onStepComplete]);

  if (activeStep === 1) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 1...</div>}>
          <Step1StudentGuardian
            studentData={studentData}
            medicalData={medicalData}
            familyData={familyData}
            feeData={feeData}
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
            onSubmitClick={handleCombinedSubmitClick}
            isStudentInfoCompleted={isStudentInfoCompleted}
            isMedicalInfoCompleted={isMedicalInfoCompleted}
            isFamilyInfoCompleted={isFamilyInfoCompleted}
            isFeeResponsibilityCompleted={isFeeResponsibilityCompleted}
            nextOfKinData={nextOfKinData} // Pass nextOfKinData here
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 2) {
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
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 3...</div>}>
          <Step3AcademicHistoryForm
            applicationId={applicationId}
            onStepComplete={onStepComplete}
            onStepChange={onStepChange}
            onAcademicHistoryComplete={() => {
              onStepComplete && onStepComplete(3); // Mark step 3 as complete
              onStepChange && onStepChange(4); // Then move to the next step
            }}
            isEditing={isEditing}
            returnStep={returnStep}
            setIsEditing={setIsEditing}
            setReturnStep={setReturnStep}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 4) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 4...</div>}>
          <Step4FeeAgreement
            applicationId={applicationId}
            onFeeAgreementComplete={onFeeAgreementComplete}
            onStepChange={onStepChange}
            onStepComplete={onStepComplete}
            onDataChange={handleFinancingDataChange}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 5) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 5...</div>}>
          <Step5DeclarationStep
            applicationId={applicationId}
            onDeclarationComplete={onDeclarationComplete}
            onStepChange={onStepChange}
            onStepComplete={onStepComplete}
            onDataChange={handleDeclarationDataChange}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (activeStep === 6) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading Step 6...</div>}>
          <Step6ReviewSubmitStep
            activeStep={activeStep}
            studentData={studentData}
            familyData={familyData}
            medicalData={medicalData}
            feeData={feeData}
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
