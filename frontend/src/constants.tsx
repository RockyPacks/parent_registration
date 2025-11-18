import type { Step, Subject } from './types/subject';
import { StepStatus } from './types/subject';
import { BookOpenIcon, CalculatorIcon, HeartIcon, AcademicCapIcon, Bars3Icon, DocumentTextIcon, BeakerIcon, MusicalNoteIcon, PaintBrushIcon, MapPinIcon, BriefcaseIcon, CurrencyDollarIcon, ComputerDesktopIcon, ChartBarIcon, FaceSmileIcon, GlobeAltIcon, SunIcon, CubeIcon } from './components/Icons';

export const STEPS: Step[] = [
  {
    id: 1,
    title: 'Student & Guardian Info',
    description: 'Personal details completed',
    status: StepStatus.Completed,
  },
  {
    id: 2,
    title: 'Document Upload',
    description: 'Documents submitted',
    status: StepStatus.Completed,
  },
  {
    id: 3,
    title: 'Academic History',
    description: 'Previous records added',
    status: StepStatus.Completed,
  },
  {
    id: 4,
    title: 'Subjects Selection',
    description: 'Currently active',
    status: StepStatus.Active,
  },
  {
    id: 5,
    title: 'Fee Agreement',
    description: 'Pending',
    status: StepStatus.Pending,
  },
];

export const CORE_SUBJECTS: Subject[] = [
    { id: 'eng', name: 'English', icon: BookOpenIcon },
    { id: 'math', name: 'Mathematics', icon: CalculatorIcon },
    { id: 'life', name: 'Life Orientation', icon: HeartIcon },
];

export const ELECTIVE_SUBJECTS: Subject[] = [
    { id: 'phy_sci', name: 'Physical Sciences', icon: BeakerIcon },
    { id: 'life_sci', name: 'Life Sciences', icon: BookOpenIcon },
    { id: 'hist', name: 'History', icon: AcademicCapIcon },
    { id: 'geo', name: 'Geography', icon: MapPinIcon },
    { id: 'biz', name: 'Business Studies', icon: BriefcaseIcon },
    { id: 'acc', name: 'Accounting', icon: CurrencyDollarIcon },
    { id: 'it', name: 'Information Technology', icon: ComputerDesktopIcon },
    { id: 'art', name: 'Visual Arts', icon: PaintBrushIcon },
    { id: 'music', name: 'Music', icon: MusicalNoteIcon },
    { id: 'econ', name: 'Economics', icon: ChartBarIcon },
    { id: 'drama', name: 'Dramatic Arts', icon: FaceSmileIcon },
    { id: 'tourism', name: 'Tourism', icon: GlobeAltIcon },
    { id: 'agri', name: 'Agricultural Sciences', icon: SunIcon },
    { id: 'egd', name: 'Eng. Graphics & Design', icon: CubeIcon },
];

export const financingOptionsData = [
  {
    title: 'Pay Monthly Debit',
    subtitle: 'No upfront required',
    price: 'R 7,083',
    period: '/month',
    tag: { type: 'save', text: 'Flexible Budget' },
    features: [
      { text: 'No upfront payment required', type: 'positive' },
      { text: 'Flexible monthly budget', type: 'positive' },
      { text: 'Spread over 12 months', type: 'positive' },
    ],
  },
  {
    title: 'Pay Per Term',
    subtitle: '3% discount total',
    price: 'R 27,483',
    period: '/term',
    tag: { type: 'save', text: '3% Discount' },
    features: [
      { text: '3% discount on total fees', type: 'positive' },
      { text: 'Payment per school term', type: 'positive' },
      { text: 'Selected term plan', type: 'positive' },
    ],
  },
  {
    title: 'Pay Once Per Year',
    subtitle: '5% discount',
    price: 'R 80,750',
    period: '/year',
    tag: { type: 'best-value', text: '5% Discount' },
    features: [
      { text: '5% discount for yearly payment', type: 'positive' },
      { text: 'One year warranty included', type: 'positive' },
      { text: 'Simplified annual billing', type: 'positive' },
    ],
  },
  {
    title: 'Buy Now, Pay Later',
    subtitle: '12% cost applies',
    price: 'R 7,933',
    period: '',
    tag: { type: 'cost', text: '12% Cost' },
    features: [
      { text: 'Immediate access to services', type: 'positive' },
      { text: '12% financing cost applies', type: 'positive' },
      { text: 'Deferred payment option', type: 'positive' },
    ],
  },
  {
    title: 'Forward Funding',
    subtitle: '15% cost applies',
    price: 'R 8,125',
    period: '',
    tag: { type: 'cost', text: '15% Cost' },
    features: [
      { text: 'Quick funding approval', type: 'positive' },
      { text: '15% cost of credit applies', type: 'positive' },
      { text: 'For urgent needs', type: 'positive' },
    ],
  },
  {
    title: 'Sibling Benefit',
    subtitle: '20% sibling discount',
    price: 'R 6,375',
    period: '',
    tag: { type: 'save', text: '20% Discount' },
    features: [
      { text: '20% discount for siblings', type: 'positive' },
      { text: 'Multiple children enrolled', type: 'positive' },
      { text: 'Family savings plan', type: 'positive' },
    ],
  },
];

export const qualifications = [
  'South African Citizen',
  'Grade 12 or equivalent',
  'Minimum academic requirements',
  'Financial need assessment',
];

export const requiredDocuments = [
  { text: 'ID Document', type: 'positive' },
  { text: 'Proof of Residence', type: 'positive' },
  { text: 'Academic Records', type: 'positive' },
  { text: 'Medical Certificate', type: 'warning' },
  { text: 'Birth Certificate', type: 'positive' },
];

export const SCHOOL_TYPES = [
  { value: 'public', label: 'Public School' },
  { value: 'private', label: 'Private School' },
  { value: 'international', label: 'International School' },
  { value: 'home', label: 'Home Schooling' },
];

export const GRADES = [
  { value: 'grade8', label: 'Grade 8' },
  { value: 'grade9', label: 'Grade 9' },
  { value: 'grade10', label: 'Grade 10' },
  { value: 'grade11', label: 'Grade 11' },
  { value: 'grade12', label: 'Grade 12' },
];

export const SUBJECTS = [
  { value: 'english', label: 'English' },
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'biology', label: 'Biology' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'business', label: 'Business Studies' },
  { value: 'art', label: 'Visual Arts' },
  { value: 'music', label: 'Music' },
  { value: 'technology', label: 'Information Technology' },
  { value: 'economics', label: 'Economics' },
  { value: 'tourism', label: 'Tourism' },
  { value: 'agriculture', label: 'Agricultural Sciences' },
  { value: 'egd', label: 'Engineering Graphics & Design' },
  { value: 'drama', label: 'Dramatic Arts' },
];
