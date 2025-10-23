
import React from 'react';

interface Step {
  number: number;
  title: string;
  subtitle: string;
}

interface SidebarProps {
  steps: Step[];
  activeStep: number;
}

const Sidebar: React.FC<SidebarProps> = ({ steps, activeStep }) => {
  return (
    <aside className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Progress</h2>
      <nav>
        <ul className="space-y-2">
          {steps.map((step) => (
            <li
              key={step.number}
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                activeStep === step.number
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                  activeStep === step.number
                    ? 'bg-white text-blue-600'
                    : 'bg-gray-300 text-gray-700'
                }`}
              >
                {step.number}
              </div>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className={`text-xs ${activeStep === step.number ? 'text-blue-100' : 'text-gray-500'}`}>{step.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
