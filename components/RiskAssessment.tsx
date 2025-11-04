import React, { useState, useEffect } from 'react';
import { RiskReport, RiskCheckRequest } from '../types';
import { apiService } from '../src/services/api';

interface RiskAssessmentProps {
  applicationId: string;
  guardianData: {
    name: string;
    email: string;
    id_number: string;
    mobile: string;
    branch_code: string;
    account_number: string;
  };
  onRiskCheckComplete?: (result: { risk_score: number; status: string; flags: string[] }) => void;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  applicationId,
  guardianData,
  onRiskCheckComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runRiskCheck = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: RiskCheckRequest = {
        reference: `APP-${applicationId}-${Date.now()}`,
        guardian: guardianData
      };

      const result = await apiService.runRiskCheck(request);

      // Create a risk report object for display
      const report: RiskReport = {
        id: `risk-${Date.now()}`,
        application_id: applicationId,
        reference: request.reference,
        guardian_email: guardianData.email,
        risk_score: result.risk_score,
        flags: result.flags,
        status: result.status,
        timestamp: new Date().toISOString(),
        raw_response: result,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setRiskReport(report);
      onRiskCheckComplete?.(result);

    } catch (err: any) {
      setError(err.message || 'Failed to perform risk assessment');
      console.error('Risk check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 50) return { level: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (score < 75) return { level: 'Medium Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const getRiskIcon = (score: number) => {
    if (score < 50) {
      return (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else if (score < 75) {
      return (
        <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Assessment</h1>
        <p className="text-gray-600">
          We perform a risk assessment to ensure secure payment processing. This check verifies banking details and helps prevent fraud.
        </p>
      </div>

      {!riskReport && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready for Risk Assessment</h2>
            <p className="text-gray-600 mb-6">
              We'll check the guardian's banking details to ensure secure payment processing.
            </p>
            <button
              onClick={runRiskCheck}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Assessment...
                </>
              ) : (
                'Run Risk Assessment'
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Assessment Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={runRiskCheck}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {riskReport && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Risk Assessment Results</h2>
            <p className="text-sm text-gray-600">Reference: {riskReport.reference}</p>
          </div>

          <div className="p-6">
            <div className="flex items-center mb-6">
              {getRiskIcon(riskReport.risk_score)}
              <div className="ml-4">
                <h3 className={`text-lg font-semibold ${getRiskLevel(riskReport.risk_score).color}`}>
                  {getRiskLevel(riskReport.risk_score).level}
                </h3>
                <p className="text-gray-600">Risk Score: {riskReport.risk_score}/100</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Assessment Details</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Status:</dt>
                    <dd className="text-sm font-medium text-gray-900">{riskReport.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Guardian:</dt>
                    <dd className="text-sm font-medium text-gray-900">{riskReport.guardian_email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Timestamp:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(riskReport.timestamp).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Validation Flags</h4>
                {riskReport.flags && riskReport.flags.length > 0 ? (
                  <ul className="space-y-1">
                    {riskReport.flags.map((flag, index) => (
                      <li key={index} className="flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {flag.replace(/([A-Z])/g, ' $1').trim()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No validation flags available</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Next Steps</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    {riskReport.risk_score < 50 ? (
                      <p>Your risk assessment passed successfully. You can proceed with the enrollment process.</p>
                    ) : riskReport.risk_score < 75 ? (
                      <p>Your risk assessment shows medium risk. Additional verification may be required before proceeding.</p>
                    ) : (
                      <p>Your risk assessment indicates high risk. Please contact our admissions office for assistance.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;
