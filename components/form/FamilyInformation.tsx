
import React from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import { FamilyIcon } from '../Icons';

const FamilyInformation: React.FC = () => {
  return (
    <FormSection icon={<FamilyIcon className="w-6 h-6 text-green-500" />} title="Family Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 border-l-4 border-blue-400 pl-6">
          <h3 className="text-lg font-medium text-gray-900">Father/Guardian Information</h3>
          <InputField id="fatherSurname" label="Surname" required />
          <InputField id="fatherFirstName" label="First Name" required />
          <InputField id="fatherIdNumber" label="ID Number" required />
          <InputField id="fatherMobile" label="Mobile Number" required />
          <InputField id="fatherEmail" label="Email Address" required />
        </div>
        <div className="space-y-6 border-l-4 border-purple-400 pl-6">
          <h3 className="text-lg font-medium text-gray-900">Mother/Guardian Information</h3>
          <InputField id="motherSurname" label="Surname" required />
          <InputField id="motherFirstName" label="First Name" required />
          <InputField id="motherIdNumber" label="ID Number" required />
          <InputField id="motherMobile" label="Mobile Number" required />
          <InputField id="motherEmail" label="Email Address" required />
        </div>
      </div>
    </FormSection>
  );
};

export default FamilyInformation;
