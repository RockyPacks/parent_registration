import React, { useState, useEffect } from 'react';
import Header from './src/components/Header';
import Sidebar from './src/components/Sidebar';
import MainContent from './src/components/MainContent';
import Footer from './src/components/Footer';
import LoginPage from './src/components/LoginPage';
import SignupPage from './src/components/SignupPage';
import PaymentConfirmation from './src/components/PaymentConfirmation';

import { EnrollmentData } from './src/services/api';
import { storage } from './src/utils/storage';

interface ApplicationSummary {
  application_id: string;
  // Add other relevant properties if known
}

// Helper to generate user-specific localStorage keys
const getUserKey = (email: string | null, key: string) => email ? `${email}_${key}` : key;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [enrollmentData, setEnrollmentData] = useState<Partial<EnrollmentData>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentView, setCurrentView] = useState<'enrollment' | 'payment-confirmation'>('enrollment');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [applicationInitialized, setApplicationInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const steps = [
    { number: 1, title: 'Student & Guardian Info', subtitle: 'Personal details' },
    { number: 2, title: 'Document Upload', subtitle: 'Required documents' },
    { number: 3, title: 'Academic History', subtitle: 'Previous schools' },
    { number: 4, title: 'Fee Agreement', subtitle: 'Payment terms' },
    { number: 5, title: 'Declaration', subtitle: 'Terms & conditions' },
    { number: 6, title: 'Review & Submit', subtitle: 'Final review' },
  ];

  useEffect(() => {
    // Check if user is already authenticated on app load
    const initializeAuth = async () => {
      console.log("App.tsx: initializeAuth called");
      const { authService } = await import('./src/services/auth');
      console.log("App.tsx: authService loaded, checking authentication");

      // Check URL params for payment return first
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('reference')) {
        console.log("App.tsx: Payment confirmation detected in URL");
        setCurrentView('payment-confirmation');
        storage.set('currentView', 'payment-confirmation');
      }

      // Initialize auth state listener first - only once at the top level
      console.log("App.tsx: Setting up auth state listener");
      let currentUserEmailRef = { current: null as string | null };
      authService.initAuthListener(async (user) => {
        console.log("App.tsx: Auth state changed, user:", !!user);
        const wasAuthenticated = isAuthenticated;
        setIsAuthenticated(!!user);
        setUserEmail(user?.email || null);

        if (!!user && !wasAuthenticated) {
          // User just became authenticated, load their application
          console.log("App.tsx: User became authenticated, loading application");
          currentUserEmailRef.current = user.email;
          await loadUserApplication(user.email);
        } else if (!user && wasAuthenticated) {
          // User became unauthenticated, clear application state
          console.log("App.tsx: User became unauthenticated, clearing application state");
          clearApplicationState(currentUserEmailRef.current); // Pass the email of the user who just logged out
          currentUserEmailRef.current = null;
        } else if (!!user && wasAuthenticated && user.email !== currentUserEmailRef.current) {
          // User changed (different email), reload application
          console.log("App.tsx: User changed, reloading application");
          currentUserEmailRef.current = user.email;
          await loadUserApplication(user.email);
        }
        // Ignore SIGNED_OUT -> SIGNED_IN events for the same user
      });

      // Check initial auth state
      if (await authService.isAuthenticated()) {
        const { data: { session } } = await import('./src/services/supabase').then(m => m.supabase.auth.getSession());
        if (session?.user?.email) {
          console.log("App.tsx: User is initially authenticated");
          setUserEmail(session.user.email);
          setIsAuthenticated(true);
          await loadUserApplication(session.user.email);
        }
      } else {
        console.log("App.tsx: User is not authenticated");
      }

      setAuthInitialized(true);
    };

    const loadUserApplication = async (userEmail: string) => {
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
        const { apiService } = await import('./src/services/api');
        const appDataResponse = await apiService.initiateApplication();
        const initialAppId = appDataResponse.application_id;

        if (initialAppId) {
          console.log("App.tsx: Setting application ID:", initialAppId);
          setApplicationId(initialAppId);

          // Save the authoritative application ID to localStorage
          const userAppIdKey = getUserKey(userEmail, 'application_id');
          localStorage.setItem(userAppIdKey, initialAppId);

          // Restore other user-specific state
          const userActiveStepKey = getUserKey(userEmail, 'activeStep');
          const userCompletedStepsKey = getUserKey(userEmail, 'completedSteps');
          const userCurrentViewKey = getUserKey(userEmail, 'currentView');

          const savedActiveStep = storage.get(userActiveStepKey, 1);
          const savedCompletedSteps = storage.get(userCompletedStepsKey, []);
          const savedCurrentView = storage.get(userCurrentViewKey, 'enrollment');

          console.log("App.tsx: Restoring state - step:", savedActiveStep, "completed:", savedCompletedSteps, "view:", savedCurrentView);

          setActiveStep(savedActiveStep);
          setCompletedSteps(savedCompletedSteps);
          setCurrentView(savedCurrentView);

          // Load existing application data from backend
          try {
            console.log("App.tsx: Loading application data for:", initialAppId);
            const { apiService } = await import('./src/services/api');
            let appData = await apiService.getApplication(initialAppId);

            if (appData) {
              console.log("App.tsx: Application data loaded successfully");
              // Transform backend data to frontend format
              const enrollmentData: Partial<EnrollmentData> = {};

              if (appData.student) {
                enrollmentData.student = {
                  surname: appData.student.surname || '',
                  firstName: appData.student.first_name || '',
                  middleName: appData.student.middle_name || '',
                  preferredName: appData.student.preferred_name || '',
                  dob: appData.student.date_of_birth || '',
                  gender: appData.student.gender || '',
                  homeLanguage: appData.student.home_language || '',
                  idNumber: appData.student.id_number || '',
                  previousGrade: appData.student.previous_grade || '',
                  gradeAppliedFor: appData.student.grade_applied_for || '',
                  previousSchool: appData.student.previous_school || ''
                };
              }

              if (appData.medical) {
                enrollmentData.medical = {
                  medicalAidName: appData.medical.medical_aid_name || '',
                  memberNumber: appData.medical.member_number || '',
                  conditions: appData.medical.conditions || [],
                  allergies: appData.medical.allergies || ''
                };
              }

              if (appData.family) {
                enrollmentData.family = {
                  fatherSurname: appData.family.father_surname || '',
                  fatherFirstName: appData.family.father_first_name || '',
                  fatherIdNumber: appData.family.father_id_number || '',
                  fatherMobile: appData.family.father_mobile || '',
                  fatherEmail: appData.family.father_email || '',
                  motherSurname: appData.family.mother_surname || '',
                  motherFirstName: appData.family.mother_first_name || '',
                  motherIdNumber: appData.family.mother_id_number || '',
                  motherMobile: appData.family.mother_mobile || '',
                  motherEmail: appData.family.mother_email || '',
                  nextOfKinSurname: appData.family.next_of_kin_surname || '',
                  nextOfKinFirstName: appData.family.next_of_kin_first_name || '',
                  nextOfKinRelationship: appData.family.next_of_kin_relationship || '',
                  nextOfKinMobile: appData.family.next_of_kin_mobile || '',
                  nextOfKinEmail: appData.family.next_of_kin_email || '',
                  nextOfKinIdNumber: appData.family.next_of_kin_id_number || '' // Added missing nextOfKinIdNumber
                };
              }

              if (appData.fee) {
                enrollmentData.fee = {
                  feePerson: appData.fee.fee_person || '',
                  relationship: appData.fee.relationship || '',
                  feeTermsAccepted: appData.fee.fee_terms_accepted || false
                };
              }

              setEnrollmentData(enrollmentData);
              console.log("App.tsx: Enrollment data set successfully");
            } else {
              console.log("App.tsx: No application data returned");
            }
          } catch (dataError) {
            console.warn('App.tsx: Could not load application data:', dataError);
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

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowSignup(false);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    // Optionally show a success message or redirect to login
    alert('Account created successfully! Please log in.');
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

    // Clear all relevant items from localStorage using user-specific keys if email is provided
    if (email) {
      localStorage.removeItem(getUserKey(email, 'application_id'));
      storage.remove(getUserKey(email, 'paymentReference'));
      storage.remove(getUserKey(email, 'activeStep'));
      storage.remove(getUserKey(email, 'completedSteps'));
      storage.remove(getUserKey(email, 'currentView'));
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
      const { apiService } = await import('./src/services/api');
      const result = await apiService.submitEnrollment(data);

      setEnrollmentData(data);
      setApplicationId(result.application_id); // Store the application ID
      if (userEmail) {
        localStorage.setItem(getUserKey(userEmail, 'application_id'), result.application_id);
      }
      setCompletedSteps(prev => {
        const newSteps = [...new Set([...prev, 1])]; // Use Set to ensure uniqueness
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
        return newSteps;
      }); // Mark step 1 as completed
      setActiveStep(2); // Advance to document upload
      storage.set('activeStep', 2);
    } catch (error) {
      alert('Failed to submit enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUploadComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 2])]; // Use Set to ensure uniqueness
      storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
      return newSteps;
    });
    setActiveStep(3); // Advance to academic history after document upload
    storage.set(getUserKey(userEmail, 'activeStep'), 3);
  };

  const handleAcademicHistoryComplete = async (data: any) => {
    if (!applicationId) {
      alert("Cannot submit academic history: Application ID is missing.");
      return;
    }
    try {
      const { apiService } = await import('./src/services/api');
      await apiService.submitAcademicHistory({ ...data, applicationId });

      setCompletedSteps(prev => {
        const newSteps = [...new Set([...prev, 3])]; // Add 3 and ensure no duplicates
        storage.set(getUserKey(userEmail, 'completedSteps'), newSteps);
        return newSteps;
      });
      setActiveStep(4); // Advance to the next step on success
    } catch (error) {
      console.error("Failed to submit academic history:", error);
      alert("There was an error submitting your academic history. Please try again.");
    }
  };

  const handleFeeAgreementComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 4])]; // Use Set to ensure uniqueness
      storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
      return newSteps;
    }); // Mark step 4 as completed
    setActiveStep(5); // Advance to declaration
  };

  const handleDeclarationComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, 5])]; // Use Set to ensure uniqueness
      storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
      return newSteps;
    });
    setActiveStep(6); // Advance to review and submit
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSteps = [...new Set([...prev, stepNumber])]; // Use Set to ensure uniqueness
      storage.set(getUserKey(userEmail, 'completedSteps'), newSteps); // Save the clean array
      return newSteps;
    });
  };

  if (!isAuthenticated && authInitialized) {
    if (showSignup) {
      return <SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => setShowSignup(false)} />;
    } else {
      return <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />;
    }
  }

  // Show loading state while auth is initializing or application is loading
  if (!authInitialized || (isAuthenticated && !applicationInitialized)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'payment-confirmation') {
    return (
      <>
        <Header
          onLogout={handleLogout}
          onNavigate={(view) => {
            setCurrentView(view);
            storage.set(getUserKey(userEmail, 'currentView'), view);
          }}
          currentView={currentView}
        />
        <PaymentConfirmation
          onBack={() => {
            setCurrentView('enrollment');
            storage.set(getUserKey(userEmail, 'currentView'), 'enrollment');
          }}
          onNext={() => {
            setCurrentView('enrollment');
            storage.set(getUserKey(userEmail, 'currentView'), 'enrollment');
          }}
        />
      </>
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
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <main className="flex flex-col md:flex-row">
            <Sidebar steps={steps} activeStep={activeStep} onStepClick={handleStepClick} completedSteps={completedSteps} />
            <div className="flex-1 flex flex-col md:ml-[25%] bg-white border border-gray-200 shadow-sm md:rounded-lg">
            <MainContent
              activeStep={activeStep}
              applicationId={applicationId}
              isSubmitting={isSubmitting}
              applicationInitialized={applicationInitialized}
              onEnrollmentSubmit={handleEnrollmentSubmit}
              onDocumentUploadComplete={handleDocumentUploadComplete}
              onAcademicHistoryComplete={handleAcademicHistoryComplete}
              onFeeAgreementComplete={handleFeeAgreementComplete}
              onDeclarationComplete={handleDeclarationComplete}
              onStepChange={setActiveStep}
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
            />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
