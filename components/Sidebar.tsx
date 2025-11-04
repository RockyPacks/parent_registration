import React from 'react';

interface Step {
  number: number;
  title: string;
  subtitle: string;
  isRiskAssessment?: boolean; // New optional property for risk assessment step
}

interface SidebarProps {
  steps: Step[];
  activeStep: number;
  onStepClick?: (stepNumber: number) => void;
  completedSteps?: Set<number>;
}

const Sidebar: React.FC<SidebarProps> = ({ steps, activeStep, onStepClick, completedSteps = new Set() }) => {
  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.has(stepNumber)) return 'completed';
    if (stepNumber === activeStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (status: string, isRiskAssessment?: boolean) => {
    if (isRiskAssessment) {
      // Special icon for risk assessment
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'active':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const progressPercentage = Math.round((completedSteps.size / steps.length) * 100);

  return (
    <aside className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-gray-200 md:fixed md:top-0 md:left-0 md:bottom-0 md:overflow-y-auto bg-white">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Application Progress</h2>
        <p className="text-sm text-gray-600 mb-4">Complete all steps to submit your enrollment</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-700">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      <nav className="mb-8">
        <ul className="space-y-2">
          {steps.map((step) => {
            const status = getStepStatus(step.number);
            return (
              <li
                key={step.number}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 border ${
                  status === 'active'
                    ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm cursor-pointer'
                    : status === 'completed'
                    ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 cursor-pointer'
                    : status === 'pending' && (step.number === activeStep + 1 || completedSteps.has(step.number - 1))
                    ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                    : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                }`}
                onClick={() => {
                  if (status !== 'pending' || step.number === activeStep + 1 || completedSteps.has(step.number - 1)) {
                    onStepClick?.(step.number);
                  }
                }}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-semibold ${
                    status === 'active'
                      ? 'bg-blue-600 text-white'
                      : status === 'completed'
                      ? 'bg-green-600 text-white'
                      : step.isRiskAssessment
                      ? 'bg-orange-100 text-orange-600 border border-orange-200'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {status === 'completed' ? getStepIcon('completed') : step.isRiskAssessment ? getStepIcon('pending', true) : step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    status === 'active' ? 'text-blue-900' : status === 'completed' ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs truncate ${
                    status === 'active' ? 'text-blue-700' : status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.subtitle}
                  </p>
                </div>
                {status === 'active' && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Need Help?</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Contact our admissions office at <span className="font-medium">admissions@linkscombined.edu.za</span> or call <span className="font-medium">(021) 123-4567</span>
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
