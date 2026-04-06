'use client';

export default function Button({
  children, variant = 'primary', size = 'md', disabled = false,
  loading = false, onClick, className = '', type = 'button', ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-forest text-white hover:bg-forest-light focus:ring-forest shadow-md hover:shadow-lg',
    secondary: 'bg-white text-forest border-2 border-forest hover:bg-forest hover:text-white focus:ring-forest',
    ghost: 'bg-transparent text-forest hover:bg-forest/10 focus:ring-forest',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
    amber: 'bg-amber text-white hover:bg-amber-dark focus:ring-amber',
    icon: 'bg-transparent text-gray-600 hover:text-forest hover:bg-forest/10 focus:ring-forest rounded-full',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[36px]',
    md: 'px-5 py-2.5 text-base rounded-xl min-h-[44px]',
    lg: 'px-8 py-3.5 text-lg rounded-xl min-h-[52px]',
    icon: 'p-3 rounded-full min-w-[48px] min-h-[48px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[variant === 'icon' ? 'icon' : size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
