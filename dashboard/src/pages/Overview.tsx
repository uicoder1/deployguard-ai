import React from 'react';
import { IncidentHeader } from '../components/IncidentHeader';
import { IncidentMetrics } from '../components/IncidentMetrics';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { InvestigationPanel } from '../components/InvestigationPanel';
import type { ServiceStatus } from '../api/types';
import type { StageStatus } from '../api/deployguard';

interface OverviewProps {
  status: ServiceStatus;
  investigating: boolean;
  stages: StageStatus[];
  onStartInvestigation: () => void;
  isComplete: boolean;
}

export const Overview: React.FC<OverviewProps> = ({
  status,
  investigating,
  stages,
  onStartInvestigation,
  isComplete
}) => {
  return (
    <div className="space-y-6">
      <IncidentHeader serviceId={status.name || 'payment-api'} status={status.status} />
      <IncidentMetrics status={status} />
      <IncidentTimeline currentStage={isComplete ? 'evidence' : investigating ? 'investigating' : 'ready'} />
      <InvestigationPanel
        investigating={investigating}
        stages={stages}
        onStartInvestigation={onStartInvestigation}
        isComplete={isComplete}
      />
    </div>
  );
};
