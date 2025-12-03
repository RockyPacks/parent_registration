import React, { useCallback } from 'react';
import AcademicHistoryForm from '../AcademicHistoryForm';

interface Step3AcademicHistoryFormProps {
  applicationId?: string | null;
  onStepComplete?: (stepNumber: number) => void;
  isEditing?: boolean;
  returnStep?: number | null;
  setIsEditing?: (value: boolean) => void;
  setReturnStep?: (value: number | null) => void;
  onAcademicHistoryComplete?: () => void;
  onStepChange?: (step: number) => void;
  onDataChange?: (data: any) => void;
  initialData?: any;
}

const Step3AcademicHistoryForm: React.FC<Step3AcademicHistoryFormProps> = ({
  applicationId,
  onStepComplete,
  onAcademicHistoryComplete,
  onStepChange,
  onDataChange,
  initialData
}) => {
  // Handle form submission
  const handleSubmit = useCallback(() => {
    console.log('Step3: handleSubmit called - completing step 3 and navigating to step 4');
    if (onStepComplete) {
      console.log('Step3: Calling onStepComplete(3)');
      onStepComplete(3);
    }
    if (onAcademicHistoryComplete) {
      console.log('Step3: Calling onAcademicHistoryComplete');
      onAcademicHistoryComplete();
    }
    // Note: onAcademicHistoryComplete already calls onStepChange(4), so we don't call it again
    console.log('Step3: Submission handlers complete');
  }, [onStepComplete, onAcademicHistoryComplete]);

  return (
    <>
      <AcademicHistoryForm
        applicationId={applicationId}
        onSubmit={handleSubmit}
        onDataChange={onDataChange}
        initialData={initialData}
      />
    </>
  );
};

export default Step3AcademicHistoryForm;

