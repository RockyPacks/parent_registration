import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import CheckIcon from './icons/CheckIcon';
import ApplicationForm from './ApplicationForm';
import type { SummaryData } from '../types';

interface ConfirmationPageProps {
  studentName?: string;
  applicationId?: string;
  summaryData?: SummaryData;
  onClose?: () => void;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  studentName,
  applicationId,
  summaryData,
  onClose
}) => {
  const applicationFormRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: applicationFormRef,
    documentTitle: `Application_${applicationId || 'Form'}`,
    pageStyle: `
      @page { size: A4; margin: 2cm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        div { page-break-inside: avoid; }
      }
    `
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Hidden ApplicationForm for printing */}
      {summaryData && (
        <div style={{ display: 'none' }}>
          <div ref={applicationFormRef}>
            <ApplicationForm summaryData={summaryData} applicationId={applicationId || undefined} />
          </div>
        </div>
      )}
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeIn_0.5s_ease-in-out]">
        {/* Success Icon Section with Modern Design */}
        <div className="relative bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 px-4 py-12 sm:px-6 sm:py-16 text-center overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-2xl mb-4 sm:mb-6 animate-[bounce_1s_ease-in-out]">
              <CheckIcon className="w-12 h-12 sm:w-14 sm:h-14 text-green-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight">
              Application Submitted!
            </h1>
            <p className="text-green-50 text-lg sm:text-xl font-medium">
              Thank you for completing your application
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
          {/* Status Message */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
              We're reviewing your application
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-2xl shadow-sm">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed flex-1 pt-1">
                  Your application has been successfully submitted. Our admissions team is reviewing the details. 
                  We will notify you via email once a decision has been made.
                </p>
              </div>
            </div>
          </div>

          {/* Application Details Card */}
          {(studentName || applicationId) && (
            <div className="mb-8 sm:mb-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Application Details</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {studentName && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium flex items-center text-sm sm:text-base mb-1 sm:mb-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Student Name
                    </span>
                    <span className="text-gray-900 font-bold text-base sm:text-lg">{studentName}</span>
                  </div>
                )}
                
                {applicationId && (
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-2 sm:py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium flex items-center text-sm sm:text-base mb-1 sm:mb-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Reference Number
                    </span>
                    <span className="text-blue-600 font-mono font-semibold text-xs sm:text-sm bg-blue-50 px-2 sm:px-3 py-1 rounded-lg break-all text-right max-w-xs">
                      {applicationId}
                    </span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3">
                  <span className="text-gray-600 font-medium flex items-center text-sm sm:text-base mb-1 sm:mb-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Submitted
                  </span>
                  <span className="text-gray-900 font-semibold text-sm sm:text-base">{new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps Timeline */}
          <div className="mb-8 sm:mb-10">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              What happens next?
            </h3>
            <div className="space-y-5 sm:space-y-6">
              {/* Step 1 */}
              <div className="flex items-start group">
                <div className="relative flex-shrink-0 mr-4 sm:mr-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white font-bold text-base sm:text-lg">1</span>
                  </div>
                  <div className="absolute top-10 sm:top-12 left-1/2 w-0.5 h-8 sm:h-10 bg-gradient-to-b from-blue-300 to-purple-300 -translate-x-1/2"></div>
                </div>
                <div className="flex-1 pt-1 sm:pt-2">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Review Process</h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Our admissions team will carefully review your application and all supporting documents to ensure everything is in order.
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex items-start group">
                <div className="relative flex-shrink-0 mr-4 sm:mr-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white font-bold text-base sm:text-lg">2</span>
                  </div>
                  <div className="absolute top-10 sm:top-12 left-1/2 w-0.5 h-8 sm:h-10 bg-gradient-to-b from-purple-300 to-indigo-300 -translate-x-1/2"></div>
                </div>
                <div className="flex-1 pt-1 sm:pt-2">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Email Notification</h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    You'll receive an email with the admissions decision within <span className="font-semibold text-gray-900">5-7 business days</span>.
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex items-start group">
                <div className="relative flex-shrink-0 mr-4 sm:mr-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white font-bold text-base sm:text-lg">3</span>
                  </div>
                </div>
                <div className="flex-1 pt-1 sm:pt-2">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Enrollment Instructions</h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    If accepted, you'll receive detailed enrollment instructions, payment schedule, and next steps to complete the registration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-1 sm:mb-2 text-base sm:text-lg">Important Notice</h4>
                <p className="text-amber-800 text-sm sm:text-base leading-relaxed">
                  Once submitted, applications cannot be edited. If you need to update any information, 
                  please contact our admissions office directly using the details below.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10">
            {summaryData && (
              <button
                onClick={handlePrint}
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-blue-500 text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span className="relative z-10 text-sm sm:text-base">Download Application</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <span className="relative z-10 text-sm sm:text-base">Back to Dashboard</span>
              </button>
            )}
          </div>

          {/* Contact Information Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                Need Help?
              </h4>
              <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                Contact our admissions team
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 text-sm sm:text-base">
                <a 
                  href="mailto:admissions@school.edu" 
                  className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  admissions@school.edu
                </a>
                <span className="hidden sm:inline text-gray-300">•</span>
                <a 
                  href="tel:+27123456789" 
                  className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +27 12 345 6789
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
