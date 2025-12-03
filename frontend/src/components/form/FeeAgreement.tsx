import React from 'react';
import AffordabilityCard from '../AffordabilityCard';
import FinancingOptions from '../FinancingOptions';
import InfoSection from '../InfoSection';

interface FeeAgreementProps {
  applicationId?: string | null;
  selectedPlan: string;
  onSelectPlan: (plan: string) => void;
  onBack?: () => void;
}

const FeeAgreement: React.FC<FeeAgreementProps> = ({ applicationId, selectedPlan, onSelectPlan, onBack }) => {
  return (
    <div className="font-sans text-gray-800">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <header className="text-center mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Financing Options</h1>
          <p className="mt-2 text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            We understand that school fees can be challenging. Review your options and pick the best plan for your family.
          </p>
        </header>

        <main className="space-y-6 md:space-y-10">
          <AffordabilityCard />
          <FinancingOptions selectedPlan={selectedPlan} onSelectPlan={onSelectPlan} />
          
          {/* EFT Payment Instructions - Show when EFT is selected */}
          {selectedPlan === 'Pay via EFT' && (
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border-2 border-blue-200">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">EFT Payment Instructions</h2>
                  <p className="text-gray-600 mb-6">
                    Please use the following banking details to make your payment. Remember to upload proof of payment after completing the transfer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                  <p className="text-lg font-semibold text-gray-900">Standard Bank</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Account Name</p>
                  <p className="text-lg font-semibold text-gray-900">School Name Trust Account</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Account Number</p>
                  <p className="text-lg font-semibold text-gray-900">123 456 7890</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Branch Code</p>
                  <p className="text-lg font-semibold text-gray-900">051001</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Payment Reference</p>
                    <p className="text-sm text-yellow-700">
                      Use: <span className="font-mono font-bold">{applicationId ? `APP-${applicationId.substring(0, 8)}` : 'Student Name'}</span>
                      <br />
                      <span className="text-xs">This helps us identify your payment quickly</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 mb-1">Important Note</p>
                    <p className="text-sm text-blue-700">
                      After making your payment, please upload proof of payment in Step 2 (Document Upload) or email it to 
                      <a href="mailto:finance@school.co.za" className="font-semibold underline ml-1">finance@school.co.za</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <InfoSection />
        </main>
      </div>
    </div>
  );
};

export default FeeAgreement;
