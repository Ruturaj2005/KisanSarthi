'use client';

export default function Card({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      className={`bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-5
        ${hover ? 'hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 cursor-pointer' : ''}
        transition-all duration-300 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-bold text-ink ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
