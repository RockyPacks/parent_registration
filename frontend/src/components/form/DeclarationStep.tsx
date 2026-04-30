import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiService } from '../../services/api';
import { DownloadIcon, ArrowLeftIcon, ArrowRightIcon } from '../Icons';
import Footer from '../Footer';
import { useToast } from '../../hooks/useToast';

interface ConfirmationChecks {
  agreeTruth: boolean;
  agreePolicies: boolean;
  agreeFinancial: boolean;
  agreeVerification: boolean;
  agreeDataProcessing: boolean;
  agreeAuditStorage: boolean;
  agreeAffordabilityProcessing: boolean;
}



const CONFIRMATIONS = [
  { id: 'agreeTruth', label: 'I confirm that I have read and understood the Data Upload and Privacy Declaration, and I consent to the collection and processing of my personal information as described above.' },
] as const;

type ConfirmationKeys = typeof CONFIRMATIONS[number]['id'];

interface DeclarationStepProps {
  applicationId?: string | null;
  onDataChange?: (data: any) => void;
  onStepChange?: (step: number) => void;
  onStepComplete?: (step: number) => void;
  // The 'onDeclarationComplete' prop is passed but not used, we'll use onStepChange/onStepComplete instead.
  onDeclarationComplete?: () => void;
  initialData?: any;
}

const DeclarationStep: React.FC<DeclarationStepProps> = ({ applicationId, onDataChange, onStepChange, onStepComplete, initialData }) => {
  console.log('DeclarationStep mounted with initialData:', { hasSignature: !!initialData?.signatureImage, fullName: initialData?.fullName });
  
  const [confirmations, setConfirmations] = useState<ConfirmationChecks>(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      return {
        agreeTruth: initialData.agreeTruth || initialData.agree_truth || false,
        agreePolicies: initialData.agreePolicies || initialData.agree_policies || true,
        agreeFinancial: initialData.agreeFinancial || initialData.agree_financial || true,
        agreeVerification: initialData.agreeVerification || initialData.agree_verification || true,
        agreeDataProcessing: initialData.agreeDataProcessing || initialData.agree_data_processing || true,
        agreeAuditStorage: initialData.agreeAuditStorage || initialData.agree_audit_storage || true,
        agreeAffordabilityProcessing: initialData.agreeAffordabilityProcessing || initialData.agree_affordability_processing || true,
      };
    }
    return {
      agreeTruth: false,
      agreePolicies: true,
      agreeFinancial: true,
      agreeVerification: true,
      agreeDataProcessing: true,
      agreeAuditStorage: true,
      agreeAffordabilityProcessing: true,
    };
  });

  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [dataLoadedFromBackend, setDataLoadedFromBackend] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(!!initialData && Object.keys(initialData).length > 0);
  const [isContinueDisabled, setIsContinueDisabled] = useState(true);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [signature, setSignature] = useState<string | null>(initialData?.signatureImage || initialData?.signature_image || initialData?.signature || null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(!!signature);

  // Initialize Canvas and restore signature if exists
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Restore existing signature to canvas
    if (signature) {
      console.log('Restoring signature to canvas. Signature length:', signature.length);
      const img = new Image();
      img.onload = () => {
        console.log('Signature image loaded. Drawing to canvas size:', canvas.width, 'x', canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log('Signature restored to canvas');
      };
      img.onerror = (e) => {
        console.error('Failed to load signature image:', e);
      };
      img.src = signature;
    }
  }, [signature]);

  // Sync signature and other fields when initialData changes (e.g., on page reload)
  useEffect(() => {
    const sig = initialData?.signatureImage || initialData?.signature_image || initialData?.signature;
    if (sig) {
      console.log('Updating signature from initialData');
      setSignature(sig);
      setHasSigned(true);
    }
    if (initialData?.fullName) {
      setFullName(initialData.fullName);
    }
    if (initialData?.city) {
      setCity(initialData.city);
    }
  }, [initialData?.signatureImage, initialData?.signature_image, initialData?.signature, initialData?.fullName]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasSigned(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
    setHasSigned(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL();
    console.log('Signature saved');
    setSignature(dataURL);
    setHasSigned(true);
  };

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const { addToast } = useToast();

  // Load existing declaration from backend when user returns to this step
  useEffect(() => {
    const loadExistingData = async () => {
      if (!applicationId || dataLoadedFromBackend) return;
      
      try {
        console.log('Loading declaration data for application:', applicationId);
        const backendData = await apiService.getDeclaration(applicationId);
        
        if (backendData && backendData.id) {
          console.log('Loaded declaration data:', backendData);
          
          setConfirmations({
            agreeTruth: backendData.agreeTruth || false,
            agreePolicies: backendData.agreePolicies || false,
            agreeFinancial: backendData.agreeFinancial || false,
            agreeVerification: backendData.agreeVerification || false,
            agreeDataProcessing: backendData.agreeDataProcessing || false,
            agreeAuditStorage: backendData.agreeAuditStorage || false,
            agreeAffordabilityProcessing: backendData.agreeAffordabilityProcessing || false,
          });
          
          setFullName(backendData.fullName || '');
          setCity(backendData.city || '');
          
          // If signature exists from backend, mark as signed
          const sig = backendData.signature_image || backendData.signatureImage || backendData.signature;
          if (sig) {
            setSignature(sig);
            setHasSigned(true);
          }
          
          setDataLoadedFromBackend(true);
        }
      } catch (error) {
        console.log('No existing declaration data found, starting fresh');
        // No data found - user can fill fresh form
      }
    };

    if (applicationId) {
      loadExistingData();
    }
  }, [applicationId, dataLoadedFromBackend]);



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
    const displayedChecksValid = CONFIRMATIONS.every(item => confirmations[item.id as ConfirmationKeys]);
    const isNameValid = fullName.trim().length >= 3;
    const isValid = displayedChecksValid && isNameValid && hasSigned;
    setIsContinueDisabled(!isValid);
    validateDeclaration();
    
    // Save to localStorage whenever form data changes
    const declarationData = {
      application_id: applicationId,
      agreeTruth: confirmations.agreeTruth,
      ...confirmations,
      fullName,
      city,
      signatureImage: signature,
      status: isValid ? 'completed' : 'in_progress', // Set status to 'completed' only if valid
      signed: isValid // Explicitly set signed status for PDF rendering
    };
    
    console.log('DeclarationStep: Update effect - signature present:', !!signature, 'signature length:', signature?.length || 0);
    
    // Only propagate changes if we have meaningful data or if we've been initialized
    const hasData = fullName || Object.values(confirmations).some(Boolean) || signature;
    if (onDataChange && (hasData || dataInitialized || dataLoadedFromBackend)) {
      console.log('DeclarationStep: Calling onDataChange with signature:', !!declarationData.signatureImage, 'length:', declarationData.signatureImage?.length || 0);
      onDataChange(declarationData);
    }
  }, [confirmations, fullName, city, signature, applicationId, dataInitialized, dataLoadedFromBackend, hasSigned, onDataChange]);

  const validateDeclaration = () => {
    const errors: {[key: string]: string} = {};

    const displayedChecksValid = CONFIRMATIONS.every(item => confirmations[item.id as ConfirmationKeys]);
    if (!displayedChecksValid) {
      errors.confirmations = 'You must agree to the declaration';
    }
    if (fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters';
    }
    if (!hasSigned) {
      errors.signature = 'Interactive signature is required';
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
          application_id: applicationId,
          ...confirmations,
          fullName,
          city,
          signatureImage: signature,
          status: 'in_progress'
        };

        onDataChange && onDataChange(declarationData);

        const responseData = await apiService.submitDeclaration(declarationData);
        if (responseData.applicationId) {
            // The parent component is responsible for managing the application ID state
        }
        addToast('Your progress has been saved!', 'success');
      } catch (error) {
        addToast('Failed to save progress. Please try again.', 'error');
      }
  };

  const handleContinue = async () => {
      console.log('handleContinue called');
      console.log('isContinueDisabled:', isContinueDisabled);
      console.log('isSubmitting:', isSubmitting);
      
      if(isContinueDisabled || isSubmitting) {
        console.log('Preventing continuation - disabled or already submitting');
        return;
      }
      
      setIsSubmitting(true);
      
      const declarationData = {
        application_id: applicationId,
        ...confirmations,
        fullName,
        city,
        signatureImage: signature,
        status: 'completed',
        signed: true // Explicitly mark as signed upon successful continuation
      };

      try {
        console.log('Submitting declaration with data:', declarationData);
        const response = await apiService.submitDeclaration(declarationData);
        console.log('Declaration submission response:', response);
        
        onDataChange && onDataChange(declarationData); // Ensure parent also gets the updated data with signed: true
        console.log('onDataChange callback called');

        // Use the props from MainContent to navigate
        console.log('Calling navigation callbacks: onStepComplete(5) and onStepChange(6)');
        onStepComplete && onStepComplete(5);
        onStepChange && onStepChange(6);
        console.log('Navigation callbacks completed');
      } catch (error) {
        addToast('Failed to submit declaration. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
  };


  return (
    <div className="flex flex-col h-full space-y-8 animate-fade-in">
        <header className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Declaration</h1>
            <p className="text-gray-500 mt-2">Please review and sign to complete your application</p>
        </header>

        <div className="flex-grow space-y-8">
            <Card title="Data Upload and Privacy Declaration">
                <div className="space-y-6 max-h-[400px] overflow-y-auto p-6 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed shadow-inner">
                    <div className="text-center border-b pb-4 mb-4">
                        <h2 className="text-lg font-bold text-gray-900 uppercase">OFFICIAL DECLARATION</h2>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            Responsible Party: Knit Academy | admissions@knit.edu
                        </p>
                    </div>
                    
                    <p className="italic font-medium text-indigo-900 bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
                        Please read and acknowledge the following before uploading your documents. By clicking "I Agree" you confirm that you have read and understood this declaration and consent to the processing of your personal information as described below.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">1. Consent to Collection and Processing</h4>
                            <p>I freely and voluntarily consent to Knit Academy ('the School') collecting and processing my personal information — including my Identity Document, bank statements, and payslips — for the purposes described in this declaration.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">2. Purpose of Processing</h4>
                            <p>My documents are required solely for the purposes of verifying my identity, assessing financial affordability, structuring school fee payment arrangements, and managing my school fee account. My information will not be used for any other purpose without my separate, specific consent.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">3. Accuracy of Information</h4>
                            <p>I confirm that all documents and information I upload are authentic, accurate, and current. I understand that submitting fraudulent or altered documents may result in rejection of my payment plan and further action by the School, including referral to law enforcement.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">4. Verification and Credit Checks</h4>
                            <p>I authorise the School to verify the information I have provided. Where applicable, this will include sharing my financial information with registered credit bureaus — including Experian South Africa (Pty) Ltd and/or Credit Intelligence — solely for the purpose of conducting an affordability assessment in connection with my school fee payment arrangement. This information will not be used for any unrelated credit or marketing purpose.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">5. Automated Processing</h4>
                            <p>I understand that my information may be used in automated affordability assessments to determine suitable fee payment arrangements. I have the right to request that any material decision affecting my account be reviewed by a person. To exercise this right, contact <span className="font-bold">admissions@knit.edu</span>.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">6. Data Security and POPIA</h4>
                            <p>My documents will be encrypted, stored securely, and processed in strict compliance with the Protection of Personal Information Act 4 of 2013 ("POPIA"). My data will not be sold or used for third-party marketing.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">7. Authorised Service Providers</h4>
                            <p>The School may share my information with authorised technology and payment service providers engaged by the School to operate this platform. These providers are contractually bound to process my information only as directed by the School and in compliance with POPIA.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">8. Retention</h4>
                            <p>My documents will be retained for a maximum of five (5) years following the conclusion of my school fee arrangement, or as required under the Tax Administration Act 28 of 2011 and the National Credit Act 34 of 2005, whichever period is longer. Thereafter, my documents will be securely destroyed.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">9. My Rights Under POPIA</h4>
                            <div className="text-sm text-gray-700">
                                Under POPIA, I have the right to:
                                <ul className="list-disc ml-5 mt-2 space-y-1">
                                    <li>Access the personal information the School holds about me;</li>
                                    <li>Request correction of inaccurate or incomplete information;</li>
                                    <li>Withdraw my consent at any time by contacting <span className="font-bold">admissions@knit.edu</span>. Withdrawal will not affect the lawfulness of processing already carried out, but the School may be unable to offer a deferred payment arrangement without these documents;</li>
                                    <li>Object to processing of my personal information on reasonable grounds; and</li>
                                    <li>Lodge a complaint with the Information Regulator (South Africa) at www.inforegulator.org.za or complaints.IR@justice.gov.za.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <a href="/official-declaration.pdf" download="Official_Declaration.pdf" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download Declaration (PDF)
                    </a>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                <div className="space-y-8">
                  <Card title="Acknowledgement" subtitle="Required for submission">
                      <div className="space-y-4">
                          {CONFIRMATIONS.map(item => (
                              <label key={item.id} className="flex items-start p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group">
                                  <input
                                      type="checkbox"
                                      name={item.id}
                                      checked={confirmations[item.id as ConfirmationKeys]}
                                      onChange={handleCheckboxChange}
                                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                                  />
                                  <span className={`ml-3 text-sm transition-colors ${confirmations[item.id as ConfirmationKeys] ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                      {item.label}
                                  </span>
                              </label>
                          ))}
                      </div>
                  </Card>

                  <Card title="Digital Name" subtitle="Enter your full legal name">
                      <div className="space-y-4">
                          <div>
                              <label htmlFor="fullName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                              <input
                                  type="text"
                                  id="fullName"
                                  value={fullName}
                                  onChange={handleFullNameChange}
                                  onBlur={() => handleBlur('fullName')}
                                  placeholder="Legal Full Name"
                                  className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none transition-all ${showFullNameError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:border-indigo-500'}`}
                              />
                          </div>
                      </div>
                  </Card>
                </div>

                <Card title="Actual Signature" subtitle="Draw your signature below">
                    <div className="space-y-4">
                        <div className={`relative bg-white border-2 rounded-xl overflow-hidden group transition-all ${!signature && touched.signature ? 'border-red-300 ring-4 ring-red-500/5' : 'border-dashed border-gray-200 focus-within:border-indigo-400'}`}>
                            <canvas
                                ref={canvasRef}
                                width={500}
                                height={200}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={endDrawing}
                                onMouseLeave={endDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={endDrawing}
                                className="w-full h-48 cursor-crosshair touch-none"
                            />
                            {!signature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs font-medium bg-gray-50/50">
                                    Click or touch to sign inside this box
                                </div>
                            )}
                            {signature && (
                                <div className="absolute top-2 left-2 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md flex items-center shadow-sm">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    SIGNATURE CAPTURED
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    clearSignature();
                                    setTouched(prev => ({ ...prev, signature: true }));
                                }}
                                className="absolute top-2 right-2 px-3 py-1.5 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center"
                            >
                                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Clear & Edit
                            </button>
                        </div>
                        
                        {!signature && touched.signature && (
                            <p className="text-xs font-bold text-red-500 animate-shake flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                Please draw your signature in the box above to proceed.
                            </p>
                        )}
                        
                        {signature && (
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 animate-fade-in">
                                <p className="text-[10px] text-indigo-600 text-center uppercase tracking-widest font-bold">
                                    Digital confirmation ID ready for verification
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>

        {/* Submit Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col space-y-3">
                <button
                    onClick={() => {
                        setTouched({ fullName: true, signature: true, confirmations: true });
                        handleContinue();
                    }}
                    disabled={isContinueDisabled || isSubmitting}
                    className={`w-full py-4 px-6 rounded-xl transition-all font-semibold shadow-md flex items-center justify-center ${
                        isContinueDisabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-[0.99]'
                    }`}
                >
                    {isSubmitting ? 'Finalizing...' : 'Submit Declaration & Continue'}
                    {!isSubmitting && <ArrowRightIcon className="ml-2 w-5 h-5" />}
                </button>
                {isContinueDisabled && (
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Check Acknowledgment, Name & Signature to proceed
                    </p>
                )}
            </div>
        </div>

        <Footer
            onBack={() => onStepChange && onStepChange(4)}
            onSave={handleSaveProgress}
            showBack={true}
            showSave={true}
            showNext={false}
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
