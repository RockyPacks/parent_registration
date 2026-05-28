
import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { MedicalIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';

interface MedicalInformationProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
}



const HOME_LANGUAGE_OPTIONS = [
  'Afrikaans',
  'English',
  'isiNdebele',
  'isiXhosa',
  'isiZulu',
  'Sepedi',
  'Sesotho',
  'Setswana',
  'siSwati',
  'Tshivenda',
  'Xitsonga',
];

const ALLERGY_STATUS_OPTIONS = [
  'Active',
  'Managed',
  'Resolved',
  'No Allergies',
];

const IMMUNISATION_OPTIONS = [
  'Yes',
  'No',
  'Partially',
  'Unknown',
];

const LEARNER_CONDITIONS = [
  'Emotional Issues',
  'Medical Conditions',
  'Psychological Problems',
  'Social Issues',
  'Previous Therapies or Recommendations',
  'Other',
];

const MedicalInformation: React.FC<MedicalInformationProps> = ({ initialData, onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    homeLanguage: '',
    allergies: '',
    allergyActionRequired: '',
    allergyStatus: '',
    immunisationsUpToDate: '',
    medicalAidScheme: '',
    medicalAidNumber: '',
    primaryMemberDetails: '',
    learnerConditions: [] as string[],
    medicineNotToAdminister: '',
    // Keep legacy fields for backward compatibility
    medicalAidName: '',
    memberNumber: '',
    conditions: [] as string[],
    ...initialData,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Update form data when initialData changes (e.g., after data is loaded from localStorage/backend)
  // Only run once when component first receives meaningful data to prevent infinite loops
  useEffect(() => {
    if (!isInitialized && initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  useEffect(() => {
    // Only propagate changes if we have data or if fully initialized from props
    const hasData = formData.homeLanguage || formData.allergies ||
      formData.allergyStatus || formData.immunisationsUpToDate ||
      formData.medicalAidScheme || formData.medicalAidNumber ||
      formData.medicalAidName || formData.memberNumber ||
      (formData.learnerConditions && formData.learnerConditions.length > 0) ||
      (formData.conditions && formData.conditions.length > 0);

    if (onDataChange && (hasData || isInitialized)) {
      // Send to parent component which will handle localStorage via MainContent
      onDataChange(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isInitialized]);

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'homeLanguage':
        if (!value) {
          error = 'Home Language is required';
        }
        break;
      case 'allergies':
        if (!value || value.trim() === '') {
          error = 'Allergy information is required. If none, type "None"';
        }
        break;
      case 'allergyStatus':
        if (!value) {
          error = 'Allergy Status is required';
        }
        break;
      case 'immunisationsUpToDate':
        if (!value) {
          error = 'Immunisation status is required';
        }
        break;
      case 'medicalAidScheme':
        if (value && value.length < 2) {
          error = 'Medical aid scheme must be at least 2 characters';
        }
        break;
      case 'medicalAidNumber':
        if (value && !/^[A-Za-z0-9\-]+$/.test(value)) {
          error = 'Medical aid number can only contain letters, numbers, and hyphens';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return error === '';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      learnerConditions: checked
        ? [...prev.learnerConditions, condition]
        : prev.learnerConditions.filter((c: string) => c !== condition)
    }));
  };

  // Auto-save functionality removed - handled by parent component
  return (
    <FormSection icon={<MedicalIcon className="w-6 h-6 text-red-500" />} title="Medical & Learner Health Details">
      {/* Religion & Language Section */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 mb-8 border border-rose-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Learner Profile</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            id="medicalHomeLanguage"
            label="Home Language"
            required
            value={formData.homeLanguage}
            onChange={(e) => handleInputChange('homeLanguage', e.target.value)}
            error={errors.homeLanguage}
          >
            <option value="">Select Language</option>
            {HOME_LANGUAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </SelectField>
        </div>
      </div>

      {/* Allergy Information Section */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 mb-8 border border-amber-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Allergy Information</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
              Allergies <span className="text-red-500">*</span>
            </label>
            <textarea
              id="allergies"
              name="allergies"
              rows={3}
              placeholder="Please enter allergy information. If none, type None."
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 ${
                errors.allergies ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            />
            {errors.allergies && (
              <div className="mt-2 flex items-center gap-1">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{errors.allergies}</p>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="allergyActionRequired" className="block text-sm font-medium text-gray-700 mb-2">
              Allergy Action Required
            </label>
            <textarea
              id="allergyActionRequired"
              name="allergyActionRequired"
              rows={3}
              placeholder="Describe any actions to be taken in case of an allergic reaction..."
              value={formData.allergyActionRequired}
              onChange={(e) => handleInputChange('allergyActionRequired', e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 hover:border-gray-400"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              id="allergyStatus"
              label="Allergy Status"
              required
              value={formData.allergyStatus}
              onChange={(e) => handleInputChange('allergyStatus', e.target.value)}
              error={errors.allergyStatus}
            >
              <option value="">Select Status</option>
              {ALLERGY_STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectField>
            <SelectField
              id="immunisationsUpToDate"
              label="Compulsory Immunisations Up to Date"
              required
              value={formData.immunisationsUpToDate}
              onChange={(e) => handleInputChange('immunisationsUpToDate', e.target.value)}
              error={errors.immunisationsUpToDate}
            >
              <option value="">Select Status</option>
              {IMMUNISATION_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      {/* Medical Aid Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Medical Aid Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="medicalAidScheme"
            label="Medical Aid Scheme"
            value={formData.medicalAidScheme || formData.medicalAidName}
            onChange={(e) => handleInputChange('medicalAidScheme', e.target.value)}
            error={errors.medicalAidScheme}
            placeholder="e.g., Discovery Health, Bonitas"
          />
          <InputField
            id="medicalAidNumber"
            label="Medical Aid Number"
            value={formData.medicalAidNumber || formData.memberNumber}
            onChange={(e) => handleInputChange('medicalAidNumber', e.target.value)}
            error={errors.medicalAidNumber}
            placeholder="e.g., 123456789"
          />
          <div className="md:col-span-2">
            <InputField
              id="primaryMemberDetails"
              label="Primary Member Details"
              value={formData.primaryMemberDetails}
              onChange={(e) => handleInputChange('primaryMemberDetails', e.target.value)}
              placeholder="Full name and relationship of the primary medical aid member"
            />
          </div>
        </div>
      </div>

      {/* Learner Conditions Disclosure Section */}
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 mb-8 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Learner Conditions Disclosure</h3>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Does the learner have any of the following conditions? (Select all that apply)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LEARNER_CONDITIONS.map(condition => (
              <div key={condition} className="flex items-center">
                <input
                  id={`condition-${condition.replace(/\s+/g, '-').toLowerCase()}`}
                  name="learnerConditions"
                  type="checkbox"
                  checked={formData.learnerConditions.includes(condition)}
                  onChange={(e) => handleConditionChange(condition, e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor={`condition-${condition.replace(/\s+/g, '-').toLowerCase()}`}
                  className="ml-2 block text-sm text-gray-900 cursor-pointer"
                >
                  {condition}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medicine Restrictions Section */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Medicine Restrictions</h3>
        </div>
        <div>
          <label htmlFor="medicineNotToAdminister" className="block text-sm font-medium text-gray-700 mb-2">
            Medicine Not To Be Administered At School
          </label>
          <textarea
            id="medicineNotToAdminister"
            name="medicineNotToAdminister"
            rows={3}
            placeholder="List any medicines that should NOT be given to the learner at school..."
            value={formData.medicineNotToAdminister}
            onChange={(e) => handleInputChange('medicineNotToAdminister', e.target.value)}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200 hover:border-gray-400"
          />
        </div>
      </div>
    </FormSection>
  );
};

export default MedicalInformation;
