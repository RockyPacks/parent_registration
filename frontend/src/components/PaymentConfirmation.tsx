import React from 'react';

interface PaymentConfirmationProps {
  onBack: () => void;
  onNext: () => void;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({ onBack, onNext }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Payment Confirmed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your payment has been successfully processed.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={onNext}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Application
          </button>
          <button
            onClick={onBack}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;
