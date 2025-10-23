
import React from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { FeeIcon } from '../Icons';

const FeeResponsibility: React.FC = () => {
  return (
    <FormSection icon={<FeeIcon className="w-6 h-6 text-yellow-500" />} title="Fee Responsibility">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField id="feePerson" label="Person Responsible for Fees" required>
          <option>Select Person</option>
          <option>Father/Guardian</option>
          <option>Mother/Guardian</option>
          <option>Other</option>
        </SelectField>
        <InputField id="relationship" label="Relationship to Learner" required />
      </div>
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <input
            id="fee-terms"
            name="fee-terms"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
          />
          <div className="ml-3 text-sm">
            <p className="text-blue-800">
              Tuition is payable via debit order or EFT within 7 days of invoice.
            </p>
            <p className="text-blue-700 mt-1">I understand and agree to the fee payment terms.</p>
          </div>
        </div>
      </div>
    </FormSection>
  );
};

export default FeeResponsibility;
