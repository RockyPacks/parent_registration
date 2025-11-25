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
}

const Step3AcademicHistoryForm: React.FC<Step3AcademicHistoryFormProps> = ({
  applicationId,
  onStepComplete,
  onAcademicHistoryComplete,
  onStepChange
}) => {
  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (onStepComplete) onStepComplete(3);
    if (onAcademicHistoryComplete) onAcademicHistoryComplete();
    if (onStepChange) onStepChange(4);
  }, [onStepComplete, onAcademicHistoryComplete, onStepChange]);

  return (
    <>
      <AcademicHistoryForm
        applicationId={applicationId}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default Step3AcademicHistoryForm;

