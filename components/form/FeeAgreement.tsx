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
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  useEffect(() => {
    const fetchBackendStatus = async () => {
      try {
        const response = await axios.get<BackendStatus>('http://localhost:8001/health');
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
    if (!selectedPlan) {
      alert('Please select a financing plan before continuing.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Get application ID from localStorage or generate temp one
      let applicationId = localStorage.getItem('applicationId');
      if (!applicationId) {
        applicationId = 'temp_' + Date.now();
        localStorage.setItem('applicationId', applicationId);
      }

      // Calculate amount based on selected plan (you may want to make this dynamic)
      const planAmounts: { [key: string]: number } = {
        'Pay Once Per Year': 102000, // Full amount
        'forward-funding': 102000, // Full amount upfront
        'bnpl': 25500, // Initial payment for BNPL
        'arrears-bnpl': 9000, // Deposit for arrears BNPL
      };

      const amount = planAmounts[selectedPlan] || 102000;

      // Create payment request with Netcash
      const paymentRequest = {
        amount: amount,
        reference: `EDUFINANCE-${applicationId}-${Date.now()}`,
        description: `School fees payment for ${selectedPlan} plan`,
      };

      const response = await fetch('http://localhost:8000/api/v1/payment/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payment created:', result);

        // Store payment reference for tracking
        localStorage.setItem('paymentReference', result.reference);

        // Redirect to Netcash payment page
        window.location.href = result.redirect_url;
      } else {
        const errorData = await response.json();
        console.error('Error creating payment:', errorData.detail || 'Unknown error');
        alert('Error creating payment. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
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
                disabled={isProcessingPayment}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}
            <div className="flex flex-col items-end">
              {isProcessingPayment && (
                <p className="text-sm text-blue-600 mb-2">Redirecting you to the secure Netcash payment page...</p>
              )}
              <button
                onClick={handleContinue}
                disabled={isProcessingPayment}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? 'Processing Payment...' : 'Continue to Declaration'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FeeAgreement;
