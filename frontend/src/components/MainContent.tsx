import React, { useState, useCallback } from "react";
import AcademicHistoryForm from "../AcademicHistoryForm";
import Footer from "../Footer";
import { apiService } from "../../services/api";
import { toast } from "react-toastify";

const Step3AcademicHistoryForm = ({
  applicationId,
  onStepComplete,
  isEditing,
  returnStep,
  setIsEditing,
  setReturnStep,
  onAcademicHistoryComplete,
  onStepChange
}) => {

  // ✅ Correct initial structure
  const initialAcademicHistory = {
    highSchoolName: "",
    grade: "",
    startYear: "",
    endYear: "",
    subjects: [],
    schoolAddress: "",
    qualification: ""
  };

  // ❗ ONLY ONE useState
  const [formData, setFormData] = useState(initialAcademicHistory);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes
  const handleDataChange = useCallback((data) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const handleSubmit = async () => {
    if (!applicationId) {
      toast.error("Missing Application ID");
      return;
    }

    try {
      setIsSubmitting(true);

      // 👉 Detect if editing or creating
      if (isEditing) {
        await apiService.academicHistory.update(applicationId, formData);
      } else {
        await apiService.academicHistory.create({
          ...formData,
          applicationId
        });
      }

      toast.success("Academic history saved");
      onStepComplete && onStepComplete(3);

      if (onAcademicHistoryComplete) onAcademicHistoryComplete();
      if (onStepChange) onStepChange(4);

    } catch (err) {
      toast.error("Failed to save academic history");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AcademicHistoryForm 
        data={formData}
        onDataChange={handleDataChange}
      />

      <Footer 
        onNext={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default Step3AcademicHistoryForm;
