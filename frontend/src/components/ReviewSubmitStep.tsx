import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import AccordionItem from './AccordionItem';
import type { SummaryData, LocalStorageData, AcademicHistoryData } from '../types';
import { CategoryStatus } from '../types';
import Footer from './Footer';
import { storage } from '../utils/storage';


const InfoItem: React.FC<{ label: string; value: string; isRequired?: boolean; placeholder?: string }> = ({ label, value, isRequired = false, placeholder = '' }) => {
  const isEmpty = !value || value.trim() === '';

  return (
    <div>
      <p className="text-sm text-gray-500">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </p>
      <p className={`font-medium ${isEmpty && isRequired ? 'text-red-600' : 'text-gray-800'}`}>
        {isEmpty ? (
          isRequired ? 'Not provided' : (placeholder ? <span className="text-gray-400 italic">{placeholder}</span> : 'Not specified')
        ) : value}
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
      personalInfo: {
        firstName: data.student?.firstName || '',
        lastName: data.student?.surname || '',
        email: data.student?.email || ''
      },
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
        id: doc.id || '1',
        title: doc.filename || doc.name || 'Document',
        status: CategoryStatus.Completed,
        files: [],
        required: true
      })) || [],
        academicHistory: data.academicHistory ? [data.academicHistory] : [{
          schoolName: '',
          schoolType: 'public',
          lastGradeCompleted: '',
          academicYearCompleted: '',
        }],
      subjects: {
        core: data.subjects?.core || [],
        electives: data.subjects?.electives || []
      },
        financing: { plan: data.financing?.plan || data.financing?.selected_plan || '' },
        fee: data.fee || {},
        declaration: { signed: data.declaration?.status === 'completed' }
    };
  };

  useEffect(() => {
    // Always fetch summary data to check application status
    fetchSummaryData(currentData);
  }, [currentData]);

  // Add a separate effect to refresh academic history when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchSummaryData(currentData);
    };

    // Listen for storage changes (though this won't work for same-tab changes)
    window.addEventListener('storage', handleStorageChange);

    // Also check for changes every 2 seconds for same-tab updates
    const interval = setInterval(() => {
      const currentAcademicData = storage.get('academicHistoryFormData', {
        schoolName: '',
        schoolType: '',
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
      if (JSON.stringify(currentAcademicData) !== JSON.stringify(summaryData?.academicHistory?.[0] || {})) {
        fetchSummaryData(currentData);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentData, summaryData]);

  const fetchSummaryData = async (currentData?: any) => {
    try {
      setError(null);
      const applicationId = storage.getString('applicationId', '1');
      const backendData = await apiService.getApplication(applicationId);

      // Fetch academic history separately since it's stored in a different table
      let academicHistoryData = null;
      try {
        academicHistoryData = await apiService.getAcademicHistory(applicationId);
      } catch (academicErr) {
        // Academic history might not exist yet, continue without it
        console.log('Academic history not found, using default values');
      }

      // Always use backend data for status check, but merge with current data if provided
      let finalData;

      if (backendData && backendData.status === 'submitted') {
        setIsSubmitted(true);
        // For submitted applications, use backend data
        finalData = {
        student: {
          name: backendData.student?.first_name && backendData.student?.surname
            ? `${backendData.student.first_name} ${backendData.student.surname}`
            : '',
          email: backendData.student?.email || '',
          phone: backendData.student?.phone || '',
          dob: backendData.student?.date_of_birth || '',
          gender: backendData.student?.gender || ''
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
            id: doc.id,
            title: doc.original_filename || doc.document_type || 'Document',
            status: CategoryStatus.Completed,
            files: [],
            required: true
          })) || [],
          academicHistory: [{
            schoolName: academicHistoryData?.school_name || '',
            schoolType: academicHistoryData?.school_type || '',
            lastGradeCompleted: academicHistoryData?.last_grade_completed || '',
            academicYearCompleted: academicHistoryData?.academic_year_completed || '',
            reasonForLeaving: academicHistoryData?.reason_for_leaving || '',
            principalName: academicHistoryData?.principal_name || '',
            schoolPhoneNumber: academicHistoryData?.school_phone_number || '',
            schoolEmail: academicHistoryData?.school_email || '',
            subjects: academicHistoryData?.subjects || []
          }],
          subjects: {
            core: backendData.subjects?.core || [],
            electives: backendData.subjects?.electives || []
          },
          financing: { plan: backendData.financing?.selected_plan || backendData.financing?.plan_type || '' },
          declaration: { signed: backendData.declaration?.status === 'completed' },
          fee: backendData.fee || {}
        };
      } else {
        // For non-submitted applications, use current data or localStorage, but always merge with latest data from localStorage
        let baseData;
        if (currentData) {
          baseData = transformCurrentDataToSummary(currentData);
        } else {
          baseData = getLocalStorageData();
        }

        // Always override academic history with the latest from localStorage to ensure immediate updates
        const academicData: AcademicHistoryData = storage.get('academicHistoryFormData', {
          schoolName: '',
          schoolType: '',
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

        // Always override financing with the latest from localStorage to ensure immediate updates
        const financingData: LocalStorageData['financingPlan'] = storage.get('financingPlan', {});

        finalData = {
          ...baseData,
          academicHistory: [academicData],
          financing: financingData
        };
      }

      setSummaryData(finalData);
    } catch (err: any) {
      // Fallback to localStorage data if backend is not available
      setSummaryData(getLocalStorageData());
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalStorageData = (): SummaryData => {
    try {
      // Get data from the current form state stored in MainContent
      // Get data from the current form state stored in MainContent
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
      const financingData: LocalStorageData['financingPlan'] = storage.get('financingPlan', {});
      const feeData: LocalStorageData['feeResponsibility'] = storage.get('feeResponsibility', {});
      const declarationData: LocalStorageData['declarationData'] = storage.get('declarationData', {});

      // Get uploaded documents from localStorage if available
      const uploadedFiles: any[] = storage.get('uploadedFiles', []);
      const documents = uploadedFiles.map((file, index) => ({
        id: index.toString(),
        title: file.filename || file.name || 'Document',
        status: CategoryStatus.Completed,
        files: [],
        required: true,
      }));

      return {
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
          gender: studentData.gender || ''
        },
        guardian: {
          name: familyData.fatherFirstName && familyData.fatherSurname ? `${familyData.fatherFirstName} ${familyData.fatherSurname}` : '',
          relationship: 'Father',
          email: familyData.fatherEmail || '',
          phone: familyData.fatherMobile || ''
        },
        documents,
        academicHistory: [academicData],
        subjects: {
          core: subjectData.core || [],
          electives: subjectData.electives || []
        },
        fee: feeData,
        financing: financingData,
        declaration: { signed: declarationData.status === 'completed' }
      };
    } catch (error) {
      return {
        personalInfo: {
          firstName: '',
          lastName: '',
          email: ''
        },
        student: { name: '', email: '', phone: '', dob: '', gender: '' },
        guardian: { name: '', relationship: 'Father', email: '', phone: '' },
        documents: [],
        academicHistory: [{
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
        }],
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

  // Helper function to format dates for API
  const formatDateForAPI = (date: string | Date | null | undefined): string | null => {
    if (!date) return null;

    // If it's already a string in YYYY-MM-DD format, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // If it's a Date object or ISO string with time, extract just the date part
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return null;
  };


  // Validation function to check required fields
  const validateRequiredFields = (data: any): boolean => {
    // Check student information
    if (!data.student?.surname || data.student.surname.trim() === '') {
      setError('Student surname is required.');
      return false;
    }
    if (!data.student?.firstName || data.student.firstName.trim() === '') {
      setError('Student first name is required.');
      return false;
    }
    if (!data.student?.date_of_birth || data.student.date_of_birth.trim() === '') {
      setError('Student date of birth is required.');
      return false;
    }
    if (!data.student?.gender || data.student.gender.trim() === '') {
      setError('Student gender is required.');
      return false;
    }
    if (!data.student?.homeLanguage || data.student.homeLanguage.trim() === '') {
      setError('Student home language is required.');
      return false;
    }
    if (!data.student?.idNumber || data.student.idNumber.trim() === '') {
      setError('Student ID number is required.');
      return false;
    }
    if (!data.student?.previousGrade || data.student.previousGrade.trim() === '') {
      setError('Student previous grade is required.');
      return false;
    }
    if (!data.student?.gradeAppliedFor || data.student.gradeAppliedFor.trim() === '') {
      setError('Grade applied for is required.');
      return false;
    }
    if (!data.student?.previousSchool || data.student.previousSchool.trim() === '') {
      setError('Previous school is required.');
      return false;
    }

    // Check fee responsibility
    if (!data.fee?.feePerson || data.fee.feePerson.trim() === '') {
      setError('Fee person is required.');
      return false;
    }
    if (!data.fee?.relationship || data.fee.relationship.trim() === '') {
      setError('Relationship to fee person is required.');
      return false;
    }
    if (data.fee?.feeTermsAccepted !== true) {
      setError('Fee terms must be accepted.');
      return false;
    }

    // Check declaration
    if (!data.declaration?.agree_truth) {
      setError('Declaration agreement is required.');
      return false;
    }
    if (!data.declaration?.agree_policies) {
      setError('Policy agreement is required.');
      return false;
    }
    if (!data.declaration?.agree_financial) {
      setError('Financial responsibility agreement is required.');
      return false;
    }
    if (!data.declaration?.agree_verification) {
      setError('Information verification agreement is required.');
      return false;
    }
    if (!data.declaration?.agree_data_processing) {
      setError('Data processing agreement is required.');
      return false;
    }
    if (!data.declaration?.fullName || data.declaration.fullName.trim() === '') {
      setError('Full name for declaration is required.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || !summaryData) {
      setError('Please confirm the application before submitting.');
      return;
    }

    // Check if application is fully initialized before submitting
    const applicationId = storage.getString('applicationId', '1');
    if (!applicationId || applicationId === '1') {
      setError('Application not yet initialized. Please wait and try again.');
      console.log("ReviewSubmitStep: Submit blocked - Application not initialized");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Get all data from local storage (using the same keys as MainContent)
      const studentData: LocalStorageData['studentInformation'] = storage.get('studentInformation', {});
      const familyData: LocalStorageData['familyInformation'] = storage.get('familyInformation', {});
      const medicalData: LocalStorageData['medicalInformation'] = storage.get('medicalInformation', {});
      const feeData: LocalStorageData['feeResponsibility'] = storage.get('feeResponsibility', {});
      const academicData: LocalStorageData['academicHistoryFormData'] = storage.get('academicHistoryFormData', {
        schoolName: '',
        schoolType: 'public',
        lastGradeCompleted: '',
        academicYearCompleted: '',
        subjects: []
      });
      const subjectData: LocalStorageData['selectedSubjects'] = storage.get('selectedSubjects', { core: [], electives: [] });
      const financingData: LocalStorageData['financingPlan'] = storage.get('financingPlan', {});
      const declarationData: LocalStorageData['declarationData'] = storage.get('declarationData', {});

      // Format all date fields to match backend expectations
      const formattedStudentData = {
        ...studentData,
        date_of_birth: formatDateForAPI(studentData.dob),
        gender: studentData.gender ? studentData.gender.toLowerCase() : null,
      };

      // Format academic history data and ensure required fields are not empty
      const formattedAcademicData = {
        ...academicData,
        schoolName: academicData.schoolName || 'N/A',
        lastGradeCompleted: academicData.lastGradeCompleted || 'N/A',
        academicYearCompleted: academicData.academicYearCompleted || new Date().getFullYear().toString(),
      };

      const fullApplicationData = {
        student: formattedStudentData,
        family: familyData,
        medical: medicalData,
        fee: feeData,
        academicHistory: formattedAcademicData,
        subjects: subjectData,
        financing: financingData,
        declaration: declarationData,
      };

      // Validate required fields before submission
      if (!validateRequiredFields(fullApplicationData)) {
        return;
      }

      const response = await apiService.submitFullApplication(applicationId, fullApplicationData);

      // Show success message
      setError('Application submitted successfully!');

      // Show a brief success message before transitioning
      setTimeout(() => {
        setIsSubmitted(true);
        if (onStepComplete) {
          onStepComplete(7);
        }
      }, 2000); // 2 second delay to show success message

      // Refresh summary data to get updated status
      fetchSummaryData();
    } catch (err: any) {
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

  // Show read-only view if submitted
  if (isSubmitted) {
    return (
      <>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h1>
                <p className="text-gray-700 font-medium">Your enrollment application has been received and is now read-only</p>
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
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Application Submitted</h1>
              <p className="text-gray-600 mt-1">Your application has been successfully submitted. Below is your submitted information for reference.</p>
              <div className="bg-gray-50 rounded-lg p-4 inline-block mt-4">
                <p className="text-sm text-gray-500">Application ID</p>
                <p className="text-lg font-semibold text-gray-900">{storage.getString('applicationId', 'N/A')}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Our admissions team will review your application and contact you within 5-7 business days.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Submitted Application Summary</h2>
              <AccordionItem title="Student & Guardian Info" onEdit={undefined}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Student Information</h3>
                    <InfoItem label="Full Name" value={summaryData.student.name} isRequired={true} placeholder="Enter student's full name" />
                    <InfoItem label="Email Address" value={summaryData.student.email} isRequired={false} placeholder="student@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.student.phone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="Date of Birth" value={summaryData.student.dob} isRequired={false} placeholder="YYYY-MM-DD" />
                    <InfoItem label="Gender" value={summaryData.student.gender} isRequired={false} placeholder="Gender" />
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
              <AccordionItem title="Documents" onEdit={undefined}>
                <div className="p-4">
                  <div className="space-y-3">
                    {summaryData.documents.length > 0 ? (
                      summaryData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-800">{doc.title}</span>
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
              <AccordionItem title="Academic History" onEdit={undefined}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Previous School" value={summaryData.academicHistory[0].schoolName} isRequired={true} placeholder="Enter school name" />
                  <InfoItem label="School Type" value={summaryData.academicHistory[0].schoolType} isRequired={true} placeholder="e.g., Public" />
                  <InfoItem label="Last Grade Completed" value={summaryData.academicHistory[0].lastGradeCompleted} isRequired={true} placeholder="e.g., Grade 12" />
                  <InfoItem label="Academic Year Completed" value={summaryData.academicHistory[0].academicYearCompleted} isRequired={true} placeholder="e.g., 2023" />
                  <InfoItem label="Reason for Leaving" value={summaryData.academicHistory[0].reasonForLeaving || ''} isRequired={false} placeholder="Reason for leaving" />
                  <InfoItem label="Principal's Name" value={summaryData.academicHistory[0].principalName || ''} isRequired={false} placeholder="Principal's name" />
                  <InfoItem label="School Phone Number" value={summaryData.academicHistory[0].schoolPhoneNumber || ''} isRequired={false} placeholder="School phone number" />
                  <InfoItem label="School Email" value={summaryData.academicHistory[0].schoolEmail || ''} isRequired={false} placeholder="School email" />
                </div>
              </AccordionItem>
              <AccordionItem title="Financing" onEdit={undefined}>
                <div className="p-4">
                  <InfoItem label="Selected Plan" value={summaryData.financing.plan || ''} isRequired={false} placeholder="No financing plan selected" />
                  <InfoItem label="Fee Person" value={summaryData.fee?.feePerson || "Not specified"} isRequired={false} placeholder="Person responsible for fees" />
                  <InfoItem label="Relationship" value={summaryData.fee?.relationship || "Not specified"} isRequired={false} placeholder="Relationship to student" />
                  <InfoItem label="Terms Accepted" value={summaryData.fee?.feeTermsAccepted ? "Yes" : "No"} isRequired={false} placeholder="Fee terms acceptance" />
                </div>
              </AccordionItem>
              <AccordionItem title="Declaration" onEdit={undefined}>
                <div className="p-4">
                  <InfoItem label="Declaration Status" value={summaryData.declaration.signed ? 'Signed and completed' : ''} isRequired={true} placeholder="Declaration not signed" />
                </div>
              </AccordionItem>
            </div>
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
              <AccordionItem title="Student & Guardian Info" onEdit={isSubmitted ? undefined : () => handleEdit('student-guardian')} disabled={isSubmitted}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Student Information</h3>
                    <InfoItem label="Full Name" value={summaryData.student.name} isRequired={true} placeholder="Enter student's full name" />
                    <InfoItem label="Email Address" value={summaryData.student.email} isRequired={false} placeholder="student@example.com" />
                    <InfoItem label="Phone Number" value={summaryData.student.phone} isRequired={false} placeholder="+27 XX XXX XXXX" />
                    <InfoItem label="Date of Birth" value={summaryData.student.dob} isRequired={false} placeholder="YYYY-MM-DD" />
                    <InfoItem label="Gender" value={summaryData.student.gender} isRequired={false} placeholder="Gender" />
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
              <AccordionItem title="Documents" onEdit={isSubmitted ? undefined : () => handleEdit('documents')} disabled={isSubmitted}>
                <div className="p-4">
                  <div className="space-y-3">
                    {summaryData.documents.length > 0 ? (
                      summaryData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-800">{doc.title}</span>
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
              <AccordionItem title="Academic History" onEdit={isSubmitted ? undefined : () => handleEdit('Academic History')} disabled={isSubmitted}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <InfoItem label="Previous School" value={summaryData.academicHistory[0].schoolName} isRequired={true} placeholder="Enter school name" />
                  <InfoItem label="School Type" value={summaryData.academicHistory[0].schoolType} isRequired={true} placeholder="e.g., Public" />
                  <InfoItem label="Last Grade Completed" value={summaryData.academicHistory[0].lastGradeCompleted} isRequired={true} placeholder="e.g., Grade 12" />
                  <InfoItem label="Academic Year Completed" value={summaryData.academicHistory[0].academicYearCompleted} isRequired={true} placeholder="e.g., 2023" />
                  <InfoItem label="Reason for Leaving" value={summaryData.academicHistory[0].reasonForLeaving || ''} isRequired={false} placeholder="Reason for leaving" />
                  <InfoItem label="Principal's Name" value={summaryData.academicHistory[0].principalName || ''} isRequired={false} placeholder="Principal's name" />
                  <InfoItem label="School Phone Number" value={summaryData.academicHistory[0].schoolPhoneNumber || ''} isRequired={false} placeholder="School phone number" />
                  <InfoItem label="School Email" value={summaryData.academicHistory[0].schoolEmail || ''} isRequired={false} placeholder="School email" />
                </div>
              </AccordionItem>
              <AccordionItem title="Financing" onEdit={isSubmitted ? undefined : () => handleEdit('Financing')} disabled={isSubmitted}>
                <div className="p-4">
                  <InfoItem label="Selected Plan" value={summaryData.financing.plan || ''} isRequired={false} placeholder="No financing plan selected" />
                  <InfoItem label="Fee Person" value={summaryData.fee?.feePerson || "Not specified"} isRequired={false} placeholder="Person responsible for fees" />
                  <InfoItem label="Relationship" value={summaryData.fee?.relationship || "Not specified"} isRequired={false} placeholder="Relationship to student" />
                  <InfoItem label="Terms Accepted" value={summaryData.fee?.feeTermsAccepted ? "Yes" : "No"} isRequired={false} placeholder="Fee terms acceptance" />
                </div>
              </AccordionItem>
              <AccordionItem title="Declaration" onEdit={isSubmitted ? undefined : () => handleEdit('Declaration')} disabled={isSubmitted}>
                <div className="p-4">
                  <InfoItem label="Declaration Status" value={summaryData.declaration.signed ? 'Signed and completed' : ''} isRequired={false} placeholder="Declaration not signed" />
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
