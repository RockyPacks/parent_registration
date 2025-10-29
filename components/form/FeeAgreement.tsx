import React, { useState } from 'react';
import type { PlanType } from '../../types';
import {
    InfoIcon,
    WalletIcon,
    ChartIcon,
    PercentageIcon,
    CreditCardIcon,
    RefreshIcon,
    CheckIcon,
    ArrowRightIcon
} from '../Icons';
import Footer from '../Footer';



const InfoCard = ({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string; }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 flex-1">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
        </div>
    </div>
);

const AffordabilityCard = ({ ratio }: { ratio: number }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 flex-1">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
                <PercentageIcon className="w-6 h-6 text-orange-500"/>
            </div>
            <div>
                <p className="text-sm text-gray-500">Affordability Ratio</p>
                <p className="text-2xl font-bold text-orange-500">{ratio}%</p>
                <p className="text-sm text-gray-500">Fee-to-income ratio</p>
            </div>
        </div>
    </div>
);


const PlanCard = ({ title, description, icon, details, benefits, interest, onSelect, isSelected }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    details: { label: string; value: string; valueHighlight?: boolean }[];
    benefits: string[];
    interest: { value: string; label: string };
    onSelect: () => void;
    isSelected: boolean;
}) => (
    <div className={`bg-white rounded-xl border-2 ${isSelected ? 'border-blue-600' : 'border-gray-200'} p-6 flex flex-col`}>
        <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>

        <div className="space-y-3 mb-4">
            {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{detail.label}</span>
                    <span className="font-semibold text-gray-800">{detail.value}</span>
                </div>
            ))}
        </div>

        <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-green-700">{interest.label}</span>
                <span className="font-bold text-green-700">{interest.value}</span>
            </div>
        </div>

        <div className="space-y-2 mb-6">
            <h4 className="font-semibold text-sm text-gray-800">Benefits</h4>
            <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                    </li>
                ))}
            </ul>
        </div>

        <button onClick={onSelect} className={`mt-auto w-full py-2.5 px-4 rounded-lg font-semibold transition duration-300 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {isSelected ? 'Selected' : `Select ${title}`}
        </button>
    </div>
);

const ArrearsCard = ({ isSelected, onSelect }: { isSelected: boolean, onSelect: () => void }) => (
    <div className={`bg-white rounded-xl border-2 ${isSelected ? 'border-blue-600' : 'border-gray-200'} p-6`}>
        <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full mr-4">
                <RefreshIcon className="w-6 h-6 text-orange-500" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">Arrears BNPL Pathway</h3>
                <p className="text-sm text-gray-500">Catch up on outstanding payments with structured repayment plans</p>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-4">
            <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-3xl font-bold text-orange-600">R45,000</p>
                <p className="text-xs text-gray-500 mb-2">Previous term fees</p>
                <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between"><span>Term 1:</span><span>R15,000</span></div>
                    <div className="flex justify-between"><span>Term 2:</span><span>R15,000</span></div>
                    <div className="flex justify-between"><span>Term 3:</span><span>R15,000</span></div>
                </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Restructured Payment</p>
                <p className="text-3xl font-bold text-blue-600">R4,500</p>
                <p className="text-xs text-gray-500 mb-2">Monthly payment</p>
                <div className="text-xs text-gray-600 space-y-1">
                    <p>Duration: 12 months</p>
                    <p>Interest: 15.5% p.a.</p>
                    <p>Total: R54,000</p>
                </div>
            </div>
            <div className="p-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-2">Benefits</h4>
                <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600"><CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Avoid account suspension</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Maintain child's education</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Affordable monthly payments</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> Rebuild payment history</li>
                </ul>
            </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-semibold text-yellow-800">Important Notice</p>
            <p className="text-sm text-yellow-700">This option is available for parents with existing arrears. A deposit of 20% of the outstanding balance is required to activate this plan.</p>
        </div>

        <div className="text-center">
             <button onClick={onSelect} className={`w-full md:w-auto py-2.5 px-6 rounded-lg font-semibold transition duration-300 ${isSelected ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                {isSelected ? 'Selected' : 'Apply for Arrears BNPL'}
            </button>
        </div>
    </div>
);

const PaymentComparison = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Comparison</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">Feature</th>
                        <th scope="col" className="px-6 py-3">Forward-Funding</th>
                        <th scope="col" className="px-6 py-3">BNPL</th>
                        <th scope="col" className="px-6 py-3 rounded-r-lg">Arrears BNPL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-white border-b"><th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Initial Payment</th><td className="px-6 py-4">R102,000</td><td className="px-6 py-4">R25,500</td><td className="px-6 py-4">R9,000</td></tr>
                    <tr className="bg-white border-b"><th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Monthly Payment</th><td className="px-6 py-4">R9,500</td><td className="px-6 py-4">R8,500</td><td className="px-6 py-4">R4,500</td></tr>
                    <tr className="bg-white border-b"><th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Interest/Fee Rate</th><td className="px-6 py-4 text-green-600 font-semibold">12.5%</td><td className="px-6 py-4 text-red-500 font-semibold">8.5%</td><td className="px-6 py-4 text-red-500 font-semibold">15.5%</td></tr>
                    <tr className="bg-white border-b"><th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Total Cost</th><td className="px-6 py-4">R114,000</td><td className="px-6 py-4">R110,500</td><td className="px-6 py-4">R54,000</td></tr>
                    <tr className="bg-white"><th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">Best For</th><td className="px-6 py-4">Large upfront budget</td><td className="px-6 py-4">Regular income</td><td className="px-6 py-4">Outstanding balances</td></tr>
                </tbody>
            </table>
        </div>
    </div>
);


interface FeeAgreementProps {
  onBack?: () => void;
  onNext?: () => void;
}

const FeeAgreement: React.FC<FeeAgreementProps> = ({ onBack, onNext }) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [isNextEnabled, setIsNextEnabled] = useState(false);

    const handleSelectPlan = (plan: PlanType) => {
        setSelectedPlan(plan);
        validateSelection();
    };

    const validateSelection = () => {
        const errors: {[key: string]: string} = {};

        if (!selectedPlan) {
            errors.plan = 'A financing plan must be selected';
        }

        setValidationErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        setIsNextEnabled(isValid);
        return isValid;
    };

    const handleContinue = () => {
        if (!validateSelection()) {
            return;
        }
        console.log("Continue to next step with selected plan:", selectedPlan);
        if (onNext) {
            onNext();
        }
    };



    const handleSkip = () => {
        console.log("Skipping financing step. Status remains 'pending'.");
        // This would navigate to the next step
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">School Fee Financing Options</h1>
                <p className="text-lg text-gray-600">
                    Choose a flexible payment solution that works with your budget. Both forward-funding and Buy Now, Pay Later options are available.
                </p>
            </div>

            <section className="grid md:grid-cols-3 gap-6 mb-8">
                <InfoCard icon={<WalletIcon className="w-6 h-6 text-blue-500" />} title="Total School Fees" value="R102,000" subtitle="Annual fees for 2024" />
                <InfoCard icon={<ChartIcon className="w-6 h-6 text-blue-500" />} title="Monthly Income" value="R25,000" subtitle="Net household income" />
                <AffordabilityCard ratio={34} />
            </section>

            <section className="grid md:grid-cols-2 gap-6 mb-8">
                <PlanCard
                    title="Forward-Funding"
                    description="Pay school fees upfront with flexible repayment"
                    icon={<WalletIcon className="w-6 h-6 text-blue-600" />}
                    details={[
                        { label: 'Upfront Payment', value: 'R102,000' },
                        { label: 'Monthly Repayment', value: 'R9,500' },
                        { label: 'Repayment Period', value: '12 months' },
                    ]}
                    interest={{ label: 'Interest Rate', value: '12.5% p.a.' }}
                    benefits={['School fees paid immediately', 'No risk of fee increases', 'Competitive interest rates', 'Flexible repayment terms']}
                    isSelected={selectedPlan === 'forward-funding'}
                    onSelect={() => handleSelectPlan('forward-funding')}
                />
                 <PlanCard
                    title="Buy Now, Pay Later"
                    description="Spread payments throughout the school year"
                    icon={<CreditCardIcon className="w-6 h-6 text-blue-600" />}
                    details={[
                        { label: 'Initial Payment', value: 'R25,500' },
                        { label: 'Monthly Payment', value: 'R8,500' },
                        { label: 'Payment Period', value: '10 months' },
                    ]}
                    interest={{ label: 'Service Fee', value: '8.5% p.a.' }}
                    benefits={['Lower initial payment', 'Aligned with income cycles', 'Better cash flow management', 'Immediate school enrollment']}
                    isSelected={selectedPlan === 'bnpl'}
                    onSelect={() => handleSelectPlan('bnpl')}
                />
            </section>

            <section className="mb-8">
                <ArrearsCard
                    isSelected={selectedPlan === 'arrears-bnpl'}
                    onSelect={() => handleSelectPlan('arrears-bnpl')}
                />
            </section>

            <section className="mb-8">
                <PaymentComparison />
            </section>

            {/* Enhanced Validation Errors Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-sm animate-fade-in">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-red-800 mb-1">
                        Required Information Missing
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {Object.keys(validationErrors).length} field{Object.keys(validationErrors).length !== 1 ? 's' : ''} required
                      </span>
                    </div>
                    <p className="text-red-700 mb-4 text-sm">
                      Please complete all required fields below before proceeding to the next step.
                    </p>

                    <div className="space-y-4">
                      <div className="bg-white/50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center mb-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <h5 className="font-semibold text-red-800 text-sm">Fee Agreement</h5>
                        </div>
                        <ul className="space-y-2">
                          {Object.entries(validationErrors).map(([key, message]) => (
                            <li key={key} className="flex items-start text-sm">
                              <span className="text-red-500 mr-2 mt-1">•</span>
                              <span className="text-red-700">{message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-red-200">
                      <p className="text-xs text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Complete all required fields to continue with your enrollment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}



            <Footer
                onBack={onBack}
                onSave={() => {}}
                onNext={() => {
                  if (validateSelection()) {
                    handleContinue();
                  }
                }}
                showBack={true}
                showSave={true}
                showNext={true}
                nextLabel="Next: Declaration"
                isLoading={!isNextEnabled}
            />
        </div>
    );
};

export default FeeAgreement;
