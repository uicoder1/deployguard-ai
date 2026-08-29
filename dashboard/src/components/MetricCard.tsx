import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'normal' | 'critical' | 'success' | 'warning';
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, variant = 'normal' }) => {
  let valueColor = 'text-gray-900';
  let borderHighlight = 'border-gray-200';

  if (variant === 'critical') {
    valueColor = 'text-red-600';
    borderHighlight = 'border-gray-200';
  } else if (variant === 'success') {
    valueColor = 'text-emerald-600';
  } else if (variant === 'warning') {
    valueColor = 'text-amber-600';
  }

  return (
    <div className={`bg-white border ${borderHighlight} rounded-lg p-4 transition-sm`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`mt-1 text-2xl font-bold tracking-tight ${valueColor}`}>{value}</div>
      {subtext && <div className="mt-1 text-xs text-gray-500">{subtext}</div>}
    </div>
  );
};
