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
  onSubmit: () => void;
  onBack?: () => void;
  onDataChange?: (data: AcademicHistoryData) => void; // Add this prop
}

const AcademicHistoryForm: React.FC<AcademicHistoryFormProps> = ({ onSubmit, onBack, onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<AcademicHistoryData>(() => { // Removed initialData from here
    // Load saved progress from localStorage
    const savedData = localStorage.getItem('academicHistoryFormData');
    return savedData ? JSON.parse(savedData) : { // It will now always start with localStorage or a clean slate
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
    };
  });

  // Load existing data from backend if application exists
  React.useEffect(() => {
    const loadExistingData = async () => {
      try {
        const applicationId = localStorage.getItem('applicationId');
        if (applicationId) {
          const backendData = await apiService.getAcademicHistory(applicationId);
          // Populate form with backend data
          if (backendData) {
            setFormData(prev => ({
              ...prev,
              schoolName: backendData.school_name || prev.schoolName,
              schoolType: backendData.school_type || prev.schoolType,
              lastGradeCompleted: backendData.last_grade_completed || prev.lastGradeCompleted,
              academicYearCompleted: backendData.academic_year_completed || prev.academicYearCompleted,
              reasonForLeaving: backendData.reason_for_leaving || prev.reasonForLeaving,
              principalName: backendData.principal_name || prev.principalName,
              schoolPhoneNumber: backendData.school_phone_number || prev.schoolPhoneNumber,
              schoolEmail: backendData.school_email || prev.schoolEmail,
              schoolAddress: backendData.school_address || prev.schoolAddress,
              reportCardUrl: backendData.report_card_url || prev.reportCardUrl, // *** THE KEY FIX ***
              additionalNotes: backendData.additional_notes || prev.additionalNotes,
            }));
          }
        }
      } catch (error) {
        // Silently handle error - form will use default values
      }
    };

    loadExistingData();
  }, []);

  const [expandedSections, setExpandedSections] = useState({
    schoolDetails: true,
    schoolContact: true,
    academicPerformance: true
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);

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

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Only require core fields - report card is now optional
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

    // Validate school name minimum length
    if (formData.schoolName && formData.schoolName.length < 2) {
      errors.schoolName = 'School name must be at least 2 characters';
    }

    // Validate academic year
    if (formData.academicYearCompleted) {
      const year = parseInt(formData.academicYearCompleted);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        errors.academicYearCompleted = `Year must be between 1900 and ${currentYear}`;
      }
    }

    // Validate email format (optional field)
    if (formData.schoolEmail && !/\S+@\S+\.\S+/.test(formData.schoolEmail)) {
      errors.schoolEmail = 'Please enter a valid email address';
    }

    // Validate phone number: exactly 10 digits only (optional field)
    if (formData.schoolPhoneNumber) {
      const cleanPhone = formData.schoolPhoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        errors.schoolPhoneNumber = 'Phone number must be exactly 10 digits';
      }
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsNextEnabled(isValid);
    return isValid;
  };

  const handleSaveProgress = () => {
    // Save form data to localStorage
    localStorage.setItem('academicHistoryFormData', JSON.stringify(formData));
    addToast('Academic history progress saved successfully!', 'success');
  };

  // Auto-save to localStorage whenever form data changes
  React.useEffect(() => {
    localStorage.setItem('academicHistoryFormData', JSON.stringify(formData));
  }, [formData]);

  // Call onDataChange whenever formData changes to pass data to parent
  React.useEffect(() => {
    onDataChange && onDataChange(formData);
  }, [formData, onDataChange]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }

    // Validate required fields
    if (!validateForm()) {
      console.log('Form validation failed:', validationErrors);
      return;
    }

    try {
      // Get application ID from localStorage
      const applicationId = localStorage.getItem('applicationId');

      if (!applicationId || applicationId.startsWith('temp_')) {
        addToast('Application ID not found. Please complete Step 1 first.', 'error');
        return;
      }

      // Upload report card only if a new file is selected
      let reportCardUrl = null;
      if (formData.reportCard && typeof formData.reportCard === 'object' && formData.reportCard instanceof File) {
        try {
          console.log('Uploading report card...');
          const uploadResult = await apiService.uploadFile(
            formData.reportCard,
            applicationId,
            'academic_history'
          );
          reportCardUrl = uploadResult.file.download_url;
          console.log('Report card uploaded:', reportCardUrl);
        } catch (uploadError) {
          console.warn('Report card upload failed (optional):', uploadError);
          // Continue without report card - it's optional
        }
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

      console.log('Submitting academic history:', payload);
      const result = await apiService.submitAcademicHistory(payload);
      console.log('Submit response:', result);

      addToast('Academic history saved successfully!', 'success');
      
      // Wait a moment to ensure UI updates
      setTimeout(() => {
        onSubmit();
      }, 500);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      addToast('Error: ' + errorMessage, 'error');
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
                      for (let i = 0; i < 5; i++) {
                        const year = currentYear - i;
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Last Report Card (Optional)</label>
                  <p className="text-xs text-gray-500 mb-2">Upload your most recent report card to help us assess your academic progress.</p>
                  <FileUpload onFileChange={handleFileChange} />
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
        isLoading={!isNextEnabled}
      />
    </div>
  );
};

export default AcademicHistoryForm;
