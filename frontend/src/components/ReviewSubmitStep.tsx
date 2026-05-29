import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import AccordionItem from './AccordionItem';
import type { SummaryData, LocalStorageData, AcademicHistoryData } from '../types';
import { CategoryStatus } from '../types';
import { storage, getActiveSchoolType } from '../utils/storage';


const InfoItem: React.FC<{ label: string; value: string | number | boolean | null | undefined; isRequired?: boolean; placeholder?: string }> = ({ label, value, isRequired = false, placeholder = '' }) => {
  const stringValue = String(value ?? '');
  const isEmpty = !stringValue || stringValue.trim() === '' || stringValue === 'undefined undefined' || stringValue === 'null';
  const displayValue = isEmpty ? (placeholder || 'Not specified') : value;

  return (
    <div className={`p-2.5 rounded-lg transition-all duration-200 ${isEmpty && isRequired ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'}`}>
      <p className="text-xs sm:text-sm font-medium text-gray-500">
        {label}
        {isRequired && <span className="text-red-500 ml-1 font-bold">*</span>}
      </p>
      {isEmpty && isRequired ? (
        <span className="inline-flex items-center text-xs sm:text-sm font-bold text-red-600 gap-1.5 mt-1 animate-pulse">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Not provided
        </span>
      ) : (
        <p className={`text-sm font-semibold mt-1 truncate ${isEmpty ? 'text-gray-400 italic font-normal' : 'text-gray-800'}`}>
          {typeof displayValue === 'boolean' ? (displayValue ? 'Yes' : 'No') : String(displayValue)}
        </p>
      )}
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

  const getSectionValidationState = () => {
    if (!summaryData) return { isValid: false, errors: {} as { [key: string]: string[] }, missingFieldsCount: 0 };

    const errors: { [key: string]: string[] } = {};
    let missingFieldsCount = 0;

    const cleanStr = (val: any): string => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    // 1. Student Information
    const studentMissing: string[] = [];
    const nameParts = cleanStr(summaryData.student?.name).split(' ');
    const firstName = nameParts[0]?.trim() || cleanStr(summaryData.personalInfo?.firstName) || '';
    const lastName = nameParts.slice(1).join(' ').trim() || cleanStr(summaryData.personalInfo?.lastName) || '';

    if (!firstName) studentMissing.push('First Name');
    if (!lastName) studentMissing.push('Surname');
    if (!cleanStr(summaryData.student?.email)) studentMissing.push('Email Address');
    if (!cleanStr(summaryData.student?.phone)) studentMissing.push('Phone Number');
    if (!summaryData.student?.dob) studentMissing.push('Date of Birth');
    if (getActiveSchoolType() !== 'molo' && !summaryData.student?.gender) studentMissing.push('Gender');
    if (!summaryData.student?.homeLanguage) studentMissing.push('Home Language');
    if (!summaryData.student?.idNumber) studentMissing.push('ID Number');
    if (!summaryData.student?.previousGrade) studentMissing.push('Previous Class');
    if (!summaryData.student?.gradeAppliedFor) studentMissing.push('Class Applied For');
    if (!cleanStr(summaryData.student?.previousSchool)) studentMissing.push('Previous School');
    if (!cleanStr(summaryData.student?.studentNumber)) studentMissing.push('Student Number');
    if (!cleanStr(summaryData.student?.pickupPerson)) studentMissing.push('Pickup Person');

    if (studentMissing.length > 0) {
      errors['student'] = studentMissing;
      missingFieldsCount += studentMissing.length;
    }

    // 2. Application Details
    const appDetailsMissing: string[] = [];
    if (!summaryData.applicationDetails?.proposedStartTerm) appDetailsMissing.push('Proposed Start Term');
    if (!summaryData.applicationDetails?.year) appDetailsMissing.push('Proposed Year');
    if (!summaryData.applicationDetails?.gradeApplyingFor) appDetailsMissing.push('Proposed Class');

    if (appDetailsMissing.length > 0) {
      errors['applicationDetails'] = appDetailsMissing;
      missingFieldsCount += appDetailsMissing.length;
    }

    // 3. Parents / Guardians Details (At least one must be complete)
    const fatherMissing: string[] = [];
    const fatherName = cleanStr(summaryData.guardian?.fatherName);
    if (!fatherName || fatherName === 'undefined undefined' || fatherName === '') {
      fatherMissing.push('Father Full Name');
    }
    if (!cleanStr(summaryData.guardian?.fatherPhone)) fatherMissing.push('Father Phone Number');
    if (!cleanStr(summaryData.guardian?.fatherEmail)) fatherMissing.push('Father Email');
    if (!cleanStr(summaryData.guardian?.fatherIdNumber)) fatherMissing.push('Father ID Number');

    const motherMissing: string[] = [];
    const motherName = cleanStr(summaryData.guardian?.motherName);
    if (!motherName || motherName === 'undefined undefined' || motherName === '') {
      motherMissing.push('Mother Full Name');
    }
    if (!cleanStr(summaryData.guardian?.motherPhone)) motherMissing.push('Mother Phone Number');
    if (!cleanStr(summaryData.guardian?.motherEmail)) motherMissing.push('Mother Email');
    if (!cleanStr(summaryData.guardian?.motherIdNumber)) motherMissing.push('Mother ID Number');

    if (fatherMissing.length > 0 && motherMissing.length > 0) {
      errors['guardian'] = ['At least one parent (Father or Mother) must be completed with all required details.'];
      missingFieldsCount += 1;
    }

    // 4. Medical Details
    const medicalMissing: string[] = [];
    if (!cleanStr(summaryData.medical?.homeLanguage)) medicalMissing.push('Home Language');
    if (!cleanStr(summaryData.medical?.allergies)) medicalMissing.push('Allergies');
    if (!cleanStr(summaryData.medical?.allergyStatus)) medicalMissing.push('Allergy Status');
    if (!cleanStr(summaryData.medical?.immunisationsUpToDate)) medicalMissing.push('Immunisations Up To Date');

    if (medicalMissing.length > 0) {
      errors['medical'] = medicalMissing;
      missingFieldsCount += medicalMissing.length;
    }

    // 5. Documents
    const documentMissing: string[] = [];
    const uploadedDocs = new Set<string>();
    const docList = summaryData.documents || [];
    
    docList.forEach((d: any) => {
      const type = d.documentType || d.document_type || d.category || d.title;
      if (type) {
        uploadedDocs.add(cleanStr(type).toLowerCase().replace(/[\s_]+/g, ''));
      }
    });

    const docTypeMap = [
      { key: 'proof_of_address', label: 'Proof of Address' },
      { key: 'id_document', label: 'Guardian ID Document' },
      { key: 'payslip', label: 'Guardian Payslip' },
      { key: 'bank_statement', label: '3 Months Bank Statements' }
    ];

    docTypeMap.forEach(({ key, label }) => {
      const matched = [...uploadedDocs].some(t => t.includes(key.replace(/[\s_]+/g, '')) || key.replace(/[\s_]+/g, '').includes(t));
      if (!matched) {
        documentMissing.push(label);
      }
    });

    if (documentMissing.length > 0) {
      errors['documents'] = documentMissing;
      missingFieldsCount += documentMissing.length;
    }

    // 6. Academic History
    const academicMissing: string[] = [];
    const acad = (summaryData.academicHistory?.[0] || {}) as any;
    if (!cleanStr(acad.schoolName)) academicMissing.push('Previous School Name');
    if (!cleanStr(acad.schoolType)) academicMissing.push('School Type');
    if (!cleanStr(acad.lastGradeCompleted)) academicMissing.push('Last Class Completed');
    if (!cleanStr(acad.academicYearCompleted)) academicMissing.push('Academic Year Completed');
    if (!cleanStr(acad.reportCardUrl)) academicMissing.push('Report Card Upload');

    if (academicMissing.length > 0) {
      errors['academicHistory'] = academicMissing;
      missingFieldsCount += academicMissing.length;
    }

    // 7. Financing selection
    const financingMissing: string[] = [];
    if (!summaryData.financing?.plan) financingMissing.push('Selected Fee Payment Plan');
    if (financingMissing.length > 0) {
      errors['financing'] = financingMissing;
      missingFieldsCount += financingMissing.length;
    }

    // 8. Fee Responsibility details
    const feeMissing: string[] = [];
    if (!cleanStr(summaryData.fee?.feePerson)) feeMissing.push('Fee Payer Full Name');
    if (!cleanStr(summaryData.fee?.relationship)) feeMissing.push('Relationship to Learner');
    if (!summaryData.fee?.feeTermsAccepted) feeMissing.push('Fee Terms Agreement Acceptance');
    if (!cleanStr(summaryData.fee?.bankName)) feeMissing.push('Bank Name');
    if (!cleanStr(summaryData.fee?.branchCode)) feeMissing.push('Branch Code');
    if (!cleanStr(summaryData.fee?.accountNumber)) feeMissing.push('Account Number');

    if (feeMissing.length > 0) {
      errors['fee'] = feeMissing;
      missingFieldsCount += feeMissing.length;
    }

    // 9. Declaration
    const declarationMissing: string[] = [];
    if (!summaryData.declaration?.signed && !summaryData.declaration?.agree_truth) declarationMissing.push('Acceptance Signature');
    if (!cleanStr(summaryData.declaration?.fullName)) declarationMissing.push('Declaration Full Name');

    if (declarationMissing.length > 0) {
      errors['declaration'] = declarationMissing;
      missingFieldsCount += declarationMissing.length;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      missingFieldsCount
    };
  };

  const validation = getSectionValidationState();

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
      const applicationDetailsData: LocalStorageData['applicationDetailsData'] = storage.get('applicationDetailsData', {});
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
          studentNumber: studentData.studentNumber || '',
          pickupPerson: studentData.pickupPerson || '',
        },
        applicationDetails: {
          proposedStartTerm: applicationDetailsData.proposedStartTerm || '',
          year: applicationDetailsData.year || '',
          gradeApplyingFor: applicationDetailsData.gradeApplyingFor || '',
          proposedStartDate: applicationDetailsData.proposedStartDate || '',
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
          homeLanguage: medicalInfoData.homeLanguage || '',
          allergies: medicalInfoData.allergies || '',
          allergyActionRequired: medicalInfoData.allergyActionRequired || '',
          allergyStatus: medicalInfoData.allergyStatus || '',
          immunisationsUpToDate: medicalInfoData.immunisationsUpToDate || '',
          medicalAidScheme: medicalInfoData.medicalAidScheme || medicalInfoData.medicalAidName || '',
          medicalAidNumber: medicalInfoData.medicalAidNumber || medicalInfoData.memberNumber || '',
          primaryMemberDetails: medicalInfoData.primaryMemberDetails || '',
          learnerConditions: medicalInfoData.learnerConditions || [],
          medicineNotToAdminister: medicalInfoData.medicineNotToAdminister || '',
          // Legacy fields
          medicalAidName: medicalInfoData.medicalAidName || '',
          memberNumber: medicalInfoData.memberNumber || '',
          mainMemberName: medicalInfoData.mainMemberName || '',
          conditions: medicalInfoData.conditions || [],
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
      'Medical Information': 1,
      'documents': 2,
      'Academic History': 3,
      'Financing': 4,
      'Fee Responsibility': 1,
      'Declaration': 5
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
    
    // Strict validation check matching getSectionValidationState
    if (!validation.isValid) {
      setError('Your application is incomplete. Please resolve the issues shown in the Incomplete Application banner above.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    console.log('ReviewSubmitStep: User clicked Submit Application button');
    setIsSubmitting(true);
    setError(null);

    if (onSubmit) {
      console.log('ReviewSubmitStep: Calling onSubmit handler');
      await onSubmit();
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

  const getBadge = (sectionKeys: string[]) => {
    const hasError = sectionKeys.some(key => validation.errors[key] !== undefined);
    
    if (hasError) {
      const totalCount = sectionKeys.reduce((acc, key) => acc + (validation.errors[key]?.length || 0), 0);
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-pulse ml-2 flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
          Incomplete ({totalCount})
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm ml-2 flex-shrink-0">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
        Complete
      </span>
    );
  };

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

          {/* Enhanced Validation Warning Panel */}
          {!validation.isValid && (
            <div className="mb-8 bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200 rounded-xl p-6 shadow-sm animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-amber-200">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-1">Mandatory Information Missing</h3>
                  <p className="text-xs sm:text-sm text-amber-700 mb-4 leading-relaxed font-medium">
                    We found some missing required fields. Please complete them using the "Fix Section" links next to each item below to submit your enrollment successfully.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(validation.errors).map(([sectionKey, fields]) => {
                      const sectionNames: { [key: string]: string } = {
                        student: 'Student Information',
                        applicationDetails: 'Application Details',
                        guardian: 'Guardian Details',
                        medical: 'Medical & Learner Health Details',
                        documents: 'Supporting Documents',
                        academicHistory: 'Academic History',
                        financing: 'Fee Agreement Plan',
                        fee: 'Fee Payer Responsibility Details',
                        declaration: 'Declaration Form'
                      };
                      
                      return (
                        <div key={sectionKey} className="bg-white border border-amber-100 rounded-lg p-4 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-amber-800 flex items-center justify-between mb-2">
                              <span>{sectionNames[sectionKey] || sectionKey}</span>
                              <span className="text-[10px] sm:text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                {fields.length} {fields.length === 1 ? 'missing' : 'missing'}
                              </span>
                            </h4>
                            <ul className="text-[11px] sm:text-xs text-amber-600 space-y-1 pl-4 list-disc mb-3">
                              {fields.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                          </div>
                          
                          <button
                            onClick={() => handleEdit(sectionKey === 'student' || sectionKey === 'medical' || sectionKey === 'guardian' || sectionKey === 'fee' ? (sectionKey === 'medical' ? 'Medical Information' : (sectionKey === 'fee' ? 'Fee Responsibility' : 'student-guardian')) : (sectionKey === 'documents' ? 'documents' : (sectionKey === 'academicHistory' ? 'Academic History' : (sectionKey === 'financing' ? 'Financing' : 'Declaration'))))}
                            className="w-full mt-2 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>Fix Section</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

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
              <AccordionItem 
                title="Student & Guardian Info" 
                onEdit={() => handleEdit('student-guardian')}
                statusBadge={getBadge(['student', 'applicationDetails', 'guardian'])}
              >
                {(validation.errors['student'] || validation.errors['applicationDetails'] || validation.errors['guardian']) && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>This section contains missing required fields.</span>
                    </div>
                    <button onClick={() => handleEdit('student-guardian')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Edit Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Student Information</h3>
                    <InfoItem label="Full Name" value={summaryData.student.name} isRequired={true} placeholder="Enter student's full name" />
                    <InfoItem label="Email Address" value={summaryData.student.email} isRequired={true} placeholder="student@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.student.phone} isRequired={true} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="Date of Birth" value={summaryData.student.dob} isRequired={true} placeholder="YYYY-MM-DD" />
                    {getActiveSchoolType() !== 'molo' && (
                      <InfoItem label="Gender" value={summaryData.student.gender} isRequired={true} placeholder="Gender" />
                    )}
                    <InfoItem label="ID Number" value={summaryData.student.idNumber} isRequired={true} placeholder="ID Number" />
                    <InfoItem label="Home Language" value={summaryData.student.homeLanguage} isRequired={true} placeholder="Home Language" />
                    <InfoItem label="Previous Grade / Class" value={summaryData.student.previousGrade} isRequired={true} placeholder="Previous Grade / Class" />
                    <InfoItem label="Grade / Class Applied For" value={summaryData.student.gradeAppliedFor} isRequired={true} placeholder="Grade / Class Applied For" />
                    <InfoItem label="Previous School" value={summaryData.student.previousSchool} isRequired={true} placeholder="Previous School" />
                    <InfoItem label="Student Number" value={summaryData.student.studentNumber} isRequired={true} placeholder="Student Number" />
                    <InfoItem label="Designated Pickup Person" value={summaryData.student.pickupPerson} isRequired={true} placeholder="Designated Pickup Person" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Application Details</h3>
                    <InfoItem label="Proposed Start Term" value={summaryData.applicationDetails?.proposedStartTerm} isRequired={true} placeholder="Please choose..." />
                    <InfoItem label="Year" value={summaryData.applicationDetails?.year} isRequired={true} placeholder="Please choose..." />
                    <InfoItem label="Grade / Class Applying For" value={summaryData.applicationDetails?.gradeApplyingFor} isRequired={true} placeholder="Please choose..." />
                    <InfoItem label="Proposed Start Date" value={summaryData.applicationDetails?.proposedStartDate} isRequired={false} placeholder="Choose date" />
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
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="font-semibold text-gray-700">Next of Kin Information</h3>
                    <InfoItem label="Full Name" value={summaryData.guardian?.nextOfKinName} isRequired={false} placeholder="Enter next of kin's full name" />
                    <InfoItem label="Relationship" value={summaryData.guardian?.nextOfKinRelationship} isRequired={false} placeholder="Relationship to student" />
                    <InfoItem label="Email Address" value={summaryData.guardian?.nextOfKinEmail} isRequired={false} placeholder="nextofkin@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.guardian?.nextOfKinPhone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="ID Number" value={summaryData.guardian?.nextOfKinIdNumber} isRequired={false} placeholder="Next of Kin ID Number" />
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem 
                title="Medical & Learner Health Details" 
                onEdit={() => handleEdit('Medical Information')}
                statusBadge={getBadge(['medical'])}
              >
                {validation.errors['medical'] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>This section contains missing required fields.</span>
                    </div>
                    <button onClick={() => handleEdit('Medical Information')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Edit Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Home Language" value={summaryData.medical?.homeLanguage} isRequired={true} placeholder="Home Language" />
                  <div className="md:col-span-2">
                    <InfoItem label="Allergies" value={summaryData.medical?.allergies} isRequired={true} placeholder="Allergy Information" />
                  </div>
                  <div className="md:col-span-2">
                    <InfoItem label="Allergy Action Required" value={summaryData.medical?.allergyActionRequired || 'Not specified'} isRequired={false} placeholder="Allergy actions" />
                  </div>
                  <InfoItem label="Allergy Status" value={summaryData.medical?.allergyStatus} isRequired={true} placeholder="Allergy Status" />
                  <InfoItem label="Compulsory Immunisations Up to Date" value={summaryData.medical?.immunisationsUpToDate} isRequired={true} placeholder="Immunisation Status" />
                  <InfoItem label="Medical Aid Scheme" value={summaryData.medical?.medicalAidScheme || summaryData.medical?.medicalAidName || 'Not specified'} isRequired={false} placeholder="Medical Aid Scheme" />
                  <InfoItem label="Medical Aid Number" value={summaryData.medical?.medicalAidNumber || summaryData.medical?.memberNumber || 'Not specified'} isRequired={false} placeholder="Medical Aid Number" />
                  <div className="md:col-span-2">
                    <InfoItem label="Primary Member Details" value={summaryData.medical?.primaryMemberDetails || 'Not specified'} isRequired={false} placeholder="Primary Member Details" />
                  </div>
                  <div className="md:col-span-2">
                    <InfoItem label="Learner Conditions Disclosure" value={summaryData.medical?.learnerConditions?.join(', ') || 'None'} isRequired={false} placeholder="Conditions" />
                  </div>
                  <div className="md:col-span-2">
                    <InfoItem label="Medicine Not To Be Administered" value={summaryData.medical?.medicineNotToAdminister || 'None'} isRequired={false} placeholder="Medicine restrictions" />
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem 
                title="Documents" 
                onEdit={() => handleEdit('documents')}
                statusBadge={getBadge(['documents'])}
              >
                {validation.errors['documents'] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>This section contains missing required files: {validation.errors['documents'].join(', ')}.</span>
                    </div>
                    <button onClick={() => handleEdit('documents')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Upload Now</button>
                  </div>
                )}
                <div className="p-4">
                  <div className="space-y-3">
                    {summaryData.documents && summaryData.documents.length > 0 && !validation.errors['documents'] ? (
                      <p className="text-green-700 font-bold flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        All required documents submitted
                      </p>
                    ) : (
                      <div className="text-gray-600 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <p className="font-semibold mb-2 text-sm text-gray-700">Uploaded files summary:</p>
                        {summaryData.documents && summaryData.documents.length > 0 ? (
                          <ul className="text-xs space-y-1 pl-4 list-disc text-gray-600">
                            {summaryData.documents.map((d: any, i) => (
                              <li key={i} className="font-medium text-gray-700">
                                {d.title || d.filename || d.name || 'Document'} <span className="text-gray-400 font-normal">({d.documentType || d.document_type || 'Unspecified Type'})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-red-500 font-semibold italic flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            No documents uploaded yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem 
                title="Academic History" 
                onEdit={() => handleEdit('Academic History')}
                statusBadge={getBadge(['academicHistory'])}
              >
                {validation.errors['academicHistory'] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>This section contains missing required fields or report card.</span>
                    </div>
                    <button onClick={() => handleEdit('Academic History')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Edit Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Previous School" value={summaryData.academicHistory[0]?.schoolName} isRequired={true} placeholder="Enter school name" />
                  <InfoItem label="School Type" value={summaryData.academicHistory[0]?.schoolType} isRequired={true} placeholder="e.g., Public" />
                  <InfoItem label="Last Class Completed" value={summaryData.academicHistory[0]?.lastGradeCompleted} isRequired={true} placeholder="e.g., Grade 7" />
                  <InfoItem label="Academic Year Completed" value={summaryData.academicHistory[0]?.academicYearCompleted} isRequired={true} placeholder="e.g., 2023" />
                  <InfoItem label="Reason for Leaving" value={summaryData.academicHistory[0]?.reasonForLeaving} isRequired={false} placeholder="Reason for leaving" />
                  <InfoItem label="Principal's Name" value={summaryData.academicHistory[0]?.principalName} isRequired={false} placeholder="Principal's name" />
                  <InfoItem label="School Phone Number" value={summaryData.academicHistory[0]?.schoolPhoneNumber} isRequired={false} placeholder="School phone number" />
                  <InfoItem label="School Email" value={summaryData.academicHistory[0]?.schoolEmail} isRequired={false} placeholder="School email" />
                  <div className="md:col-span-2">
                    <InfoItem 
                      label="Uploaded Report Card" 
                      value={summaryData.academicHistory[0]?.reportCardUrl} 
                      isRequired={true} 
                      placeholder="Report card has not been uploaded"
                    />
                  </div>
                </div>
              </AccordionItem>
              <AccordionItem 
                title="Financing" 
                onEdit={() => handleEdit('Financing')}
                statusBadge={getBadge(['financing'])}
              >
                {validation.errors['financing'] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Please select a fee payment plan option to proceed.</span>
                    </div>
                    <button onClick={() => handleEdit('Financing')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Select Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Selected Plan" value={summaryData.financing?.plan || ''} isRequired={true} placeholder="No financing plan selected" />
                  <InfoItem label="Fee Person" value={summaryData.financing?.feePerson || "Not specified"} isRequired={false} placeholder="Person responsible for fees" />
                  <InfoItem label="Relationship" value={summaryData.financing?.relationship || "Not specified"} isRequired={false} placeholder="Relationship to student" />
                </div>
              </AccordionItem>
              <AccordionItem 
                title="Fee Responsibility" 
                onEdit={() => handleEdit('Fee Responsibility')}
                statusBadge={getBadge(['fee'])}
              >
                {validation.errors['fee'] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>This section contains missing required fields.</span>
                    </div>
                    <button onClick={() => handleEdit('Fee Responsibility')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Edit Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Fee Person" value={summaryData.fee?.feePerson || "Not specified"} isRequired={true} placeholder="Person responsible for fees" />
                  <InfoItem label="Relationship" value={summaryData.fee?.relationship || "Not specified"} isRequired={true} placeholder="Relationship to student" />
                  <InfoItem label="Terms Accepted" value={summaryData.fee?.feeTermsAccepted ? "Yes" : ""} isRequired={true} placeholder="Fee terms acceptance required" />
                  <InfoItem label="Bank Name" value={summaryData.fee?.bankName || "Not specified"} isRequired={true} placeholder="Bank Name" />
                  <InfoItem label="Branch Code" value={summaryData.fee?.branchCode || "Not specified"} isRequired={true} placeholder="Branch Code" />
                  <InfoItem label="Account Number" value={summaryData.fee?.accountNumber || "Not specified"} isRequired={true} placeholder="Account Number" />
                  <InfoItem label="Account Type" value={summaryData.fee?.accountType || "Not specified"} isRequired={false} placeholder="Account Type" />
                </div>
              </AccordionItem>
              <AccordionItem 
                title="Declaration" 
                onEdit={() => handleEdit('Declaration')}
                statusBadge={getBadge(['declaration'])}
              >
                {validation.errors['declaration'] && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Please sign the declaration to authorize this application.</span>
                    </div>
                    <button onClick={() => handleEdit('Declaration')} className="text-amber-900 underline hover:text-orange-900 font-bold ml-2">Sign Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Full Name" value={summaryData.declaration?.fullName} isRequired={true} placeholder="Full Name" />
                  <InfoItem label="Agree to Truth" value={summaryData.declaration?.agree_truth} isRequired={true} placeholder="Acceptance required" />
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
                  disabled={!isConfirmed || isSubmitting || !validation.isValid}
                  className={`w-64 px-6 py-3 rounded-lg shadow-md font-semibold text-sm tracking-wide transition-all duration-300 ${
                    !validation.isValid
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white cursor-not-allowed opacity-75'
                      : !isConfirmed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105 hover:from-blue-600 hover:to-purple-700 cursor-pointer animate-pulse'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : !validation.isValid ? 'Fix Missing Fields to Submit' : 'Submit Application'}
                </button>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};
