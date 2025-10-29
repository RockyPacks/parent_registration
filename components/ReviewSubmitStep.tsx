import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AccordionItem from './AccordionItem';
import type { SummaryData } from '../types';
import Footer from './Footer';

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-800">{value}</p>
  </div>
)

interface ReviewSubmitStepProps {
  onBack?: () => void;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ onBack }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setError(null);
      const response = await axios.get('http://localhost:8000/applications/1');
      setSummaryData(response.data);
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
      const studentData = JSON.parse(localStorage.getItem('studentInformation') || '{}');
      const familyData = JSON.parse(localStorage.getItem('familyInformation') || '{}');
      const medicalData = JSON.parse(localStorage.getItem('medicalInformation') || '{}');
      const feeData = JSON.parse(localStorage.getItem('feeResponsibility') || '{}');

      return {
        student: {
          name: studentData.firstName && studentData.surname ? `${studentData.firstName} ${studentData.surname}` : 'Please complete Step 1 to see student information',
          email: studentData.email || 'Please complete Step 1 to see student email',
          phone: studentData.phone || 'Please complete Step 1 to see student phone'
        },
        guardian: {
          name: familyData.fatherFirstName && familyData.fatherSurname ? `${familyData.fatherFirstName} ${familyData.fatherSurname}` : 'Please complete Step 1 to see guardian information',
          relationship: 'Father',
          email: familyData.fatherEmail || 'Please complete Step 1 to see guardian email',
          phone: familyData.fatherMobile || 'Please complete Step 1 to see guardian phone'
        },
        documents: [
          { name: 'Please upload documents in Step 2', status: 'Pending' }
        ],
        academicHistory: { schoolName: 'Please complete Step 3 to see academic history', lastGrade: 'Please complete Step 3 to see last grade' },
        subjects: {
          core: ['Please select subjects in Step 4'],
          electives: ['Please select subjects in Step 4']
        },
        financing: { plan: feeData.feePerson ? 'Fee plan selected' : 'Please complete Step 5 to see financing plan' },
        declaration: { signed: false }
      };
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return getMockData();
    }
  };

  const getMockData = (): SummaryData => ({
    student: { name: 'Please complete Step 1 to see student information', email: 'Please complete Step 1 to see student email', phone: 'Please complete Step 1 to see student phone' },
    guardian: { name: 'Please complete Step 1 to see guardian information', relationship: 'Please complete Step 1 to see relationship', email: 'Please complete Step 1 to see guardian email', phone: 'Please complete Step 1 to see guardian phone' },
    documents: [
      { name: 'Please upload documents in Step 2', status: 'Pending' }
    ],
    academicHistory: { schoolName: 'Please complete Step 3 to see academic history', lastGrade: 'Please complete Step 3 to see last grade' },
    subjects: {
      core: ['Please select subjects in Step 4'],
      electives: ['Please select subjects in Step 4']
    },
    financing: { plan: 'Please complete Step 5 to see financing plan' },
    declaration: { signed: false }
  });

  const handleEdit = (stepName: string) => {
    console.log(`Navigating to edit: ${stepName}`);
    alert(`Navigating to edit: ${stepName}`);
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

      const response = await axios.post('http://localhost:8000/submit-declaration', summaryData);
      alert(`Application Submitted Successfully! ID: ${response.data.id}`);
      console.log('Application submitted:', response.data);
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

  return (
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
        <AccordionItem title="Student & Guardian Info" onEdit={() => handleEdit('Student & Guardian Info')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Student Information</h3>
              <InfoItem label="Full Name" value={summaryData.student.name} />
              <InfoItem label="Email Address" value={summaryData.student.email} />
              <InfoItem label="Phone Number" value={summaryData.student.phone} />
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Guardian Information</h3>
              <InfoItem label="Full Name" value={summaryData.guardian.name} />
              <InfoItem label="Relationship" value={summaryData.guardian.relationship} />
              <InfoItem label="Email Address" value={summaryData.guardian.email} />
              <InfoItem label="Phone Number" value={summaryData.guardian.phone} />
            </div>
          </div>
        </AccordionItem>
        <AccordionItem title="Documents" onEdit={() => handleEdit('Documents')}>
           <div className="p-4">
            <p className="text-gray-800">{summaryData.documents.length} files uploaded. All documents have been verified.</p>
           </div>
        </AccordionItem>
        <AccordionItem title="Academic History" onEdit={() => handleEdit('Academic History')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <InfoItem label="Previous School" value={summaryData.academicHistory.schoolName} />
            <InfoItem label="Last Grade Completed" value={summaryData.academicHistory.lastGrade} />
          </div>
        </AccordionItem>
        <AccordionItem title="Subjects" onEdit={() => handleEdit('Subjects')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
             <div>
                <h3 className="font-semibold text-gray-700 mb-2">Core Subjects</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {summaryData.subjects.core.map(s => <li key={s}>{s}</li>)}
                </ul>
             </div>
             <div>
                <h3 className="font-semibold text-gray-700 mb-2">Elective Subjects</h3>
                <ul className="list-disc list-inside text-gray-800">
                  {summaryData.subjects.electives.map(s => <li key={s}>{s}</li>)}
                </ul>
             </div>
          </div>
        </AccordionItem>
        <AccordionItem title="Financing" onEdit={() => handleEdit('Financing')}>
          <div className="p-4">
            <InfoItem label="Selected Plan" value={summaryData.financing.plan ?? 'Skipped'} />
          </div>
        </AccordionItem>
        <AccordionItem title="Declaration" onEdit={() => handleEdit('Declaration')}>
            <div className="p-4">
              <p className="text-gray-800">{summaryData.declaration.signed ? 'Signed and completed.' : 'Not signed.'}</p>
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

      <form onSubmit={handleSubmit}>
        <div className="mt-8">
            <button
              type="submit"
              disabled={!isConfirmed || isSubmitting}
              className="w-full text-center px-6 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application for Review'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">Once submitted, your application will be sent to the school for review. You will be notified of the outcome via email and your dashboard.</p>
        </div>
      </form>

      <Footer
        onBack={onBack}
        onSave={() => {}}
        onNext={() => {}}
        showBack={true}
        showSave={false}
        showNext={false}
      />
    </div>
  );
}

export default ReviewSubmitStep;
