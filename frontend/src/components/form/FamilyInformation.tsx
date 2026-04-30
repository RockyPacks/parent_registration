import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import { FamilyIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';
import { validateSAID } from '../../utils/saIdValidator';

interface FamilyInformationProps {
  initialFamilyData?: any;
  initialNextOfKinData?: any;
  onFamilyDataChange?: (data: any) => void;
  onNextOfKinDataChange?: (data: any) => void;
}

const FamilyInformation: React.FC<FamilyInformationProps> = ({ initialFamilyData, initialNextOfKinData, onFamilyDataChange, onNextOfKinDataChange }) => {
  const { addToast } = useToast();
  const [familyFormData, setFamilyFormData] = useState({
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
    ...initialFamilyData
  });

  const [nextOfKinFormData, setNextOfKinFormData] = useState({
    nextOfKinSurname: '',
    nextOfKinFirstName: '',
    nextOfKinRelationship: '',
    nextOfKinMobile: '',
    nextOfKinEmail: '',
    nextOfKinIdNumber: '',
    nextOfKinPhone: '',
    nextOfKinAlternateMobile: '',
    nextOfKinPhysicalAddress: '',
    ...initialNextOfKinData
  });

  const [isFamilyInitialized, setIsFamilyInitialized] = useState(false);
  const [isNextOfKinInitialized, setIsNextOfKinInitialized] = useState(false);

  // Update form data when initialFamilyData changes (e.g., after data is loaded from localStorage/backend)
  // Only run once when component first receives data to prevent infinite loops
  useEffect(() => {
    // Check if initialFamilyData has meaningful content (not just empty object)
    const hasMeaningfulData = initialFamilyData && Object.keys(initialFamilyData).length > 0 &&
      (initialFamilyData.fatherSurname || initialFamilyData.motherSurname ||
       initialFamilyData.fatherFirstName || initialFamilyData.motherFirstName);
    
    if (!isFamilyInitialized && hasMeaningfulData) {
      console.log("FamilyInformation: Initializing with familyData:", initialFamilyData);
      setFamilyFormData(prev => ({
        ...prev,
        ...initialFamilyData
      }));
      setIsFamilyInitialized(true);
    }
  }, [initialFamilyData, isFamilyInitialized]);

  // Update nextOfKin form data when initialNextOfKinData changes
  // Only run once when component first receives data to prevent infinite loops
  useEffect(() => {
    // Check if initialNextOfKinData has meaningful content (not just empty object)
    const hasMeaningfulData = initialNextOfKinData && Object.keys(initialNextOfKinData).length > 0 &&
      (initialNextOfKinData.nextOfKinSurname || initialNextOfKinData.nextOfKinFirstName || initialNextOfKinData.nextOfKinEmail);
    
    if (!isNextOfKinInitialized && hasMeaningfulData) {
      console.log("FamilyInformation: Initializing with nextOfKinData:", initialNextOfKinData);
      setNextOfKinFormData(prev => ({
        ...prev,
        ...initialNextOfKinData
      }));
      setIsNextOfKinInitialized(true);
    }
  }, [initialNextOfKinData, isNextOfKinInitialized]);

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
    nextOfKinEmail: '',
    nextOfKinIdNumber: '' // Added missing nextOfKinIdNumber
  });

  useEffect(() => {
    // Only propagate changes if we have data or if fully initialized from props
    // This protects against empty state overwriting valid localStorage/backend data
    const hasData = familyFormData.fatherSurname || familyFormData.motherSurname;
    
    if (onFamilyDataChange && (hasData || isFamilyInitialized)) {
      onFamilyDataChange(familyFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyFormData, isFamilyInitialized]);

  useEffect(() => {
    if (onNextOfKinDataChange) {
      // Only send meaningful data (not empty objects)
      const hasData = nextOfKinFormData.nextOfKinSurname || nextOfKinFormData.nextOfKinFirstName || 
                      nextOfKinFormData.nextOfKinEmail || nextOfKinFormData.nextOfKinMobile;
      console.log("FamilyInformation: Next of kin data change detected. Has meaningful data:", hasData);
      console.log("FamilyInformation: Sending next of kin data to parent:", nextOfKinFormData);
      onNextOfKinDataChange(nextOfKinFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextOfKinFormData]);


  // Check if at least one parent is fully filled
  useEffect(() => {
    const isFatherComplete = familyFormData.fatherSurname && familyFormData.fatherFirstName && familyFormData.fatherIdNumber && familyFormData.fatherMobile && familyFormData.fatherEmail;
    const isMotherComplete = familyFormData.motherSurname && familyFormData.motherFirstName && familyFormData.motherIdNumber && familyFormData.motherMobile && familyFormData.motherEmail;

    if (!isFatherComplete && !isMotherComplete) {
      addToast('Please provide complete information for at least one parent (Father or Mother)', 'warning');
    }
  }, [familyFormData, addToast]);

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
      case 'nextOfKinIdNumber': // Added validation for nextOfKinIdNumber
        if (!value.trim()) {
          error = 'ID number is required';
        } else {
          const validationResult = validateSAID(value);
          if (!validationResult.isValid) {
            error = validationResult.error || 'Invalid SA ID number';
          }
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
    // Determine if the field belongs to familyFormData or nextOfKinFormData
    if (field.startsWith('nextOfKin')) {
      setNextOfKinFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFamilyFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    validateField(field, value);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Use grid for responsive layout */}
                <InputField
                  id="fatherSurname"
                  label="Surname"
                  required
                  value={familyFormData.fatherSurname}
                  onChange={(e) => handleInputChange('fatherSurname', e.target.value)}
                  error={errors.fatherSurname}
                />
                <InputField
                  id="fatherFirstName"
                  label="First Name"
                  required
                  value={familyFormData.fatherFirstName}
                  onChange={(e) => handleInputChange('fatherFirstName', e.target.value)}
                  error={errors.fatherFirstName}
                />
              <div className="md:col-span-2">
              <InputField
                id="fatherIdNumber"
                label="ID Number"
                required
                value={familyFormData.fatherIdNumber}
                onChange={(e) => handleInputChange('fatherIdNumber', e.target.value)}
                error={errors.fatherIdNumber}
                placeholder="13-digit South African ID number"
              />
              </div>
              <InputField
                  id="fatherMobile"
                  label="Mobile Number"
                  required
                  value={familyFormData.fatherMobile}
                  onChange={(e) => handleInputChange('fatherMobile', e.target.value)}
                  error={errors.fatherMobile}
                  placeholder="+27 or 0XXXXXXXXX"
                />
              <InputField
                  id="fatherEmail"
                  label="Email Address"
                  required
                  value={familyFormData.fatherEmail}
                  onChange={(e) => handleInputChange('fatherEmail', e.target.value)}
                  error={errors.fatherEmail}
                  placeholder="example@email.com"
                />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Use grid for responsive layout */}
                <InputField
                  id="motherSurname"
                  label="Surname"
                  required
                  value={familyFormData.motherSurname}
                  onChange={(e) => handleInputChange('motherSurname', e.target.value)}
                  error={errors.motherSurname}
                />
                <InputField
                  id="motherFirstName"
                  label="First Name"
                  required
                  value={familyFormData.motherFirstName}
                  onChange={(e) => handleInputChange('motherFirstName', e.target.value)}
                  error={errors.motherFirstName}
                />
              <div className="md:col-span-2">
              <InputField
                id="motherIdNumber"
                label="ID Number"
                required
                value={familyFormData.motherIdNumber}
                onChange={(e) => handleInputChange('motherIdNumber', e.target.value)}
                error={errors.motherIdNumber}
                placeholder="13-digit South African ID number"
              />
              </div>
              <InputField
                  id="motherMobile"
                  label="Mobile Number"
                  required
                  value={familyFormData.motherMobile}
                  onChange={(e) => handleInputChange('motherMobile', e.target.value)}
                  error={errors.motherMobile}
                  placeholder="+27 or 0XXXXXXXXX"
                />
              <InputField
                  id="motherEmail"
                  label="Email Address"
                  required
                  value={familyFormData.motherEmail}
                  onChange={(e) => handleInputChange('motherEmail', e.target.value)}
                  error={errors.motherEmail}
                  placeholder="example@email.com"
                />
            </div>
          </div>
        </div>

        {/* Next of Kin Card */}
        <div className="relative bg-gradient-to-br from-indigo-50 via-indigo-25 to-blue-50 rounded-2xl p-8 border border-indigo-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17.555 17.555A8 8 0 102.444 2.444a8 8 0 0015.111 15.111zM10 12a4 4 0 00-4 4v1a2 2 0 002 2h4a2 2 0 002-2v-1a4 4 0 00-4-4z" />
            </svg>
          </div>
          <div className="ml-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-gray-800">Next of Kin</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <InputField
                id="nextOfKinSurname"
                label="Surname"
                required
                value={nextOfKinFormData.nextOfKinSurname}
                onChange={(e) => handleInputChange('nextOfKinSurname', e.target.value)}
                error={errors.nextOfKinSurname}
              />
              <InputField
                id="nextOfKinFirstName"
                label="First Name"
                required
                value={nextOfKinFormData.nextOfKinFirstName}
                onChange={(e) => handleInputChange('nextOfKinFirstName', e.target.value)}
                error={errors.nextOfKinFirstName}
              />
              <InputField
                id="nextOfKinRelationship"
                label="Relationship to Student"
                required
                value={nextOfKinFormData.nextOfKinRelationship}
                onChange={(e) => handleInputChange('nextOfKinRelationship', e.target.value)}
                error={errors.nextOfKinRelationship}
              />
              <InputField
                id="nextOfKinMobile"
                label="Mobile Number"
                required
                value={nextOfKinFormData.nextOfKinMobile}
                onChange={(e) => handleInputChange('nextOfKinMobile', e.target.value)}
                error={errors.nextOfKinMobile}
                placeholder="+27 or 0XXXXXXXXX"
              />
              <div className="md:col-span-2">
                <InputField
                  id="nextOfKinEmail"
                  label="Email Address"
                  required
                  value={nextOfKinFormData.nextOfKinEmail}
                  onChange={(e) => handleInputChange('nextOfKinEmail', e.target.value)}
                  error={errors.nextOfKinEmail}
                  placeholder="example@email.com"
                />
              </div>
              <div className="md:col-span-2">
                <InputField
                  id="nextOfKinIdNumber"
                  label="ID Number"
                  required
                  value={nextOfKinFormData.nextOfKinIdNumber}
                  onChange={(e) => handleInputChange('nextOfKinIdNumber', e.target.value)}
                  error={errors.nextOfKinIdNumber}
                  placeholder="13-digit South African ID number"
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
