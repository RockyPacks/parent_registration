import { Step, StepStatus } from './types';

export const STEPS: Step[] = [
  { id: 1, title: 'Student & Guardian Info', status: StepStatus.Completed },
  { id: 2, title: 'Document Upload', status: StepStatus.Completed },
  { id: 3, title: 'Academic History', status: StepStatus.Current },
];

export const SCHOOL_TYPES: string[] = ['Public', 'Private', 'Charter', 'Homeschool'];
export const GRADES: string[] = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
export const SUBJECTS: string[] = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Social Studies', 'Foreign Languages'];

export const financingOptionsData = [
  {
    title: 'Pay Monthly',
    subtitle: 'Zero Discount',
    price: 'R 7,083',
    period: 'per month',
    tag: { text: '', type: 'none' },
    features: [
      { text: 'Standard school debit order', type: 'positive' },
      { text: 'No upfront payment required', type: 'positive' },
      { text: 'Predictable monthly budget', type: 'positive' },
    ],
  },
  {
    title: 'Pay Per Term',
    subtitle: 'Save 3%',
    price: 'R 27,483',
    period: 'per term',
    tag: { text: 'Save 3%', type: 'save' },
    features: [
      { text: 'Pay 3 times per year', type: 'positive' },
      { text: '3% discount on total fees', type: 'positive' },
      { text: 'Aligned with school terms', type: 'positive' },
    ],
  },
  {
    title: 'Pay Once Per Year',
    subtitle: 'Save 5%',
    price: 'R 80,750',
    period: 'per year',
    tag: { text: 'Save 5%', type: 'save' },
    features: [
      { text: 'Maximum discount available', type: 'positive' },
      { text: 'One payment, no worries', type: 'positive' },
      { text: 'Save R 4,250 annually', type: 'positive' },
    ],
  },
  {
    title: 'Buy Now, Pay Later',
    subtitle: 'Flexible Option',
    price: 'R 7,933',
    period: 'per month',
    tag: { text: '12% Cost', type: 'cost' },
    features: [
      { text: 'Pay school fees immediately', type: 'positive' },
      { text: 'Flexible repayment terms', type: 'positive' },
      { text: '12% cost of credit applies', type: 'warning' },
    ],
  },
  {
    title: 'Forward Funding',
    subtitle: '6-12 months',
    price: 'R 8,125',
    period: 'per month',
    tag: { text: '15% Cost', type: 'cost' },
    features: [
      { text: 'Cover funding gap', type: 'positive' },
      { text: 'Quick approval process', type: 'positive' },
      { text: '15% cost of credit applies', type: 'warning' },
    ],
  },
  {
    title: 'Sibling Benefit',
    subtitle: 'Multiple children',
    price: 'R 6,375',
    period: 'per child/month',
    tag: { text: 'Save 10%', type: 'save' },
    features: [
      { text: '10% discount per additional child', type: 'positive' },
      { text: 'Combined family billing', type: 'positive' },
      { text: '2 children detected', type: 'info' },
    ],
  },
];

export const qualifications = [
  'Monthly Payment Plans',
  'Termly & Annual Discounts',
  'Buy Now, Pay Later',
  'Forward Funding Loans',
  'Sibling Discounts',
];

export const requiredDocuments = [
  { text: 'Income Verification', type: 'positive' },
  { text: 'Bank Statements (3 months)', type: 'positive' },
  { text: 'Identity Documents', type: 'positive' },
  { text: 'Proof of Residence', type: 'positive' },
  { text: 'Credit Check (for loans)', type: 'warning' },
];
