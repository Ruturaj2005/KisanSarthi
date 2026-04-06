'use client';

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-3 border-gray-200 border-t-forest`} />
    </div>
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-leaf/30 border-t-forest" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">🌱</span>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
