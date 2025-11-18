
import React from 'react';

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ icon, title, children }) => {
  return (
    <div className="bg-white p-8 sm:p-10 border border-gray-200/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 mb-10">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 border border-blue-200/50 shadow-sm group-hover:shadow-md transition-all duration-300">
          <div className="text-blue-600 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto"></div>
        </div>
      </div>
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
