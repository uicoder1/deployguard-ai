import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  let colors = 'bg-gray-100 text-gray-700 border-gray-200';
  let label = status.toUpperCase();

  if (normalized === 'critical' || normalized === 'down' || normalized === 'failed') {
    colors = 'bg-red-50 text-red-700 border-red-200';
  } else if (normalized === 'healthy' || normalized === 'successful' || normalized === 'resolved') {
    colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (normalized === 'degraded' || normalized === 'investigating' || normalized === 'warn') {
    colors = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalized === 'rolled_back') {
    colors = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'ROLLED BACK';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium border rounded-md uppercase tracking-wider ${px} ${colors}`}>
      {label}
    </span>
  );
};
