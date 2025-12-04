import React, { useMemo } from 'react';
import OptionCard from './OptionCard';
import { SchoolFees } from '../services/api';

interface FinancingOptionsProps {
  selectedPlan: string;
  onSelectPlan: (title: string) => void;
  fees: SchoolFees;
}

const FinancingOptions: React.FC<FinancingOptionsProps> = ({ selectedPlan, onSelectPlan, fees }) => {
  // Calculate financing options dynamically based on actual fees
  const financingOptionsData = useMemo(() => {
    const annualFee = fees.annual_fee;
    const termFee = fees.term_fee;
    const regFee = fees.registration_fee;
    
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
    
    return [
      {
        title: 'Pay Monthly Debit',
        subtitle: 'No upfront tuition',
        price: `R ${Math.round(annualFee / 12).toLocaleString('en-ZA')}`,
        period: '/month',
        tag: { type: 'save', text: 'Most Flexible' },
        features: [
          { text: `${formatCurrency(regFee)} registration fee due now`, type: 'info' },
          { text: 'No upfront tuition payment', type: 'positive' },
          { text: 'Flexible monthly budget', type: 'positive' },
          { text: 'Spread over 12 months', type: 'positive' },
        ],
      },
      {
        title: 'Pay Per Term',
        subtitle: 'Quarterly payments',
        price: `R ${termFee.toLocaleString('en-ZA')}`,
        period: '/term',
        tag: { type: 'save', text: 'Quarterly' },
        features: [
          { text: `${formatCurrency(regFee)} registration fee applies`, type: 'info' },
          { text: 'Pay per school term', type: 'positive' },
          { text: '4 payments per year', type: 'positive' },
          { text: 'Manageable quarterly budget', type: 'positive' },
        ],
      },
      {
        title: 'Pay Once Per Year',
        subtitle: 'Best value - 5% discount',
        price: `R ${Math.round(annualFee * 0.95).toLocaleString('en-ZA')}`,
        period: '/year',
        tag: { type: 'best-value', text: 'Best Value - Save 5%' },
        features: [
          { text: `${formatCurrency(regFee)} registration fee included`, type: 'info' },
          { text: `Save ${formatCurrency(annualFee * 0.05)} with 5% discount`, type: 'positive' },
          { text: 'One simple payment per year', type: 'positive' },
          { text: 'No monthly admin hassle', type: 'positive' },
        ],
      },
      {
        title: 'Buy Now, Pay Later',
        subtitle: 'Start now, pay over time',
        price: `R ${Math.round((annualFee * 1.12) / 12).toLocaleString('en-ZA')}`,
        period: '/month',
        tag: { type: 'cost', text: '12% Interest' },
        features: [
          { text: `${formatCurrency(regFee)} registration fee required`, type: 'info' },
          { text: 'Start immediately, pay later', type: 'positive' },
          { text: '12% annual interest applies', type: 'neutral' },
          { text: 'Flexible 12-month repayment', type: 'positive' },
        ],
      },
      {
        title: 'Forward Funding',
        subtitle: 'Fast approval financing',
        price: `R ${Math.round((annualFee * 1.15) / 12).toLocaleString('en-ZA')}`,
        period: '/month',
        tag: { type: 'cost', text: '15% Interest' },
        features: [
          { text: `${formatCurrency(regFee)} upfront registration`, type: 'info' },
          { text: 'Quick 24-hour approval', type: 'positive' },
          { text: '15% annual interest rate', type: 'neutral' },
          { text: 'Ideal for urgent enrollment', type: 'positive' },
        ],
      },
      {
        title: 'Sibling Benefit',
        subtitle: 'Family discount program',
        price: `R ${Math.round(annualFee * 0.80).toLocaleString('en-ZA')}`,
        period: '/year',
        tag: { type: 'save', text: 'Save 20% - Family Plan' },
        features: [
          { text: `${formatCurrency(regFee)} per child registration`, type: 'info' },
          { text: `Save ${formatCurrency(annualFee * 0.20)} per sibling`, type: 'positive' },
          { text: 'Applies to 2+ children enrolled', type: 'positive' },
          { text: 'Stackable with other discounts', type: 'positive' },
        ],
      },
      {
        title: 'Pay via EFT',
        subtitle: 'Direct bank transfer',
        price: `R ${Math.round(annualFee / 12).toLocaleString('en-ZA')}`,
        period: '/month',
        tag: { type: 'none', text: 'Traditional' },
        features: [
          { text: `${formatCurrency(regFee)} registration included`, type: 'info' },
          { text: 'Direct bank-to-bank transfer', type: 'positive' },
          { text: 'Monthly payment option available', type: 'positive' },
          { text: 'Banking details provided on approval', type: 'positive' },
        ],
      },
    ];
  }, [fees]);

  const handleSelectPlan = (title: string) => {
    // If clicking on the already selected plan, deselect it
    if (selectedPlan === title) {
      onSelectPlan('');
    } else {
      onSelectPlan(title);
    }
  };

  // Auto-select "Pay Once Per Year" on hover if no plan is selected
  const handleMouseEnter = (title: string) => {
    if (!selectedPlan && title === 'Pay Once Per Year') {
      onSelectPlan(title);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Financing Options</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {financingOptionsData.map((option) => (
          <OptionCard
            key={option.title}
            option={option}
            isSelected={selectedPlan === option.title}
            onSelect={() => handleSelectPlan(option.title)}
            onMouseEnter={() => handleMouseEnter(option.title)}
          />
        ))}
      </div>
    </div>
  );
};

export default FinancingOptions;
