import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AffordabilityCard from '../AffordabilityCard';
import FinancingOptions from '../FinancingOptions';
import InfoSection from '../InfoSection';
import Footer from '../Footer';

interface BackendStatus {
  message: string;
  status: string;
}

interface FeeAgreementProps {
  applicationId?: string | null;
  onBack?: () => void;
  onNext?: () => void;
}

const FeeAgreement: React.FC<FeeAgreementProps> = ({ applicationId, onBack, onNext }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    // Load saved plan from localStorage, default to 'Pay Once Per Year'
    const saved = localStorage.getItem('financingPlan');
    return saved ? JSON.parse(saved).plan || 'Pay Once Per Year' : 'Pay Once Per Year';
  });
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBackendStatus = async () => {
      try {
        const response = await axios.get<BackendStatus>('http://localhost:8000/health');
        setBackendStatus(response.data);
      } catch (error) {
        setBackendStatus({ message: 'Backend unavailable', status: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBackendStatus();
  }, []);

  // Map frontend plan titles to backend plan_types
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

  // Sanitize and validate plan title
  const sanitizePlanTitle = (title: string): string => {
    if (!title || typeof title !== 'string') {
      return 'Pay Once Per Year'; // Default fallback
    }
    // Trim whitespace and ensure proper casing
    return title.trim();
  };

  const handleContinue = async () => {
    // Validate that a plan is selected
    if (!selectedPlan) {
      alert('Please select a financing plan before continuing.');
      return;
    }

    try {
      // Sanitize the selected plan
      const sanitizedPlan = sanitizePlanTitle(selectedPlan);

      // Save to localStorage
      const financingData = { plan: sanitizedPlan };
      localStorage.setItem('financingPlan', JSON.stringify(financingData));

      // Get application ID from localStorage
      let applicationId = localStorage.getItem('applicationId');
      if (!applicationId) {
        alert('No application ID found. Please complete the enrollment form first.');
        return;
      }

      // Submit financing plan data to backend using the correct endpoint
      const formDataToSubmit = {
        application_id: applicationId,
        plan_type: getPlanType(sanitizedPlan)
      };

      const response = await fetch('http://localhost:8000/api/v1/financing/select-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Financing plan saved:', result);
        // Continue to next step with selected plan
        if (onNext) {
          onNext();
        }
      } else {
        const errorData = await response.json();
        console.error('Error saving financing plan:', errorData);
        alert('Error saving financing plan. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving financing plan. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <header className="text-center mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Financing Options</h1>
          <p className="mt-2 text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            We understand that school fees can be challenging. Review your options and pick the best plan for your family.
          </p>

        </header>

        <main className="space-y-6 md:space-y-10 pb-24 md:pb-32">
          <AffordabilityCard />
          <FinancingOptions selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />
          <InfoSection />
        </main>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:p-4">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back
              </button>
            )}
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Continue to Declaration
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FeeAgreement;
