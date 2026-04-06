'use client';
import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon, className = '', type = 'text', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-ink 
            placeholder:text-gray-400 transition-all duration-200
            focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''} ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
