import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerFieldProps {
  id: string;
  label: string;
  required?: boolean;
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  maxDate?: Date;
  minDate?: Date;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  dropdownMode?: 'scroll' | 'select';
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  label,
  required = false,
  selected,
  onChange,
  placeholder = 'Select date',
  error,
  maxDate = new Date(),
  minDate,
  showYearDropdown = true,
  showMonthDropdown = true,
  dropdownMode = 'select'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <DatePicker
          id={id}
          selected={selected}
          onChange={onChange}
          dateFormat="yyyy/MM/dd"
          placeholderText={placeholder}
          maxDate={maxDate}
          minDate={minDate}
          showYearDropdown={showYearDropdown}
          showMonthDropdown={showMonthDropdown}
          dropdownMode={dropdownMode}
          yearDropdownItemNumber={50}
          scrollableYearDropdown
          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          wrapperClassName="w-full"
          popperClassName="z-50"
          showPopperArrow={false}
          open={isOpen}
          onInputClick={() => setIsOpen(true)}
          onClickOutside={() => setIsOpen(false)}
          onSelect={() => setIsOpen(false)}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default DatePickerField;
