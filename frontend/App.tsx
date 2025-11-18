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


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [enrollmentData, setEnrollmentData] = useState<Partial<EnrollmentData>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentView, setCurrentView] = useState<'enrollment' | 'payment-confirmation'>('enrollment');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [applicationInitialized, setApplicationInitialized] = useState(false);


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

        if (!!user && !wasAuthenticated) {
          // User just became authenticated, load their application
          console.log("App.tsx: User became authenticated, loading application");
          currentUserEmailRef.current = user.email;
          await loadUserApplication();
        } else if (!user && wasAuthenticated) {
          // User became unauthenticated, clear application state
          console.log("App.tsx: User became unauthenticated, clearing application state");
          currentUserEmailRef.current = null;
          clearApplicationState();
        } else if (!!user && wasAuthenticated && user.email !== currentUserEmailRef.current) {
          // User changed (different email), reload application
          console.log("App.tsx: User changed, reloading application");
          currentUserEmailRef.current = user.email;
          await loadUserApplication();
        }
        // Ignore SIGNED_OUT -> SIGNED_IN events for the same user
      });

      // Check initial auth state
      if (authService.isAuthenticated()) {
        console.log("App.tsx: User is initially authenticated");
        setIsAuthenticated(true);
        await loadUserApplication();
      } else {
        console.log("App.tsx: User is not authenticated");
      }

      setAuthInitialized(true);
    };

    const loadUserApplication = async () => {
      try {
        // Restore app state from localStorage
        const savedActiveStep = storage.get('activeStep', 1);
        const savedCompletedSteps = storage.get('completedSteps', []);
        const savedCurrentView = storage.get('currentView', 'enrollment');
        const savedApplicationId = storage.getString('applicationId');

        console.log("App.tsx: Restoring state - step:", savedActiveStep, "completed:", savedCompletedSteps, "view:", savedCurrentView, "appId:", savedApplicationId);

        setActiveStep(savedActiveStep);
        setCompletedSteps(savedCompletedSteps);
        setCurrentView(savedCurrentView);

        // Load user's existing in-progress application
        const { apiService } = await import('./src/services/api');
        let appId = savedApplicationId;

        if (!appId) {
          console.log("App.tsx: No saved application ID, creating new one");
          // Get user's in-progress application from backend
          const response = await apiService.request('/enrollment/auto-save', {
            method: 'POST',
            body: JSON.stringify({ application_id: null })
          });
          if ((response as any).application_id) {
            appId = (response as any).application_id;
            storage.setString('applicationId', appId);
            console.log("App.tsx: Created new application:", appId);
          }
        }

        if (appId) {
          console.log("App.tsx: Setting application ID:", appId);
          setApplicationId(appId);

          // Load existing application data from backend
          try {
            console.log("App.tsx: Loading application data for:", appId);
            const appData = await apiService.getApplication(appId);
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
                  motherEmail: appData.family.mother_email || ''
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

    const clearApplicationState = () => {
      setApplicationId(null);
      setEnrollmentData({});
      setActiveStep(1);
      setCompletedSteps([]);
      setCurrentView('enrollment');
      setApplicationInitialized(false);
    };

    initializeAuth();
  }, []);

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

    // Clear additional app state
    storage.remove('applicationId');
    storage.remove('paymentReference');
    storage.remove('activeStep');
    storage.remove('completedSteps');
    storage.remove('currentView');
    setIsAuthenticated(false);
    setActiveStep(1);
    setEnrollmentData({});
    setApplicationId(null);
    setCompletedSteps([]);
    setCurrentView('enrollment');
    setApplicationInitialized(false);
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to completed steps or the next step
    if (stepNumber <= activeStep || completedSteps.includes(Math.floor(stepNumber - 1))) {
      setActiveStep(stepNumber);
      storage.set('activeStep', stepNumber);
    }
  };

  const handleEnrollmentSubmit = async (data: EnrollmentData) => {
    try {
      // Submit enrollment data to backend using the API service
      const { apiService } = await import('./src/services/api');
      const result = await apiService.submitEnrollment(data);

      setEnrollmentData(data);
      setApplicationId(result.application_id); // Store the application ID
      storage.setString('applicationId', result.application_id);
      setCompletedSteps(prev => {
        const newSteps = [...prev, 1];
        storage.set('completedSteps', newSteps);
        return newSteps;
      }); // Mark step 1 as completed
      setActiveStep(2); // Advance to document upload
      storage.set('activeStep', 2);
    } catch (error) {
      alert('Failed to submit enrollment. Please try again.');
    }
  };

  const handleDocumentUploadComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...prev, 2];
      storage.set('completedSteps', newSteps);
      return newSteps;
    }); // Mark step 2 as completed
    setActiveStep(3); // Advance to academic history after document upload
    storage.set('activeStep', 3);
  };

  const handleAcademicHistoryComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...prev, 3];
      storage.set('completedSteps', newSteps);
      return newSteps;
    }); // Mark step 3 as completed
    setActiveStep(4); // Advance to fee agreement
    storage.set('activeStep', 4);
  };

  const handleFeeAgreementComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...prev, 4];
      storage.set('completedSteps', newSteps);
      return newSteps;
    }); // Mark step 4 as completed
    setActiveStep(5); // Advance to declaration
    storage.set('activeStep', 5);
  };

  const handleDeclarationComplete = () => {
    setCompletedSteps(prev => {
      const newSteps = [...prev, 5];
      storage.set('completedSteps', newSteps);
      return newSteps;
    }); // Mark step 5 as completed
    setActiveStep(6); // Advance to review and submit
    storage.set('activeStep', 6);
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => {
      const newSteps = [...prev, stepNumber];
      storage.set('completedSteps', newSteps);
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
            storage.set('currentView', view);
          }}
          currentView={currentView}
        />
        <PaymentConfirmation
          onBack={() => {
            setCurrentView('enrollment');
            storage.set('currentView', 'enrollment');
          }}
          onNext={() => {
            setCurrentView('enrollment');
            storage.set('currentView', 'enrollment');
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
          storage.set('currentView', view);
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
