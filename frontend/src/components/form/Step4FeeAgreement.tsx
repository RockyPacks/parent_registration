import React, { useState } from 'react';
import FeeAgreement from './FeeAgreement';
import Footer from '../Footer';
import { apiService } from '../../services/api';

interface Step4FeeAgreementProps {
  applicationId?: string | null;
  onFeeAgreementComplete?: () => void;
  onStepChange?: (step: number) => void;
  onStepComplete?: (stepNumber: number) => void;
  onDataChange?: (data: any) => void; // Add this prop
}

const Step4FeeAgreement: React.FC<Step4FeeAgreementProps> = ({
  applicationId,
  onFeeAgreementComplete,
  onStepChange,
  onStepComplete,
  onDataChange // Destructure onDataChange prop
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    const saved = localStorage.getItem('financingPlan');
    return saved ? JSON.parse(saved).plan || 'Pay Once Per Year' : 'Pay Once Per Year';
  });

  // Call onDataChange whenever selectedPlan changes or initialData is loaded
  React.useEffect(() => {
    // Also include feeData, as it's often related to financing in the summary
    onDataChange && onDataChange({ plan: selectedPlan });
  }, [selectedPlan]);

  const getPlanType = (planTitle: string): string => {
    const planMapping: { [key: string]: string } = {
      'Pay Monthly Debit': 'monthly_flat',
      'Pay Per Term': 'termly_discount',
      'Pay Once Per Year': 'annual_discount',
      'Buy Now, Pay Later': 'bnpl',
      'Forward Funding': 'forward_funding',
      'Sibling Benefit': 'sibling_discount'
    };
    return planMapping[planTitle] || planTitle.toLowerCase().replace(/\s+/g, '_');
  };

  const sanitizePlanTitle = (title: string): string => {
    if (!title || typeof title !== 'string') {
      return 'Pay Once Per Year'; // Default fallback
    }
    return title.trim();
  };

  const handleNext = async () => {
    if (!selectedPlan) {
      alert('Please select a financing plan before continuing.');
      return;
    }

    try {
      const sanitizedPlan = sanitizePlanTitle(selectedPlan);
      const financingData = { plan: sanitizedPlan };
      localStorage.setItem('financingPlan', JSON.stringify(financingData));

      let currentApplicationId = applicationId || localStorage.getItem('applicationId');
      if (!currentApplicationId) {
        alert('No application ID found. Please complete the enrollment form first.');
        return;
      }

      const formDataToSubmit = {
        application_id: currentApplicationId,
        plan_type: getPlanType(sanitizedPlan)
      };

      await apiService.request('/financing/select-plan', {
        method: 'POST',
        body: JSON.stringify(formDataToSubmit),
      });

      onStepComplete && onStepComplete(4);
      onStepChange && onStepChange(5);

    } catch (error) {
      console.error('Error saving financing plan:', error);
      alert('Error saving financing plan. Please try again.');
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Agreement</h1>
              <p className="text-gray-700 font-medium">Review and agree to the school fee structure</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Step 4 of 6</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '67%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-24 pb-64">
        <FeeAgreement
          applicationId={applicationId}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          onBack={() => onStepChange && onStepChange(3)}
        />
      </div>

      <Footer
        onBack={() => onStepChange && onStepChange(3)}
        onSave={() => {}}
        onNext={handleNext}
        showBack={true}
        showSave={false}
        showNext={true}
        nextLabel="Next: Declaration"
      />
    </div>
  );
};

Step4FeeAgreement.displayName = 'Step4FeeAgreement';

export default Step4FeeAgreement;
