import React from 'react';
import { Clock, GitCommit, ShieldAlert } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface IncidentCardProps {
  status: string;
  deploymentId: string;
  version: string;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ status, deploymentId, version }) => {
  const isHealthy = status.toLowerCase() === 'healthy';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          {isHealthy ? (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            {isHealthy ? 'INCIDENT RESOLVED' : 'ACTIVE INCIDENT'}
          </h3>
        </div>
        <StatusBadge status={isHealthy ? 'RESOLVED' : 'CRITICAL'} size="sm" />
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            {isHealthy
              ? 'payment-api restored to healthy state (v1.8.2)'
              : 'High error rate and latency spike on payment-api'}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {isHealthy
              ? 'Rollback successfully mitigated connection pool exhaustion. All 7/7 pods healthy.'
              : 'Database connection pool exhaustion causing failed payment transactions and HTTP 500 error cascade.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100 text-xs">
          <div>
            <span className="text-gray-500 block">Triggering Deployment</span>
            <div className="font-mono text-gray-900 mt-0.5 flex items-center space-x-1">
              <GitCommit className="w-3.5 h-3.5 text-gray-400" />
              <span>#{deploymentId} ({version})</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 block">Incident Time</span>
            <div className="text-gray-900 mt-0.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>2026-08-26 17:00 UTC</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 block">Impacted Service</span>
            <div className="font-medium text-gray-900 mt-0.5">
              payment-api
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
