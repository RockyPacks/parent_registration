import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CORE_SUBJECTS, ELECTIVE_SUBJECTS } from '../../src/constants';
import type { Subject } from '../../src/types/subject';
import { PaintBrushIcon, Bars3Icon, CheckCircleIcon, ClockIcon, LockClosedIcon, ArrowLongLeftIcon, ArrowLongRightIcon, PlusIcon, XMarkIcon } from './icons';
import { apiService } from '../../src/services/api';
import Footer from '../../components/Footer';
import { useToast } from '../../hooks/useToast';

const CoreSubjectCard: React.FC<{
  subject: Subject;
}> = ({ subject }) => {
  return (
    <div className="flex items-center justify-between w-full p-6 rounded-xl border bg-white border-gray-200 cursor-default shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <subject.icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-lg block">{subject.name}</span>
        </div>
      </div>
      <CheckCircleIcon className="w-7 h-7 text-green-600" />
    </div>
  );
};

const SelectedElectiveCard: React.FC<{
  subject: Subject;
  onRemove: (id: string) => void;
}> = ({ subject, onRemove }) => {
  return (
    <div className="flex items-center justify-between w-full p-5 rounded-xl border bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in group">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
          <subject.icon className="w-5 h-5 text-blue-600" />
        </div>
        <span className="font-semibold text-gray-800 text-lg">{subject.name}</span>
      </div>
      <button
        onClick={() => onRemove(subject.id)}
        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label={`Remove ${subject.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onRemove(subject.id);
          }
        }}
      >
        <XMarkIcon className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
};


const SubjectSelection: React.FC<{ onContinue: () => void; onBack: () => void }> = ({ onContinue, onBack }) => {
    const { addToast } = useToast();
    const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [isNextEnabled, setIsNextEnabled] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const saveToStorage = async (selection: string[]) => {
        setSaveStatus('saving');
        try {
            // Save to localStorage as the API doesn't have subject selection endpoints yet
            localStorage.setItem('selectedElectives', JSON.stringify(selection));
            addToast('Subject selection saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save selections:', error);
            addToast('Failed to save subject selection.', 'error');
            setSaveStatus('idle');
            return;
        }

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set status to saved after a brief delay
        saveTimeoutRef.current = setTimeout(() => {
            setSaveStatus('saved');
            // Reset to idle after showing saved status
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 300);
    };

    const addElective = useCallback((id: string) => {
        if (!selectedElectives.includes(id)) {
            setSelectedElectives(prev => {
                const newSelection = [...prev, id];
                saveToStorage(newSelection);
                return newSelection;
            });
        }
        setSearchTerm('');
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
    }, [selectedElectives]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent, availableElectives: Subject[]) => {
        if (!isDropdownOpen) return;

        const maxIndex = availableElectives.length - 1;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setFocusedIndex(prev => prev < maxIndex ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                event.preventDefault();
                setFocusedIndex(prev => prev > 0 ? prev - 1 : maxIndex);
                break;
            case 'Enter':
                event.preventDefault();
                if (focusedIndex >= 0 && focusedIndex <= maxIndex) {
                    addElective(availableElectives[focusedIndex].id);
                }
                break;
            case 'Escape':
                event.preventDefault();
                setIsDropdownOpen(false);
                setFocusedIndex(-1);
                break;
        }
    }, [isDropdownOpen, focusedIndex, addElective]);

    const removeElective = useCallback((id: string) => {
        setSelectedElectives(prev => {
            const newSelection = prev.filter(eId => eId !== id);
            saveToStorage(newSelection);
            return newSelection;
        });
    }, []);

    const saveProgress = useCallback(() => {
        saveToStorage(selectedElectives);
    }, [selectedElectives]);

    const validateSelection = () => {
        const errors: {[key: string]: string} = {};

        if (selectedElectives.length === 0) {
            errors.subjects = 'At least one elective subject must be selected';
        }

        setValidationErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        setIsNextEnabled(isValid);
        return isValid;
    };



    // Load initial data from localStorage
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load from localStorage
                const saved = localStorage.getItem('selectedElectives');
                if (saved) {
                    setSelectedElectives(JSON.parse(saved));
                } else {
                    setSelectedElectives(['phy_sci']); // Default selection
                }
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                setSelectedElectives(['phy_sci']); // Default selection
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setFocusedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const availableElectives = useMemo(() =>
        ELECTIVE_SUBJECTS.filter(subject => !selectedElectives.includes(subject.id)),
        [selectedElectives]
    );

    const filteredAvailableElectives = useMemo(() =>
        availableElectives.filter(subject =>
            subject.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [availableElectives, searchTerm]
    );

    const selectedSubjectObjects = useMemo(() =>
        ELECTIVE_SUBJECTS.filter(s => selectedElectives.includes(s.id)),
        [selectedElectives]
    );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading subject selections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Failed to load data</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">



        <div className="flex-grow space-y-12 pb-24">
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <PaintBrushIcon className="w-7 h-7 text-blue-600"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Core Subjects</h3>
                    </div>
                </div>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">These subjects are mandatory and pre-selected by the school.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CORE_SUBJECTS.map(subject => <CoreSubjectCard key={subject.id} subject={subject} />)}
                </div>
            </section>

            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <Bars3Icon className="w-7 h-7 text-green-600"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Elective Subjects</h3>
                        <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full mt-1 inline-block">Optional</span>
                    </div>
                </div>
                <p id="elective-description" className="text-gray-600 text-lg mb-8 leading-relaxed">Select any additional subjects the learner would like to take. You can choose as many or as few as needed.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {selectedSubjectObjects.map(subject => (
                        <SelectedElectiveCard
                            key={subject.id}
                            subject={subject}
                            onRemove={removeElective}
                        />
                    ))}
                </div>

            <div className="relative" ref={dropdownRef}>
    <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !isDropdownOpen) {
                e.preventDefault();
                setIsDropdownOpen(true);
                setFocusedIndex(0);
            }
        }}
        className="flex items-center justify-center w-full p-6 text-left bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:from-blue-100 hover:to-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow-md group"
        aria-haspopup="listbox"
        aria-expanded={isDropdownOpen}
        aria-label="Add elective subject"
        aria-describedby="elective-description"
    >
        <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors duration-200 mr-4">
            <PlusIcon className="w-6 h-6 text-white" aria-hidden="true"/>
        </div>
        <span className="font-bold text-lg text-gray-700 group-hover:text-gray-900">Add Elective Subject</span>
    </button>

    {isDropdownOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-xl animate-fade-in"
             style={{
                 maxHeight: '240px',
                 bottom: 'calc(100% + 0.75rem)',
                 overflowY: 'auto'
             }}>
            <div className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 rounded-t-xl">
                <input
                    type="text"
                    placeholder="Search subjects..."
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, filteredAvailableElectives)}
                    autoFocus
                    aria-label="Search elective subjects"
                />
            </div>
                            <ul className="overflow-y-auto" tabIndex={-1} role="listbox" aria-label="Available elective subjects">
                                {filteredAvailableElectives.length > 0 ? filteredAvailableElectives.map((subject, index) => (
                                    <li
                                        key={subject.id}
                                        onClick={() => addElective(subject.id)}
                                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50 transition-all duration-200 rounded-lg mx-2 my-1 group ${
                                            focusedIndex === index ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                                        }`}
                                        role="option"
                                        aria-selected={selectedElectives.includes(subject.id)}
                                        aria-label={`Add ${subject.name} to selected subjects`}
                                        tabIndex={focusedIndex === index ? 0 : -1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                addElective(subject.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                                                <subject.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" aria-hidden="true" />
                                            </div>
                                            <span className="font-semibold text-gray-800 text-base group-hover:text-blue-900">{subject.name}</span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <PlusIcon className="w-5 h-5 text-blue-500" aria-hidden="true" />
                                        </div>
                                    </li>
                                )) : (
                                    <li className="p-6 text-base text-gray-500 text-center font-medium" role="option" aria-disabled="true">No more subjects to add.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </section>
        </div>

        {/* Enhanced Validation Errors Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-sm animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-red-800 mb-1">
                    Required Information Missing
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {Object.keys(validationErrors).length} field{Object.keys(validationErrors).length !== 1 ? 's' : ''} required
                  </span>
                </div>
                <p className="text-red-700 mb-4 text-sm">
                  Please complete all required fields below before proceeding to the next step.
                </p>

                <div className="space-y-4">
                  <div className="bg-white/50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center mb-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <h5 className="font-semibold text-red-800 text-sm">Subject Selection</h5>
                    </div>
                    <ul className="space-y-2">
                      {Object.entries(validationErrors).map(([key, message]) => (
                        <li key={key} className="flex items-start text-sm">
                          <span className="text-red-500 mr-2 mt-1">•</span>
                          <span className="text-red-700">{message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-red-200">
                  <p className="text-xs text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Complete all required fields to continue with your enrollment
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}



        <Footer
          onBack={onBack}
          onSave={saveProgress}
          onNext={() => {
            if (validateSelection()) {
              onContinue();
            }
          }}
          showBack={true}
          showSave={true}
          showNext={true}
          nextLabel="Next: Fee Agreement"
          isLoading={!isNextEnabled}
        />
    </div>
  );
};

export default SubjectSelection;
