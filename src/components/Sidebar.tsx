
import React from 'react';
import { ApplicationStep, StepStatus } from '../types';
import { CheckCircleIcon, InfoIcon } from './icons';

const Step: React.FC<{ step: ApplicationStep }> = ({ step }) => {
  const getStatusClasses = () => {
    switch (step.status) {
      case StepStatus.Completed:
        return {
          iconContainer: 'bg-green-500 text-white',
          text: 'text-gray-500',
          line: 'border-green-500',
        };
      case StepStatus.Active:
        return {
          iconContainer: 'bg-blue-600 text-white',
          text: 'text-blue-600 font-semibold',
          line: 'border-blue-600',
        };
      case StepStatus.Upcoming:
      default:
        return {
          iconContainer: 'bg-gray-200 text-gray-500',
          text: 'text-gray-500',
          line: 'border-gray-300',
        };
    }
  };

  const { iconContainer, text, line } = getStatusClasses();

  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconContainer}`}>
          {step.status === StepStatus.Completed ? <CheckCircleIcon className="w-5 h-5" /> : <span className="font-bold">{step.id}</span>}
        </div>
        {step.id < 7 && <div className={`w-0.5 h-12 mt-1 ${line}`}></div>}
      </div>
      <div className={`pt-1 ${text}`}>
        <p className="text-sm font-medium">{step.title}</p>
        <p className="text-xs">{step.description}</p>
      </div>
    </div>
  );
};

interface SidebarProps {
  documentUploadCompleted?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ documentUploadCompleted = false }) => {
  const steps: ApplicationStep[] = [
    { id: 1, title: 'Customer Details', description: 'Basic information completed', status: StepStatus.Completed },
    { id: 2, title: 'Document Upload', description: 'Upload required documents', status: documentUploadCompleted ? StepStatus.Completed : StepStatus.Active },
  ];

  return (
    <aside className="w-full lg:w-80 bg-white p-4 sm:p-6 border-r border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Progress</h3>
      <div className="space-y-2">
        {steps.map((step) => <Step key={step.id} step={step} />)}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 flex items-center">
          <InfoIcon className="w-5 h-5 mr-2" /> Upload Tips
        </h4>
        <ul className="list-disc list-inside text-xs text-blue-700 mt-2 space-y-1">
          <li>Ensure documents are clear and legible.</li>
          <li>Maximum file size: 5MB</li>
          <li>Accepted formats: PDF, JPG, PNG</li>
        </ul>
      </div>
    </aside>
  );
};
