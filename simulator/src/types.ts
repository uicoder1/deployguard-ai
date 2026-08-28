export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'down';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface Service {
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

export interface Incident {
  id: string;
  title: string;
  serviceId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
  triggeredAt: string;
  triggeringDeploymentId: string;
  summary: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  serviceId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface GetLogsOptions {
  serviceId?: string;
  level?: LogLevel;
  limit?: number;
}
