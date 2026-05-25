// SignupPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import knitIcon from '../../assets/knit-icon.png';
import moloMhlabaTennysonLogo from '../../assets/molo-mhlaba-tennyson-logo.png';
import PasswordInput from './ui/PasswordInput';

interface SignupPageProps {
  onSignupSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
  onSwitchToInquiry?: () => void;
  initialSchoolId?: string | null;
  initialSchoolSlug?: string | null;
}

interface School {
  id: number | string;
  name: string;
}

const SELECTED_SCHOOL_LOGO_KEY = 'selectedSchoolLogo';
const SELECTED_SCHOOL_NAME_KEY = 'selectedSchoolName';

const getSchoolLogo = (schoolName: string) => {
  const normalizedName = schoolName.toLowerCase();

  if (
    normalizedName.includes('molo') ||
    normalizedName.includes('mhlaba') ||
    normalizedName.includes('tennyson')
  ) {
    return moloMhlabaTennysonLogo;
  }

  return knitIcon;
};

const SignupPage: React.FC<SignupPageProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
  onSwitchToInquiry,
  initialSchoolId,
  initialSchoolSlug
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | string | null>(null);
  const [selectedSchoolLogo, setSelectedSchoolLogo] = useState(knitIcon);

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadSchools = async () => {
      try {
        const response = await apiService.getSchools();
        if (!mounted) return;

        const rows = (response as any)?.data;

        if (!rows || !Array.isArray(rows)) {
          console.warn('[Schools] Unexpected response', response);
          setSchoolsError('Could not load schools list.');
        } else {
          const list: School[] = rows.map((row: any) => ({
            id: row.id as number,
            name: row.schoolName as string,
          }));

          setSchools(list);
        }
      } catch (e: any) {
        if (mounted) {
          console.warn('[Schools]', e.message);
          setSchoolsError('Could not load schools list.');
        }
      } finally {
        if (mounted) setSchoolsLoading(false);
      }
    };

    loadSchools();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!schools.length || selectedSchool) return;

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const requestedId = initialSchoolId?.trim();
    const requestedSlug = initialSchoolSlug?.trim().toLowerCase();

    const matchedSchool = schools.find((school) => {
      const schoolId = String(school.id);
      const schoolSlug = normalize(school.name);

      return Boolean(
        (requestedId && schoolId === requestedId) ||
          (requestedSlug &&
            (schoolSlug === requestedSlug ||
              schoolSlug.includes(requestedSlug) ||
              requestedSlug.includes(schoolSlug)))
      );
    });

    if (matchedSchool) {
      handleSelectSchool(matchedSchool);
    }
  }, [schools, selectedSchool, initialSchoolId, initialSchoolSlug]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        schoolDropdownRef.current &&
        !schoolDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSchoolDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateInputs = () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedFirstName) return 'First name is required.';
    if (trimmedFirstName.length < 2) {
      return 'First name must be at least 2 characters long.';
    }

    if (!trimmedLastName) return 'Last name is required.';
    if (trimmedLastName.length < 2) {
      return 'Last name must be at least 2 characters long.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!selectedSchool) {
      return 'Please select a school you are applying for.';
    }

    if (trimmedPassword.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    if (!/[A-Z]/.test(trimmedPassword)) {
      return 'Password must contain at least one uppercase letter.';
    }

    if (!/[a-z]/.test(trimmedPassword)) {
      return 'Password must contain at least one lowercase letter.';
    }

    if (!/[^A-Za-z0-9]/.test(trimmedPassword)) {
      return 'Password must contain at least one special character.';
    }

    return null;
  };

  const handleSelectSchool = (school: School) => {
    const logo = getSchoolLogo(school.name);

    setSelectedSchool(school.name);
    setSelectedSchoolId(school.id);
    setSelectedSchoolLogo(logo);

    localStorage.setItem(SELECTED_SCHOOL_NAME_KEY, school.name);
    localStorage.setItem(SELECTED_SCHOOL_LOGO_KEY, logo);

    setSchoolSearch('');
    setShowSchoolDropdown(false);
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const validationError = validateInputs();

    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      await authService.signup(
        fullName,
        email.trim(),
        password.trim(),
        selectedSchool,
        selectedSchoolId as any
      );

      onSignupSuccess(email.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-5 transition-all duration-300 hover:shadow-2xl">
            <img
              src={selectedSchoolLogo}
              alt={selectedSchool ? `${selectedSchool} Logo` : 'Knit Logo'}
              className="w-32 h-32 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        <h2 className="text-center text-4xl font-extrabold tracking-tight text-slate-900">
          Create your Knit Portal Account
        </h2>

        {selectedSchool && (
          <p className="mt-3 text-center text-sm font-medium text-slate-500">
            {selectedSchool}
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-200 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
                First Name
              </label>

              <div className="mt-2">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
                Last Name
              </label>

              <div className="mt-2">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>

              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="relative" ref={schoolDropdownRef}>
              <label htmlFor="school-search" className="block text-sm font-semibold text-gray-700">
                School Applying For <span className="text-red-500">*</span>
              </label>

              <div className="mt-2 relative">
                {schoolsLoading ? (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 bg-gray-50">
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm text-gray-500">Loading schools…</span>
                  </div>
                ) : schoolsError ? (
                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                    <p className="text-sm text-yellow-800">{schoolsError}</p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        id="school-search"
                        type="text"
                        placeholder={selectedSchool || 'Search and select your school...'}
                        value={schoolSearch}
                        onChange={(e) => {
                          setSchoolSearch(e.target.value);
                          setShowSchoolDropdown(true);
                        }}
                        onFocus={() => setShowSchoolDropdown(true)}
                        className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 pr-10 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                      />

                      <svg className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>

                    {showSchoolDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                        {filteredSchools.length > 0 ? (
                          <ul className="py-1">
                            {filteredSchools.map((school) => (
                              <li key={school.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectSchool(school)}
                                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                                    selectedSchool === school.name
                                      ? 'bg-blue-100 text-blue-900'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {school.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            {schoolSearch ? 'No schools found' : 'Start typing to search schools...'}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedSchool && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-900">
                          <strong>Selected:</strong> {selectedSchool}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>

              <div className="mt-2">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-requirements"
                />

                <p id="password-requirements" className="mt-2 text-xs text-gray-500 leading-relaxed">
                  Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one special character.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-xl border border-transparent bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
              >
                Sign in
              </button>
            </p>

            {onSwitchToInquiry && (
              <p className="mt-5 text-xs text-gray-500 max-w-xs mx-auto leading-relaxed border-t border-gray-100 pt-4">
                Just want to express initial interest without completing a full multi-step application?{' '}
                <button
                  type="button"
                  onClick={onSwitchToInquiry}
                  className="font-bold text-purple-600 hover:text-purple-500 cursor-pointer block mt-2 mx-auto"
                >
                  Submit a quick school inquiry &rarr;
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Knit. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SignupPage;