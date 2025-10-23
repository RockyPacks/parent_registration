
import React from 'react';
import FormSection from './FormSection';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectField';
import { StudentIcon, CalendarIcon } from '../Icons';

const StudentInformation: React.FC = () => {
  return (
    <FormSection icon={<StudentIcon className="w-6 h-6 text-blue-600" />} title="Student Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField id="surname" label="Surname" required />
        <InputField id="firstName" label="First Name" required />
        <InputField id="middleName" label="Middle Name" />
        <InputField id="preferredName" label="Preferred Name" />
        <InputField id="dob" label="Date of Birth" placeholder="yyyy/mm/dd" required icon={<CalendarIcon className="h-5 w-5 text-gray-400" />} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <input id="male" name="gender" type="radio" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
              <label htmlFor="male" className="ml-2 block text-sm text-gray-900">Male</label>
            </div>
            <div className="flex items-center">
              <input id="female" name="gender" type="radio" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
              <label htmlFor="female" className="ml-2 block text-sm text-gray-900">Female</label>
            </div>
            <div className="flex items-center">
              <input id="other" name="gender" type="radio" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
              <label htmlFor="other" className="ml-2 block text-sm text-gray-900">Other</label>
            </div>
          </div>
        </div>
        <SelectField id="homeLanguage" label="Home Language" required>
          <option>Select Language</option>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </SelectField>
        <InputField id="idNumber" label="ID Number" required />
        <SelectField id="previousGrade" label="Previous Grade" required>
          <option>Select Grade</option>
          <option>Grade 8</option>
          <option>Grade 9</option>
          <option>Grade 10</option>
        </SelectField>
        <SelectField id="gradeAppliedFor" label="Grade Applied For" required>
          <option>Select Grade</option>
          <option>Grade 9</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
        </SelectField>
        <div className="md:col-span-2">
          <InputField id="previousSchool" label="Previous School Attended" required />
        </div>
      </div>
    </FormSection>
  );
};

export default StudentInformation;
