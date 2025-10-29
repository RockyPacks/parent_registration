
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
