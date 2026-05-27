import React, { useState, useEffect, useRef } from 'react';
import SelectField from '../ui/SelectField';
import DatePickerField from '../ui/DatePickerField';
import { getActiveSchoolType, getGradeConfig } from '../../utils/storage';

interface ApplicationDetailsProps {
  initialData?: any;
  onDataChange?: (data: any) => void;
}

const normalizeFormData = (data?: any) => {
  const normalized = {
    proposedStartTerm: data?.proposedStartTerm || '',
    year: data?.year || '',
    gradeApplyingFor: data?.gradeApplyingFor || '',
    proposedStartDate: data?.proposedStartDate || null,
  };

  if (normalized.proposedStartDate && typeof normalized.proposedStartDate === 'string') {
    normalized.proposedStartDate = new Date(normalized.proposedStartDate);
  } else if (typeof normalized.proposedStartDate === 'number') {
    normalized.proposedStartDate = new Date(normalized.proposedStartDate);
  }

  return normalized;
};

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ initialData, onDataChange }) => {
  const [formData, setFormData] = useState(() => normalizeFormData(initialData));

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const lastEmittedDataRef = useRef('');

  useEffect(() => {
    const normalizedInitialData = normalizeFormData(initialData);
    const hasMeaningfulData =
      normalizedInitialData.proposedStartTerm ||
      normalizedInitialData.year ||
      normalizedInitialData.gradeApplyingFor ||
      normalizedInitialData.proposedStartDate;

    if (!isInitialized && hasMeaningfulData) {
      setFormData(normalizedInitialData);
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  useEffect(() => {
    const hasData = formData.proposedStartTerm || formData.year || formData.gradeApplyingFor;

    if (onDataChange && (hasData || isInitialized)) {
      const dataToSave = { ...formData };
      if (dataToSave.proposedStartDate instanceof Date) {
        dataToSave.proposedStartDate = dataToSave.proposedStartDate.toISOString().split('T')[0];
      } else if (dataToSave.proposedStartDate === null) {
        dataToSave.proposedStartDate = '';
      }
      const serializedDataToSave = JSON.stringify(dataToSave);
      if (serializedDataToSave !== lastEmittedDataRef.current) {
        lastEmittedDataRef.current = serializedDataToSave;
        onDataChange(dataToSave);
      }
    }
  }, [formData, isInitialized, onDataChange]);

  const validateField = (field: string, value: string | Date | null) => {
    let error = '';

    switch (field) {
      case 'proposedStartTerm':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          error = 'Proposed Start Term is required';
        }
        break;
      case 'year':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          error = 'Year is required';
        }
        break;
      case 'gradeApplyingFor':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          const { label } = getGradeConfig(getActiveSchoolType());
          error = `${label} Applying For is required`;
        }
        break;
      case 'proposedStartDate':
        // Optional field - only validate if provided
        if (value instanceof Date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (value < today) {
            error = 'Start date cannot be in the past';
          }
        }
        break;
      default:
        break;
    }

    return error;
  };

  const handleFieldChange = (field: string, value: string | Date | null) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Get current and future years for the year dropdown
  const getCurrentYear = () => new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => getCurrentYear() + i);

  const { options: gradeOptions, label: gradeLabel } = getGradeConfig(getActiveSchoolType());

  // Term options
  const termOptions = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          id="proposedStartTerm"
          label="Proposed Start Term"
          required
          value={formData.proposedStartTerm}
          onChange={(e) => handleFieldChange('proposedStartTerm', e.target.value)}
          error={errors.proposedStartTerm}
        >
          <option value="">Please choose...</option>
          {termOptions.map((term) => (
            <option key={term} value={term}>
              {term}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="year"
          label="Year"
          required
          value={formData.year}
          onChange={(e) => handleFieldChange('year', e.target.value)}
          error={errors.year}
        >
          <option value="">Please choose...</option>
          {years.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          id="gradeApplyingFor"
          label={`${gradeLabel} Applying For`}
          required
          value={formData.gradeApplyingFor}
          onChange={(e) => handleFieldChange('gradeApplyingFor', e.target.value)}
          error={errors.gradeApplyingFor}
        >
          <option value="">Please choose...</option>
          {gradeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </SelectField>

        <DatePickerField
          id="proposedStartDate"
          label="Proposed Start Date"
          required={false}
          selected={formData.proposedStartDate}
          onChange={(date) => handleFieldChange('proposedStartDate', date)}
          placeholder="Choose date"
          error={errors.proposedStartDate}
          minDate={new Date()}
          maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
        />
      </div>
    </div>
  );
};

export default ApplicationDetails;
