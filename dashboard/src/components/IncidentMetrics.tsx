import React from 'react';
import type { ServiceStatus } from '../api/types';

interface IncidentMetricsProps {
  status: ServiceStatus;
}

export const IncidentMetrics: React.FC<IncidentMetricsProps> = ({ status }) => {
  const isHealthy = status.status.toLowerCase() === 'healthy';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ERROR RATE */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
          Error Rate
        </span>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold tracking-tight ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
            {status.errorRatePercent}%
          </span>
          <span className="text-xs text-gray-400">
            {isHealthy ? 'Nominal' : 'Elevated'}
          </span>
        </div>
      </div>

      {/* LATENCY */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
          Average Latency
        </span>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold tracking-tight ${isHealthy ? 'text-gray-900' : 'text-red-600'}`}>
            {status.averageLatencyMs} ms
          </span>
          <span className="text-xs text-gray-400">
            {isHealthy ? 'p99 45ms' : 'p99 spike'}
          </span>
        </div>
      </div>

      {/* HEALTHY PODS */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
          Healthy Pods
        </span>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold tracking-tight ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
            {status.healthyInstances} / {status.healthyInstances + status.unhealthyInstances}
          </span>
          <span className="text-xs text-gray-400">
            {isHealthy ? 'All Ready' : '5 Failing'}
          </span>
        </div>
      </div>

      {/* DEPLOYMENT */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
          Deployment
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 font-mono">
            {isHealthy ? 'v1.8.2' : '#184'}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {isHealthy ? '#183' : `v${status.version}`}
          </span>
        </div>
      </div>
    </div>
  );
};
