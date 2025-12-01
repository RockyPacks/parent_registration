/**
 * Production-safe logging utility
 * Disables console logging in production builds
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    // Always log warnings in production
    console.warn(...args);
  },
  error: (...args: any[]) => {
    // Always log errors in production
    console.error(...args);
  },
};

// Override console methods in production
if (!isDevelopment) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}
