'use client';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    forest: 'bg-forest/10 text-forest',
    leaf: 'bg-leaf/10 text-forest-dark',
    amber: 'bg-amber/10 text-amber-dark',
    danger: 'bg-danger/10 text-danger',
    caution: 'bg-caution/10 text-yellow-800',
    low: 'bg-leaf/10 text-forest',
    medium: 'bg-caution/10 text-yellow-800',
    high: 'bg-danger/10 text-danger',
    critical: 'bg-red-100 text-red-900',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-[var(--radius-chip)] text-xs font-semibold ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
