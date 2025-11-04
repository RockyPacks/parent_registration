import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { FeeIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';

interface FeeResponsibilityProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
}

const FeeResponsibility: React.FC<FeeResponsibilityProps> = ({ initialData, onDataChange }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    feePerson: '',
    relationship: '',
    feeTermsAccepted: false,
    ...initialData
  });

  const [errors, setErrors] = useState({
    feePerson: '',
    relationship: '',
    feeTermsAccepted: ''
  });



  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  const validateField = (field: string, value: string | boolean) => {
    let error = '';

    switch (field) {
      case 'feePerson':
        if (!value) {
          error = 'Please select who is responsible for fees';
        }
        break;
      case 'relationship':
        if (!value) {
          error = 'Please select the relationship to the student';
        }
        break;
      case 'feeTermsAccepted':
        if (!value) {
          error = 'You must accept the fee terms and conditions to proceed';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return error === '';
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
  };

  // Auto-save functionality removed - handled by parent component

  return (
    <FormSection icon={<FeeIcon className="w-6 h-6 text-yellow-500" />} title="Fee Responsibility">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          id="feePerson"
          label="Person Responsible for Fees"
          required
          value={formData.feePerson}
          onChange={(e) => handleInputChange('feePerson', e.target.value)}
          error={errors.feePerson}
        >
          <option value="">Select Person</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Guardian">Guardian</option>
          <option value="Other">Other</option>
        </SelectField>
        <SelectField
          id="relationship"
          label="Relationship to Student"
          required
          value={formData.relationship}
          onChange={(e) => handleInputChange('relationship', e.target.value)}
          error={errors.relationship}
        >
          <option value="">Select Relationship</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Legal Guardian">Legal Guardian</option>
          <option value="Grandparent">Grandparent</option>
          <option value="Other">Other</option>
        </SelectField>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="feeTerms"
              name="feeTerms"
              type="checkbox"
              checked={formData.feeTermsAccepted}
              onChange={(e) => handleInputChange('feeTermsAccepted', e.target.checked)}
              className="focus:ring-yellow-500 h-5 w-5 text-yellow-600 border-gray-300 rounded cursor-pointer"
            />
          </div>
          <div className="ml-4 text-sm">
            <label htmlFor="feeTerms" className="font-semibold text-gray-900 cursor-pointer">
              I accept the fee terms and conditions *
            </label>
            <p className="text-gray-600 mt-1 leading-relaxed">
              By checking this box, I agree to the school's fee structure, payment terms, and understand that fees must be paid according to the agreed schedule. I acknowledge that failure to pay fees may result in suspension or termination of enrollment.
            </p>
            {errors.feeTermsAccepted && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.feeTermsAccepted}</p>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
};

export default FeeResponsibility;
