import React from 'react';
import type { ServiceStatus } from '../api/types';

interface IncidentMetricsProps {
  status: ServiceStatus;
}

export const IncidentMetrics: React.FC<IncidentMetricsProps> = ({ status }) => {
  const isHealthy = status.status.toLowerCase() === 'healthy';

  const totalPods =
    status.healthyInstances + status.unhealthyInstances;

  const deploymentNumber = isHealthy ? '#183' : '#184';
  const version = status.version || (isHealthy ? '1.8.2' : '1.8.3');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">

      {/* ERROR RATE */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Error Rate
        </span>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold ${isHealthy ? 'text-emerald-600' : 'text-red-600'
              }`}
          >
            {status.errorRatePercent}%
          </span>

          <span className="text-xs text-gray-400">
            {isHealthy ? 'Healthy' : 'Critical'}
          </span>
        </div>
      </div>

      {/* LATENCY */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Average Latency
        </span>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold ${isHealthy ? 'text-gray-900' : 'text-red-600'
              }`}
          >
            {status.averageLatencyMs} ms
          </span>

          <span className="text-xs text-gray-400">
            {isHealthy ? 'Normal' : 'High'}
          </span>
        </div>
      </div>

      {/* HEALTHY PODS */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Healthy Pods
        </span>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold ${isHealthy ? 'text-emerald-600' : 'text-red-600'
              }`}
          >
            {status.healthyInstances} / {totalPods}
          </span>

          <span className="text-xs text-gray-400">
            {isHealthy
              ? 'All Ready'
              : `${status.unhealthyInstances} failing`}
          </span>
        </div>
      </div>

      {/* DEPLOYMENT */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Active Deployment
        </span>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 font-mono">
            {deploymentNumber}
          </span>

          <span className="text-xs text-gray-500 font-mono">
            v{version}
          </span>
        </div>

        <span
          className={`text-xs font-semibold ${isHealthy ? 'text-emerald-600' : 'text-red-600'
            }`}
        >
          {isHealthy ? 'Recovered' : 'Failing'}
        </span>
      </div>

    </div>
  );
};