import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { EnrollmentData } from './src/services/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [enrollmentData, setEnrollmentData] = useState<Partial<EnrollmentData>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());


  const steps = [
    { number: 1, title: 'Student & Guardian Info', subtitle: 'Personal details' },
    { number: 2, title: 'Document Upload', subtitle: 'Required documents' },
    { number: 3, title: 'Academic History', subtitle: 'Previous schools' },
    { number: 4, title: 'Subjects Selection', subtitle: 'Choose subjects' },
    { number: 5, title: 'Fee Agreement', subtitle: 'Payment terms' },
    { number: 6, title: 'Declaration', subtitle: 'Terms & conditions' },
    { number: 7, title: 'Review & Submit', subtitle: 'Final review' },
  ];

  useEffect(() => {
    // Check if user is already authenticated on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setActiveStep(1);
    setEnrollmentData({});
    setApplicationId(null);
    setCompletedSteps(new Set());
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow navigation to completed steps or the next step
    if (stepNumber <= activeStep || completedSteps.has(stepNumber - 1)) {
      setActiveStep(stepNumber);
    }
  };

  const handleEnrollmentSubmit = async (data: EnrollmentData) => {
    try {
      // Submit enrollment data to backend
      const response = await fetch('http://localhost:8000/enrollment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit enrollment');
      }

      const result = await response.json();
      console.log('Enrollment submitted successfully:', result);

      setEnrollmentData(data);
      setApplicationId(result.data.application_id); // Store the application ID
      setCompletedSteps(prev => new Set([...prev, 1])); // Mark step 1 as completed
      setActiveStep(2); // Advance to document upload
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      alert('Failed to submit enrollment. Please try again.');
    }
  };

  const handleDocumentUploadComplete = () => {
    setCompletedSteps(prev => new Set([...prev, 2])); // Mark step 2 as completed
    setActiveStep(3); // Advance to academic history after document upload
  };

  if (!isAuthenticated) {
    if (showSignup) {
      return <SignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => setShowSignup(false)} />;
    } else {
      return <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />;
    }
  }

  return (
    <>
      <Header onLogout={handleLogout} />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <main className="flex flex-col md:flex-row">
            <Sidebar steps={steps} activeStep={activeStep} onStepClick={handleStepClick} completedSteps={completedSteps} />
            <div className="flex-1 flex flex-col md:ml-[25%] bg-white border border-gray-200 shadow-sm md:rounded-lg">
        <MainContent
          activeStep={activeStep}
          applicationId={applicationId}
          onEnrollmentSubmit={handleEnrollmentSubmit}
          onDocumentUploadComplete={handleDocumentUploadComplete}
          onStepChange={setActiveStep}
        />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
