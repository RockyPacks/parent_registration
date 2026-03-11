import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import AccordionItem from './AccordionItem';
import type { SummaryData, LocalStorageData, AcademicHistoryData } from '../types';
import { CategoryStatus } from '../types';
import { storage } from '../utils/storage';


const InfoItem: React.FC<{ label: string; value: string | number | boolean | null | undefined; isRequired?: boolean; placeholder?: string }> = ({ label, value, isRequired = false, placeholder = '' }) => {
  const stringValue = String(value ?? '');
  const isEmpty = !stringValue || stringValue.trim() === '';

  let displayValue: string | number | boolean;
  if (isEmpty) {
    displayValue = isRequired ? 'Not provided' : (placeholder || 'Not specified');
  } else {
    displayValue = value;
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </p>
      <p className={`font-medium ${isEmpty && isRequired ? 'text-red-600' : 'text-gray-800'}`}>
        {displayValue}
      </p>
    </div>
  );
}

import { NextOfKinData } from '../types/index';

interface ReviewSubmitStepProps {
  currentData?: SummaryData; // Specify SummaryData type
  onBack?: () => void;
  onEditStep?: (stepNumber: number) => void;
  onSubmit?: () => void;
  onStepComplete?: (stepNumber: number) => void;
}

export const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ currentData, onBack, onEditStep, onSubmit, onStepComplete }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentData) {
      setSummaryData(currentData);
      setIsLoading(false);
    } else {
      // This should ideally not happen if Step6ReviewSubmitStep is passing data correctly
      // Fallback to local storage for isolated testing or unexpected states
      const studentData: LocalStorageData['studentInformation'] = storage.get('studentInformation', {});
      const familyData: LocalStorageData['familyInformation'] = storage.get('familyInformation', {});
      const academicData: AcademicHistoryData = storage.get('academicHistoryFormData', {
        schoolName: '',
        schoolType: 'public',
        lastGradeCompleted: '',
        academicYearCompleted: '',
        reasonForLeaving: '',
        principalName: '',
        schoolPhoneNumber: '',
        schoolEmail: '',
        schoolAddress: '',
        reportCard: null,
        additionalNotes: '',
      });
      const subjectData: LocalStorageData['selectedSubjects'] = storage.get('selectedSubjects', { core: [], electives: [] });
      const financingPlanData: LocalStorageData['financingPlan'] = storage.get('financingPlan', {});
      const feeData: LocalStorageData['feeResponsibility'] = storage.get('feeResponsibility', {});
      const declarationData: LocalStorageData['declarationData'] = storage.get('declarationData', {});
      const medicalInfoData: LocalStorageData['medicalInformation'] = storage.get('medicalInformation', {});
      const nextOfKinData: NextOfKinData = storage.get('nextOfKinInformation', {});

      const uploadedFiles: any[] = storage.get('uploadedFiles', []);
      const documents = uploadedFiles.map((file, index) => ({
        id: index.toString(),
        title: file.filename || file.name || 'Document',
        status: CategoryStatus.Completed,
        files: [],
        required: true,
      }));

      setSummaryData({
        personalInfo: {
          firstName: studentData.firstName || '',
          lastName: studentData.surname || '',
          email: studentData.email || ''
        },
        student: {
          name: studentData.firstName && studentData.surname ? `${studentData.firstName} ${studentData.surname}` : '',
          email: studentData.email || '',
          phone: studentData.phone || '',
          dob: studentData.dob ? (typeof studentData.dob === 'string' ? studentData.dob : (studentData.dob as Date).toISOString().split('T')[0]) : '',
          gender: studentData.gender || '',
          idNumber: studentData.idNumber || '',
          homeLanguage: studentData.homeLanguage || '',
          previousGrade: studentData.previousGrade || '',
          gradeAppliedFor: studentData.gradeAppliedFor || '',
          previousSchool: studentData.previousSchool || '',
        },
        guardian: {
          fatherName: familyData.fatherFirstName && familyData.fatherSurname ? `${familyData.fatherFirstName} ${familyData.fatherSurname}` : '',
          fatherRelationship: 'Father',
          fatherEmail: familyData.fatherEmail || '',
          fatherPhone: familyData.fatherMobile || '',
          fatherIdNumber: familyData.fatherIdNumber || '',

          motherName: familyData.motherFirstName && familyData.motherSurname ? `${familyData.motherFirstName} ${familyData.motherSurname}` : '',
          motherRelationship: 'Mother',
          motherEmail: familyData.motherEmail || '',
          motherPhone: familyData.motherMobile || '',
          motherIdNumber: familyData.motherIdNumber || '',

          nextOfKinName: nextOfKinData.firstName && nextOfKinData.surname ? `${nextOfKinData.firstName} ${nextOfKinData.surname}` : '',
          nextOfKinRelationship: nextOfKinData.relationship || '',
          nextOfKinEmail: nextOfKinData.email || '',
          nextOfKinPhone: nextOfKinData.mobile || '',
          nextOfKinIdNumber: nextOfKinData.idNumber || '',
        },
        medical: {
          medicalAidName: medicalInfoData.medicalAidName || '',
          memberNumber: medicalInfoData.memberNumber || '',
          mainMemberName: medicalInfoData.mainMemberName || '',
          conditions: medicalInfoData.conditions || [],
          allergies: medicalInfoData.allergies || '',
          doctorName: medicalInfoData.doctorName || '',
          doctorPhoneNumber: medicalInfoData.doctorPhoneNumber || '',
        },
        documents,
        academicHistory: [academicData],
        subjects: {
          core: subjectData.core || [],
          electives: subjectData.electives || []
        },
        fee: feeData,
        financing: {
          plan: financingPlanData.plan || '',
          feePerson: financingPlanData.feePerson || '',
          relationship: financingPlanData.relationship || '',
          email: financingPlanData.email || '',
          mobile: financingPlanData.mobile || '',
          idNumber: financingPlanData.idNumber || '',
          occupation: financingPlanData.occupation || '',
          employer: financingPlanData.employer || '',
          employerAddress: financingPlanData.employerAddress || '',
          employerPhoneNumber: financingPlanData.employerPhoneNumber || '',
        },
        declaration: {
          signed: declarationData.agree_truth || declarationData.status === 'completed',
          agree_truth: declarationData.agree_truth || false,
          agree_policies: declarationData.agree_policies || false,
          agree_financial: declarationData.agree_financial || false,
          agree_verification: declarationData.agree_verification || false,
          agree_data_processing: declarationData.agree_data_processing || false,
          fullName: declarationData.fullName || ''
        }
      });
      setIsLoading(false);
    }
  }, [currentData]);

  const handleEdit = (stepName: string) => {
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
    if (!isConfirmed) {
      setError('Please confirm the application before submitting.');
      return;
    }
    
    // Validate that at least one parent information is complete
    if (summaryData?.guardian) {
      const fatherComplete = summaryData.guardian.fatherName && summaryData.guardian.fatherEmail && summaryData.guardian.fatherPhone;
      const motherComplete = summaryData.guardian.motherName && summaryData.guardian.motherEmail && summaryData.guardian.motherPhone;
      const nokComplete = summaryData.guardian.nextOfKinName && summaryData.guardian.nextOfKinEmail && summaryData.guardian.nextOfKinPhone;
      
      if (!fatherComplete && !motherComplete) {
        setError('Please provide complete information for at least one parent (Father or Mother).');
        return;
      }
      
      if (!nokComplete) {
        setError('Please provide complete information for the Next of Kin (emergency contact).');
        return;
      }
    }
    
    console.log('ReviewSubmitStep: User clicked Submit Application button');
    setIsSubmitting(true);
    setError(null);

    if (onSubmit) {
      console.log('ReviewSubmitStep: Calling onSubmit handler');
      onSubmit();
    }
    setIsSubmitting(false);
  };

  // The isSubmitted view is now fully managed by Step6ReviewSubmitStep.tsx
  // This component will only render the review section or nothing if the parent has submitted.
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
    <>
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20" />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-24">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Review & Submit</h1>
            <p className="text-gray-600 mt-1">Please review your application below. If you need to make any changes, you may edit individual sections before submitting.</p>
          </div>

          {error && (
            <div className={`mb-4 p-4 rounded ${
              error === 'Application submitted successfully!'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {error}
            </div>
          )}

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Application Summary</h2>
              <AccordionItem title="Student & Guardian Info" onEdit={() => handleEdit('student-guardian')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Student Information</h3>
                    <InfoItem label="Full Name" value={summaryData.student.name} isRequired={true} placeholder="Enter student's full name" />
                    <InfoItem label="Email Address" value={summaryData.student.email} isRequired={false} placeholder="student@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.student.phone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="Date of Birth" value={summaryData.student.dob} isRequired={false} placeholder="YYYY-MM-DD" />
                    <InfoItem label="Gender" value={summaryData.student.gender} isRequired={false} placeholder="Gender" />
                    <InfoItem label="ID Number" value={summaryData.student.idNumber} isRequired={false} placeholder="ID Number" />
                    <InfoItem label="Home Language" value={summaryData.student.homeLanguage} isRequired={false} placeholder="Home Language" />
                    <InfoItem label="Previous Grade" value={summaryData.student.previousGrade} isRequired={false} placeholder="Previous Grade" />
                    <InfoItem label="Grade Applied For" value={summaryData.student.gradeAppliedFor} isRequired={false} placeholder="Grade Applied For" />
                    <InfoItem label="Previous School" value={summaryData.student.previousSchool} isRequired={false} placeholder="Previous School" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Father Information</h3>
                    <InfoItem label="Full Name" value={summaryData.guardian?.fatherName} isRequired={false} placeholder="Enter father's full name" />
                    <InfoItem label="Relationship" value={summaryData.guardian?.fatherRelationship} isRequired={false} placeholder="Father" />
                    <InfoItem label="Email Address" value={summaryData.guardian?.fatherEmail} isRequired={false} placeholder="father@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.guardian?.fatherPhone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="ID Number" value={summaryData.guardian?.fatherIdNumber} isRequired={false} placeholder="Father ID Number" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Mother Information</h3>
                    <InfoItem label="Full Name" value={summaryData.guardian?.motherName} isRequired={false} placeholder="Enter mother's full name" />
                    <InfoItem label="Relationship" value={summaryData.guardian?.motherRelationship} isRequired={false} placeholder="Mother" />
                    <InfoItem label="Email Address" value={summaryData.guardian?.motherEmail} isRequired={false} placeholder="mother@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.guardian?.motherPhone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="ID Number" value={summaryData.guardian?.motherIdNumber} isRequired={false} placeholder="Mother ID Number" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Next of Kin Information</h3>
                    <InfoItem label="Full Name" value={summaryData.guardian?.nextOfKinName} isRequired={false} placeholder="Enter next of kin's full name" />
                    <InfoItem label="Relationship" value={summaryData.guardian?.nextOfKinRelationship} isRequired={false} placeholder="Relationship to student" />
                    <InfoItem label="Email Address" value={summaryData.guardian?.nextOfKinEmail} isRequired={false} placeholder="nextofkin@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.guardian?.nextOfKinPhone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="ID Number" value={summaryData.guardian?.nextOfKinIdNumber} isRequired={false} placeholder="Next of Kin ID Number" />
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Medical Information" onEdit={() => handleEdit('Medical Information')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Medical Aid Name" value={summaryData.medical?.medicalAidName} isRequired={false} placeholder="Medical Aid Name" />
                  <InfoItem label="Member Number" value={summaryData.medical?.memberNumber} isRequired={false} placeholder="Member Number" />
                  <InfoItem label="Conditions" value={summaryData.medical?.conditions?.join(', ') || 'None'} isRequired={false} placeholder="Conditions" />
                  <InfoItem label="Allergies" value={summaryData.medical?.allergies || 'None'} isRequired={false} placeholder="Allergies" />
                </div>
              </AccordionItem>
              <AccordionItem title="Documents" onEdit={() => handleEdit('documents')}>
                <div className="p-4">
                  <div className="space-y-3">
                    {summaryData.documents && summaryData.documents.length > 0 ? (
                      <p className="text-gray-800 font-medium">All required documents submitted</p>
                    ) : (
                      <p className="text-gray-400 italic">No documents uploaded</p>
                    )}
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem title="Academic History" onEdit={() => handleEdit('Academic History')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Previous School" value={summaryData.academicHistory[0]?.schoolName} isRequired={true} placeholder="Enter school name" />
                  <InfoItem label="School Type" value={summaryData.academicHistory[0]?.schoolType} isRequired={true} placeholder="e.g., Public" />
                  <InfoItem label="Last Grade Completed" value={summaryData.academicHistory[0]?.lastGradeCompleted} isRequired={true} placeholder="e.g., Grade 12" />
                  <InfoItem label="Academic Year Completed" value={summaryData.academicHistory[0]?.academicYearCompleted} isRequired={true} placeholder="e.g., 2023" />
                  <InfoItem label="Reason for Leaving" value={summaryData.academicHistory[0]?.reasonForLeaving} isRequired={false} placeholder="Reason for leaving" />
                  <InfoItem label="Principal's Name" value={summaryData.academicHistory[0]?.principalName} isRequired={false} placeholder="Principal's name" />
                  <InfoItem label="School Phone Number" value={summaryData.academicHistory[0]?.schoolPhoneNumber} isRequired={false} placeholder="School phone number" />
                  <InfoItem label="School Email" value={summaryData.academicHistory[0]?.schoolEmail} isRequired={false} placeholder="School email" />
                </div>
              </AccordionItem>
              <AccordionItem title="Financing" onEdit={() => handleEdit('Financing')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Selected Plan" value={summaryData.financing?.plan || ''} isRequired={false} placeholder="No financing plan selected" />
                  <InfoItem label="Fee Person" value={summaryData.financing?.feePerson || "Not specified"} isRequired={false} placeholder="Person responsible for fees" />
                  <InfoItem label="Relationship" value={summaryData.financing?.relationship || "Not specified"} isRequired={false} placeholder="Relationship to student" />
                </div>
              </AccordionItem>
              <AccordionItem title="Fee Responsibility" onEdit={() => handleEdit('Fee Responsibility')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Fee Person" value={summaryData.fee?.feePerson || "Not specified"} isRequired={false} placeholder="Person responsible for fees" />
                  <InfoItem label="Relationship" value={summaryData.fee?.relationship || "Not specified"} isRequired={false} placeholder="Relationship to student" />
                  <InfoItem label="Terms Accepted" value={summaryData.fee?.feeTermsAccepted ? "Yes" : "No"} isRequired={false} placeholder="Fee terms acceptance" />
                  <InfoItem label="Bank Name" value={summaryData.fee?.bankName || "Not specified"} isRequired={false} placeholder="Bank Name" />
                  <InfoItem label="Branch Code" value={summaryData.fee?.branchCode || "Not specified"} isRequired={false} placeholder="Branch Code" />
                  <InfoItem label="Account Number" value={summaryData.fee?.accountNumber || "Not specified"} isRequired={false} placeholder="Account Number" />
                  <InfoItem label="Account Type" value={summaryData.fee?.accountType || "Not specified"} isRequired={false} placeholder="Account Type" />
                </div>
              </AccordionItem>
              <AccordionItem title="Declaration" onEdit={() => handleEdit('Declaration')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Full Name" value={summaryData.declaration?.fullName} isRequired={false} placeholder="Full Name" />
                  <InfoItem label="Agree to Truth" value={summaryData.declaration?.agree_truth ? 'Yes' : 'No'} isRequired={false} />
                  <InfoItem label="Agree to Policies" value={summaryData.declaration?.agree_policies ? 'Yes' : 'No'} isRequired={false} />
                  <InfoItem label="Agree to Financial" value={summaryData.declaration?.agree_financial ? 'Yes' : 'No'} isRequired={false} />
                  <InfoItem label="Agree to Verification" value={summaryData.declaration?.agree_verification ? 'Yes' : 'No'} isRequired={false} />
                  <InfoItem label="Agree to Data Processing" value={summaryData.declaration?.agree_data_processing ? 'Yes' : 'No'} isRequired={false} />
                </div>
              </AccordionItem>
            </div>

            <div className="mt-10 pt-6 border-t flex flex-col items-center space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirmation"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="confirmation" className="ml-2 block text-sm text-gray-900">
                  I confirm that the information provided is true and correct.
                </label>
              </div>
          
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!isConfirmed || isSubmitting}
                  className="w-48 px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-md shadow-md hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};
