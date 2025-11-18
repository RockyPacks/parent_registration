export enum StepStatus {
  Completed,
  Active,
  Upcoming,
}

export interface ApplicationStep {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
}

export enum CategoryStatus {
  Completed = 'Completed',
  InProgress = 'In progress',
  NotStarted = 'Not started',
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number; // in bytes
  progress: number; // 0-100
  timestamp: Date;
}

export interface DocumentCategory {
  id: string;
  title: string;
  status: CategoryStatus;
  files: UploadedFile[];
  required: boolean;
  description?: string;
}

export interface AcademicHistoryData {
  schoolName: string;
  schoolType: string;
  lastGradeCompleted: string;
  academicYearCompleted: string;
  yearCompleted?: number;
  reasonForLeaving?: string;
  principalName?: string;
  schoolPhoneNumber?: string;
  schoolEmail?: string;
  schoolAddress?: string;
  reportCard?: File | null;
  additionalNotes?: string;
  subjects?: string[];
}

export interface PlanType {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  pricing: {
    monthly: number;
    yearly: number;
  };
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface FinancingOption {
  id: string;
  name: string;
  description: string;
  interestRate: number;
  term: number;
  monthlyPayment: number;
}

export interface SummaryData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  academicHistory: AcademicHistoryData[];
  documents: DocumentCategory[];
  selectedPlan?: PlanType;
  financingOption?: FinancingOption;
  student?: {
    name: string;
    email: string;
    phone: string;
    dob?: string;
    gender?: string;
  };
  guardian?: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
  };
  subjects?: {
    core: string[];
    electives: string[];
  };
  financing?: {
    plan?: string;
  };
  fee?: {
    feePerson?: string;
    relationship?: string;
    feeTermsAccepted?: boolean;
  };
  declaration?: {
    signed: boolean;
  };
}

export interface LocalStorageData {
  studentInformation: {
    firstName?: string;
    surname?: string;
    email?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    middleName?: string;
    preferredName?: string;
    homeLanguage?: string;
    idNumber?: string;
    previousGrade?: string;
    gradeAppliedFor?: string;
    previousSchool?: string;
  };
  familyInformation: {
    fatherFirstName?: string;
    fatherSurname?: string;
    fatherEmail?: string;
    fatherMobile?: string;
    motherFirstName?: string;
    motherSurname?: string;
    motherEmail?: string;
    motherMobile?: string;
  };
  medicalInformation: {
    medicalAidName?: string;
    memberNumber?: string;
    conditions?: string[];
    allergies?: string;
  };
  feeResponsibility: {
    feePerson?: string;
    relationship?: string;
    feeTermsAccepted?: boolean;
  };
  academicHistoryFormData: AcademicHistoryData;
  selectedSubjects: {
    core: string[];
    electives: string[];
  };
  financingPlan: {
    plan?: string;
  };
  declarationData: {
    status?: string;
  };
}
