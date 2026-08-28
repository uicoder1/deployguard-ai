import { Service, Deployment, Incident, LogEntry } from './types.js';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'payment-api',
    name: 'Payment Processing Service',
    status: 'critical',
    version: '1.8.3',
    errorRatePercent: 47.2,
    averageLatencyMs: 1840,
    healthyInstances: 2,
    unhealthyInstances: 5,
    updatedAt: '2026-08-26T17:05:00Z'
  },
  {
    id: 'user-api',
    name: 'User Management Service',
    status: 'healthy',
    version: '2.4.1',
    errorRatePercent: 0.1,
    averageLatencyMs: 45,
    healthyInstances: 4,
    unhealthyInstances: 0,
    updatedAt: '2026-08-26T17:05:00Z'
  },
  {
    id: 'order-api',
    name: 'Order Fulfillment Service',
    status: 'healthy',
    version: '1.12.0',
    errorRatePercent: 0.3,
    averageLatencyMs: 82,
    healthyInstances: 3,
    unhealthyInstances: 0,
    updatedAt: '2026-08-26T17:05:00Z'
  },
  {
    id: 'database',
    name: 'Primary PostgreSQL Database Cluster',
    status: 'healthy',
    version: '15.4-pg',
    errorRatePercent: 0.0,
    averageLatencyMs: 5,
    healthyInstances: 2,
    unhealthyInstances: 0,
    updatedAt: '2026-08-26T17:05:00Z'
  }
];

export const INITIAL_DEPLOYMENTS: Deployment[] = [
  {
    id: '183',
    serviceId: 'payment-api',
    version: '1.8.2',
    status: 'successful',
    deployedBy: 'ci-cd-pipeline',
    timestamp: '2026-08-26T16:30:00Z',
    commitHash: 'a1b2c3d',
    description: 'Routine stability update and security patch'
  },
  {
    id: '184',
    serviceId: 'payment-api',
    version: '1.8.3',
    status: 'successful',
    deployedBy: 'deploy-bot',
    timestamp: '2026-08-26T17:00:00Z',
    commitHash: 'f9e8d7c',
    description: 'Payment gateway connection pool optimization v1.8.3'
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0842',
    title: 'High error rate and latency spike on payment-api',
    serviceId: 'payment-api',
    severity: 'CRITICAL',
    status: 'OPEN',
    triggeredAt: '2026-08-26T17:05:00Z',
    triggeringDeploymentId: '184',
    summary: 'Following deployment #184 of payment-api (v1.8.3), error rate reached 47.2% with latencies peaking at 1840ms. 5 of 7 pods failing health checks due to DB connection timeouts.'
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-08-26T16:30:00Z',
    serviceId: 'payment-api',
    level: 'INFO',
    message: 'Deployment #183 completed successfully for payment-api v1.8.2',
    context: { deploymentId: '183', version: '1.8.2' }
  },
  {
    id: 'log-002',
    timestamp: '2026-08-26T17:00:00Z',
    serviceId: 'payment-api',
    level: 'INFO',
    message: 'Deployment #184 completed successfully for payment-api v1.8.3',
    context: { deploymentId: '184', version: '1.8.3' }
  },
  {
    id: 'log-003',
    timestamp: '2026-08-26T17:01:15Z',
    serviceId: 'payment-api',
    level: 'INFO',
    message: 'POST /v1/charge HTTP 200 - latency 120ms - charge_id: ch_994182',
    context: { statusCode: 200, latencyMs: 120 }
  },
  {
    id: 'log-004',
    timestamp: '2026-08-26T17:02:30Z',
    serviceId: 'payment-api',
    level: 'WARN',
    message: 'Database connection pool usage reaching threshold (48/50 active connections)',
    context: { activeConnections: 48, maxConnections: 50 }
  },
  {
    id: 'log-005',
    timestamp: '2026-08-26T17:03:10Z',
    serviceId: 'payment-api',
    level: 'ERROR',
    message: 'HTTP 500 POST /v1/charge - Payment processing failed: DB Connection Timeout after 5000ms',
    context: { statusCode: 500, error: 'DB Connection Timeout', latencyMs: 5002 }
  },
  {
    id: 'log-006',
    timestamp: '2026-08-26T17:03:45Z',
    serviceId: 'payment-api',
    level: 'ERROR',
    message: 'Database connection acquire timeout: pool exhausted for primary-db cluster',
    context: { poolState: 'exhausted', waitingRequests: 32 }
  },
  {
    id: 'log-007',
    timestamp: '2026-08-26T17:04:12Z',
    serviceId: 'payment-api',
    level: 'ERROR',
    message: 'HTTP 500 POST /v1/refund - Payment processing failed: connection reset by peer',
    context: { statusCode: 500, error: 'Connection reset', latencyMs: 1840 }
  },
  {
    id: 'log-008',
    timestamp: '2026-08-26T17:04:30Z',
    serviceId: 'payment-api',
    level: 'WARN',
    message: 'Healthcheck failed for payment-api-pod-3: readiness probe TCP 8080 timeout',
    context: { pod: 'payment-api-pod-3', probe: 'readiness' }
  },
  {
    id: 'log-009',
    timestamp: '2026-08-26T17:04:45Z',
    serviceId: 'payment-api',
    level: 'WARN',
    message: 'Healthcheck failed for payment-api-pod-4: readiness probe TCP 8080 timeout',
    context: { pod: 'payment-api-pod-4', probe: 'readiness' }
  },
  {
    id: 'log-010',
    timestamp: '2026-08-26T17:05:00Z',
    serviceId: 'payment-api',
    level: 'FATAL',
    message: 'CRITICAL ALERT: payment-api error rate 47.2% exceeds threshold (5.0%). Latency 1840ms. 5/7 instances unhealthy.',
    context: { errorRatePercent: 47.2, latencyMs: 1840, healthyInstances: 2, unhealthyInstances: 5 }
  },
  {
    id: 'log-011',
    timestamp: '2026-08-26T17:05:30Z',
    serviceId: 'user-api',
    level: 'INFO',
    message: 'GET /v1/users/me HTTP 200 - latency 42ms',
    context: { statusCode: 200, latencyMs: 42 }
  },
  {
    id: 'log-012',
    timestamp: '2026-08-26T17:06:00Z',
    serviceId: 'order-api',
    level: 'WARN',
    message: 'Downstream dependency warning: payment-api elevated response latency (1840ms)',
    context: { targetService: 'payment-api', latencyMs: 1840 }
  }
];
