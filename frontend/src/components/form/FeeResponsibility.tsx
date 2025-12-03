import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { FeeIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';

interface FeeResponsibilityProps {
  initialData?: any;
  familyData?: any;
  onDataChange?: (data: any) => void;
}

const FeeResponsibility: React.FC<FeeResponsibilityProps> = ({ initialData, familyData, onDataChange }) => {
  const { addToast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [formData, setFormData] = useState({
    feePerson: '',
    relationship: '',
    feeTermsAccepted: false,
    bankName: '',
    branchCode: '',
    accountNumber: '',
    accountType: '',
    selectedPlan: initialData?.selectedPlan || '',
    // Parent information fields
    parentIdNumber: '',
    parentFirstName: '',
    parentSurname: '',
    parentEmail: '',
    parentMobile: '',
    ...initialData
  });

  const [errors, setErrors] = useState({
    feePerson: '',
    relationship: '',
    feeTermsAccepted: '',
    bankName: '',
    branchCode: '',
    accountNumber: '',
    accountType: ''
  });

  // Update form data when initialData changes (e.g., after data is loaded from localStorage/backend)
  useEffect(() => {
    // Check if initialData has meaningful content (not just empty object)
    const hasMeaningfulData = initialData && Object.keys(initialData).length > 0 && 
      (initialData.feePerson || initialData.bankName || initialData.parentEmail);
    
    if (!isInitialized && hasMeaningfulData) {
      console.log('FeeResponsibility: Initializing with data:', initialData);
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  useEffect(() => {
    if (onDataChange) {
      // Send to parent component which will handle localStorage via MainContent
      onDataChange(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

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
      case 'bankName':
        if (!value) {
          error = 'Bank name is required';
        }
        break;
      case 'branchCode':
        if (!value) {
          error = 'Branch code is required';
        } else if (!/^\d{6}$/.test(value as string)) {
          error = 'Branch code must be 6 digits';
        }
        break;
      case 'accountNumber':
        if (!value) {
          error = 'Account number is required';
        } else if (!/^\d{10,12}$/.test(value as string)) {
          error = 'Account number must be 10-12 digits';
        }
        break;
      case 'accountType':
        if (!value) {
          error = 'Account type is required';
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
    // Special handling for feePerson changes - auto-populate parent information
    if (field === 'feePerson' && value !== formData.feePerson && familyData) {
      let parentData = {};
      
      console.log('FeeResponsibility: feePerson changed to:', value);
      console.log('FeeResponsibility: familyData available:', familyData);
      
      if (value === 'Father') {
        parentData = {
          parentIdNumber: familyData.fatherIdNumber || '',
          parentFirstName: familyData.fatherFirstName || '',
          parentSurname: familyData.fatherSurname || '',
          parentEmail: familyData.fatherEmail || '',
          parentMobile: familyData.fatherMobile || '',
        };
        console.log('FeeResponsibility: Auto-populating Father data:', parentData);
      } else if (value === 'Mother') {
        parentData = {
          parentIdNumber: familyData.motherIdNumber || '',
          parentFirstName: familyData.motherFirstName || '',
          parentSurname: familyData.motherSurname || '',
          parentEmail: familyData.motherEmail || '',
          parentMobile: familyData.motherMobile || '',
        };
        console.log('FeeResponsibility: Auto-populating Mother data:', parentData);
      } else if (value === 'Guardian') {
        parentData = {
          parentIdNumber: familyData.nextOfKinIdNumber || '',
          parentFirstName: familyData.nextOfKinFirstName || '',
          parentSurname: familyData.nextOfKinSurname || '',
          parentEmail: familyData.nextOfKinEmail || '',
          parentMobile: familyData.nextOfKinMobile || '',
        };
        console.log('FeeResponsibility: Auto-populating Guardian data:', parentData);
      } else {
        // For "Other", clear parent fields
        parentData = {
          parentIdNumber: '',
          parentFirstName: '',
          parentSurname: '',
          parentEmail: '',
          parentMobile: '',
        };
      }

      setFormData(prev => ({
        ...prev,
        [field]: value,
        ...parentData
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    if (field !== 'feeTermsAccepted') {
      validateField(field, value);
    }
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

      {/* Parent Information Section */}
      {formData.feePerson && (
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Parent/Guardian Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="parentFirstName"
              label="First Name"
              value={formData.parentFirstName}
              onChange={(e) => handleInputChange('parentFirstName', e.target.value)}
              disabled
              placeholder="Auto-populated from family information"
            />
            <InputField
              id="parentSurname"
              label="Surname"
              value={formData.parentSurname}
              onChange={(e) => handleInputChange('parentSurname', e.target.value)}
              disabled
              placeholder="Auto-populated from family information"
            />
            <InputField
              id="parentIdNumber"
              label="ID Number"
              value={formData.parentIdNumber}
              onChange={(e) => handleInputChange('parentIdNumber', e.target.value)}
              disabled
              placeholder="Auto-populated from family information"
            />
            <InputField
              id="parentEmail"
              label="Email Address"
              type="email"
              value={formData.parentEmail}
              onChange={(e) => handleInputChange('parentEmail', e.target.value)}
              disabled
              placeholder="Auto-populated from family information"
            />
            <InputField
              id="parentMobile"
              label="Mobile Number"
              value={formData.parentMobile}
              onChange={(e) => handleInputChange('parentMobile', e.target.value)}
              disabled
              placeholder="Auto-populated from family information"
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Parent/guardian information is automatically populated from your family information section.
          </p>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SelectField
            id="bankName"
            label="Bank Name"
            required
            value={formData.bankName}
            onChange={(e) => handleInputChange('bankName', e.target.value)}
            error={errors.bankName}
          >
            <option value="">Select a bank</option>
            <option value="Absa Bank">Absa Bank</option>
            <option value="African Bank">African Bank</option>
            <option value="Bidvest Bank">Bidvest Bank</option>
            <option value="Capitec Bank">Capitec Bank</option>
            <option value="Discovery Bank">Discovery Bank</option>
            <option value="FirstRand Bank">FirstRand Bank</option>
            <option value="Investec Bank">Investec Bank</option>
            <option value="Nedbank">Nedbank</option>
            <option value="Standard Bank">Standard Bank</option>
            <option value="TymeBank">TymeBank</option>
            <option value="Other">Other</option>
          </SelectField>
          <InputField
            id="branchCode"
            label="Branch Code"
            required
            value={formData.branchCode}
            onChange={(e) => handleInputChange('branchCode', e.target.value)}
            error={errors.branchCode}
            placeholder="6-digit code"
            maxLength={6}
          />
          <InputField
            id="accountNumber"
            label="Account Number"
            required
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            error={errors.accountNumber}
            placeholder="10-12 digit number"
            maxLength={12}
          />
          <SelectField
            id="accountType"
            label="Account Type"
            required
            value={formData.accountType}
            onChange={(e) => handleInputChange('accountType', e.target.value)}
            error={errors.accountType}
          >
            <option value="">Select account type</option>
            <option value="Cheque">Cheque</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
            <option value="Money Market">Money Market</option>
            <option value="Fixed Deposit">Fixed Deposit</option>
          </SelectField>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          These banking details will be used for fee payments and risk assessment verification.
        </p>
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
