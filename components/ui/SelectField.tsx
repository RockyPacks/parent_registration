
import React from 'react';

interface SelectFieldProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const SelectField: React.FC<SelectFieldProps> = ({ id, label, required = false, children }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={id}
        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        {children}
      </select>
    </div>
  );
};

export default SelectField;
