import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiService } from '../../services/api';
import { DownloadIcon, ArrowLeftIcon, ArrowRightIcon } from '../Icons';
import Footer from '../Footer';

interface ConfirmationChecks {
  agree_truth: boolean;
  agree_policies: boolean;
  agree_financial: boolean;
  agree_verification: boolean;
  agree_data_processing: boolean;
  agree_audit_storage: boolean;
  agree_affordability_processing: boolean;
}



const CONFIRMATIONS = [
  { id: 'agree_truth', label: 'I confirm that all information provided in this application is true and correct.' },
  { id: 'agree_policies', label: 'I agree to abide by the school\'s rules, policies, and code of conduct.' },
  { id: 'agree_financial', label: 'I acknowledge responsibility for all school fees as per the agreement.' },
  { id: 'agree_verification', label: 'I consent to the school verifying my information where required.' },
  { id: 'agree_data_processing', label: 'I consent to the storage and processing of my personal information.' },
  { id: 'agree_audit_storage', label: 'I consent to storing my information for the school audit processes.' },
  { id: 'agree_affordability_processing', label: 'I consent to the school processing my information for affordability check.' },
] as const;

type ConfirmationKeys = typeof CONFIRMATIONS[number]['id'];

interface DeclarationStepProps {
  onBack?: () => void;
  onNext?: () => void;
}

const DeclarationStep: React.FC<DeclarationStepProps> = ({ onBack, onNext }) => {
  const [confirmations, setConfirmations] = useState<ConfirmationChecks>({
    agree_truth: false,
    agree_policies: false,
    agree_financial: false,
    agree_verification: false,
    agree_data_processing: false,
    agree_audit_storage: false,
    agree_affordability_processing: false,
  });
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [isContinueDisabled, setIsContinueDisabled] = useState(true);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);



  const today = new Date().toISOString().split('T')[0];

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setConfirmations(prev => ({ ...prev, [name]: checked }));
  };

  const handleFullNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(event.target.value);
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCity(event.target.value);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const showFullNameError = touched.fullName && fullName.trim().length < 3;






  useEffect(() => {
    const allChecked = Object.values(confirmations).every(Boolean);
    const isNameValid = fullName.trim().length >= 3;
    setIsContinueDisabled(!(allChecked && isNameValid));
    validateDeclaration();
    // Save to localStorage whenever form data changes
    const declarationData = {
      application_id: localStorage.getItem('applicationId'),
      agree_truth: confirmations.agree_truth,
      agree_policies: confirmations.agree_policies,
      agree_financial: confirmations.agree_financial,
      agree_verification: confirmations.agree_verification,
      agree_data_processing: confirmations.agree_data_processing,
      agree_audit_storage: confirmations.agree_audit_storage,
      agree_affordability_processing: confirmations.agree_affordability_processing,
      fullName,
      city,
      status: 'in_progress'
    };
    localStorage.setItem('declarationData', JSON.stringify(declarationData));
  }, [confirmations, fullName, city]);

  const validateDeclaration = () => {
    const errors: {[key: string]: string} = {};

    if (!Object.values(confirmations).every(Boolean)) {
      errors.confirmations = 'All declaration confirmations must be checked';
    }
    if (fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters';
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsNextEnabled(isValid);
    return isValid;
  };



  const handleSaveProgress = async () => {
      console.log('Saving progress...');
      try {
        const declarationData = {
          application_id: localStorage.getItem('applicationId'),
          agree_truth: confirmations.agree_truth,
          agree_policies: confirmations.agree_policies,
          agree_financial: confirmations.agree_financial,
          agree_verification: confirmations.agree_verification,
          agree_data_processing: confirmations.agree_data_processing,
          agree_audit_storage: confirmations.agree_audit_storage,
          agree_affordability_processing: confirmations.agree_affordability_processing,
          fullName,
          city,
          status: 'in_progress'
        };

        // Save to localStorage
        localStorage.setItem('declarationData', JSON.stringify(declarationData));

        const responseData = await apiService.submitDeclaration(declarationData);
        if (responseData.application_id) {
            localStorage.setItem('applicationId', responseData.application_id);
        }
        alert('Your progress has been saved!');
      } catch (error) {
        console.error('Error saving progress:', error);
        alert('Failed to save progress. Please try again.');
      }
  };

  const handleContinue = async () => {
      if(isContinueDisabled) return;
      console.log('Continuing to next step...');
      try {
        const declarationData = {
          application_id: localStorage.getItem('applicationId'),
          agree_truth: confirmations.agree_truth,
          agree_policies: confirmations.agree_policies,
          agree_financial: confirmations.agree_financial,
          agree_verification: confirmations.agree_verification,
          agree_data_processing: confirmations.agree_data_processing,
          agree_audit_storage: confirmations.agree_audit_storage,
          agree_affordability_processing: confirmations.agree_affordability_processing,
          fullName,
          city,
          status: 'completed'
        };

        // Save to localStorage
        localStorage.setItem('declarationData', JSON.stringify(declarationData));

        const responseData = await apiService.submitDeclaration(declarationData);
        if (responseData.application_id) {
            localStorage.setItem('applicationId', responseData.application_id);
        }
       // alert('Declaration complete! Moving to the next step.');
        if (onNext) {
            onNext();
        }
      } catch (error) {
        console.error('Error submitting declaration:', error);
       // alert('Failed to submit declaration. Please try again.');
      }
  };


  return (
    <div className="flex flex-col h-full">
        <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Declaration</h1>
        </header>

        <div className="flex-grow mt-8 space-y-8 overflow-y-auto pr-2">
            <Card title="Declaration Text">
                <div className="space-y-4 max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <div>
                        <h4 className="font-semibold text-gray-800">Code of Conduct Acknowledgement</h4>
                        <p>By submitting this application, I acknowledge that I have read, understood, and agree to abide by the school's Code of Conduct. I understand that any violation of these standards may result in disciplinary action, including suspension or expulsion.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Financial Responsibility Acceptance</h4>
                        <p>I acknowledge full responsibility for all school fees, charges, and associated costs as outlined in the fee agreement. I understand that failure to meet payment obligations may affect my child's continued enrollment at the institution.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Accuracy of Information Declaration</h4>
                        <p>I declare that all information provided in this application is true, complete, and accurate to the best of my knowledge. I understand that providing false or misleading information may result in the rejection of this application or termination of enrollment.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Consent to Verify Information</h4>
                        <p>I consent to the school verifying any information provided in this application through appropriate channels, including but not limited to previous schools, employers, and reference contacts.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Data Processing Consent (POPIA/GDPR Compliant)</h4>
                        <p>I consent to the collection, storage, processing, and use of my personal information and that of my child for the purposes of education administration, communication, and compliance with legal requirements. I understand my rights regarding data protection and privacy.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Audit Storage Consent</h4>
                        <p>I consent to storing my information for the school audit processes.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Affordability Processing Consent</h4>
                        <p>I consent to the school processing my information for affordability check.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">School Rules and Disciplinary Policy Agreement</h4>
                        <p>I agree to support and enforce the school's rules, policies, and disciplinary procedures. I understand that cooperation between home and school is essential for my child's success and the wellbeing of the school community.</p>
                    </div>
                </div>
                <a href="/assets/school-policy.pdf" download="school-policy.pdf" className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm">
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download Full Policy (PDF)
                </a>
            </Card>

            <Card title="Required Confirmations" subtitle="All confirmations below are required to proceed">
                <div className="space-y-4">
                    {CONFIRMATIONS.map(item => (
                        <label key={item.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                name={item.id}
                                checked={confirmations[item.id as ConfirmationKeys]}
                                onChange={handleCheckboxChange}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                            />
                            <span className="ml-3 text-gray-700">{item.label}</span>
                        </label>
                    ))}
                </div>
            </Card>

            <Card title="Digital Signature" subtitle="Your digital signature is required to complete this declaration">
                 <div className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name (as Digital Signature) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={handleFullNameChange}
                            onBlur={() => handleBlur('fullName')}
                            placeholder="Enter your full name"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${showFullNameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        />
                        <p className={`mt-1 text-sm ${showFullNameError ? 'text-red-600' : 'text-gray-500'}`}>
                            Minimum 3 characters required
                        </p>
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">Place / City</label>
                        <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={handleCityChange}
                            placeholder="Enter city (optional)"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="text"
                            id="date"
                            value={today}
                            readOnly
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white sm:text-sm cursor-default"
                        />
                    </div>
                </div>
            </Card>
        </div>

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
                      <h5 className="font-semibold text-red-800 text-sm">Declaration</h5>
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



        {/* Submit Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (validateDeclaration()) {
                handleContinue();
              }
            }}
            disabled={!isNextEnabled}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
          >
            Submit Declaration & Continue to Review
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            Complete all declarations and enter your name to submit and proceed to the final review
          </p>
        </div>

        <Footer
            onBack={onBack}
            onSave={handleSaveProgress}
            onNext={() => {}}
            showBack={true}
            showSave={true}
            showNext={false}
            nextLabel="Next: Review and Submit"
            isLoading={false}
        />
    </div>
  );
};


const Card: React.FC<{ title: string, subtitle?: string, children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <section>
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            <div className="mt-6">
                {children}
            </div>
        </div>
    </section>
);

export default DeclarationStep;
