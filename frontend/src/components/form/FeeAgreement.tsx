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
          <InfoSection />
        </main>
      </div>
    </div>
  );
};

export default FeeAgreement;
