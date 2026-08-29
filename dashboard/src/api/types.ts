export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'down';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface ServiceStatus {
  id: string;
  name: string;
  status: HealthStatus;
  version: string;
  errorRatePercent: number;
  averageLatencyMs: number;
  healthyInstances: number;
  unhealthyInstances: number;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  serviceId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface Deployment {
  id: string;
  serviceId: string;
  version: string;
  status: 'successful' | 'failed' | 'in_progress' | 'rolled_back';
  deployedBy: string;
  timestamp: string;
  commitHash: string;
  description: string;
}

export interface KubernetesDeployment {
  name: string;
  namespace: string;
  replicas: {
    desired: number;
    ready: number;
    available: number;
    updated: number;
  };
  containers: Array<{
    name: string;
    image: string;
    resources?: Record<string, unknown>;
  }>;
  status: string;
  updatedAt?: string;
}

export interface KubernetesPod {
  name: string;
  namespace: string;
  phase: string;
  ready: string;
  restarts: number;
  node: string;
  ip?: string;
  age?: string;
}

export interface KubernetesEvent {
  type: string;
  reason: string;
  object: string;
  message: string;
  timestamp: string;
  count?: number;
}

export interface InvestigationResult {
  rootCause: string;
  confidence: 'CONFIRMED' | 'HIGH' | 'MEDIUM';
  evidence: string[];
  recommendation: {
    action: string;
    serviceId: string;
    deploymentId: string;
    fromVersion: string;
    toVersion: string;
    risk: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  };
}

export interface RollbackResult {
  success: boolean;
  deploymentId?: string;
  serviceId?: string;
  previousVersion?: string;
  restoredVersion?: string;
  simulated?: boolean;
  serviceStatus?: ServiceStatus;
  auditRecord?: AuditRecord;
  error?: string;
}

export interface AuditRecord {
  timestamp: string;
  deploymentId: string;
  service: string;
  fromVersion: string;
  restoredVersion: string;
  reason: string;
  simulated: boolean;
  resultingStatus: string;
}
