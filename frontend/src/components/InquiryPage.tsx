import React, { useState, useEffect, useRef } from 'react';
import knitIcon from '../../assets/knit-icon.png';

const MOLO_CLASS_NAME_OPTIONS = [
  'Empress of Menen',
  'Frances Gqoba',
  'Sibulelo Mashale',
  'Thandeka Nonkasana',
  'Nosiseko Dlakavu',
  'Amanirenas of Kush',
];
interface InquiryPageProps {
  schoolId?: string | null;
  onBackToLogin?: () => void;
}

interface SchoolBranding {
  id: string;
  name: string;
  logoUrl?: string;
}

interface SchoolListItem {
  id: string;
  schoolName: string;
}

interface FormFields {
  parentName: string;
  contactNumber: string;
  email: string;
  grade: string;
  academicYear: string;
}

interface FormErrors {
  parentName?: string;
  contactNumber?: string;
  email?: string;
  grade?: string;
  academicYear?: string;
}

export const InquiryPage: React.FC<InquiryPageProps> = ({ schoolId: initialSchoolId, onBackToLogin }) => {
  // Active School selection state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(initialSchoolId || null);
  
  // School list (for selector mode)
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [loadingSchoolsList, setLoadingSchoolsList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown UI states
  const [tempSelectedSchool, setTempSelectedSchool] = useState<SchoolListItem | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Branding states
  const [school, setSchool] = useState<SchoolBranding | null>(null);
  const [loadingSchool, setLoadingSchool] = useState<boolean>(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<FormFields>({
    parentName: '',
    contactNumber: '',
    email: '',
    grade: '',
    academicYear: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  // Fetch list of all schools (only if no schoolId is active)
  useEffect(() => {
    const fetchSchoolsList = async () => {
      if (selectedSchoolId) return;

      try {
        setLoadingSchoolsList(true);
        const res = await fetch(`${API_BASE_URL}/schools`);
        if (!res.ok) throw new Error('Failed to fetch school list');
        const result = await res.json();
        setSchools(result.data || []);
      } catch (err) {
        console.error('Failed to fetch schools list:', err);
      } finally {
        setLoadingSchoolsList(false);
      }
    };

    fetchSchoolsList();
  }, [selectedSchoolId, API_BASE_URL]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch branding details of selected school
  useEffect(() => {
    const fetchSchoolBranding = async () => {
      if (!selectedSchoolId) {
        setSchool(null);
        return;
      }

      try {
        setLoadingSchool(true);
        setSchoolError(null);
        const res = await fetch(`${API_BASE_URL}/schools/${selectedSchoolId}/public`);
        
        if (res.status === 404) {
          setSchoolError("This admissions form is not available. Please contact the school directly.");
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch school details');
        }

        const data = await res.json();
        setSchool(data);
      } catch (err) {
        console.error('Branding fetch error:', err);
        setSchoolError("This admissions form is not available. Please contact the school directly.");
      } finally {
        setLoadingSchool(false);
      }
    };

    fetchSchoolBranding();
  }, [selectedSchoolId, API_BASE_URL]);

  // Form input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field as the parent edits it
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  };

  // Form validation on submit
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Parent Name validation
    const trimmedName = form.parentName.trim();
    if (!trimmedName) {
      newErrors.parentName = 'Parent full name is required';
    } else if (trimmedName.length < 2) {
      newErrors.parentName = 'Name must be at least 2 characters long';
    } else {
      const nameParts = trimmedName.split(/\s+/);
      if (nameParts.length < 2) {
        newErrors.parentName = 'Please enter both your first and last name';
      }
    }

    // Contact Number validation (stripping spaces/hyphens/parentheses and matching South African phone pattern)
    const cleanPhone = form.contactNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    if (!form.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.contactNumber = 'Invalid contact number. Use format e.g. 0821234567 or +27821234567';
    }

    // Email validation (standard system regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = 'Invalid email address format';
    }

    // Class name validation
    if (!form.grade) {
      newErrors.grade = 'Class Name is required';
    }

    // Academic Year validation
    if (!form.academicYear) {
      newErrors.academicYear = 'Academic year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/schools/${selectedSchoolId}/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentName: form.parentName,
          contactNumber: form.contactNumber,
          email: form.email,
          grade: form.grade,
          academicYear: form.academicYear,
        }),
      });

      if (res.status === 201) {
        setSuccess(true);
      } else if (res.status === 400) {
        const errorData = await res.json();
        if (errorData.detail && typeof errorData.detail === 'string') {
          setNetworkError(errorData.detail);
        } else if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          setNetworkError('Invalid form entry. Please check your details and try again.');
        }
      } else {
        throw new Error('Server returned an error');
      }
    } catch (err) {
      console.error('Prospect submission error:', err);
      setNetworkError('Something went wrong. Please try again or contact the school directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form
  const handleReset = () => {
    setForm({
      parentName: '',
      contactNumber: '',
      email: '',
      grade: '',
      academicYear: '',
    });
    setErrors({});
    setNetworkError(null);
    setSuccess(false);
  };

  // Filter schools list based on search
  const filteredSchools = schools.filter(s => 
    s.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSchool = (s: SchoolListItem) => {
    setTempSelectedSchool(s);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleConfirmSchool = () => {
    if (tempSelectedSchool) {
      setSelectedSchoolId(tempSelectedSchool.id);
    }
  };

  // ==========================================
  // RENDER STATE: School Selection (Selector Mode)
  // ==========================================
  if (!selectedSchoolId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[500px] flex flex-col gap-6">
          
          {/* Main Selector Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-150">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 mb-2">School Admissions Portal</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Submit an inquiry to express initial interest and connect directly with a school's admissions team.
              </p>
            </div>

            {/* School Search Searchable Dropdown */}
            <div className="relative mb-5" ref={dropdownRef}>
              <label htmlFor="school-search" className="text-slate-600 uppercase tracking-widest text-[11px] font-bold select-none mb-1.5 block" style={{ letterSpacing: '0.5px' }}>
                Select Your School <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                {loadingSchoolsList ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2.5 bg-slate-50">
                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm text-slate-500">Loading schools list...</span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        id="school-search"
                        type="text"
                        placeholder={tempSelectedSchool ? tempSelectedSchool.schoolName : "Search and select your school..."}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full pr-10 pl-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-500"
                      />
                      <svg className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Floating Dropdown Panel */}
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                        {filteredSchools.length > 0 ? (
                          <ul className="py-1">
                            {filteredSchools.map((item) => (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectSchool(item)}
                                  className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-semibold transition-colors cursor-pointer ${
                                    tempSelectedSchool?.id === item.id ? 'bg-blue-100 text-blue-900' : 'text-slate-800'
                                  }`}
                                >
                                  {item.schoolName}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-xs font-semibold text-slate-400">
                            {searchQuery ? 'No schools found' : 'Type to search...'}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Selected Confirmation Banner */}
            {tempSelectedSchool && (
              <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between animate-fade-in">
                <p className="text-xs text-blue-900 font-semibold leading-tight">
                  <span className="text-[10px] uppercase text-blue-500 font-bold block mb-0.5" style={{ letterSpacing: '0.5px' }}>Selected School</span>
                  {tempSelectedSchool.schoolName}
                </p>
                <button
                  type="button"
                  onClick={() => setTempSelectedSchool(null)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Proceed Action Button */}
            <button
              type="button"
              disabled={!tempSelectedSchool}
              onClick={handleConfirmSchool}
              className="w-full mb-3 py-3 px-4 text-white font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-1.5 select-none cursor-pointer"
            >
              <span>Proceed to Inquiry Form</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Back to Login Button */}
            {onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl text-sm transition-all active:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Login</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pb-4 text-xs font-semibold text-slate-400 tracking-wide">
            Powered by <span className="text-slate-500 font-bold">Knit</span> · <a href="https://knit.cash" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">knit.cash</a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STATE: Loading School Branding
  // ==========================================
  if (loadingSchool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading admissions form...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STATE: School Details Fetch Error
  // ==========================================
  if (schoolError || !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Form Not Available</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            {schoolError || "This admissions form is not available. Please contact the school directly."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSchoolId(null);
              setTempSelectedSchool(null);
            }}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const initialLetter = school.name.charAt(0).toUpperCase();

  // ==========================================
  // RENDER STATE: Form and Details Page
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      
      <div className="w-full max-w-[580px] flex flex-col gap-6 animate-fade-in">
        
        {/* Back Link if not locked to URL param */}
        {(!initialSchoolId || onBackToLogin) && (
          <div className="flex justify-between items-center px-1">
            <button
              onClick={() => {
                if (initialSchoolId) {
                  if (onBackToLogin) onBackToLogin();
                } else {
                  setSelectedSchoolId(null);
                  setTempSelectedSchool(null);
                  handleReset();
                }
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{initialSchoolId ? 'Back to Login' : 'Back to school selection'}</span>
            </button>
          </div>
        )}

        {/* School Header Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-150 relative flex items-center gap-4">
          <span className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-100">
            Admissions Module
          </span>

          <img 
            src={knitIcon} 
            alt="Knit Logo" 
            className="w-12 h-12 rounded-xl object-contain border border-gray-100 p-1 shrink-0" 
          />

          <div className="pr-28">
            <h1 className="text-lg sm:text-xl font-bold text-gray-950 leading-tight">
              {school.name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Official inquiry portal</p>
          </div>
        </div>

        {/* Main Content Card (Form or Success state) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-150">
          {!success ? (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="border-b border-gray-100 pb-3 mb-1">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Submit this quick inquiry form to express initial interest in {school.name}. Submitting this form creates an entry with our admissions department, who will get in touch with you shortly to guide you on the next steps.
                </p>
              </div>
              
              {/* Row 1: Contact Number + Email (2-Column) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contactNumber" className="text-gray-700 uppercase tracking-widest text-[11px] font-bold select-none" style={{ letterSpacing: '0.5px' }}>
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    placeholder="e.g. +27 82 123 4567"
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.contactNumber 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  />
                  {errors.contactNumber && (
                    <span className="text-red-500 text-xs font-medium mt-0.5">{errors.contactNumber}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-gray-700 uppercase tracking-widest text-[11px] font-bold select-none" style={{ letterSpacing: '0.5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.email 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs font-medium mt-0.5">{errors.email}</span>
                  )}
                </div>
              </div>

              {/* Row 2: Class Name + Academic Year (2-Column) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="grade" className="text-gray-700 uppercase tracking-widest text-[11px] font-bold select-none" style={{ letterSpacing: '0.5px' }}>
                    Class Name Applying For
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white transition-all focus:outline-none focus:ring-2 ${
                      errors.grade 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  >
                    <option value="">Select Class Name</option>
                    {MOLO_CLASS_NAME_OPTIONS.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                  {errors.grade && (
                    <span className="text-red-500 text-xs font-medium mt-0.5">{errors.grade}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="academicYear" className="text-gray-700 uppercase tracking-widest text-[11px] font-bold select-none" style={{ letterSpacing: '0.5px' }}>
                    Academic Year
                  </label>
                  <select
                    id="academicYear"
                    name="academicYear"
                    value={form.academicYear}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white transition-all focus:outline-none focus:ring-2 ${
                      errors.academicYear 
                        ? 'border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  >
                    <option value="">Select Year</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                  {errors.academicYear && (
                    <span className="text-red-500 text-xs font-medium mt-0.5">{errors.academicYear}</span>
                  )}
                </div>
              </div>

              {/* Row 3: Parent Name (Full Width) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="parentName" className="text-gray-700 uppercase tracking-widest text-[11px] font-bold select-none" style={{ letterSpacing: '0.5px' }}>
                  Parent Full Name
                </label>
                <input
                  type="text"
                  id="parentName"
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  placeholder="Enter your first and last name"
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.parentName 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {errors.parentName && (
                  <span className="text-red-500 text-xs font-medium mt-0.5">{errors.parentName}</span>
                )}
              </div>

              {/* Network Error Banner */}
              {networkError && (
                <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-200 flex gap-2.5 items-start">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{networkError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 text-white font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 select-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit inquiry</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-3">Inquiry submitted!</h2>

              <p className="text-gray-600 text-sm leading-relaxed max-w-sm mb-8">
                Thank you. The <span className="font-bold text-gray-800">{school.name}</span> admissions team will contact you within 2 business days.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-semibold rounded-xl text-sm transition-all shadow-sm active:bg-gray-50 cursor-pointer"
              >
                Submit another inquiry
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-4 text-xs font-semibold text-gray-400/80 tracking-wide">
          Powered by <span className="text-gray-500 font-bold">Knit</span> · <a href="https://knit.cash" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">knit.cash</a>
        </div>

      </div>
    </div>
  );
};
