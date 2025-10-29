import type { Step, Subject } from './types/subject';
import { StepStatus } from './types/subject';
import { BookOpenIcon, CalculatorIcon, HeartIcon, AcademicCapIcon, Bars3Icon, DocumentTextIcon, BeakerIcon, MusicalNoteIcon, PaintBrushIcon, MapPinIcon, BriefcaseIcon, CurrencyDollarIcon, ComputerDesktopIcon, ChartBarIcon, FaceSmileIcon, GlobeAltIcon, SunIcon, CubeIcon } from './components/icons';

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
