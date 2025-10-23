
import React from 'react';
import StudentInformation from './form/StudentInformation';
import MedicalInformation from './form/MedicalInformation';
import FamilyInformation from './form/FamilyInformation';
import FeeResponsibility from './form/FeeResponsibility';

const MainContent: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50 p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Step 1 — Student & Guardian Information</h1>
        <p className="mt-1 text-gray-600">Please complete all required details below. Fields marked with <span className="text-red-500">*</span> are mandatory.</p>
      </div>
      <StudentInformation />
      <MedicalInformation />
      <FamilyInformation />
      <FeeResponsibility />
    </div>
  );
};

export default MainContent;
