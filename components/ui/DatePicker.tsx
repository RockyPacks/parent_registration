import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = 'Select date',
  required = false
}) => {
  const selectedDate = value ? new Date(value) : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      // Format as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <ReactDatePicker
          id={name}
          name={name}
          selected={selectedDate}
          onChange={handleChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          wrapperClassName="w-full"
          popperClassName="z-50"
          yearDropdownItemNumber={20}
          scrollableYearDropdown
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
