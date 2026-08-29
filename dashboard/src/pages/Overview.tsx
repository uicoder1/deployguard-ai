import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { IncidentCard } from '../components/IncidentCard';
import { InvestigationPanel } from '../components/InvestigationPanel';
import { StatusBadge } from '../components/StatusBadge';
import type { ServiceStatus, InvestigationResult } from '../api/types';

interface OverviewProps {
  status: ServiceStatus;
  onInvestigate: () => Promise<InvestigationResult>;
  onRequestRollback: () => void;
  isRolledBack: boolean;
}

export const Overview: React.FC<OverviewProps> = ({
  status,
  onInvestigate,
  onRequestRollback,
  isRolledBack
}) => {
  const isHealthy = status.status.toLowerCase() === 'healthy';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          DeployGuard Production Incident Control
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Investigate production failures, understand root causes, and remediate safely.
        </p>
      </div>

      {/* Main Service Status Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-5 gap-3">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900">Payment API</h2>
              <StatusBadge status={status.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">payment-api.production.internal</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-500 block">Current Active Deployment</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              #{status.status === 'healthy' && isRolledBack ? '184 (Rolled Back)' : '184'} · v{status.version}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Error Rate"
            value={`${status.errorRatePercent}%`}
            subtext={isHealthy ? 'Nominal operational range' : '47.1% above normal threshold'}
            variant={isHealthy ? 'success' : 'critical'}
          />

          <MetricCard
            label="Average Latency"
            value={`${status.averageLatencyMs} ms`}
            subtext={isHealthy ? 'Normal response time' : 'p99 latency breach'}
            variant={isHealthy ? 'normal' : 'critical'}
          />

          <MetricCard
            label="Healthy Pods"
            value={`${status.healthyInstances} / ${status.healthyInstances + status.unhealthyInstances}`}
            subtext={isHealthy ? 'All instances passing health probes' : '5 pods failing liveness check'}
            variant={isHealthy ? 'success' : 'critical'}
          />

          <MetricCard
            label="Current Version"
            value={`v${status.version}`}
            subtext={isHealthy ? 'Restored stable release' : 'Deployed 2026-08-26 17:00 UTC'}
            variant={isHealthy ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Incident Details Card */}
      <IncidentCard
        status={status.status}
        deploymentId="184"
        version={status.version}
      />

      {/* AI Investigation Section */}
      <InvestigationPanel
        onInvestigate={onInvestigate}
        onRequestRollback={onRequestRollback}
        isRolledBack={isRolledBack}
      />
    </div>
  );
};
