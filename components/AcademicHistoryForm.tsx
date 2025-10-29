import React, { useState, useMemo } from 'react';
import { AcademicHistoryData } from '../types';
import { SCHOOL_TYPES, GRADES, SUBJECTS } from '../constants';
import { Input, Select, Textarea } from './ui/FormControls';
import FileUpload from './ui/FileUpload';
import MultiSelect from './ui/MultiSelect';
import DatePicker from './ui/DatePicker';
import { Button } from './ui/Button';
import { SaveIcon, ArrowRightIcon, ChevronDownIcon, ChevronUpIcon, SchoolIcon, ContactIcon, PerformanceIcon } from './ui/Icons';
import Footer from './Footer';
import { useToast } from '../hooks/useToast';

interface AcademicHistoryFormProps {
  onSubmit: () => void;
  onBack?: () => void;
}

const AcademicHistoryForm: React.FC<AcademicHistoryFormProps> = ({ onSubmit, onBack }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<AcademicHistoryData>(() => {
    // Load saved progress from localStorage
    const savedData = localStorage.getItem('academicHistoryFormData');
    return savedData ? JSON.parse(savedData) : {
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
      subjectsPerformedWellIn: [],
      areasNeedingImprovement: [],
      additionalNotes: '',
    };
  });

  const [expandedSections, setExpandedSections] = useState({
    schoolDetails: true,
    schoolContact: false,
    academicPerformance: false
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const totalFields = 8; // schoolName, schoolType, lastGradeCompleted, academicYearCompleted, principalName, schoolPhoneNumber, schoolEmail, schoolAddress
    let filledFields = 0;

    if (formData.schoolName) filledFields++;
    if (formData.schoolType) filledFields++;
    if (formData.lastGradeCompleted) filledFields++;
    if (formData.academicYearCompleted) filledFields++;
    if (formData.principalName) filledFields++;
    if (formData.schoolPhoneNumber) filledFields++;
    if (formData.schoolEmail) filledFields++;
    if (formData.schoolAddress) filledFields++;

    return Math.round((filledFields / totalFields) * 100);
  }, [formData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!validateForm()) {
      return;
    }

    try {
      // Get application ID from localStorage or generate temp one
      let applicationId = localStorage.getItem('applicationId');
      if (!applicationId) {
        applicationId = 'temp_' + Date.now();
        localStorage.setItem('applicationId', applicationId);
      }

      // If there's a report card file, upload it first
      let reportCardUrl = null;
      if (formData.reportCard) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.reportCard);
        uploadFormData.append('application_id', applicationId);
        uploadFormData.append('document_type', 'report_card');

        const uploadResponse = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          reportCardUrl = uploadResult.file.download_url;
        } else {
          addToast('Error uploading report card. Please try again.', 'error');
          return;
        }
      }

      // Submit form data to backend
      const formDataToSubmit = {
        application_id: applicationId,
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,
        lastGradeCompleted: formData.lastGradeCompleted,
        academicYearCompleted: formData.academicYearCompleted,
        reasonForLeaving: formData.reasonForLeaving,
        principalName: formData.principalName,
        schoolPhoneNumber: formData.schoolPhoneNumber,
        schoolEmail: formData.schoolEmail,
        schoolAddress: formData.schoolAddress,
        subjectsPerformedWellIn: formData.subjectsPerformedWellIn,
        areasNeedingImprovement: formData.areasNeedingImprovement,
        additionalNotes: formData.additionalNotes,
        reportCardUrl: reportCardUrl
      };

      const response = await fetch('http://localhost:8000/academic-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        addToast('Academic history saved successfully!', 'success');
        // Clear saved progress after successful submission
        localStorage.removeItem('academicHistoryFormData');
        onSubmit(); // Call the onSubmit prop to update the stepper
      } else {
        const errorData = await response.json();
        addToast('Error saving academic history: ' + (errorData.detail || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      addToast('Error saving academic history. Please try again.', 'error');
    }
  };



  return (
    <div className="flex flex-col min-h-full">


      <div className="flex-grow space-y-8 pb-24">
        <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden">
        <button
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
        <div className={`transition-all duration-300 ease-in-out ${expandedSections.schoolDetails ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="School Name" name="schoolName" value={formData.schoolName} onChange={handleChange} placeholder="Enter school name" required />
              <Select label="School Type" name="schoolType" value={formData.schoolType} onChange={handleChange} options={SCHOOL_TYPES} placeholder="Select school type" required />
              <Select label="Last Grade Completed" name="lastGradeCompleted" value={formData.lastGradeCompleted} onChange={handleChange} options={GRADES} placeholder="Select grade" required />
              <DatePicker
                label="Academic Year Completed"
                name="academicYearCompleted"
                value={formData.academicYearCompleted}
                onChange={(value) => setFormData(prev => ({ ...prev, academicYearCompleted: value }))}
                placeholder="Select year completed"
                required
              />
            </div>
            <Textarea label="Reason for Leaving" name="reasonForLeaving" value={formData.reasonForLeaving} onChange={handleChange} placeholder="Optional - Please explain the reason for leaving the previous school" rows={4} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden">
        <button
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
        <div className={`transition-all duration-300 ease-in-out ${expandedSections.schoolContact ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Principal / Teacher Name" name="principalName" value={formData.principalName} onChange={handleChange} placeholder="Enter name" />
              <Input label="School Phone Number" name="schoolPhoneNumber" value={formData.schoolPhoneNumber} onChange={handleChange} placeholder="+27 (0)11 123 4567" />
            </div>
            <Input label="School Email Address" name="schoolEmail" type="email" value={formData.schoolEmail} onChange={handleChange} placeholder="school@example.com" />
            <Textarea label="School Address" name="schoolAddress" value={formData.schoolAddress} onChange={handleChange} placeholder="Enter complete school address" rows={4} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden">
        <button
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
        <div className={`transition-all duration-300 ease-in-out ${expandedSections.academicPerformance ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-6 pb-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Last Report Card</label>
                <FileUpload onFileChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelect
                    label="Subjects Performed Well In"
                    name="subjectsPerformedWellIn"
                    options={SUBJECTS}
                    value={formData.subjectsPerformedWellIn}
                    onChange={(values) => handleMultiSelectChange('subjectsPerformedWellIn', values)}
                />
                <MultiSelect
                    label="Areas Needing Improvement"
                    name="areasNeedingImprovement"
                    options={SUBJECTS}
                    value={formData.areasNeedingImprovement}
                    onChange={(values) => handleMultiSelectChange('areasNeedingImprovement', values)}
                />
            </div>
            <Textarea label="Additional Notes / Comments" name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} placeholder="Any additional information about the student's academic history or special considerations" rows={4} />
          </div>
        </div>
      </div>
      </div>

      {/* Enhanced Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-red-800 mb-1">
                  Required Information Missing
                </h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {Object.keys(validationErrors).length} field{Object.keys(validationErrors).length !== 1 ? 's' : ''} required
                </span>
              </div>
              <p className="text-red-700 mb-4 text-sm">
                Please complete all required fields below before proceeding to the next step.
              </p>

              <div className="space-y-4">
                <div className="bg-white/50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <h5 className="font-semibold text-red-800 text-sm">Academic History</h5>
                  </div>
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

              <div className="mt-6 pt-4 border-t border-red-200">
                <p className="text-xs text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Complete all required fields to continue with your enrollment
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      <Footer
        onBack={onBack}
        onSave={handleSaveProgress}
        onNext={handleSubmit}
        showBack={true}
        showSave={true}
        showNext={true}
        nextLabel="Next: Subjects Selection"
        isLoading={!isNextEnabled}
      />
    </div>
  );
};

export default AcademicHistoryForm;
