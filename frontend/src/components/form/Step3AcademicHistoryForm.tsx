import React, { useState, useCallback } from 'react';
import AcademicHistoryForm from '../AcademicHistoryForm';
import Footer from '../Footer';
import { apiService } from '../../services/api'; // Import the apiService
import { toast } from 'react-toastify'; // Optional: for user feedback

interface Step3AcademicHistoryFormProps {
  applicationId?: string | null;
  onStepComplete?: (stepNumber: number) => void;
  isEditing?: boolean;
  returnStep?: number | null;
  setIsEditing?: (value: boolean) => void;
  setReturnStep?: (value: number | null) => void;
  onAcademicHistoryComplete?: () => void;
  onStepChange?: (step: number) => void;
}

const Step3AcademicHistoryForm: React.FC<Step3AcademicHistoryFormProps> = ({
  applicationId,
  onStepComplete,
  isEditing,
  returnStep,
  setIsEditing,
  setReturnStep,
  onAcademicHistoryComplete,
  onStepChange
}) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use useCallback to prevent re-creation of this function on every render
  const handleDataChange = useCallback((data: any) => {
    setFormData(prevData => ({ ...prevData, ...data }));
  }, []);

  const handleSubmit = async () => {
    if (!applicationId) {
      toast.error("Application ID is missing. Cannot submit.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine form data with the application ID and call the API
      await apiService.submitAcademicHistory({ ...formData, applicationId });
      toast.success("Academic history saved successfully!");

      // Mark step as complete and navigate
      if (onStepComplete) onStepComplete(3);
      if (onAcademicHistoryComplete) onAcademicHistoryComplete();

      // Handle navigation for editing mode
      if (isEditing && returnStep) {
        if (onStepChange) onStepChange(returnStep);
        if (setIsEditing) setIsEditing(false);
        if (setReturnStep) setReturnStep(null);
      }
    } catch (error) {
      console.error("Failed to submit academic history:", error);
      toast.error("Failed to save academic history. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
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
            onSubmit={handleSubmit}
            onBack={() => onStepChange && onStepChange(2)}
            onDataChange={handleDataChange} // Use the local data handler
          />
          <Footer onBack={() => onStepChange && onStepChange(2)} onNext={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </div>

    </div>
  );
};

Step3AcademicHistoryForm.displayName = 'Step3AcademicHistoryForm';

export default Step3AcademicHistoryForm;
