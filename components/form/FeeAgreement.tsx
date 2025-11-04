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
  onBack?: () => void;
  onNext?: () => void;
}

const FeeAgreement: React.FC<FeeAgreementProps> = ({ onBack, onNext }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('Pay Once Per Year');
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBackendStatus = async () => {
      try {
        const response = await axios.get<BackendStatus>('http://localhost:8000/health');
        setBackendStatus(response.data);
      } catch (error) {
        console.error('Error fetching backend status:', error);
        setBackendStatus({ message: 'Backend unavailable', status: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBackendStatus();
  }, []);

  const handleContinue = async () => {
    try {
      // Get application ID from localStorage or generate temp one
      let applicationId = localStorage.getItem('applicationId');
      if (!applicationId) {
        applicationId = 'temp_' + Date.now();
        localStorage.setItem('applicationId', applicationId);
      }

      // Submit financing plan data to backend
      const formDataToSubmit = {
        application_id: applicationId,
        plan: selectedPlan
      };

      const response = await fetch('http://localhost:8000/financing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        const result = await response.json();
        // Update localStorage with the real application ID if it was a temp ID
        if (result.application_id && result.application_id !== applicationId) {
          localStorage.setItem('applicationId', result.application_id);
        }
        console.log("Continue to next step with selected plan:", selectedPlan);
        if (onNext) {
          onNext();
        }
      } else {
        const errorData = await response.json();
        console.error('Error saving financing plan:', errorData.detail || 'Unknown error');
        alert('Error saving financing plan. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving financing plan. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Financing Options</h1>
          <p className="mt-2 text-lg text-gray-600 max-w-3xl mx-auto">
            We understand that school fees can be challenging. Review your options and pick the best plan for your family.
          </p>
          {isLoading ? (
            <p className="mt-4 text-sm text-gray-500">Connecting to backend...</p>
          ) : (
            backendStatus && (
              <p className={`mt-4 text-sm ${backendStatus.status === 'running' ? 'text-green-600' : 'text-red-600'}`}>
                Backend: {backendStatus.message} ({backendStatus.status})
              </p>
            )
          )}
        </header>

        <main className="space-y-10 pb-32">
          <AffordabilityCard />
          <FinancingOptions selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />
          <InfoSection />
        </main>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
