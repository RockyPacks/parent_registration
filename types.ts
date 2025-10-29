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
