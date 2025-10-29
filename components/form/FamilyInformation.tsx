
import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import { FamilyIcon } from '../Icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';

interface FamilyInformationProps {
  onDataChange?: (data: any) => void;
}

const FamilyInformation: React.FC<FamilyInformationProps> = ({ onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useLocalStorage('familyInformation', {
    fatherSurname: '',
    fatherFirstName: '',
    fatherIdNumber: '',
    fatherMobile: '',
    fatherEmail: '',
    motherSurname: '',
    motherFirstName: '',
    motherIdNumber: '',
    motherMobile: '',
    motherEmail: ''
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
    motherEmail: ''
  });

  // Show toast when data is loaded from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('familyInformation');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (Object.values(parsedData).some(value => value !== '')) {
          addToast('Family information loaded from previous session', 'info');
        }
      } catch (error) {
        console.error('Error parsing saved family data:', error);
      }
    }
  }, [addToast]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'fatherSurname':
      case 'motherSurname':
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
        if (!value.trim()) {
          error = 'Mobile number is required';
        } else if (!/^(\+27|0)[6-8][0-9]{8}$/.test(value)) {
          error = 'Please enter a valid South African mobile number';
        }
        break;
      case 'fatherEmail':
      case 'motherEmail':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
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
  return (
    <FormSection icon={<FamilyIcon className="w-6 h-6 text-green-500" />} title="Family Information">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
      </div>
    </FormSection>
  );
};

export default FamilyInformation;
