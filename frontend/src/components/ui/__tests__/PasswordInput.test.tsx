import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordInput from '../PasswordInput';

// Import Jest globals for ESM
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('PasswordInput', () => {
  const defaultProps = {
    id: 'test-password',
    name: 'password',
    value: 'testPassword123',
    onChange: jest.fn() as unknown as (e: React.ChangeEvent<HTMLInputElement>) => void,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders password input with masked text by default', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const input = screen.getByDisplayValue('testPassword123');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<PasswordInput {...defaultProps} />);
    
    // Get the input element
    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe('password');
    
    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    
    // Password should now be visible
    expect(input.type).toBe('text');
    
    // Button label should change
    const hideButton = screen.getByRole('button', { name: /hide password/i });
    expect(hideButton).toBeInTheDocument();
  });

  it('hides password when eye-off icon is clicked', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const input = document.getElementById('test-password') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Show password
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
    
    // Hide password
    const hideButton = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideButton);
    expect(input.type).toBe('password');
  });

  it('calls onChange handler when input value changes', () => {
    const handleChange = jest.fn();
    render(<PasswordInput {...defaultProps} onChange={handleChange} />);
    
    const input = document.getElementById('test-password') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'newPassword' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with required attribute when specified', () => {
    render(<PasswordInput {...defaultProps} required />);
    
    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveAttribute('required');
  });

  it('renders with minLength attribute when specified', () => {
    render(<PasswordInput {...defaultProps} minLength={8} />);
    
    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveAttribute('minLength', '8');
  });

  it('renders with custom autoComplete attribute', () => {
    render(<PasswordInput {...defaultProps} autoComplete="new-password" />);
    
    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveAttribute('autoComplete', 'new-password');
  });

  it('renders with aria-describedby for accessibility', () => {
    render(<PasswordInput {...defaultProps} aria-describedby="password-hint" />);
    
    const input = document.getElementById('test-password') as HTMLInputElement;
    expect(input).toHaveAttribute('aria-describedby', 'password-hint');
  });

  it('toggle button has tabIndex -1 to prevent tab focus', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toHaveAttribute('tabIndex', '-1');
  });

  it('eye icon is aria-hidden for screen readers', () => {
    render(<PasswordInput {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    const icon = toggleButton.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
