
import React from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import { MedicalIcon } from '../Icons';

const MedicalInformation: React.FC = () => {
  return (
    <FormSection icon={<MedicalIcon className="w-6 h-6 text-red-500" />} title="Medical Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField id="medicalAidName" label="Medical Aid Name" />
        <InputField id="memberNumber" label="Member Number" />
      </div>
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Does the learner suffer from any of the following?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <input id="asthma" name="conditions" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="asthma" className="ml-2 block text-sm text-gray-900">Asthma</label>
          </div>
          <div className="flex items-center">
            <input id="adhd" name="conditions" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="adhd" className="ml-2 block text-sm text-gray-900">ADHD</label>
          </div>
          <div className="flex items-center">
            <input id="epilepsy" name="conditions" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="epilepsy" className="ml-2 block text-sm text-gray-900">Epilepsy</label>
          </div>
          <div className="flex items-center">
            <input id="other-condition" name="conditions" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="other-condition" className="ml-2 block text-sm text-gray-900">Other</label>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <InputField id="allergies" label="Allergies" placeholder="e.g., peanuts, dairy products" />
      </div>
    </FormSection>
  );
};

export default MedicalInformation;
