import { Service, Deployment, Incident, LogEntry, GetLogsOptions, HealthStatus, RollbackAuditRecord } from './types.js';
import { INITIAL_SERVICES, INITIAL_DEPLOYMENTS, INITIAL_INCIDENTS, INITIAL_LOGS } from './data.js';

export class ProductionSimulator {
  private services: Map<string, Service>;
  private deployments: Deployment[];
  private incidents: Incident[];
  private logs: LogEntry[];
  private rollbackAudits: RollbackAuditRecord[];

  constructor() {
    this.services = new Map(INITIAL_SERVICES.map(s => [s.id, { ...s }]));
    this.deployments = INITIAL_DEPLOYMENTS.map(d => ({ ...d }));
    this.incidents = INITIAL_INCIDENTS.map(i => ({ ...i }));
    this.logs = INITIAL_LOGS.map(l => ({ ...l }));
    this.rollbackAudits = [];
  }

  /**
   * Retrieve all services in the simulated environment.
   */
  public getServices(): Service[] {
    return Array.from(this.services.values());
  }

  /**
   * Retrieve details for a specific service.
   */
  public getServiceById(serviceId: string): Service | undefined {
    const service = this.services.get(serviceId);
    return service ? { ...service } : undefined;
  }

  /**
   * Retrieve health status metrics for a service.
   */
  public getServiceStatus(serviceId: string): {
    id: string;
    status: HealthStatus;
    errorRatePercent: number;
    averageLatencyMs: number;
    healthyInstances: number;
    unhealthyInstances: number;
  } | undefined {
    const service = this.services.get(serviceId);
    if (!service) return undefined;
    return {
      id: service.id,
      status: service.status,
      errorRatePercent: service.errorRatePercent,
      averageLatencyMs: service.averageLatencyMs,
      healthyInstances: service.healthyInstances,
      unhealthyInstances: service.unhealthyInstances
    };
  }

  /**
   * Retrieve deployments, optionally filtered by serviceId.
   */
  public getRecentDeployments(serviceId?: string): Deployment[] {
    if (serviceId) {
      return this.deployments.filter(d => d.serviceId === serviceId);
    }
    return [...this.deployments];
  }

  /**
   * Retrieve details for a specific deployment by ID.
   */
  public getDeploymentDetails(deploymentId: string): Deployment | undefined {
    const dep = this.deployments.find(d => d.id === deploymentId);
    return dep ? { ...dep } : undefined;
  }

  /**
   * Retrieve active or past incidents.
   */
  public getIncidents(serviceId?: string): Incident[] {
    if (serviceId) {
      return this.incidents.filter(i => i.serviceId === serviceId);
    }
    return [...this.incidents];
  }

  /**
   * Retrieve logs filtered by serviceId, level, or limit.
   */
  public getLogs(options: GetLogsOptions = {}): LogEntry[] {
    let filtered = [...this.logs];

    if (options.serviceId) {
      filtered = filtered.filter(l => l.serviceId === options.serviceId);
    }

    if (options.level) {
      filtered = filtered.filter(l => l.level === options.level);
    }

    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Return high-level environment summary for diagnostic inspection.
   */
  public getEnvironmentSummary(): {
    totalServices: number;
    criticalServices: string[];
    activeIncidentsCount: number;
    latestDeploymentId: string;
  } {
    const services = this.getServices();
    const criticalServices = services.filter(s => s.status === 'critical').map(s => s.id);
    const activeIncidents = this.incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING');
    const latestDeployment = this.deployments[this.deployments.length - 1];

    return {
      totalServices: services.length,
      criticalServices,
      activeIncidentsCount: activeIncidents.length,
      latestDeploymentId: latestDeployment ? latestDeployment.id : 'N/A'
    };
  }

  /**
   * Retrieve all recorded rollback audit logs.
   */
  public getRollbackAudits(): RollbackAuditRecord[] {
    return this.rollbackAudits.map(record => ({ ...record }));
  }

  /**
   * Safely simulate rolling back a service deployment to the previous successful version.
   */
  public rollbackDeployment(deploymentId: string): {
    success: boolean;
    error?: string;
    deploymentId?: string;
    serviceId?: string;
    previousVersion?: string;
    restoredVersion?: string;
    simulated?: boolean;
    serviceStatus?: ReturnType<ProductionSimulator['getServiceStatus']>;
    auditRecord?: RollbackAuditRecord;
  } {
    const deployment = this.deployments.find(d => d.id === deploymentId);
    if (!deployment) {
      return {
        success: false,
        error: `Error: Deployment with ID '${deploymentId}' was not found.`
      };
    }

    if (deployment.status === 'rolled_back') {
      return {
        success: false,
        error: `Error: Deployment #${deploymentId} has already been rolled back.`
      };
    }

    const service = this.services.get(deployment.serviceId);
    if (!service) {
      return {
        success: false,
        error: `Error: Service '${deployment.serviceId}' was not found.`
      };
    }

    const serviceDeployments = this.deployments.filter(d => d.serviceId === deployment.serviceId);
    const latestDeployment = serviceDeployments[serviceDeployments.length - 1];
    if (latestDeployment.id !== deploymentId) {
      return {
        success: false,
        error: `Error: Deployment #${deploymentId} is not the currently active deployment for service '${deployment.serviceId}'. Only the active deployment can be rolled back.`
      };
    }

    const deploymentIndex = serviceDeployments.findIndex(d => d.id === deploymentId);
    const previousSuccessful = serviceDeployments
      .slice(0, deploymentIndex)
      .reverse()
      .find(d => d.status === 'successful');

    if (!previousSuccessful) {
      return {
        success: false,
        error: `Error: No previous successful deployment found for service '${deployment.serviceId}'.`
      };
    }

    const previousVersion = service.version;
    const restoredVersion = previousSuccessful.version;

    // Mark deployment as rolled back
    deployment.status = 'rolled_back';

    // Restore service version and metrics to healthy state
    service.version = restoredVersion;
    service.status = 'healthy';
    service.errorRatePercent = 0.1;
    service.averageLatencyMs = 45;
    service.healthyInstances = service.healthyInstances + service.unhealthyInstances;
    service.unhealthyInstances = 0;
    service.updatedAt = new Date().toISOString();

    // Mark active incident as RESOLVED if triggered by this deployment
    const incident = this.incidents.find(i => i.triggeringDeploymentId === deploymentId);
    if (incident) {
      incident.status = 'RESOLVED';
    }

    const auditRecord: RollbackAuditRecord = {
      timestamp: service.updatedAt,
      deploymentId,
      service: service.id,
      fromVersion: previousVersion,
      restoredVersion,
      reason: `Simulated rollback of deployment #${deploymentId} for service ${service.id}`,
      simulated: true,
      resultingStatus: service.status
    };
    this.rollbackAudits.push(auditRecord);

    return {
      success: true,
      deploymentId,
      serviceId: service.id,
      previousVersion,
      restoredVersion,
      simulated: true,
      serviceStatus: this.getServiceStatus(service.id),
      auditRecord: { ...auditRecord }
    };
  }
}

// Global deterministic simulator instance
export const simulator = new ProductionSimulator();
