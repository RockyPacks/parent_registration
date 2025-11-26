import React, { useState, useEffect } from 'react';
import Header from './src/components/Header';
import Sidebar from './src/components/Sidebar';
import MainContent from './src/components/MainContent';
import Footer from './src/components/Footer';
import LoginPage from './src/components/LoginPage';
import SignupPage from './src/components/SignupPage';

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
  const [userName, setUserName] = useState<string | null>(null);
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

      // Initialize auth state listener - now tab-specific with sessionStorage
      console.log("App.tsx: Setting up tab-specific auth state listener");
      let currentUserEmailRef = { current: null as string | null };
      let isInitialLoad = true;

      authService.initAuthListener(async (user) => {
        console.log("App.tsx: Auth state changed in THIS TAB, user:", !!user);
        const wasAuthenticated = isAuthenticated;
        
        // On initial load, we'll handle authentication separately
        // This prevents double-loading when both listener and manual check fire
        if (isInitialLoad) {
          console.log("App.tsx: Initial load handled by listener");
          setIsAuthenticated(!!user);
          setUserEmail(user?.email || null);
          setUserName(user?.full_name || null);
          
          if (user) {
            currentUserEmailRef.current = user.email;
            await loadUserApplication(user.email);
          }
          isInitialLoad = false;
          setAuthInitialized(true);
          return;
        }

        // For subsequent auth state changes (after initial load)
        setIsAuthenticated(!!user);
        setUserEmail(user?.email || null);
        setUserName(user?.full_name || null);

        if (!!user && !wasAuthenticated) {
          // User just logged in - load their application
          console.log("App.tsx: User logged in, loading application");
          currentUserEmailRef.current = user.email;
          await loadUserApplication(user.email);
        } else if (!user && wasAuthenticated) {
          // User logged out - clear application state
          console.log("App.tsx: User logged out, clearing application state");
          clearApplicationState(currentUserEmailRef.current);
          currentUserEmailRef.current = null;
        }
      });

      // Note: We no longer need this separate check because initAuthListener handles initial state
      // The listener will fire immediately with the current session
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
          console.log("App.tsx: Application ID from backend:", initialAppId);
          setApplicationId(initialAppId);

          // Restore other user-specific state
          const userActiveStepKey = getUserKey(userEmail, 'activeStep');
          const userCompletedStepsKey = getUserKey(userEmail, 'completedSteps');
          const userCurrentViewKey = getUserKey(userEmail, 'currentView');

          const savedCurrentView = storage.get(userCurrentViewKey, 'enrollment');

          // Load existing application data from backend first to determine actual completed steps
          try {
            console.log("App.tsx: Loading application data for:", initialAppId);
            const { apiService } = await import('./src/services/api');
            let appData = await apiService.getApplication(initialAppId);

            // Determine completed steps based on actual backend data
            const backendCompletedSteps: number[] = [];
            
            if (appData) {
              console.log("App.tsx: Application data loaded successfully");
              
              // Check if step 1 data exists
              if (appData.student?.surname && appData.student?.first_name && 
                  appData.family && appData.fee?.fee_person) {
                backendCompletedSteps.push(1);
              }
              
              // Check if step 2 data exists (documents)
              if (appData.documents && appData.documents.length > 0) {
                backendCompletedSteps.push(2);
              }
              
              // Check if step 3 data exists (academic history)
              if (appData.academic_history && appData.academic_history.length > 0) {
                backendCompletedSteps.push(3);
              }
              
              // Check if step 4 data exists (fee agreement - financing selections)
              if (appData.financing_selections && appData.financing_selections.length > 0) {
                backendCompletedSteps.push(4);
              }
              
              // Check if step 5 data exists (declaration)
              if (appData.declaration?.signed) {
                backendCompletedSteps.push(5);
              }
              
              // IMPORTANT: Step 6 is ONLY complete when the application has been submitted
              // This happens when user clicks "Submit Application" button in Step 6
              // The backend status changes to 'submitted' or 'completed' only after successful submission
              if (appData.status === 'submitted' || appData.status === 'completed') {
                backendCompletedSteps.push(6);
                console.log("App.tsx: Application has been submitted - Step 6 is complete");
              }

              console.log("App.tsx: Backend completed steps:", backendCompletedSteps);
              
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
              
              // Save loaded data to localStorage so forms can access it
              if (enrollmentData.student) {
                storage.set(getUserKey(userEmail, 'studentData'), enrollmentData.student);
              }
              if (enrollmentData.medical) {
                storage.set(getUserKey(userEmail, 'medicalData'), enrollmentData.medical);
              }
              if (enrollmentData.family) {
                storage.set(getUserKey(userEmail, 'familyData'), enrollmentData.family);
              }
              if (enrollmentData.fee) {
                storage.set(getUserKey(userEmail, 'feeData'), enrollmentData.fee);
              }
              
              // Set completed steps based on backend data
              setCompletedSteps(backendCompletedSteps);
              storage.set(userCompletedStepsKey, backendCompletedSteps);
              console.log("App.tsx: Completed steps saved to localStorage:", backendCompletedSteps);
              
              // Determine the active step
              let targetStep = 1;
              
              if (backendCompletedSteps.includes(6)) {
                // Application submitted, stay on step 6 to view summary
                targetStep = 6;
              } else if (backendCompletedSteps.length > 0) {
                // User has made progress - restore their last saved position or go to next incomplete step
                const savedActiveStep = storage.get(userActiveStepKey, null);
                if (savedActiveStep && savedActiveStep >= 1 && savedActiveStep <= 6) {
                  // Restore user's last position
                  targetStep = savedActiveStep;
                } else {
                  // Go to next incomplete step
                  targetStep = Math.min(backendCompletedSteps.length + 1, 6);
                }
              } else {
                // New user with no data - start at step 1
                targetStep = 1;
              }
              
              console.log("App.tsx: Restoring state - step:", targetStep, "completed:", backendCompletedSteps, "view:", savedCurrentView);
              
              // IMPORTANT: Only set active step on initial load to prevent jumping while user is working
              // After initial load, step changes are controlled by user navigation only
              if (activeStep === 1 && !storage.get(userActiveStepKey, null)) {
                // This is truly the initial load - no saved step exists
                setActiveStep(targetStep);
                console.log("App.tsx: Initial load - setting active step to:", targetStep);
              } else {
                // User is already working or has a saved position - preserve their current step
                // Backend completion status updates won't cause navigation jumps
                console.log("App.tsx: Preserving user's current active step, not jumping");
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
    setUserName(null);

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
      const { apiService } = await import('./src/services/api');
      const result = await apiService.submitEnrollment(data);

      setEnrollmentData(data);
      setApplicationId(result.application_id); // Store the application ID from backend
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
              onStepChange={(step) => {
                console.log(`App.tsx: Step change requested from ${activeStep} to ${step}`);
                setActiveStep(step);
              }}
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
              userEmail={userEmail}
            />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
