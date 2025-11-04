export type PlanType = 'forward-funding' | 'bnpl' | 'arrears-bnpl' | null;

export interface Step {
  id: number;
  title: string;
  status: StepStatus;
}

export enum StepStatus {
  Pending = 'pending',
  Current = 'current',
  Completed = 'completed',
}

export interface AcademicHistoryData {
  schoolName: string;
  schoolType: string;
  lastGradeCompleted: string;
  academicYearCompleted: string;
  reasonForLeaving: string;
  principalName: string;
  schoolPhoneNumber: string;
  schoolEmail: string;
  schoolAddress: string;
  reportCard: File | null;
  subjectsPerformedWellIn: string[];
  areasNeedingImprovement: string[];
  additionalNotes: string;
}

export interface SummaryData {
  student: {
    name: string;
    email: string;
    phone: string;
  };
  guardian: {
    name: string;
    relationship: string;
    email: string;
    phone: string;
  };
  documents: {
    name: string;
    status: 'Verified' | 'Pending';
  }[];
  academicHistory: {
    schoolName: string;
    lastGrade: string;
  };
  subjects: {
    core: string[];
    electives: string[];
  };
  financing: {
    plan: string | null;
  };
  declaration: {
    signed: boolean;
  };
}

export interface Feature {
  text: string;
  type: 'positive' | 'warning' | 'info';
}

export type TagType = 'save' | 'cost' | 'best-value' | 'none';

export interface FinancingOption {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  tag: {
    text: string;
    type: TagType;
  };
  features: Feature[];
}

export interface RiskCheckRequest {
  reference: string;
  guardian: {
    name: string;
    email: string;
    id_number: string;
    mobile: string;
    branch_code: string;
    account_number: string;
  };
}

export interface RiskReportResponse {
  risk_score: number;
  status: string;
  flags: string[];
}

export interface RiskReport {
  id: string;
  application_id: string;
  reference: string;
  guardian_email: string;
  risk_score: number;
  flags: string[];
  status: string;
  timestamp: string;
  raw_response: any;
  created_at: string;
  updated_at: string;
}
