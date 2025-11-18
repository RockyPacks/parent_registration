
import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import { MedicalIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';

interface MedicalInformationProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
}

const MedicalInformation: React.FC<MedicalInformationProps> = ({ initialData, onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    medicalAidName: '',
    memberNumber: '',
    conditions: [] as string[],
    allergies: '',
    ...initialData
  });

  const [errors, setErrors] = useState({
    medicalAidName: '',
    memberNumber: '',
    allergies: ''
  });



  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
    // Save to localStorage whenever form data changes
    localStorage.setItem('medicalInformation', JSON.stringify(formData));
  }, [formData, onDataChange]);

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'medicalAidName':
        if (value && value.length < 2) {
          error = 'Medical aid name must be at least 2 characters';
        }
        break;
      case 'memberNumber':
        if (value && !/^[A-Za-z0-9\-]+$/.test(value)) {
          error = 'Member number can only contain letters, numbers, and hyphens';
        }
        break;
      case 'allergies':
        if (value && value.length > 200) {
          error = 'Allergies description must be less than 200 characters';
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
      conditions: checked
        ? [...prev.conditions, condition]
        : prev.conditions.filter(c => c !== condition)
    }));
  };

  // Auto-save functionality removed - handled by parent component
  return (
    <FormSection icon={<MedicalIcon className="w-6 h-6 text-red-500" />} title="Medical Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="medicalAidName"
          label="Medical Aid Name"
          value={formData.medicalAidName}
          onChange={(e) => handleInputChange('medicalAidName', e.target.value)}
          error={errors.medicalAidName}
        />
        <InputField
          id="memberNumber"
          label="Member Number"
          value={formData.memberNumber}
          onChange={(e) => handleInputChange('memberNumber', e.target.value)}
          error={errors.memberNumber}
        />
      </div>
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Does the learner suffer from any of the following?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <input
              id="asthma"
              name="conditions"
              type="checkbox"
              checked={formData.conditions.includes('Asthma')}
              onChange={(e) => handleConditionChange('Asthma', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="asthma" className="ml-2 block text-sm text-gray-900 cursor-pointer">Asthma</label>
          </div>
          <div className="flex items-center">
            <input
              id="adhd"
              name="conditions"
              type="checkbox"
              checked={formData.conditions.includes('ADHD')}
              onChange={(e) => handleConditionChange('ADHD', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="adhd" className="ml-2 block text-sm text-gray-900 cursor-pointer">ADHD</label>
          </div>
          <div className="flex items-center">
            <input
              id="epilepsy"
              name="conditions"
              type="checkbox"
              checked={formData.conditions.includes('Epilepsy')}
              onChange={(e) => handleConditionChange('Epilepsy', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="epilepsy" className="ml-2 block text-sm text-gray-900 cursor-pointer">Epilepsy</label>
          </div>
          <div className="flex items-center">
            <input
              id="other-condition"
              name="conditions"
              type="checkbox"
              checked={formData.conditions.includes('Other')}
              onChange={(e) => handleConditionChange('Other', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="other-condition" className="ml-2 block text-sm text-gray-900 cursor-pointer">Other</label>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <InputField
          id="allergies"
          label="Allergies"
          placeholder="e.g., peanuts, dairy products"
          value={formData.allergies}
          onChange={(e) => handleInputChange('allergies', e.target.value)}
          error={errors.allergies}
        />
      </div>
    </FormSection>
  );
};

export default MedicalInformation;
