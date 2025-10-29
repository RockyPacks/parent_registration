import { Step, StepStatus } from './types';

export const STEPS: Step[] = [
  { id: 1, title: 'Student & Guardian Info', status: StepStatus.Completed },
  { id: 2, title: 'Document Upload', status: StepStatus.Completed },
  { id: 3, title: 'Academic History', status: StepStatus.Current },
];

export const SCHOOL_TYPES: string[] = ['Public', 'Private', 'Charter', 'Homeschool'];
export const GRADES: string[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
export const SUBJECTS: string[] = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Social Studies', 'Foreign Languages'];
