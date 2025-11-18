
import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import { FamilyIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';

interface FamilyInformationProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
}

const FamilyInformation: React.FC<FamilyInformationProps> = ({ initialData, onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    fatherSurname: '',
    fatherFirstName: '',
    fatherIdNumber: '',
    fatherMobile: '',
    fatherEmail: '',
    motherSurname: '',
    motherFirstName: '',
    motherIdNumber: '',
    motherMobile: '',
    motherEmail: '',
    nextOfKinSurname: '',
    nextOfKinFirstName: '',
    nextOfKinRelationship: '',
    nextOfKinMobile: '',
    nextOfKinEmail: '',
    ...initialData
  });

  const [errors, setErrors] = useState({
    fatherSurname: '',
    fatherFirstName: '',
    fatherIdNumber: '',
    fatherMobile: '',
    fatherEmail: '',
    motherSurname: '',
    motherFirstName: '',
    motherIdNumber: '',
    motherMobile: '',
    motherEmail: '',
    nextOfKinSurname: '',
    nextOfKinFirstName: '',
    nextOfKinRelationship: '',
    nextOfKinMobile: '',
    nextOfKinEmail: ''
  });



  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
    // Save to localStorage whenever form data changes
    localStorage.setItem('familyInformation', JSON.stringify(formData));
  }, [formData, onDataChange]);

  // Check if at least one parent is fully filled
  useEffect(() => {
    const isFatherComplete = formData.fatherSurname && formData.fatherFirstName && formData.fatherIdNumber && formData.fatherMobile && formData.fatherEmail;
    const isMotherComplete = formData.motherSurname && formData.motherFirstName && formData.motherIdNumber && formData.motherMobile && formData.motherEmail;

    if (!isFatherComplete && !isMotherComplete) {
      addToast('Please provide complete information for at least one parent (Father or Mother)', 'warning');
    }
  }, [formData, addToast]);

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'fatherSurname':
      case 'motherSurname':
      case 'nextOfKinSurname':
        if (!value.trim()) {
          error = 'Surname is required';
        } else if (value.length < 2) {
          error = 'Surname must be at least 2 characters';
        } else if (!/^[a-zA-Z\s\-']+$/.test(value)) {
          error = 'Surname can only contain letters, spaces, hyphens, and apostrophes';
        }
        break;
      case 'fatherFirstName':
      case 'motherFirstName':
      case 'nextOfKinFirstName':
        if (!value.trim()) {
          error = 'First name is required';
        } else if (value.length < 2) {
          error = 'First name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s\-']+$/.test(value)) {
          error = 'First name can only contain letters, spaces, hyphens, and apostrophes';
        }
        break;
      case 'fatherIdNumber':
      case 'motherIdNumber':
        if (!value.trim()) {
          error = 'ID number is required';
        } else if (!/^\d{13}$/.test(value)) {
          error = 'ID number must be exactly 13 digits';
        }
        break;
      case 'fatherMobile':
      case 'motherMobile':
      case 'nextOfKinMobile':
        if (!value.trim()) {
          error = 'Mobile number is required';
        } else if (!/^(\+27|0)[6-8][0-9]{8}$/.test(value)) {
          error = 'Please enter a valid South African mobile number';
        }
        break;
      case 'fatherEmail':
      case 'motherEmail':
      case 'nextOfKinEmail':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'nextOfKinRelationship':
        if (!value.trim()) {
          error = 'Relationship is required';
        } else if (value.length < 2) {
          error = 'Relationship must be at least 2 characters';
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

  // Auto-save functionality removed - handled by parent component
  return (
    <FormSection icon={<FamilyIcon className="w-6 h-6 text-green-500" />} title="Family Information">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">Single Parent Households Supported</h4>
            <p className="text-sm text-blue-700">
              You only need to provide complete information for one parent (Father or Mother). The Next of Kin section is for emergency contact purposes.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        {/* Father/Guardian Card */}
        <div className="relative bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 rounded-2xl p-8 border border-blue-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-gray-800">Father/Guardian</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="fatherSurname"
                  label="Surname"
                  required
                  value={formData.fatherSurname}
                  onChange={(e) => handleInputChange('fatherSurname', e.target.value)}
                  error={errors.fatherSurname}
                />
                <InputField
                  id="fatherFirstName"
                  label="First Name"
                  required
                  value={formData.fatherFirstName}
                  onChange={(e) => handleInputChange('fatherFirstName', e.target.value)}
                  error={errors.fatherFirstName}
                />
              </div>
              <InputField
                id="fatherIdNumber"
                label="ID Number"
                required
                value={formData.fatherIdNumber}
                onChange={(e) => handleInputChange('fatherIdNumber', e.target.value)}
                error={errors.fatherIdNumber}
                placeholder="13-digit South African ID number"
              />
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="fatherMobile"
                  label="Mobile Number"
                  required
                  value={formData.fatherMobile}
                  onChange={(e) => handleInputChange('fatherMobile', e.target.value)}
                  error={errors.fatherMobile}
                  placeholder="+27 or 0XXXXXXXXX"
                />
                <InputField
                  id="fatherEmail"
                  label="Email Address"
                  required
                  value={formData.fatherEmail}
                  onChange={(e) => handleInputChange('fatherEmail', e.target.value)}
                  error={errors.fatherEmail}
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mother/Guardian Card */}
        <div className="relative bg-gradient-to-br from-purple-50 via-purple-25 to-pink-50 rounded-2xl p-8 border border-purple-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-gray-800">Mother/Guardian</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="motherSurname"
                  label="Surname"
                  required
                  value={formData.motherSurname}
                  onChange={(e) => handleInputChange('motherSurname', e.target.value)}
                  error={errors.motherSurname}
                />
                <InputField
                  id="motherFirstName"
                  label="First Name"
                  required
                  value={formData.motherFirstName}
                  onChange={(e) => handleInputChange('motherFirstName', e.target.value)}
                  error={errors.motherFirstName}
                />
              </div>
              <InputField
                id="motherIdNumber"
                label="ID Number"
                required
                value={formData.motherIdNumber}
                onChange={(e) => handleInputChange('motherIdNumber', e.target.value)}
                error={errors.motherIdNumber}
                placeholder="13-digit South African ID number"
              />
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="motherMobile"
                  label="Mobile Number"
                  required
                  value={formData.motherMobile}
                  onChange={(e) => handleInputChange('motherMobile', e.target.value)}
                  error={errors.motherMobile}
                  placeholder="+27 or 0XXXXXXXXX"
                />
                <InputField
                  id="motherEmail"
                  label="Email Address"
                  required
                  value={formData.motherEmail}
                  onChange={(e) => handleInputChange('motherEmail', e.target.value)}
                  error={errors.motherEmail}
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Next of Kin Card */}
        <div className="relative bg-gradient-to-br from-green-50 via-green-25 to-emerald-50 rounded-2xl p-8 border border-green-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-gray-800">Next of Kin</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent"></div>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="nextOfKinSurname"
                  label="Surname"
                  required
                  value={formData.nextOfKinSurname}
                  onChange={(e) => handleInputChange('nextOfKinSurname', e.target.value)}
                  error={errors.nextOfKinSurname}
                />
                <InputField
                  id="nextOfKinFirstName"
                  label="First Name"
                  required
                  value={formData.nextOfKinFirstName}
                  onChange={(e) => handleInputChange('nextOfKinFirstName', e.target.value)}
                  error={errors.nextOfKinFirstName}
                />
              </div>
              <InputField
                id="nextOfKinRelationship"
                label="Relationship"
                required
                value={formData.nextOfKinRelationship}
                onChange={(e) => handleInputChange('nextOfKinRelationship', e.target.value)}
                error={errors.nextOfKinRelationship}
                placeholder="e.g., Aunt, Uncle, Grandparent"
              />
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  id="nextOfKinMobile"
                  label="Mobile Number"
                  required
                  value={formData.nextOfKinMobile}
                  onChange={(e) => handleInputChange('nextOfKinMobile', e.target.value)}
                  error={errors.nextOfKinMobile}
                  placeholder="+27 or 0XXXXXXXXX"
                />
                <InputField
                  id="nextOfKinEmail"
                  label="Email Address"
                  required
                  value={formData.nextOfKinEmail}
                  onChange={(e) => handleInputChange('nextOfKinEmail', e.target.value)}
                  error={errors.nextOfKinEmail}
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
};

export default FamilyInformation;
