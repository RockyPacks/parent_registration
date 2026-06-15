import React, { useState, useEffect, useMemo } from 'react';
import Header from './src/components/Header';
import Sidebar from './src/components/Sidebar';
import MainContent from './src/components/MainContent';
import Footer from './src/components/Footer';
import LoginPage from './src/components/LoginPage';
import SignupPage from './src/components/SignupPage';
import ForgotPasswordPage from './src/components/ForgotPasswordPage';
import ResetPasswordPage from './src/components/ResetPasswordPage';
import { InquiryPage } from './src/components/InquiryPage';

import { EnrollmentData, apiService } from './src/services/api';
import { storage } from './src/utils/storage';
import { isStAndrewsSchool } from './src/utils/schoolConsent';

interface ApplicationSummary {
  applicationId: string;
  // Add other relevant properties if known
}

// Helper to generate user-specific localStorage keys
const getUserKey = (email: string | null, key: string) => email ? `${email}_${key}` : key;

// Public registration routes are school-scoped.
// Example: /signup/molo-mhlaba-tennyson
const getSignupSchoolSlug = (): string | null => {
  const path = window.location.pathname;
  const pathMatch = path.match(/^\/signup\/([a-zA-Z0-9-]+)/);
  if (pathMatch) return pathMatch[1];

  const hash = window.location.hash;
  const hashMatch =
    hash.match(/^#\/signup\/([a-zA-Z0-9-]+)/) ||
    hash.match(/^#signup\/([a-zA-Z0-9-]+)/);

  return hashMatch ? hashMatch[1] : null;
};

const SELECTED_SCHOOL_SLUG_KEY = 'selectedSchoolSlug';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPublicInquiry, setShowPublicInquiry] = useState(false);
  // Detect password recovery token synchronously before Supabase processes it
  const [showResetPassword, setShowResetPassword] = useState(
    () => window.location.hash.includes('type=recovery')
  );
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string>('');
  const [activeStep, setActiveStep] = useState(1);
  const [enrollmentData, setEnrollmentData] = useState<Partial<EnrollmentData>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [inProgressSteps, setInProgressSteps] = useState<number[]>([]);
  const [currentView, setCurrentView] = useState<'enrollment' | 'payment-confirmation'>('enrollment');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [applicationInitialized, setApplicationInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(() => localStorage.getItem('selectedSchoolName'));
  const [selectedSchoolSlug, setSelectedSchoolSlug] = useState<string | null>(() => {
    const signupSlug = getSignupSchoolSlug();
    if (signupSlug) {
      storage.set(SELECTED_SCHOOL_SLUG_KEY, signupSlug);
      sessionStorage.setItem(SELECTED_SCHOOL_SLUG_KEY, signupSlug);
      return signupSlug;
    }

    return (
      sessionStorage.getItem(SELECTED_SCHOOL_SLUG_KEY) ||
      storage.get(SELECTED_SCHOOL_SLUG_KEY, null)
    );
  });


  const consentStepEnabled = isStAndrewsSchool(schoolName || selectedSchoolSlug);
  const steps = useMemo(() => {
    const baseSteps = [
      {
        number: 1,
        title: 'Student & Guardian Info',
        subtitle: 'Personal details',
        showUpdateBadge: true
      },
      { number: 2, title: 'Document Upload', subtitle: 'Required documents' },
      { number: 3, title: 'Academic History', subtitle: 'Previous schools' },
      { number: 4, title: 'Fee Agreement', subtitle: 'Payment terms' },
      { number: 5, title: 'Declaration', subtitle: 'Terms & conditions' },
    ];

    if (consentStepEnabled) {
      return [
        ...baseSteps,
        { number: 6, title: 'POPIA Consent', subtitle: 'Screening consent' },
        { number: 7, title: 'Review & Submit', subtitle: 'Final review' },
      ];
    }

    return [
      ...baseSteps,
      { number: 6, title: 'Review & Submit', subtitle: 'Final review' },
    ];
  }, [consentStepEnabled]);

  useEffect(() => {
    const signupSlug = getSignupSchoolSlug();

    if (signupSlug) {
      setSelectedSchoolSlug(signupSlug);
      storage.set(SELECTED_SCHOOL_SLUG_KEY, signupSlug);
      sessionStorage.setItem(SELECTED_SCHOOL_SLUG_KEY, signupSlug);

      // A school-specific signup URL must always open signup, not logout/sign-out.
      setShowSignup(true);
      setShowForgotPassword(false);
      setShowPublicInquiry(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const initializeAuth = async () => {
      console.log("App.tsx: initializeAuth called");

      // Handle PKCE code exchange from email confirmation
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        console.log("App.tsx: PKCE code detected in URL, exchanging for session");
        // Clean up URL (remove code parameter)
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { authService } = await import('./src/services/auth');
      console.log("App.tsx: authService loaded, checking authentication");

      // Initialize auth state listener - now tab-specific with sessionStorage
      console.log("App.tsx: Setting up tab-specific auth state listener");
      let currentUserEmailRef = { current: null as string | null };
      let hasInitialized = false;
      let isLoadingApplication = false; // Prevent duplicate loads

      authService.initAuthListener(async (user) => {
        console.log("App.tsx: Auth state changed in THIS TAB, user:", !!user, "hasInitialized:", hasInitialized, "isLoadingApplication:", isLoadingApplication);


        // Skip if we're already loading an application (prevents duplicate calls)
        if (isLoadingApplication) {
          console.log("App.tsx: Skipping - already loading application");
          return;
        }

        // On initial load, handle authentication once
        if (!hasInitialized) {
          console.log("App.tsx: Initial load handled by listener");
          hasInitialized = true;
          setIsAuthenticated(!!user);
          setUserEmail(user?.email || null);
          setUserName(user?.full_name || null);

          if (user) {
            currentUserEmailRef.current = user.email;
            isLoadingApplication = true;
            try {
              // Auth user metadata can be exposed under different keys depending on auth client/version;
              // cast to any and try common variants to avoid TypeScript errors while preserving runtime data.
              await loadUserApplication(user.email, (user as any).user_metadata || (user as any).userMetadata || {});
            } finally {
              isLoadingApplication = false;
            }
          }
          setAuthInitialized(true);
          return;
        }

        // For subsequent auth state changes (after initial load)
        // Only process if user state actually changed
        const newUserEmail = user?.email || null;
        const previousUserEmail = currentUserEmailRef.current;

        // Skip if it's the same user (duplicate event)
        if (newUserEmail === previousUserEmail) {
          console.log("App.tsx: Skipping duplicate auth event for same user");
          return;
        }

        setIsAuthenticated(!!user);
        setUserEmail(newUserEmail);
        if (user && !previousUserEmail) {
          // User just logged in - load their application
          console.log("App.tsx: User logged in, loading application");
          currentUserEmailRef.current = newUserEmail;
          isLoadingApplication = true;
          try {
            // Try both possible metadata property names to be compatible with different auth types/versions
            await loadUserApplication(newUserEmail!, (user as any).user_metadata || (user as any).userMetadata || {});
          } finally {
            isLoadingApplication = false;
          }
        } else if (!user && previousUserEmail) {
          // User logged out - clear application state
          console.log("App.tsx: User logged out, clearing application state");
          clearApplicationState(previousUserEmail);
          currentUserEmailRef.current = null;
        }
      }, () => {
        // Password recovery event - show reset password page
        setShowResetPassword(true);
      });

      // Note: We no longer need this separate check because initAuthListener handles initial state
      // The listener will fire immediately with the current session
    };

    const loadUserApplication = async (userEmail: string, userMetadata: any = {}) => {
      setApplicationInitialized(false);
      const currentInProgressSteps: number[] = [];
      try {
        if (!userEmail) {
          console.log("App.tsx: No user email provided, skipping application load.");
          setApplicationId(null);
          setEnrollmentData({});
          setActiveStep(1);
          setCompletedSteps([]);
          setCurrentView('enrollment');
          setApplicationInitialized(true); // Indicate that application loading is complete for unauthenticated user
          return;
        }

        console.log("App.tsx: Fetching application details from backend for user:", userEmail);
        const appDataResponse = await apiService.initiateApplication();
        const initialAppId = appDataResponse.applicationId;

        if (initialAppId) {
          console.log("App.tsx: Application ID from backend:", initialAppId);
          setApplicationId(initialAppId);
          setApplicationStatus(appDataResponse.status);
          // Restore other user-specific state
          const userActiveStepKey = getUserKey(userEmail, 'activeStep');
          const userCompletedStepsKey = getUserKey(userEmail, 'completedSteps');
          const userCurrentViewKey = getUserKey(userEmail, 'currentView');

          const savedCurrentView = storage.get(userCurrentViewKey, 'enrollment');

          // Use nested full application data from the initiateApplication response
          try {
            console.log("App.tsx: Loading application data for:", initialAppId);
            let appData = (appDataResponse as any).application;
            const effectiveSchoolName = (appDataResponse as any).schoolName || appData?.schoolName || appData?.school_name || null;
            if (effectiveSchoolName) {
              setSchoolName(effectiveSchoolName);
              localStorage.setItem('selectedSchoolName', effectiveSchoolName);
              console.log("App.tsx: Saved selectedSchoolName to localStorage:", effectiveSchoolName);
            }

            // Determine completed steps based on actual backend data
            const backendCompletedSteps: number[] = [];

            // Helper to check if an object has meaningful data (not just empty {})
            const hasData = (obj: any): boolean => {
              if (!obj || typeof obj !== 'object') return false;
              if (Array.isArray(obj)) return obj.length > 0;
              return Object.keys(obj).some(key => {
                const val = obj[key];
                return val !== null && val !== undefined && val !== '';
              });
            };

            if (appData) {
              console.log("App.tsx: Application data loaded successfully");

              // Check if step 1 data exists - must have actual student data with required fields
              const hasStudentData = appData.student?.surname && appData.student?.firstName;
              const hasFamilyData = hasData(appData.family) && (appData.family?.fatherSurname || appData.family?.motherSurname);
              const hasFeeData = appData.fee?.feePerson;
              const isSubmittedOrCompleted = appData.status === 'submitted' || appData.status === 'completed';
              const appUsesConsentStep = isStAndrewsSchool((appDataResponse as any).schoolName || appData.schoolName);
              const appReviewStepNumber = appUsesConsentStep ? 7 : 6;

              console.log("App.tsx: Step 1 check - hasStudentData:", hasStudentData, "hasFamilyData:", hasFamilyData, "hasFeeData:", hasFeeData, "isSubmittedOrCompleted:", isSubmittedOrCompleted);

              if ((hasStudentData && hasFamilyData && hasFeeData) || isSubmittedOrCompleted) {
                backendCompletedSteps.push(1);
                console.log("App.tsx: Step 1 marked as complete (either by data check or application status)");
              } else {
                console.log("App.tsx: Step 1 NOT marked as complete. Missing data and status is:", appData.status);
              }

              // Check if step 2 data exists (documents).
              // uploaded_files uses a JSONB 'files' array (one row per application),
              // so we must count actual files inside the JSONB array, not the number of rows.
              const allUploadedFiles = Array.isArray(appData.documents)
                ? appData.documents.flatMap((row: any) => (Array.isArray(row.files) ? row.files : []))
                : [];
              const documentCount = allUploadedFiles.length;
              const uploadedDocTypes = new Set(allUploadedFiles.map((f: any) => f.documentType).filter(Boolean));
              const requiredDocTypes = new Set(['proof_of_address', 'id_document', 'payslip', 'bank_statement']);
              const hasAllRequiredDocuments = [...requiredDocTypes].every(t => uploadedDocTypes.has(t));

              console.log("App.tsx: Step 2 check - fileCount:", documentCount, "uploadedTypes:", [...uploadedDocTypes], "allRequired:", hasAllRequiredDocuments);

              if (hasAllRequiredDocuments) {
                backendCompletedSteps.push(2);
              } else if (documentCount > 0 && !hasAllRequiredDocuments) {
                // Some documents uploaded but not all categories covered - mark as in-progress
                currentInProgressSteps.push(2);
                console.log("App.tsx: Step 2 marked as IN-PROGRESS - uploaded types:", [...uploadedDocTypes]);
              }

              // Check if step 3 data exists (academic history) - must have actual records
              const hasAcademicHistory = Array.isArray(appData.academicHistory) && appData.academicHistory.length > 0;
              console.log("App.tsx: Step 3 check - hasAcademicHistory:", hasAcademicHistory, "count:", appData.academicHistory?.length || 0);

              if (hasAcademicHistory) {
                backendCompletedSteps.push(3);
              }

              // Check if step 4 data exists (fee agreement - plan stored in fee.selectedPlan OR financingSelections)
              const hasFinancingSelections = (Array.isArray(appData.financingSelections) && appData.financingSelections.length > 0) ||
                !!(appData.fee?.selectedPlan);
              console.log("App.tsx: Step 4 check - hasFinancingSelections:", hasFinancingSelections, "fee.selectedPlan:", appData.fee?.selectedPlan, "count:", appData.financingSelections?.length || 0);

              if (hasFinancingSelections) {
                backendCompletedSteps.push(4);
              }

              // Check if step 5 data exists (declaration) - must be explicitly signed
              const hasDeclaration = appData.declaration?.signed === true;
              console.log("App.tsx: Step 5 check - hasDeclaration:", hasDeclaration, "signed:", appData.declaration?.signed);

              if (hasDeclaration) {
                backendCompletedSteps.push(5);
              }

              const hasConsent = Boolean(appData.consent?.consentToken || appData.consent?.consent_token);
              const hasPassedKba = appData.identityVerification?.result === 'passed' || appData.identity_verification?.result === 'passed';
              if (appUsesConsentStep && hasConsent && hasPassedKba) {
                backendCompletedSteps.push(6);
              }

              // IMPORTANT: Step 6 is ONLY complete when:
              // 1. Application status is 'submitted' AND has submittedAt timestamp
              // 2. AND ALL prerequisite steps (1-5) are ACTUALLY complete with data
              // This prevents showing step 6 as complete when steps are missing
              const hasAllPrerequisites = hasStudentData && hasFamilyData && hasFeeData;
              const allStepsComplete = backendCompletedSteps.includes(1) &&
                backendCompletedSteps.includes(2) &&
                backendCompletedSteps.includes(3) &&
                backendCompletedSteps.includes(4) &&
                backendCompletedSteps.includes(5) &&
                (!appUsesConsentStep || backendCompletedSteps.includes(6));
              const isSubmitted = (appData.status === 'submitted' || appData.status === 'completed') && appData.submittedAt;

              console.log("App.tsx: Step 6 check - status:", appData.status, "submittedAt:", appData.submittedAt);
              console.log("App.tsx: Step 6 check - hasAllPrerequisites:", hasAllPrerequisites, "allStepsComplete:", allStepsComplete);
              console.log("App.tsx: Step 6 check - completed steps so far:", backendCompletedSteps);

              if (isSubmitted && hasAllPrerequisites && allStepsComplete) {
                console.log(`App.tsx: ✓ Application is submitted with ALL steps complete - marking step ${appReviewStepNumber} as complete`);
                backendCompletedSteps.push(appReviewStepNumber);
              } else if (isSubmitted && !allStepsComplete) {
                console.log("App.tsx: ✗ Application is submitted but NOT all steps complete - NOT marking step 6 as complete");
                console.log("App.tsx: Missing steps - need all of [1,2,3,4,5] but have:", backendCompletedSteps);
              } else if (!isSubmitted) {
                console.log("App.tsx: ✗ Application NOT submitted - NOT marking step 6 as complete");
              }

              console.log("App.tsx: Backend completed steps:", backendCompletedSteps);

              // IMPORTANT: Always use backend-determined steps, ignore any stale localStorage data
              // This ensures the UI accurately reflects the actual state of the application
              console.log("App.tsx: Using backend completed steps (ignoring any stale localStorage)");

              // Transform backend data to frontend format
              const enrollmentData: Partial<EnrollmentData> = {};

              if (appData.student) {
                // Pre-fill from user metadata if student record is empty
                const fullMetadataName = userMetadata?.full_name || '';
                const [metaFirst = '', ...metaLastArr] = fullMetadataName.split(' ');
                const metaLast = metaLastArr.join(' ');

                enrollmentData.student = {
                  surname: appData.student.surname || metaLast || '',
                  firstName: appData.student.firstName || metaFirst || '',
                  middleName: appData.student.middleName || '',
                  preferredName: appData.student.preferredName || '',
                  email: appData.student.email || userEmail || '',
                  phone: appData.student.phone || '',
                  dob: appData.student.dateOfBirth || '',
                  gender: appData.student.gender || '',
                  homeLanguage: appData.student.homeLanguage || '',
                  idNumber: appData.student.idNumber || '',
                  previousGrade: appData.student.previousGrade || '',
                  gradeAppliedFor: appData.student.gradeAppliedFor || '',
                  previousSchool: appData.student.previousSchool || ''
                };
              }

              if (appData.medical) {
                enrollmentData.medical = {
                  religion: appData.medical.religion || '',
                  homeLanguage: appData.medical.homeLanguage || '',
                  allergies: appData.medical.allergies || '',
                  allergyActionRequired: appData.medical.allergyActionRequired || '',
                  allergyStatus: appData.medical.allergyStatus || '',
                  immunisationsUpToDate: appData.medical.immunisationsUpToDate || '',
                  medicalAidScheme: appData.medical.medicalAidScheme || appData.medical.medicalAidName || '',
                  medicalAidNumber: appData.medical.medicalAidNumber || appData.medical.memberNumber || '',
                  primaryMemberDetails: appData.medical.primaryMemberDetails || '',
                  learnerConditions: Array.isArray(appData.medical.learnerConditions) ? appData.medical.learnerConditions : [],
                  medicineNotToAdminister: appData.medical.medicineNotToAdminister || '',
                  // Legacy fields for backward compatibility
                  medicalAidName: appData.medical.medicalAidName || '',
                  memberNumber: appData.medical.memberNumber || '',
                  conditions: Array.isArray(appData.medical.conditions) ? appData.medical.conditions : [],
                };
              }

              if (appData.family) {
                enrollmentData.family = {
                  fatherSurname: appData.family.fatherSurname || '',
                  fatherFirstName: appData.family.fatherFirstName || '',
                  fatherIdNumber: appData.family.fatherIdNumber || '',
                  fatherMobile: appData.family.fatherMobile || '',
                  fatherEmail: appData.family.fatherEmail || '',
                  motherSurname: appData.family.motherSurname || '',
                  motherFirstName: appData.family.motherFirstName || '',
                  motherIdNumber: appData.family.motherIdNumber || '',
                  motherMobile: appData.family.motherMobile || '',
                  motherEmail: appData.family.motherEmail || '',
                  nextOfKinSurname: appData.family.nextOfKinSurname || '',
                  nextOfKinFirstName: appData.family.nextOfKinFirstName || '',
                  nextOfKinRelationship: appData.family.nextOfKinRelationship || '',
                  nextOfKinMobile: appData.family.nextOfKinMobile || '',
                  nextOfKinEmail: appData.family.nextOfKinEmail || '',
                  nextOfKinIdNumber: appData.family.nextOfKinIdNumber || ''
                };
              }

              if (appData.fee) {
                enrollmentData.fee = {
                  feePerson: appData.fee.feePerson || '',
                  relationship: appData.fee.relationship || '',
                  feeTermsAccepted: appData.fee.feeTermsAccepted || false,
                  bankName: appData.fee.bankName || '',
                  branchCode: appData.fee.branchCode || '',
                  accountNumber: appData.fee.accountNumber || '',
                  accountType: appData.fee.accountType || ''
                };
              }

              setEnrollmentData(enrollmentData);
              console.log("App.tsx: Enrollment data set successfully");

              // Save loaded data to localStorage so forms can access it
              // Helper to check for actual data content
              const hasActualData = (obj: any) => obj && Object.values(obj).some(val => val !== null && val !== undefined && val !== '');

              if (appData.student?.surname || appData.student?.firstName) {
                storage.set(getUserKey(userEmail, 'studentData'), enrollmentData.student);
              } else {
                console.log("App.tsx: Backend student data is empty or missing, not overwriting localStorage");
              }
              if (hasActualData(enrollmentData.medical)) {
                storage.set(getUserKey(userEmail, 'medicalData'), enrollmentData.medical);
              }
              if (hasActualData(enrollmentData.family)) {
                storage.set(getUserKey(userEmail, 'familyData'), enrollmentData.family);
              }
              if (hasActualData(enrollmentData.fee)) {
                storage.set(getUserKey(userEmail, 'feeData'), enrollmentData.fee);
              }

              // Save application details data to localStorage (Step 1)
              if (appData.applicationDetails) {
                const applicationDetailsData = {
                  proposedStartTerm: appData.applicationDetails.proposedStartTerm || '',
                  year: appData.applicationDetails.year || '',
                  gradeApplyingFor: appData.applicationDetails.gradeApplyingFor || '',
                  proposedStartDate: appData.applicationDetails.proposedStartDate || ''
                };
                storage.set(getUserKey(userEmail, 'applicationDetailsData'), applicationDetailsData);
                console.log("App.tsx: Saved applicationDetailsData to localStorage:", applicationDetailsData);
              }

              // Save next of kin data to localStorage (Step 1)
              if (appData.nextOfKin) {
                const nextOfKinData = {
                  nextOfKinSurname: appData.nextOfKin.surname || '',
                  nextOfKinFirstName: appData.nextOfKin.firstName || '',
                  nextOfKinRelationship: appData.nextOfKin.relationship || '',
                  nextOfKinMobile: appData.nextOfKin.mobileNumber || appData.nextOfKin.mobile || '',
                  nextOfKinWhatsapp: appData.nextOfKin.whatsapp || '',
                  nextOfKinEmail: appData.nextOfKin.emailAddress || appData.nextOfKin.email || '',
                  nextOfKinIdNumber: appData.nextOfKin.idNumber || '',
                  nextOfKinPhone: appData.nextOfKin.phoneNumber || appData.nextOfKin.phone || '',
                  nextOfKinAlternateMobile: appData.nextOfKin.alternateMobile || '',
                  nextOfKinPhysicalAddress: appData.nextOfKin.physicalAddress || ''
                };
                storage.set(getUserKey(userEmail, 'nextOfKinData'), nextOfKinData);
                console.log("App.tsx: Saved nextOfKinData to localStorage:", nextOfKinData);
              } else if (appData.family && (appData.family.nextOfKinSurname || appData.family.nextOfKinFirstName)) {
                // Fallback to extracting from family object
                const nextOfKinData = {
                  nextOfKinSurname: appData.family.nextOfKinSurname || '',
                  nextOfKinFirstName: appData.family.nextOfKinFirstName || '',
                  nextOfKinRelationship: appData.family.nextOfKinRelationship || '',
                  nextOfKinMobile: appData.family.nextOfKinMobile || '',
                  nextOfKinWhatsapp: appData.family.nextOfKinWhatsapp || '',
                  nextOfKinEmail: appData.family.nextOfKinEmail || '',
                  nextOfKinIdNumber: appData.family.nextOfKinIdNumber || '',
                  nextOfKinPhone: appData.family.nextOfKinPhone || '',
                  nextOfKinAlternateMobile: appData.family.nextOfKinAlternateMobile || '',
                  nextOfKinPhysicalAddress: appData.family.nextOfKinPhysicalAddress || ''
                };
                storage.set(getUserKey(userEmail, 'nextOfKinData'), nextOfKinData);
                console.log("App.tsx: Saved nextOfKinData (from family fallback) to localStorage:", nextOfKinData);
              }

              // Save declaration data to localStorage (Step 5)
              if (appData.declaration && (appData.declaration.signed || appData.declaration.id)) {
                const declData = appData.declaration;
                const declarationData = {
                  application_id: initialAppId,
                  agreeTruth: declData.agreeTruth || declData.agree_truth || false,
                  agreePolicies: declData.agreePolicies || declData.agree_policies || true,
                  agreeFinancial: declData.agreeFinancial || declData.agree_financial || true,
                  agreeVerification: declData.agreeVerification || declData.agree_verification || true,
                  agreeDataProcessing: declData.agreeDataProcessing || declData.agree_data_processing || true,
                  agreeAuditStorage: declData.agreeAuditStorage || declData.agree_audit_storage || true,
                  agreeAffordabilityProcessing: declData.agreeAffordabilityProcessing || declData.agree_affordability_processing || true,
                  fullName: declData.fullName || '',
                  city: declData.city || '',
                  signatureImage: declData.signatureImage || declData.signature || '', // Include signature from backend
                  signature: declData.signatureImage || declData.signature || '', // Also save as 'signature' for compatibility
                  signed: declData.signed || false,
                  status: declData.signed ? 'completed' : 'in_progress'
                };
                // Save to user-prefixed key (read by MainContent)
                storage.set(getUserKey(userEmail, 'declarationData'), declarationData);
                console.log("App.tsx: Declaration data saved to localStorage - signature present:", !!declarationData.signatureImage, 'length:', declarationData.signatureImage?.length || 0);
              }

              if (appData.consent && (appData.consent.consentToken || appData.consent.consent_token)) {
                const consentData = {
                  consentToken: appData.consent.consentToken || appData.consent.consent_token,
                  consentedAt: appData.consent.consentedAt || appData.consent.consented_at,
                  disclosureVersion: appData.consent.disclosureVersion || appData.consent.disclosure_version,
                  kbaEnabled: appUsesConsentStep,
                  kbaResult: appData.identityVerification?.result || appData.identity_verification?.result,
                };
                storage.set(getUserKey(userEmail, 'consentData'), consentData);
              }

              // Save financing data to localStorage (Step 4)
              // Backend stores plan in fee.selectedPlan (fee_responsibility table), not in financingSelections
              const rawPlanType = (appData.financingSelections && appData.financingSelections.length > 0)
                ? appData.financingSelections[0].planType
                : appData.fee?.selectedPlan;
              if (rawPlanType) {
                const planType = rawPlanType;

                // Check if it's already a display name or needs conversion
                const knownDisplayNames = [
                  'Pay Monthly Debit',
                  'Pay Per Term',
                  'Pay Once Per Year',
                  'Sibling Benefit',
                  'Pay via EFT'
                ];

                let planTitle = planType;

                // If it's in old format (code), convert to display name
                if (!knownDisplayNames.includes(planType)) {
                  const planTypeToTitle: { [key: string]: string } = {
                    'monthly_flat': 'Pay Monthly Debit',
                    'termly_discount': 'Pay Per Term',
                    'annual_discount': 'Pay Once Per Year',
                    'bnpl': 'Pay Once Per Year',
                    'forward_funding': 'Pay Once Per Year',
                    'sibling_discount': 'Sibling Benefit',
                    'eft': 'Pay via EFT'
                  };
                  planTitle = planTypeToTitle[planType] || 'Pay Once Per Year';
                }

                storage.set(getUserKey(userEmail, 'financingData'), { plan: planTitle });
                console.log("App.tsx: Financing data saved to localStorage:", { plan: planTitle });
              }

              // Save academic history data to localStorage (Step 3)
              if (appData.academicHistory && appData.academicHistory.length > 0) {
                const academicData = appData.academicHistory[0];
                const academicHistoryData = {
                  schoolName: academicData.schoolName || '',
                  schoolType: academicData.schoolType || '',
                  lastGradeCompleted: academicData.lastGradeCompleted || '',
                  academicYearCompleted: academicData.academicYearCompleted || '',
                  reasonForLeaving: academicData.reasonForLeaving || '',
                  principalName: academicData.principalName || '',
                  schoolPhoneNumber: academicData.schoolPhoneNumber || '',
                  schoolEmail: academicData.schoolEmail || '',
                  schoolAddress: academicData.schoolAddress || '',
                  reportCardUrl: academicData.reportCardUrl || '',
                  additionalNotes: academicData.additionalNotes || ''
                };
                storage.set(getUserKey(userEmail, 'academicHistoryData'), academicHistoryData);
                console.log("App.tsx: Academic history data saved to localStorage:", academicHistoryData);
              }

              // Set completed steps based on backend data
              // CRITICAL: Clear any stale localStorage data and use ONLY backend data
              console.log("App.tsx: Clearing any stale completedSteps from localStorage");

              // SAFETY CHECK: Remove step 6 from backendCompletedSteps if application is not actually submitted
              // This prevents any stale data or bugs from showing step 6 as complete prematurely
              const isActuallySubmitted = (appData.status === 'submitted' || appData.status === 'completed') && appData.submittedAt;
              if (!isActuallySubmitted && backendCompletedSteps.includes(appReviewStepNumber)) {
                console.warn(`App.tsx: WARNING - Step ${appReviewStepNumber} found in completed steps but application not submitted! Removing review step.`);
                const index = backendCompletedSteps.indexOf(appReviewStepNumber);
                if (index > -1) {
                  backendCompletedSteps.splice(index, 1);
                }
              }

              setCompletedSteps(backendCompletedSteps);
              setInProgressSteps(currentInProgressSteps);
              setApplicationStatus(appData.status);
              storage.set(userCompletedStepsKey, backendCompletedSteps);
              storage.set(getUserKey(userEmail, 'inProgressSteps'), currentInProgressSteps);
              console.log("App.tsx: Completed steps set from backend:", backendCompletedSteps);
              console.log("App.tsx: In-progress steps set from backend:", currentInProgressSteps);

              // Determine the active step
              let targetStep = 1;

              if (backendCompletedSteps.includes(appReviewStepNumber)) {
                // Application submitted, stay on step 6 to view summary
                targetStep = appReviewStepNumber;
              } else if (backendCompletedSteps.length > 0) {
                // User has made progress - restore their last saved position or go to next incomplete step
                const savedActiveStep = storage.get(userActiveStepKey, null);
                if (savedActiveStep && savedActiveStep >= 1 && savedActiveStep <= appReviewStepNumber) {
                  // Restore user's last position
                  targetStep = savedActiveStep;
                } else {
                  // Go to next incomplete step
                  targetStep = Math.min(backendCompletedSteps.length + 1, appReviewStepNumber);
                }
              } else {
                // New user with no data - start at step 1
                targetStep = 1;
              }

              console.log("App.tsx: Restoring state - step:", targetStep, "completed:", backendCompletedSteps, "view:", savedCurrentView);

              // IMPORTANT: Set active step on initial load/reload
              if (activeStep === 1) {
                setActiveStep(targetStep);
                console.log("App.tsx: Initial load/reload - setting active step to:", targetStep);
              } else {
                console.log("App.tsx: Preserving user's current session active step:", activeStep);
              }
              setCurrentView(savedCurrentView);
            } else {
              console.log("App.tsx: No application data returned - starting fresh at step 1");
              // No backend data, fresh start at step 1
              setCompletedSteps([]);
              setActiveStep(1);
              setCurrentView(savedCurrentView);
              storage.set(userCompletedStepsKey, []);
              storage.set(userActiveStepKey, 1);
            }
          } catch (dataError) {
            console.warn('App.tsx: Could not load application data:', dataError);
            // On error, start fresh at step 1
            setCompletedSteps([]);
            setActiveStep(1);
            setCurrentView(savedCurrentView);
            storage.set(userCompletedStepsKey, []);
            storage.set(userActiveStepKey, 1);
          }
        } else {
          console.log("App.tsx: No application ID available");
        }

        setApplicationInitialized(true);
      } catch (error) {
        console.warn('App.tsx: Could not load existing application:', error);
        setApplicationInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // This effect ensures that whenever activeStep changes, it's saved to localStorage.
  // This is more reliable than saving it in every single handler function.
  useEffect(() => {
    if (userEmail) {
      storage.set(getUserKey(userEmail, 'activeStep'), activeStep);
    }
  }, [activeStep, userEmail]);

  // Removed URL sync to prevent navigation bouncing
  // Active step is now managed purely through React state and localStorage

  const handleLogin = () => {
    if (selectedSchoolSlug) {
      storage.set(SELECTED_SCHOOL_SLUG_KEY, selectedSchoolSlug);
      sessionStorage.setItem(SELECTED_SCHOOL_SLUG_KEY, selectedSchoolSlug);
    }

    setIsAuthenticated(true);
    setShowSignup(false);
  };

  const handleSignupSuccess = (email: string) => {
    if (selectedSchoolSlug) {
      storage.set(SELECTED_SCHOOL_SLUG_KEY, selectedSchoolSlug);
      sessionStorage.setItem(SELECTED_SCHOOL_SLUG_KEY, selectedSchoolSlug);
    }

    setShowSignup(false);
    setShowEmailConfirmation(true);
    setConfirmationEmail(email);
  };

  const handleLogout = async () => {
    try {
      const { authService } = await import('./src/services/auth');
      await authService.logout();
    } catch (error) {
      // Silently handle logout error
    }
  };

  const clearApplicationState = (email: string | null = null) => {
    setApplicationId(null);
    setEnrollmentData({});
    setActiveStep(1);
    setCompletedSteps([]);
    setCurrentView('enrollment');
    setApplicationInitialized(false);
    setIsAuthenticated(false);
    setUserName(null);
    setSchoolName(null);

    // Clear all relevant items from localStorage using user-specific keys if email is provided
    if (email) {
      storage.remove(getUserKey(email, 'paymentReference'));
      storage.remove(getUserKey(email, 'activeStep'));
      storage.remove(getUserKey(email, 'completedSteps'));
      storage.remove(getUserKey(email, 'currentView'));
      // Clear all form data
      storage.remove(getUserKey(email, 'studentData'));
      storage.remove(getUserKey(email, 'medicalData'));
      storage.remove(getUserKey(email, 'familyData'));
      storage.remove(getUserKey(email, 'feeData'));
      storage.remove(getUserKey(email, 'nextOfKinData'));
      storage.remove(getUserKey(email, 'documentsData'));
      storage.remove(getUserKey(email, 'academicHistoryData'));
      storage.remove(getUserKey(email, 'financingData'));
      storage.remove(getUserKey(email, 'declarationData'));
      storage.remove(getUserKey(email, 'consentData'));
      // Note: Application ID is managed by backend, not stored in localStorage
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // This function should directly set the active step when a user clicks the sidebar.
    setActiveStep(stepNumber);
  };

  const handleEnrollmentSubmit = async (data: EnrollmentData) => {
    setIsSubmitting(true);
    try {
      // Submit enrollment data to backend using the API service
      const result = await apiService.submitEnrollment(data);

      setEnrollmentData(data);
      setApplicationId(result.applicationId); // Store the application ID from backend
      setCompletedSteps(prev => {
        const newSteps = [...new Set([...prev, 1])]; // Use Set to ensure uniqueness
        if (userEmail) {
          storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
          console.log('App.tsx: Step 1 completed. All completed steps:', newSteps);
        }
        return newSteps;
      }); // Mark step 1 as completed
      setActiveStep(2); // Advance to document upload
    } catch (error) {
      alert('Failed to submit enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUploadComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 2])]; // Use Set to ensure uniqueness
      if (userEmail) {
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
        console.log('App.tsx: Step 2 completed. All completed steps:', newSteps);
      }
      return newSteps;
    });
    setActiveStep(3); // Advance to academic history after document upload
  };

  const handleAcademicHistoryComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 3])]; // Add 3 and ensure no duplicates
      if (userEmail) {
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps);
        console.log('App.tsx: Step 3 completed. All completed steps:', newSteps);
      }
      return newSteps;
    });
    setActiveStep(4); // Advance to the next step on success
  };

  const handleFeeAgreementComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 4])]; // Use Set to ensure uniqueness
      if (userEmail) {
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
        console.log('App.tsx: Step 4 completed. All completed steps:', newSteps);
      }
      return newSteps;
    }); // Mark step 4 as completed
    setActiveStep(5); // Advance to declaration
  };

  const handleDeclarationComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 5])]; // Use Set to ensure uniqueness
      if (userEmail) {
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
        console.log('App.tsx: Step 5 completed. All completed steps:', newSteps);
      }
      return newSteps;
    });
    setActiveStep(6); // Advance to review and submit
  };

  // Auto-hide email confirmation toast after 5 seconds
  useEffect(() => {
    if (showEmailConfirmation) {
      const timer = setTimeout(() => {
        setShowEmailConfirmation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showEmailConfirmation]);

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, stepNumber])]; // Use Set to ensure uniqueness
      if (userEmail) {
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
        console.log(`App.tsx: Step ${stepNumber} marked as complete. All completed steps:`, newSteps);
      }
      return newSteps;
    });
  };

  const handleCompletedStepsChange = (newSteps: number[]) => {
    setCompletedSteps(prev => {
      // Avoid infinite loop if equal
      if (prev.length === newSteps.length && prev.every(s => newSteps.includes(s))) {
        return prev;
      }
      if (userEmail) {
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps);
      }
      console.log('App.tsx: Dynamically updated completed steps to:', newSteps);
      return newSteps;
    });
  };

  // Support both standard pathname (/inquiry/school_uuid) and hash routing (/#/inquiry/school_uuid)
  const getInquirySchoolId = (): string | null => {
    const path = window.location.pathname;
    const pathMatch = path.match(/^\/inquiry\/([a-zA-Z0-9-]+)/);
    if (pathMatch) return pathMatch[1];

    const hash = window.location.hash;
    const hashMatch = hash.match(/^#\/inquiry\/([a-zA-Z0-9-]+)/) || hash.match(/^#inquiry\/([a-zA-Z0-9-]+)/);
    if (hashMatch) return hashMatch[1];

    return null;
  };

  const inquirySchoolId = getInquirySchoolId();

  if (inquirySchoolId) {
    return <InquiryPage schoolId={inquirySchoolId} />;
  }

  if (showPublicInquiry) {
    return <InquiryPage onBackToLogin={() => setShowPublicInquiry(false)} />;
  }

  // Show reset password page regardless of auth state (triggered by recovery email link)
  if (showResetPassword) {
    return <ResetPasswordPage onPasswordReset={() => { setShowResetPassword(false); }} />;
  }

  if (!isAuthenticated && authInitialized) {
    return (
      <>
        {/* Toast Notification - Fixed position overlay */}
        {showEmailConfirmation && (
          <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-slide-in">
            <div className="bg-white rounded-lg shadow-2xl border-l-4 border-green-500 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Email Confirmation Sent!
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Check your email at <span className="font-medium text-blue-600">{confirmationEmail}</span> and click the confirmation link to verify your account.
                  </p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => {
                        setShowEmailConfirmation(false);
                        setShowSignup(false);
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Go to Login
                    </button>
                    <button
                      onClick={() => setShowEmailConfirmation(false)}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailConfirmation(false)}
                  className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {showSignup ? (
          <SignupPage 
            onSignupSuccess={handleSignupSuccess} 
            onSwitchToLogin={() => setShowSignup(false)} 
            onSwitchToInquiry={() => { setShowSignup(false); setShowPublicInquiry(true); }}
            initialSchoolSlug={selectedSchoolSlug}
          />
        ) : showForgotPassword ? (
          <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />
        ) : (
          <LoginPage 
            onLogin={handleLogin} 
            onSwitchToSignup={() => setShowSignup(true)} 
            onForgotPassword={() => setShowForgotPassword(true)} 
            onSwitchToInquiry={() => setShowPublicInquiry(true)}
          />
        )}
      </>
    );
  }

  // Show loading state while auth is initializing or application is loading
  if (!authInitialized || (isAuthenticated && !applicationInitialized && !showResetPassword)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        onLogout={handleLogout}
        onNavigate={(view) => {
          setCurrentView(view);
          storage.set(getUserKey(userEmail, 'currentView'), view);
        }}
        currentView={currentView}
        userName={userName || undefined}
        userEmail={userEmail || undefined}
        schoolName={schoolName || undefined}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <main className="flex flex-col md:flex-row">
            <Sidebar steps={steps} activeStep={activeStep} onStepClick={handleStepClick} completedSteps={completedSteps} inProgressSteps={inProgressSteps} />
            <div className="flex-1 flex flex-col md:ml-[25%] bg-white border border-gray-200 shadow-sm md:rounded-lg">
              <MainContent
                activeStep={activeStep}
                applicationId={applicationId}
                applicationStatus={applicationStatus}
                isSubmitting={isSubmitting}
                applicationInitialized={applicationInitialized}
                onEnrollmentSubmit={handleEnrollmentSubmit}
                onDocumentUploadComplete={handleDocumentUploadComplete}
                onAcademicHistoryComplete={handleAcademicHistoryComplete}
                onFeeAgreementComplete={handleFeeAgreementComplete}
                onDeclarationComplete={handleDeclarationComplete}
                onStepChange={(step) => {
                  console.log(`App.tsx: Step change requested from ${activeStep} to ${step}`);
                  setActiveStep(step);
                }}
                onStepComplete={handleStepComplete}
                onCompletedStepsChange={handleCompletedStepsChange}
                completedSteps={completedSteps}
                userEmail={userEmail}
                consentStepEnabled={consentStepEnabled}
              />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
