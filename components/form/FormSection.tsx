
import React from 'react';

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ icon, title, children }) => {
  return (
    <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
};

export default FormSection;
