import React, { useState, useMemo } from 'react';
import { AcademicHistoryData } from '../types';
import { SCHOOL_TYPES, GRADES, SUBJECTS } from '../constants';
import { Input, Select, Textarea } from './ui/FormControls';
import FileUpload from './ui/FileUpload';
import MultiSelect from './ui/MultiSelect';
import { Button } from './ui/Button';
import { SaveIcon, ArrowRightIcon, ChevronDownIcon, ChevronUpIcon, AcademicCapIcon as SchoolIcon, BriefcaseIcon as ContactIcon, ChartBarIcon as PerformanceIcon } from './Icons';
import Footer from './Footer';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';

interface AcademicHistoryFormProps {
  applicationId?: string | null;
  onSubmit: () => void;
  onBack?: () => void;
  onDataChange?: (data: AcademicHistoryData) => void;
}

const AcademicHistoryForm: React.FC<AcademicHistoryFormProps> = ({ applicationId, onSubmit, onBack, onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<AcademicHistoryData>({
    schoolName: '',
    schoolType: '',
    lastGradeCompleted: '',
    academicYearCompleted: '',
    reasonForLeaving: '',
    principalName: '',
    schoolPhoneNumber: '',
    schoolEmail: '',
    schoolAddress: '',
    reportCard: null,
    additionalNotes: ''
  });
  const [dataLoadedFromBackend, setDataLoadedFromBackend] = useState(false);

  // Load existing data from backend if application exists (when user returns to this step)
  React.useEffect(() => {
    const loadExistingData = async () => {
      if (!applicationId || dataLoadedFromBackend) return;
      
      try {
        console.log('Loading academic history data for application:', applicationId);
        const backendData = await apiService.getAcademicHistory(applicationId);
        
        if (backendData && backendData.length > 0) {
          const data = backendData[0]; // Get first record
          console.log('Loaded academic history data:', data);
          
          setFormData({
            schoolName: data.school_name || '',
            schoolType: data.school_type || '',
            lastGradeCompleted: data.last_grade_completed || '',
            academicYearCompleted: data.academic_year_completed || '',
            reasonForLeaving: data.reason_for_leaving || '',
            principalName: data.principal_name || '',
            schoolPhoneNumber: data.school_phone_number || '',
            schoolEmail: data.school_email || '',
            schoolAddress: data.school_address || '',
            reportCard: null, // File object can't be restored, but URL is kept
            reportCardUrl: data.report_card_url || '',
            additionalNotes: data.additional_notes || ''
          });
          
          setDataLoadedFromBackend(true);
          console.log('Previous academic history data loaded successfully');
        }
      } catch (error) {
        console.log('No existing academic history found, starting fresh');
        // No data found - user can fill fresh form
      }
    };

    if (applicationId) {
      loadExistingData();
    }
  }, [applicationId, dataLoadedFromBackend]);

  const [expandedSections, setExpandedSections] = useState({
    schoolDetails: true,
    schoolContact: true,
    academicPerformance: true
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-validate form when formData changes
  React.useEffect(() => {
    validateForm();
  }, [formData]);

  // Progress percentage calculation removed - progress bar hidden on Step 3

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name: keyof AcademicHistoryData, values: string[]) => {
      setFormData(prev => ({ ...prev, [name]: values }));
  };

  const handleFileChange = (file: File | null) => {
      setFormData(prev => ({ ...prev, reportCard: file }));
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Required fields including report card
    const requiredFields = [
      { key: 'schoolName', label: 'School Name' },
      { key: 'schoolType', label: 'School Type' },
      { key: 'lastGradeCompleted', label: 'Last Grade Completed' },
      { key: 'academicYearCompleted', label: 'Academic Year Completed' }
    ];

    requiredFields.forEach(({ key, label }) => {
      if (!formData[key as keyof AcademicHistoryData]) {
        errors[key] = `${label} is required`;
      }
    });

    // Report card is required (either new file or already uploaded URL)
    if (!formData.reportCard && !formData.reportCardUrl) {
      errors.reportCard = 'Report card upload is required';
    }

    // Validate school name minimum length
    if (formData.schoolName && formData.schoolName.length < 2) {
      errors.schoolName = 'School name must be at least 2 characters';
    }

    // Validate academic year
    if (formData.academicYearCompleted) {
      const year = parseInt(formData.academicYearCompleted);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1; // Allow next year (e.g., 2026 for enrollments)
      if (year < 1900 || year > nextYear) {
        errors.academicYearCompleted = `Year must be between 1900 and ${nextYear}`;
      }
    }

    // Validate email format (optional field)
    if (formData.schoolEmail && !/\S+@\S+\.\S+/.test(formData.schoolEmail)) {
      errors.schoolEmail = 'Please enter a valid email address';
    }

    // Relaxed phone validation: at least 7 digits (optional field)
    if (formData.schoolPhoneNumber) {
      const cleanPhone = formData.schoolPhoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 7) {
        errors.schoolPhoneNumber = 'Phone number must contain at least 7 digits';
      }
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsNextEnabled(isValid);
    
    console.log('Form validation result:', { isValid, errors, formData });
    return isValid;
  };

  const handleSaveProgress = () => {
    // Validate before allowing save
    if (!validateForm()) {
      addToast('Please fix validation errors before continuing', 'warning');
    }
  };

  // Call onDataChange whenever formData changes to pass data to parent
  React.useEffect(() => {
    onDataChange && onDataChange(formData);
  }, [formData, onDataChange]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    console.log('handleSubmit called with event:', e);
    
    if (e) {
      e.preventDefault?.();
    }

    console.log('Current form data:', formData);
    console.log('Current isNextEnabled:', isNextEnabled);
    console.log('Current validationErrors:', validationErrors);

    // Validate required fields
    const isValid = validateForm();
    console.log('validateForm returned:', isValid);
    
    if (!isValid) {
      console.log('Form validation failed, showing errors:', validationErrors);
      addToast('Please fill in all required fields before continuing', 'error');
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    console.log('Validation passed, proceeding with submission');
    setIsSubmitting(true);

    try {
      // Use applicationId passed from props (from Supabase - source of truth)
      console.log('Application ID (from props):', applicationId);

      if (!applicationId || applicationId.startsWith('temp_')) {
        addToast('Application ID not found. Please complete Step 1 first.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Upload report card if new file provided, or use existing URL
      let reportCardUrl = formData.reportCardUrl || null;
      
      if (formData.reportCard && typeof formData.reportCard === 'object' && formData.reportCard instanceof File) {
        try {
          console.log('Uploading new report card...');
          addToast('Uploading report card...', 'info');
          const uploadResult = await apiService.uploadFile(
            formData.reportCard,
            applicationId,
            'academic_history'
          );
          reportCardUrl = uploadResult.file.download_url;
          console.log('Report card uploaded:', reportCardUrl);
        } catch (uploadError: any) {
          console.error('Report card upload failed:', uploadError);
          const errorMsg = uploadError.message || 'Failed to upload report card';
          addToast(`Upload error: ${errorMsg}`, 'error');
          setIsSubmitting(false);
          return;
        }
      } else if (!reportCardUrl) {
        addToast('Report card is required', 'error');
        setIsSubmitting(false);
        return;
      }

      // Build payload - simple and clean
      const payload = {
        application_id: applicationId,
        school_name: formData.schoolName.trim(),
        school_type: formData.schoolType.trim(),
        last_grade_completed: formData.lastGradeCompleted.trim(),
        academic_year_completed: formData.academicYearCompleted.trim(),
        reason_for_leaving: formData.reasonForLeaving?.trim() || null,
        principal_name: formData.principalName?.trim() || null,
        school_phone_number: formData.schoolPhoneNumber?.trim() || null,
        school_email: formData.schoolEmail?.trim() || null,
        school_address: formData.schoolAddress?.trim() || null,
        additional_notes: formData.additionalNotes?.trim() || null,
        report_card_url: reportCardUrl || null
      };

      console.log('Submitting academic history with payload:', payload);
      const result = await apiService.submitAcademicHistory(payload);
      console.log('Submit response:', result);

      addToast('Academic history saved successfully!', 'success');
      
      // Wait a moment to ensure UI updates
      setTimeout(() => {
        setIsSubmitting(false);
        console.log('Calling onSubmit callback');
        onSubmit();
      }, 500);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      addToast('Error: ' + errorMessage, 'error');
      setIsSubmitting(false);
    }
  };



  return (
    <div className="w-full flex flex-col min-h-screen">
      <form onSubmit={handleSubmit} className="flex-1 w-full max-w-6xl mx-auto px-4 pt-20 pb-40">
        {/* Form Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Academic History</h2>
          <p className="text-gray-600">Provide details about your previous school and academic performance</p>
        </div>

        {/* Progress Bar - Hidden on Step 3 */}

        {/* Cards Container - Fixed spacing */}
        <div className="space-y-6">
          {/* Card 1: School Details */}
          <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <button
              type="button"
              onClick={() => toggleSection('schoolDetails')}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <SchoolIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Previous School Details</h3>
              </div>
              {expandedSections.schoolDetails ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.schoolDetails && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="School Name" name="schoolName" value={formData.schoolName} onChange={handleChange} placeholder="Enter school name" required />
                  <Select label="School Type" name="schoolType" value={formData.schoolType} onChange={handleChange} options={SCHOOL_TYPES} placeholder="Select school type" required />
                  <Select label="Last Grade Completed" name="lastGradeCompleted" value={formData.lastGradeCompleted} onChange={handleChange} options={GRADES} placeholder="Select grade" required />
                  <Select
                    label="Academic Year Completed"
                    name="academicYearCompleted"
                    value={formData.academicYearCompleted}
                    onChange={handleChange}
                    options={(() => {
                      const currentYear = new Date().getFullYear();
                      const years = [];
                      // Include next year (2026) and go back 5 years from current
                      for (let i = 1; i >= -5; i--) {
                        const year = currentYear + i;
                        years.push({ value: year.toString(), label: year.toString() });
                      }
                      return years;
                    })()}
                    placeholder="Select year"
                    required
                  />
                </div>
                <Textarea label="Reason for Leaving" name="reasonForLeaving" value={formData.reasonForLeaving} onChange={handleChange} placeholder="Optional - Please explain the reason for leaving the previous school" rows={4} />
              </div>
            )}
          </div>

          {/* Card 2: School Contact Information */}
          <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <button
              type="button"
              onClick={() => toggleSection('schoolContact')}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <ContactIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">School Contact Information</h3>
              </div>
              {expandedSections.schoolContact ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.schoolContact && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Principal / Teacher Name" name="principalName" value={formData.principalName} onChange={handleChange} placeholder="Enter name" />
                  <Input label="School Phone Number" name="schoolPhoneNumber" value={formData.schoolPhoneNumber} onChange={handleChange} placeholder="+27 11 123 4567 or 011 123 4567" />
                </div>
                <Input label="School Email Address" name="schoolEmail" type="email" value={formData.schoolEmail} onChange={handleChange} placeholder="school@example.com" />
                <Textarea label="School Address" name="schoolAddress" value={formData.schoolAddress} onChange={handleChange} placeholder="Enter complete school address" rows={4} />
              </div>
            )}
          </div>

          {/* Card 3: Academic Performance */}
          <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <button
              type="button"
              onClick={() => toggleSection('academicPerformance')}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <PerformanceIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Academic Performance & Comments</h3>
              </div>
              {expandedSections.academicPerformance ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.academicPerformance && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Last Report Card <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Upload your most recent report card (required).</p>
                  {formData.reportCardUrl && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Report card already uploaded. Upload a new file to replace it.
                    </div>
                  )}
                  <FileUpload onFileChange={handleFileChange} />
                  {validationErrors.reportCard && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.reportCard}</p>
                  )}
                </div>

                <Textarea label="Additional Notes / Comments" name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} placeholder="Any additional information about your academic history" rows={3} />
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-bold text-red-800 mb-2">
                  Required Information Missing
                </h4>
                <ul className="space-y-2">
                  {Object.entries(validationErrors).map(([key, message]) => (
                    <li key={key} className="flex items-start text-sm">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span className="text-red-700">{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </form>

      {/* Footer Navigation */}
      <Footer
        onBack={onBack}
        onNext={handleSubmit as any}
        showBack={true}
        showNext={true}
        nextLabel="Continue to Next Step"
        showSave={false}
        showSkip={false}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AcademicHistoryForm;
