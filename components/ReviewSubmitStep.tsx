import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiService } from '../src/services/api';
import AccordionItem from './AccordionItem';
import type { SummaryData } from '../types';
import Footer from './Footer';

const InfoItem: React.FC<{ label: string; value: string; isRequired?: boolean; placeholder?: string }> = ({ label, value, isRequired = false, placeholder = '' }) => {
  const isEmpty = !value || value.trim() === '';
  const showPlaceholder = isEmpty && placeholder;

  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </p>
      <p className={`font-medium ${isEmpty && isRequired ? 'text-red-600' : 'text-gray-800'}`}>
        {showPlaceholder ? (
          <span className="text-gray-400 italic">{placeholder}</span>
        ) : (
          value || (isRequired ? 'Not provided' : 'Not specified')
        )}
      </p>
    </div>
  );
}

interface ReviewSubmitStepProps {
  currentData?: any;
  onBack?: () => void;
  onEditStep?: (stepNumber: number) => void;
  onStepComplete?: (stepNumber: number) => void;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ currentData, onBack, onEditStep, onStepComplete }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const transformCurrentDataToSummary = (data: any): SummaryData => {
    return {
      student: {
        name: data.student?.firstName && data.student?.surname
          ? `${data.student.firstName} ${data.student.surname}`
          : '',
        email: data.student?.email || '',
        phone: data.student?.phone || ''
      },
      guardian: {
        name: data.family?.fatherFirstName && data.family?.fatherSurname
          ? `${data.family.fatherFirstName} ${data.family.fatherSurname}`
          : data.family?.motherFirstName && data.family?.motherSurname
          ? `${data.family.motherFirstName} ${data.family.motherSurname}`
          : '',
        relationship: data.family?.fatherFirstName ? 'Father' : data.family?.motherFirstName ? 'Mother' : 'Guardian',
        email: data.family?.fatherEmail || data.family?.motherEmail || '',
        phone: data.family?.fatherMobile || data.family?.motherMobile || ''
      },
      documents: data.documents?.map((doc: any) => ({
        name: doc.filename || doc.name || 'Document',
        status: 'Verified' as const
      })) || [],
      academicHistory: {
        schoolName: data.academicHistory?.schoolName || '',
        lastGrade: data.academicHistory?.lastGradeCompleted || ''
      },
      subjects: {
        core: data.subjects?.core || [],
        electives: data.subjects?.electives || []
      },
      financing: { plan: data.financing?.plan || '' },
      declaration: { signed: data.declaration?.status === 'completed' }
    };
  };

  useEffect(() => {
    if (currentData) {
      // Use current data if provided
      setSummaryData(transformCurrentDataToSummary(currentData));
      setIsLoading(false);
    } else {
      // Fallback to fetching if no current data
      fetchSummaryData();
    }
  }, [currentData]);

  const fetchSummaryData = async () => {
    try {
      setError(null);
      const applicationId = localStorage.getItem('applicationId') || '1'; // Get from localStorage
      const backendData = await apiService.getApplication(applicationId);

      // Check if backend data has actual content, if not, use localStorage data
      const hasBackendData = backendData && (
        (backendData.student?.name && backendData.student.name.trim() !== '') ||
        (backendData.guardian?.name && backendData.guardian.name.trim() !== '') ||
        (backendData.academicHistory?.schoolName && backendData.academicHistory.schoolName.trim() !== '') ||
        (backendData.subjects?.core && backendData.subjects.core.length > 0) ||
        (backendData.subjects?.electives && backendData.subjects.electives.length > 0) ||
        (backendData.financing?.plan && backendData.financing.plan.trim() !== '') ||
        backendData.declaration?.signed === true
      );

      if (hasBackendData) {
        // Transform backend data to match frontend format
        const transformedData = {
          student: {
            name: backendData.student?.first_name && backendData.student?.surname
              ? `${backendData.student.first_name} ${backendData.student.surname}`
              : '',
            email: backendData.student?.email || '',
            phone: backendData.student?.phone || ''
          },
          guardian: {
            name: backendData.family?.father_first_name && backendData.family?.father_surname
              ? `${backendData.family.father_first_name} ${backendData.family.father_surname}`
              : backendData.family?.mother_first_name && backendData.family?.mother_surname
              ? `${backendData.family.mother_first_name} ${backendData.family.mother_surname}`
              : '',
            relationship: backendData.family?.father_first_name ? 'Father' : 'Mother',
            email: backendData.family?.father_email || backendData.family?.mother_email || '',
            phone: backendData.family?.father_mobile || backendData.family?.mother_mobile || ''
          },
          documents: backendData.documents?.map((doc: any) => ({
            name: doc.original_filename || doc.document_type || 'Document',
            status: 'Verified'
          })) || [],
          academicHistory: {
            schoolName: backendData.academicHistory?.school_name || '',
            lastGrade: backendData.academicHistory?.last_grade_completed || ''
          },
          subjects: {
            core: backendData.subjects?.core || [],
            electives: backendData.subjects?.electives || []
          },
          financing: { plan: backendData.financing?.selected_plan || '' },
          declaration: { signed: backendData.declaration?.status === 'completed' }
        };

        setSummaryData(transformedData);
        // Check if application is already submitted
        if (backendData.status === 'submitted') {
          setIsSubmitted(true);
        }
      } else {
        // Use localStorage data if backend has no real data
        setSummaryData(getLocalStorageData());
      }
    } catch (err: any) {
      console.error('Error fetching summary data:', err);
      // Fallback to localStorage data if backend is not available
      setSummaryData(getLocalStorageData());
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalStorageData = (): SummaryData => {
    try {
      // Get data from the current form state stored in MainContent
      const studentData = JSON.parse(localStorage.getItem('studentInformation') || '{}');
      const familyData = JSON.parse(localStorage.getItem('familyInformation') || '{}');
      const medicalData = JSON.parse(localStorage.getItem('medicalInformation') || '{}');
      const feeData = JSON.parse(localStorage.getItem('feeResponsibility') || '{}');
      const academicData = JSON.parse(localStorage.getItem('academicHistoryFormData') || '{}');
      const subjectData = JSON.parse(localStorage.getItem('selectedSubjects') || '{}');
      const financingData = JSON.parse(localStorage.getItem('financingPlan') || '{}');
      const declarationData = JSON.parse(localStorage.getItem('declarationData') || '{}');

      // Get uploaded documents from localStorage if available
      const uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const documents = uploadedFiles.map((file: any) => ({
        name: file.filename || file.name || 'Document',
        status: 'Verified'
      }));

      return {
        student: {
          name: studentData.firstName && studentData.surname ? `${studentData.firstName} ${studentData.surname}` : '',
          email: studentData.email || '',
          phone: studentData.phone || ''
        },
        guardian: {
          name: familyData.fatherFirstName && familyData.fatherSurname ? `${familyData.fatherFirstName} ${familyData.fatherSurname}` : '',
          relationship: 'Father',
          email: familyData.fatherEmail || '',
          phone: familyData.fatherMobile || ''
        },
        documents: documents,
        academicHistory: {
          schoolName: academicData.schoolName || '',
          lastGrade: academicData.lastGradeCompleted || ''
        },
        subjects: {
          core: subjectData.core || [],
          electives: subjectData.electives || []
        },
        financing: { plan: financingData.plan || '' },
        declaration: { signed: declarationData.status === 'completed' }
      };
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return {
        student: { name: '', email: '', phone: '' },
        guardian: { name: '', relationship: 'Father', email: '', phone: '' },
        documents: [],
        academicHistory: { schoolName: '', lastGrade: '' },
        subjects: { core: [], electives: [] },
        financing: { plan: '' },
        declaration: { signed: false }
      };
    }
  };



  const handleEdit = (stepName: string) => {
    if (isSubmitted) return; // Prevent editing after submission

    const stepMapping: { [key: string]: number } = {
      'student-guardian': 1,
      'documents': 2,
      'Academic History': 3,
      'Subjects': 4,
      'Financing': 5,
      'Declaration': 6
    };

    const stepNumber = stepMapping[stepName];
    if (stepNumber && onEditStep) {
      onEditStep(stepNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || !summaryData) {
      setError('Please confirm the application before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const applicationId = localStorage.getItem('applicationId') || '1';

      // Get all data from local storage (using the same keys as MainContent)
      const studentData = JSON.parse(localStorage.getItem('studentInformation') || '{}');
      const familyData = JSON.parse(localStorage.getItem('familyInformation') || '{}');
      const medicalData = JSON.parse(localStorage.getItem('medicalInformation') || '{}');
      const feeData = JSON.parse(localStorage.getItem('feeResponsibility') || '{}');
      const academicData = JSON.parse(localStorage.getItem('academicHistoryFormData') || '{}');
      const subjectData = JSON.parse(localStorage.getItem('selectedSubjects') || '{}');
      const financingData = JSON.parse(localStorage.getItem('financingPlan') || '{}');
      const declarationData = JSON.parse(localStorage.getItem('declarationData') || '{}');

      const fullApplicationData = {
        student: studentData,
        family: familyData,
        medical: medicalData,
        fee: feeData,
        academicHistory: academicData,
        subjects: subjectData,
        financing: financingData,
        declaration: declarationData,
      };

      const response = await apiService.submitFullApplication(applicationId, fullApplicationData);

      console.log('Application submitted:', response.data);
      setIsSubmitted(true);
      if (onStepComplete) {
        onStepComplete(7);
      }
      // Refresh summary data to get updated status
      fetchSummaryData();
    } catch (err: any) {
      console.error('Error submitting application:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to submit application. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading application summary...</p>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center py-8 text-red-600">
          Failed to load application data. Please refresh the page.
        </div>
      </div>
    );
  }

  // Show success screen if submitted
  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen">
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h1>
                <p className="text-gray-700 font-medium">Your enrollment application has been received</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                Your application has been successfully submitted. You will receive an email confirmation shortly with your application reference number.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-500">Application ID</p>
                <p className="text-lg font-semibold text-gray-900">{localStorage.getItem('applicationId') || 'N/A'}</p>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Our admissions team will review your application and contact you within 5-7 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit</h1>
              <p className="text-gray-700 font-medium">Final review of your enrollment application</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Step 7 of 7</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '100%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Review & Submit</h1>
            <p className="text-gray-600 mt-1">Please review your application below. If you need to make any changes, you may edit individual sections before submitting.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Application Summary</h2>
              <AccordionItem title="Student & Guardian Info" onEdit={isSubmitted ? undefined : () => handleEdit('student-guardian')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Student Information</h3>
                    <InfoItem label="Full Name" value={summaryData.student.name} isRequired={true} placeholder="Enter student's full name" />
                    <InfoItem label="Email Address" value={summaryData.student.email} isRequired={false} placeholder="student@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.student.phone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Guardian Information</h3>
                    <InfoItem label="Full Name" value={summaryData.guardian.name} isRequired={true} placeholder="Enter guardian's full name" />
                    <InfoItem label="Relationship" value={summaryData.guardian.relationship} isRequired={true} placeholder="Father/Mother/Guardian" />
                    <InfoItem label="Email Address" value={summaryData.guardian.email} isRequired={true} placeholder="guardian@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.guardian.phone} isRequired={true} placeholder="+27 XX XXX XXXX" />
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Documents" onEdit={isSubmitted ? undefined : () => handleEdit('documents')}>
                <div className="p-4">
                  <div className="space-y-3">
                    {summaryData.documents.length > 0 ? (
                      summaryData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-800">{doc.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">No documents uploaded</p>
                    )}
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Academic History" onEdit={isSubmitted ? undefined : () => handleEdit('Academic History')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Previous School" value={summaryData.academicHistory.schoolName} isRequired={true} placeholder="Enter school name" />
                  <InfoItem label="Last Grade Completed" value={summaryData.academicHistory.lastGrade} isRequired={true} placeholder="e.g., Grade 12" />
                </div>
              </AccordionItem>
              <AccordionItem title="Subjects" onEdit={isSubmitted ? undefined : () => handleEdit('Subjects')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Core Subjects</h3>
                    {summaryData.subjects.core.length > 0 ? (
                      <ul className="list-disc list-inside text-gray-800">
                        {summaryData.subjects.core.map(s => <li key={s}>{s}</li>)}
                      </ul>
                    ) : (
                      <p className="text-gray-400 italic">No core subjects selected</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Elective Subjects</h3>
                    {summaryData.subjects.electives.length > 0 ? (
                      <ul className="list-disc list-inside text-gray-800">
                        {summaryData.subjects.electives.map(s => <li key={s}>{s}</li>)}
                      </ul>
                    ) : (
                      <p className="text-gray-400 italic">No elective subjects selected</p>
                    )}
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Financing" onEdit={isSubmitted ? undefined : () => handleEdit('Financing')}>
                <div className="p-4">
                  <InfoItem label="Selected Plan" value={summaryData.financing.plan || ''} isRequired={false} placeholder="No financing plan selected" />
                </div>
              </AccordionItem>
              <AccordionItem title="Declaration" onEdit={isSubmitted ? undefined : () => handleEdit('Declaration')}>
                <div className="p-4">
                  <InfoItem label="Declaration Status" value={summaryData.declaration.signed ? 'Signed and completed' : ''} isRequired={true} placeholder="Declaration not signed" />
                </div>
              </AccordionItem>
            </div>

            <div className="mt-10 pt-6 border-t">
              <h2 className="text-xl font-semibold text-gray-800">Final Confirmation</h2>
              <div className="mt-4">
                <label className="flex items-start p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                  />
                  <span className="ml-3 text-gray-700">I have reviewed this application and confirm that all information is true, correct, and complete.</span>
                </label>
              </div>
            </div>

            {!isSubmitted && (
              <form onSubmit={handleSubmit}>
                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={!isConfirmed || isSubmitting}
                    className="w-full text-center px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application for Review'}
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-3">Once submitted, your application will be sent to the school for review. You will be notified of the outcome via email and your dashboard.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer
        onBack={onBack}
        onSave={() => {}}
        onNext={() => {}}
        showBack={true}
        showSave={false}
        showNext={false}
      />
    </>
  );
}

export default ReviewSubmitStep;
