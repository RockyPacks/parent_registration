import React from 'react';

const WarningTriangleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.006-1.742 3.006H4.42c-1.522 0-2.492-1.672-1.742-3.006l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const AffordabilityCard: React.FC = () => {
  const feeToIncomeRatio = 76;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold text-gray-900">Affordability Assessment</h2>
        <div className="bg-orange-100 text-orange-600 font-semibold py-1 px-3 rounded-full flex items-center text-sm">
          <WarningTriangleIcon />
          Financing Recommended
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
        <div>
          <p className="text-sm text-gray-500 mb-1">Annual School Fees</p>
          <p className="text-3xl font-bold text-gray-900">R 85,000</p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center md:justify-start">
              <div className="w-px h-full bg-gray-200 hidden md:block"></div>
          </div>
          <div className="md:pl-8">
            <p className="text-sm text-gray-500 mb-1">Available Disposable Income</p>
            <p className="text-3xl font-bold text-gray-900">R 65,000</p>
          </div>
        </div>
        <div className="relative">
           <div className="absolute inset-0 flex items-center justify-center md:justify-start">
              <div className="w-px h-full bg-gray-200 hidden md:block"></div>
          </div>
          <div className="md:pl-8">
            <p className="text-sm text-gray-500 mb-1">Funding Gap</p>
            <p className="text-3xl font-bold text-danger-DEFAULT">R 20,000</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-600">Fee-to-Income Ratio</p>
          <p className="text-sm font-bold text-gray-900">{feeToIncomeRatio}%</p>
        </div>
        <div className="relative h-2.5 bg-gray-200 rounded-full w-full">
          <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" style={{ width: '100%' }}></div>
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-500" style={{ left: `calc(${feeToIncomeRatio}% - 8px)` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5 px-1">
          <span>Comfortable (0-50%)</span>
          <span>Manageable (50-70%)</span>
          <span>Challenging (70%+)</span>
        </div>
      </div>
    </div>
  );
};

export default AffordabilityCard;
