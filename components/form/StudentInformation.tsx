
import React, { useState, useEffect } from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import DatePickerField from '../ui/DatePickerField';
import { StudentIcon } from '../Icons';
import { useToast } from '../../hooks/useToast';
import Footer from '../Footer';

interface StudentInformationProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
  onNext?: () => void;
}

const StudentInformation: React.FC<StudentInformationProps> = ({ initialData, onDataChange, onNext }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    surname: '',
    firstName: '',
    middleName: '',
    preferredName: '',
    dob: null,
    gender: '',
    homeLanguage: '',
    idNumber: '',
    previousGrade: '',
    gradeAppliedFor: '',
    previousSchool: '',
    ...initialData
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  const validateField = (field: string, value: string | Date | null) => {
    let error = '';

    switch (field) {
      case 'surname':
      case 'firstName':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          error = `${field === 'surname' ? 'Surname' : 'First Name'} must be at least 2 characters`;
        }
        break;
      case 'idNumber':
        if (!value || (typeof value === 'string' && !/^\d{13}$/.test(value))) {
          error = 'ID Number must be exactly 13 digits';
        }
        break;
      case 'dob':
        if (!value) {
          error = 'Date of Birth is required';
        } else if (value instanceof Date) {
          const age = new Date().getFullYear() - value.getFullYear();
          if (age < 5 || age > 25) {
            error = 'Age must be between 5 and 25 years';
          }
        }
        break;
      case 'gender':
        if (!value) {
          error = 'Gender is required';
        }
        break;
      case 'homeLanguage':
        if (!value) {
          error = 'Home Language is required';
        }
        break;
      case 'previousGrade':
        if (!value) {
          error = 'Previous Grade is required';
        }
        break;
      case 'gradeAppliedFor':
        if (!value) {
          error = 'Grade Applied For is required';
        }
        break;
      case 'previousSchool':
        if (!value || (typeof value === 'string' && value.trim().length < 3)) {
          error = 'Previous School must be at least 3 characters';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return error === '';
  };

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field !== 'middleName' && field !== 'preferredName') {
      validateField(field, value);
    }
  };

  // Auto-save functionality removed - handled by parent component
  return (
    <div>
      <FormSection icon={<StudentIcon className="w-6 h-6 text-blue-600" />} title="Student Information">
      {/* Personal Details Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-12 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Personal Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="surname"
            label="Surname"
            required
            value={formData.surname}
            onChange={(e) => handleInputChange('surname', e.target.value)}
            error={errors.surname}
          />
          <InputField
            id="firstName"
            label="First Name"
            required
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            error={errors.firstName}
          />
          <InputField
            id="middleName"
            label="Middle Name"
            value={formData.middleName}
            onChange={(e) => handleInputChange('middleName', e.target.value)}
          />
          <InputField
            id="preferredName"
            label="Preferred Name"
            value={formData.preferredName}
            onChange={(e) => handleInputChange('preferredName', e.target.value)}
          />
          <DatePickerField
            id="dob"
            label="Date of Birth"
            required
            selected={formData.dob}
            onChange={(date) => handleInputChange('dob', date)}
            error={errors.dob}
            maxDate={new Date()}
            minDate={new Date(2000, 0, 1)}
            placeholder="Select your date of birth"
          />
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'male', value: 'Male', label: 'Male' },
                { id: 'female', value: 'Female', label: 'Female' },
                { id: 'other', value: 'Other', label: 'Other' }
              ].map((option) => (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                    formData.gender === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    id={option.id}
                    name="gender"
                    type="radio"
                    value={option.value}
                    checked={formData.gender === option.value}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                  {formData.gender === option.value && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.gender && (
              <div className="flex items-center gap-1 mt-2">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{errors.gender}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Information Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-12 border border-emerald-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 010-1.848l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Academic Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            id="homeLanguage"
            label="Home Language"
            required
            value={formData.homeLanguage}
            onChange={(e) => handleInputChange('homeLanguage', e.target.value)}
            error={errors.homeLanguage}
          >
            <option value="">Select Language</option>
            <option value="Afrikaans">Afrikaans</option>
            <option value="English">English</option>
            <option value="isiNdebele">isiNdebele</option>
            <option value="isiXhosa">isiXhosa</option>
            <option value="isiZulu">isiZulu</option>
            <option value="Sepedi">Sepedi</option>
            <option value="Sesotho">Sesotho</option>
            <option value="Setswana">Setswana</option>
            <option value="siSwati">siSwati</option>
            <option value="Tshivenda">Tshivenda</option>
            <option value="Xitsonga">Xitsonga</option>
          </SelectField>
          <InputField
            id="idNumber"
            label="ID Number"
            required
            value={formData.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value)}
            error={errors.idNumber}
          />
          <SelectField
            id="previousGrade"
            label="Previous Grade"
            required
            value={formData.previousGrade}
            onChange={(e) => handleInputChange('previousGrade', e.target.value)}
            error={errors.previousGrade}
          >
            <option value="">Select Grade</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </SelectField>
          <SelectField
            id="gradeAppliedFor"
            label="Grade Applied For"
            required
            value={formData.gradeAppliedFor}
            onChange={(e) => handleInputChange('gradeAppliedFor', e.target.value)}
            error={errors.gradeAppliedFor}
          >
            <option value="">Select Grade</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </SelectField>
          <div className="md:col-span-2">
            <InputField
              id="previousSchool"
              label="Previous School Attended"
              required
              value={formData.previousSchool}
              onChange={(e) => handleInputChange('previousSchool', e.target.value)}
              error={errors.previousSchool}
            />
          </div>
        </div>
      </div>
      </FormSection>
      <Footer
        onBack={() => {}}
        onSave={() => {}}
        onNext={onNext}
        showBack={false}
        showSave={false}
        showNext={true}
        nextLabel="Next: Document Upload"
      />
    </div>
  );
};

export default StudentInformation;
