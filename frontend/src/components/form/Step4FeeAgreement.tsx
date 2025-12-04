import React, { useState, useEffect, useRef } from 'react';
import FeeAgreement from './FeeAgreement';
import Footer from '../Footer';
import { apiService, SchoolFees } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface Step4FeeAgreementProps {
  applicationId?: string | null;
  onFeeAgreementComplete?: () => void;
  onStepChange?: (step: number) => void;
  onStepComplete?: (stepNumber: number) => void;
  onDataChange?: (data: any) => void;
  initialData?: { plan?: string };
}

const Step4FeeAgreement: React.FC<Step4FeeAgreementProps> = ({
  applicationId,
  onFeeAgreementComplete,
  onStepChange,
  onStepComplete,
  onDataChange,
  initialData
}) => {
  // Initialize from initialData (localStorage via MainContent) or default
  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    if (initialData?.plan) {
      return initialData.plan;
    }
    return 'Pay Once Per Year';
  });
  const [fees, setFees] = useState<SchoolFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  
  // Use ref to avoid re-render loops with onDataChange callback
  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Fetch fees based on the student's grade
  useEffect(() => {
    const fetchFees = async () => {
      if (!applicationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 1. Get Application to find the grade
        const appData = await apiService.getApplication(applicationId);
        const grade = appData.student?.grade_applied_for;

        if (grade) {
          // 2. Get Fees for that grade
          const feeData = await apiService.getSchoolFees(grade);
          setFees(feeData);
        } else {
          setError('Grade information not found. Please complete student information first.');
        }
      } catch (err: any) {
        console.error('Failed to load fees:', err);
        setError('Could not load fee structure. Please try again.');
        addToast('Could not load fee structure', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [applicationId, addToast]);

  // Update selectedPlan when initialData changes (e.g., after data is loaded from backend)
  useEffect(() => {
    if (initialData?.plan) {
      setSelectedPlan(initialData.plan);
    }
  }, [initialData?.plan]);

  // Call onDataChange whenever selectedPlan changes or initialData is loaded
  useEffect(() => {
    // Also include feeData, as it's often related to financing in the summary
    onDataChangeRef.current?.({ plan: selectedPlan });
  }, [selectedPlan]);

  const getPlanType = (planTitle: string): string => {
    const planMapping: { [key: string]: string } = {
      'Pay Monthly Debit': 'monthly_flat',
      'Pay Per Term': 'termly_discount',
      'Pay Once Per Year': 'annual_discount',
      'Buy Now, Pay Later': 'bnpl',
      'Forward Funding': 'forward_funding',
      'Sibling Benefit': 'sibling_discount',
      'Pay via EFT': 'eft'
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
      addToast('Please select a financing plan before continuing.', 'error');
      return;
    }

    try {
      const sanitizedPlan = sanitizePlanTitle(selectedPlan);
      // Note: No need to write to localStorage here - onDataChange already handles user-specific storage

      let currentApplicationId = applicationId;
      if (!currentApplicationId) {
        addToast('No application ID found. Please complete the enrollment form first.', 'error');
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

      addToast('Financing plan saved successfully!', 'success');
      onStepComplete && onStepComplete(4);
      onStepChange && onStepChange(5);

    } catch (error) {
      addToast('Error saving financing plan. Please try again.', 'error');
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 mt-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">Fee Agreement</h1>
              <p className="text-gray-700 font-medium">Review and agree to the school fee structure</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Modern Step Indicator */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 font-bold text-lg">4</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step 4 of 6</div>
                  <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    67% Complete
                  </div>
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
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fee structure...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold mb-2">{error}</p>
            <button
              onClick={() => onStepChange && onStepChange(1)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Student Information
            </button>
          </div>
        ) : fees ? (
          <FeeAgreement
            applicationId={applicationId}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onBack={() => onStepChange && onStepChange(3)}
            fees={fees}
          />
        ) : null}
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
