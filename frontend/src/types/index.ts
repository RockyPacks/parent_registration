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
  reportCardUrl?: string;
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
    idNumber?: string;
    homeLanguage?: string;
    previousGrade?: string;
    gradeAppliedFor?: string;
    previousSchool?: string;
  };
  guardian?: {
    fatherName?: string;
    fatherRelationship?: string;
    fatherEmail?: string;
    fatherPhone?: string;
    fatherIdNumber?: string;
    motherName?: string;
    motherRelationship?: string;
    motherEmail?: string;
    motherPhone?: string;
    motherIdNumber?: string;
    nextOfKinName?: string;
    nextOfKinRelationship?: string;
    nextOfKinEmail?: string;
    nextOfKinPhone?: string;
    nextOfKinIdNumber?: string;
  };
  medical?: {
    medicalAidName?: string;
    memberNumber?: string;
    mainMemberName?: string;
    conditions?: string[];
    allergies?: string;
    doctorName?: string;
    doctorPhoneNumber?: string;
  };
  subjects?: {
    core: string[];
    electives: string[];
  };
  financing?: {
    plan?: string;
    feePerson?: string;
    relationship?: string;
    email?: string;
    mobile?: string;
    idNumber?: string;
    occupation?: string;
    employer?: string;
    employerAddress?: string;
    employerPhoneNumber?: string;
  };
  fee?: {
    feePerson?: string;
    relationship?: string;
    feeTermsAccepted?: boolean;
    bankName?: string;
    branchCode?: string;
    accountNumber?: string;
  };
  declaration?: {
    signed: boolean;
    agree_truth?: boolean;
    agree_policies?: boolean;
    agree_financial?: boolean;
    agree_verification?: boolean;
    agree_data_processing?: boolean;
    fullName?: string;
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
    fatherIdNumber?: string;
    motherFirstName?: string;
    motherSurname?: string;
    motherEmail?: string;
    motherMobile?: string;
    motherIdNumber?: string;
  };
  nextOfKinInformation: NextOfKinData;
  medicalInformation: {
    medicalAidName?: string;
    memberNumber?: string;
    mainMemberName?: string;
    conditions?: string[];
    allergies?: string;
    doctorName?: string;
    doctorPhoneNumber?: string;
  };
  feeResponsibility: {
    feePerson?: string;
    relationship?: string;
    feeTermsAccepted?: boolean;
    bankName?: string;
    branchCode?: string;
    accountNumber?: string;
  };
  academicHistoryFormData: AcademicHistoryData;
  selectedSubjects: {
    core: string[];
    electives: string[];
  };
  financingPlan: {
    plan?: string;
    feePerson?: string;
    relationship?: string;
    email?: string;
    mobile?: string;
    idNumber?: string;
    occupation?: string;
    employer?: string;
    employerAddress?: string;
    employerPhoneNumber?: string;
  };
  declarationData: {
    status?: string;
    agree_truth?: boolean;
    agree_policies?: boolean;
    agree_financial?: boolean;
    agree_verification?: boolean;
    agree_data_processing?: boolean;
    fullName?: string;
  };
}

export interface NextOfKinData {
  firstName?: string;
  surname?: string;
  relationship?: string;
  email?: string;
  mobile?: string;
  idNumber?: string;
}
