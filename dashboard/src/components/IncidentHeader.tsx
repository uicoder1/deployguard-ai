import React from 'react';
import { StatusBadge } from './StatusBadge';

interface IncidentHeaderProps {
  serviceId: string;
  status: string;
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({
  serviceId,
  status
}) => {
  const isHealthy = status.toLowerCase() === 'healthy';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Production Incident
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {isHealthy
              ? `${serviceId} — Service Recovered`
              : `High error rate and latency spike on ${serviceId}`}
          </h1>
        </div>
        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        {isHealthy
          ? `${serviceId} is healthy and operating within normal parameters following successful rollback to v1.8.2.`
          : `${serviceId} is experiencing elevated failures and latency following deployment #184.`}
      </p>
    </div>
  );
};
