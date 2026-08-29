import type {
  ServiceStatus,
  LogEntry,
  Deployment,
  KubernetesDeployment,
  KubernetesPod,
  KubernetesEvent,
  InvestigationResult,
  RollbackResult,
  AuditRecord
} from './types';

// Centralized backend MCP server URL configuration
export const MCP_SERVER_URL =
  import.meta.env.VITE_MCP_SERVER_URL || 'https://deployguard-mcp.onrender.com';

const API_BASE_URL = `${MCP_SERVER_URL.replace(/\/$/, '')}/api`;

// Deterministic in-memory fallback state if backend is offline or sleeping
let fallbackServiceStatus: ServiceStatus = {
  id: 'payment-api',
  name: 'Payment Processing Service',
  status: 'critical',
  version: '1.8.3',
  errorRatePercent: 47.2,
  averageLatencyMs: 1840,
  healthyInstances: 2,
  unhealthyInstances: 5,
  updatedAt: new Date().toISOString()
};

let fallbackAudits: AuditRecord[] = [];

export interface StageStatus {
  name: string;
  status: 'loading' | 'success' | 'error';
  details?: string;
}

export interface DetailedInvestigationResult extends InvestigationResult {
  stages: StageStatus[];
}

export const deployGuardApi = {
  /**
   * Check backend connection health and Render service wake-up status.
   */
  async checkBackendConnection(): Promise<{
    connected: boolean;
    isSleeping: boolean;
    server: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { connected: true, isSleeping: false, server: data.server || 'deployguard-production' };
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return { connected: false, isSleeping: true, server: 'render-sleeping' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { connected: false, isSleeping: true, server: 'render-timeout' };
      }
    }
    return { connected: false, isSleeping: false, server: 'demo-simulator' };
  },

  async getServiceStatus(serviceId: string = 'payment-api'): Promise<ServiceStatus> {
    try {
      const res = await fetch(`${API_BASE_URL}/services/${serviceId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return fallbackServiceStatus;
  },

  async getServiceLogs(serviceId: string = 'payment-api', level?: string, limit: number = 20): Promise<LogEntry[]> {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      params.append('limit', String(limit));
      const res = await fetch(`${API_BASE_URL}/services/${serviceId}/logs?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        id: 'log-101',
        timestamp: '2026-08-26T17:04:30Z',
        serviceId: 'payment-api',
        level: 'FATAL',
        message: 'Pod health check failed: Liveness probe failed for container payment-service (HTTP 500)'
      },
      {
        id: 'log-102',
        timestamp: '2026-08-26T17:04:12Z',
        serviceId: 'payment-api',
        level: 'ERROR',
        message: 'Connection reset by peer: Database connection terminated unexpectedly'
      },
      {
        id: 'log-103',
        timestamp: '2026-08-26T17:03:45Z',
        serviceId: 'payment-api',
        level: 'ERROR',
        message: 'DB Connection Pool Exhausted: Active connections 50/50, queued requests 142'
      },
      {
        id: 'log-104',
        timestamp: '2026-08-26T17:03:10Z',
        serviceId: 'payment-api',
        level: 'ERROR',
        message: 'Payment processing failed: Connection timeout after 5000ms'
      },
      {
        id: 'log-105',
        timestamp: '2026-08-26T17:02:30Z',
        serviceId: 'payment-api',
        level: 'WARN',
        message: 'High connection pool utilization: 48/50 active connections'
      }
    ];
  },

  async getRecentDeployments(serviceId: string = 'payment-api'): Promise<Deployment[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/deployments/${serviceId}`);
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        id: '184',
        serviceId: 'payment-api',
        version: '1.8.3',
        status: fallbackServiceStatus.status === 'healthy' ? 'rolled_back' : 'successful',
        deployedBy: 'alex.chen',
        timestamp: '2026-08-26T17:00:00Z',
        commitHash: 'a1b2c3d4',
        description: 'Connection pool size and query timeout optimizations'
      },
      {
        id: '183',
        serviceId: 'payment-api',
        version: '1.8.2',
        status: 'successful',
        deployedBy: 'sarah.jenkins',
        timestamp: '2026-08-26T16:30:00Z',
        commitHash: 'e5f6g7h8',
        description: 'Fix payment gateway retry handling logic'
      }
    ];
  },

  async getDeploymentDetails(deploymentId: string = '184'): Promise<Deployment> {
    try {
      const res = await fetch(`${API_BASE_URL}/deployments/details/${deploymentId}`);
      if (res.ok) return await res.json();
    } catch {}

    return {
      id: '184',
      serviceId: 'payment-api',
      version: '1.8.3',
      status: fallbackServiceStatus.status === 'healthy' ? 'rolled_back' : 'successful',
      deployedBy: 'alex.chen',
      timestamp: '2026-08-26T17:00:00Z',
      commitHash: 'a1b2c3d4',
      description: 'Connection pool size and query timeout optimizations'
    };
  },

  /**
   * Executes four explicit evidence retrieval stages (Service Health, Error Logs, Deployment History, Kubernetes State)
   * with loading, success, and error feedback for each stage.
   */
  async runInvestigation(
    onStageUpdate?: (stages: StageStatus[]) => void
  ): Promise<DetailedInvestigationResult> {
    const stages: StageStatus[] = [
      { name: '1. Service Health', status: 'loading' },
      { name: '2. Error Logs', status: 'loading' },
      { name: '3. Deployment History', status: 'loading' },
      { name: '4. Kubernetes State', status: 'loading' }
    ];

    if (onStageUpdate) onStageUpdate([...stages]);

    // Stage 1: Service Health
    let status: ServiceStatus | null = null;
    try {
      status = await this.getServiceStatus('payment-api');
      stages[0] = { name: '1. Service Health', status: 'success', details: `${status.status.toUpperCase()} (${status.errorRatePercent}% error rate)` };
    } catch {
      stages[0] = { name: '1. Service Health', status: 'error', details: 'Using cached status' };
    }
    if (onStageUpdate) onStageUpdate([...stages]);
    await new Promise((r) => setTimeout(r, 250));

    // Stage 2: Error Logs
    let logs: LogEntry[] = [];
    try {
      logs = await this.getServiceLogs('payment-api', 'ERROR', 10);
      stages[1] = { name: '2. Error Logs', status: 'success', details: `${logs.length} error entries correlated` };
    } catch {
      stages[1] = { name: '2. Error Logs', status: 'error', details: 'Using local log stream' };
    }
    if (onStageUpdate) onStageUpdate([...stages]);
    await new Promise((r) => setTimeout(r, 250));

    // Stage 3: Deployment History
    let deployments: Deployment[] = [];
    let depDetails: Deployment | null = null;
    try {
      deployments = await this.getRecentDeployments('payment-api');
      depDetails = await this.getDeploymentDetails('184');
      stages[2] = { name: '3. Deployment History', status: 'success', details: `Deployment #${depDetails?.id || '184'} (${depDetails?.version || 'v1.8.3'}) identified` };
    } catch {
      stages[2] = { name: '3. Deployment History', status: 'error', details: 'Using cached deployments' };
    }
    if (onStageUpdate) onStageUpdate([...stages]);
    await new Promise((r) => setTimeout(r, 250));

    // Stage 4: Kubernetes State
    let k8sPods: KubernetesPod[] | null = null;
    let k8sEvents: KubernetesEvent[] | null = null;
    try {
      k8sPods = await this.getKubernetesPods();
      k8sEvents = await this.getKubernetesEvents();
      stages[3] = { name: '4. Kubernetes State', status: 'success', details: `${k8sPods?.length || 1} pods, ${k8sEvents?.length || 2} cluster events` };
    } catch {
      stages[3] = { name: '4. Kubernetes State', status: 'error', details: 'Using cluster telemetry cache' };
    }
    if (onStageUpdate) onStageUpdate([...stages]);

    const activeDep = deployments.find((d) => d.id === '184') || depDetails;
    const evidence: string[] = [
      `Connection pool reached 48/50 active connections shortly after deployment #${activeDep?.id || '184'} (${activeDep?.version || 'v1.8.3'})`,
      `Database connection timeouts followed across ${logs.length || 5} retrieved error log entries`,
      `Pool exhaustion caused payment failures (Error rate: ${status?.errorRatePercent || 47.2}%, Latency: ${status?.averageLatencyMs || 1840}ms)`,
      `Multiple pods failed health checks (${status?.unhealthyInstances || 5} unhealthy instances reported across ${k8sPods?.length || 7} pods)`,
      `Incident started shortly after deployment #${activeDep?.id || '184'} (commit ${activeDep?.commitHash || 'a1b2c3d4'} by ${activeDep?.deployedBy || 'alex.chen'})`
    ];

    return {
      rootCause: `Deployment #${activeDep?.id || '184'} (${activeDep?.version || 'v1.8.3'}) introduced database connection pool exhaustion.`,
      confidence: 'CONFIRMED',
      evidence,
      recommendation: {
        action: `Rollback deployment #${activeDep?.id || '184'}`,
        serviceId: 'payment-api',
        deploymentId: activeDep?.id || '184',
        fromVersion: activeDep?.version || 'v1.8.3',
        toVersion: 'v1.8.2',
        risk: 'HIGH',
        reason: `The ${activeDep?.version || 'v1.8.3'} connection pool optimization correlates directly with the production failure.`
      },
      stages
    };
  },

  async rollbackDeployment(deploymentId: string = '184'): Promise<RollbackResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.serviceStatus) {
          fallbackServiceStatus = data.serviceStatus;
        }
        return data;
      } else {
        const err = await res.json();
        return { success: false, error: err.error || 'Rollback failed' };
      }
    } catch {}

    // Fallback in-memory simulation if backend is offline
    if (fallbackServiceStatus.status === 'healthy') {
      return {
        success: false,
        error: `Error: Deployment #${deploymentId} has already been rolled back.`
      };
    }

    fallbackServiceStatus = {
      ...fallbackServiceStatus,
      status: 'healthy',
      version: '1.8.2',
      errorRatePercent: 0.1,
      averageLatencyMs: 45,
      healthyInstances: 7,
      unhealthyInstances: 0,
      updatedAt: new Date().toISOString()
    };

    const audit: AuditRecord = {
      timestamp: new Date().toISOString(),
      deploymentId,
      service: 'payment-api',
      fromVersion: 'v1.8.3',
      restoredVersion: 'v1.8.2',
      reason: `Simulated rollback of deployment #${deploymentId} for service payment-api`,
      simulated: true,
      resultingStatus: 'healthy'
    };

    fallbackAudits.push(audit);

    return {
      success: true,
      deploymentId,
      serviceId: 'payment-api',
      previousVersion: 'v1.8.3',
      restoredVersion: 'v1.8.2',
      simulated: true,
      serviceStatus: fallbackServiceStatus,
      auditRecord: audit
    };
  },

  async getRollbackAudits(): Promise<AuditRecord[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/audits`);
      if (res.ok) return await res.json();
    } catch {}

    return fallbackAudits;
  },

  async getKubernetesDeployment(name: string = 'payment-api', namespace: string = 'default'): Promise<KubernetesDeployment | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/kubernetes/deployment/${name}?namespace=${namespace}`);
      if (res.ok) return await res.json();
    } catch {}

    return {
      name: 'payment-api',
      namespace: 'default',
      replicas: {
        desired: 1,
        ready: 1,
        available: 1,
        updated: 1
      },
      containers: [
        {
          name: 'payment-api',
          image: 'nginx:1.27'
        }
      ],
      status: 'Running',
      updatedAt: '2026-08-26T17:00:00Z'
    };
  },

  async getKubernetesPods(namespace: string = 'default', labelSelector?: string): Promise<KubernetesPod[] | null> {
    try {
      const params = new URLSearchParams({ namespace });
      if (labelSelector) params.append('labelSelector', labelSelector);
      const res = await fetch(`${API_BASE_URL}/kubernetes/pods?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        name: 'payment-api-79f9d8459-x8j2p',
        namespace: 'default',
        phase: 'Running',
        ready: '1/1',
        restarts: 0,
        node: 'kind-control-plane',
        ip: '10.244.0.5',
        age: '2h'
      }
    ];
  },

  async getKubernetesPodLogs(podName: string = 'payment-api-79f9d8459-x8j2p', namespace: string = 'default'): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/kubernetes/logs?podName=${podName}&namespace=${namespace}`);
      if (res.ok) {
        const data = await res.json();
        return data.logs;
      }
    } catch {}

    return `2026-08-26T17:00:00.000Z [INFO] Initializing payment-api container (v1.8.3)
2026-08-26T17:00:05.120Z [INFO] Database pool configured: min=10 max=50 acquireTimeout=5000ms
2026-08-26T17:02:30.412Z [WARN] Active connection count reached threshold: 48/50
2026-08-26T17:03:10.880Z [ERROR] TimeoutAcquiringConnection: Connection pool request timed out after 5000ms
2026-08-26T17:03:45.105Z [ERROR] PoolExhaustion: Cannot allocate connection (50 active, 142 waiting)
2026-08-26T17:04:30.901Z [FATAL] Liveness probe failure on /healthz: status 500`;
  },

  async getKubernetesEvents(namespace: string = 'default'): Promise<KubernetesEvent[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/kubernetes/events?namespace=${namespace}`);
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        type: 'Warning',
        reason: 'Unhealthy',
        object: 'pod/payment-api-79f9d8459-x8j2p',
        message: 'Liveness probe failed: HTTP probe failed with statuscode: 500',
        timestamp: '2026-08-26T17:04:30Z',
        count: 5
      },
      {
        type: 'Normal',
        reason: 'Started',
        object: 'pod/payment-api-79f9d8459-x8j2p',
        message: 'Started container payment-api',
        timestamp: '2026-08-26T17:00:05Z',
        count: 1
      },
      {
        type: 'Normal',
        reason: 'Scheduled',
        object: 'pod/payment-api-79f9d8459-x8j2p',
        message: 'Successfully assigned default/payment-api-79f9d8459-x8j2p to kind-control-plane',
        timestamp: '2026-08-26T17:00:01Z',
        count: 1
      }
    ];
  }
};
