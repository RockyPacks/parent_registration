import { useState } from 'react';

// Simplified version that doesn't persist data - fresh start each session
export const useLocalStorage = <T>(key: string, initialValue: T, prefix?: string) => {
  // Always start with initial value - no persistence across sessions
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Return a wrapped version of useState's setter function that doesn't persist
  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
  };

  return [storedValue, setValue] as const;
};
