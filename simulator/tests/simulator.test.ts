import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProductionSimulator } from '../src/simulator.js';

describe('DeployGuard Production Simulator Tests', () => {

  it('should represent payment-api initially with critical status and correct metrics', () => {
    const sim = new ProductionSimulator();
    const paymentService = sim.getServiceById('payment-api');

    assert.ok(paymentService, 'payment-api should exist');
    assert.equal(paymentService.id, 'payment-api');
    assert.equal(paymentService.status, 'critical');
    assert.equal(paymentService.errorRatePercent, 47.2);
    assert.equal(paymentService.averageLatencyMs, 1840);
    assert.equal(paymentService.healthyInstances, 2);
    assert.equal(paymentService.unhealthyInstances, 5);
    assert.equal(paymentService.version, '1.8.3');
  });

  it('should verify all 4 required services exist with correct initial health', () => {
    const sim = new ProductionSimulator();
    const services = sim.getServices();
    assert.equal(services.length, 4);

    const userApi = sim.getServiceById('user-api');
    const orderApi = sim.getServiceById('order-api');
    const database = sim.getServiceById('database');

    assert.ok(userApi && userApi.status === 'healthy');
    assert.ok(orderApi && orderApi.status === 'healthy');
    assert.ok(database && database.status === 'healthy');
  });

  it('should prove deployment #184 exists and is associated with payment-api v1.8.3', () => {
    const sim = new ProductionSimulator();
    const dep184 = sim.getDeploymentDetails('184');

    assert.ok(dep184, 'Deployment #184 must exist');
    assert.equal(dep184.id, '184');
    assert.equal(dep184.serviceId, 'payment-api');
    assert.equal(dep184.version, '1.8.3');
    assert.equal(dep184.status, 'successful');

    const dep183 = sim.getDeploymentDetails('183');
    assert.ok(dep183, 'Deployment #183 must exist');
    assert.equal(dep183.version, '1.8.2');
  });

  it('should prove the incident is associated with payment-api and deployment #184', () => {
    const sim = new ProductionSimulator();
    const incidents = sim.getIncidents('payment-api');

    assert.equal(incidents.length, 1);
    const incident = incidents[0];
    assert.equal(incident.serviceId, 'payment-api');
    assert.equal(incident.severity, 'CRITICAL');
    assert.equal(incident.status, 'OPEN');
    assert.equal(incident.triggeringDeploymentId, '184');
  });

  it('should contain realistic logs with payment failures and DB connection timeouts', () => {
    const sim = new ProductionSimulator();
    const logs = sim.getLogs({ serviceId: 'payment-api' });

    assert.ok(logs.length > 0, 'payment-api should have log entries');

    const errorLogs = sim.getLogs({ serviceId: 'payment-api', level: 'ERROR' });
    assert.ok(errorLogs.length >= 2, 'Should contain error logs for payment-api');

    const has500Error = errorLogs.some(l => l.message.includes('HTTP 500') && l.message.includes('Payment processing failed'));
    const hasDbTimeout = errorLogs.some(l => l.message.includes('DB Connection Timeout') || l.message.includes('pool exhausted'));

    assert.ok(has500Error, 'Logs must contain HTTP 500 payment processing failure');
    assert.ok(hasDbTimeout, 'Logs must contain database connection timeout / pool exhaustion messages');
  });

  it('should successfully roll back deployment #184 for payment-api', () => {
    const sim = new ProductionSimulator();
    const result = sim.rollbackDeployment('184');

    assert.equal(result.success, true);
    assert.equal(result.deploymentId, '184');
    assert.equal(result.serviceId, 'payment-api');
    assert.equal(result.previousVersion, '1.8.3');
    assert.equal(result.restoredVersion, '1.8.2');
    assert.equal(result.simulated, true);

    const paymentService = sim.getServiceById('payment-api');
    assert.ok(paymentService);
    assert.equal(paymentService.version, '1.8.2');
    assert.equal(paymentService.status, 'healthy');
    assert.equal(paymentService.unhealthyInstances, 0);

    const dep184 = sim.getDeploymentDetails('184');
    assert.ok(dep184);
    assert.equal(dep184.status, 'rolled_back');

    const deployments = sim.getRecentDeployments('payment-api');
    assert.equal(deployments.length, 2, 'Deployment history must remain available');
  });

  it('should reject rollback for unknown deployment ID', () => {
    const sim = new ProductionSimulator();
    const result = sim.rollbackDeployment('non-existent-dep');

    assert.equal(result.success, false);
    assert.ok(result.error && result.error.includes('non-existent-dep'));
  });

  it('should reject rollback if deployment is not the currently active deployment', () => {
    const sim = new ProductionSimulator();
    const result = sim.rollbackDeployment('183');

    assert.equal(result.success, false);
    assert.ok(result.error && result.error.includes('not the currently active deployment'));
  });

  it('should maintain an in-memory audit trail of successful rollbacks', () => {
    const sim = new ProductionSimulator();
    assert.equal(sim.getRollbackAudits().length, 0);

    const result = sim.rollbackDeployment('184');
    assert.equal(result.success, true);
    assert.ok(result.auditRecord);

    const audits = sim.getRollbackAudits();
    assert.equal(audits.length, 1);

    const record = audits[0];
    assert.ok(record.timestamp);
    assert.equal(record.deploymentId, '184');
    assert.equal(record.service, 'payment-api');
    assert.equal(record.fromVersion, '1.8.3');
    assert.equal(record.restoredVersion, '1.8.2');
    assert.equal(record.simulated, true);
    assert.equal(record.resultingStatus, 'healthy');
    assert.ok(record.reason.includes('184'));
  });

  it('should not create an audit record when rollback fails', () => {
    const sim = new ProductionSimulator();
    assert.equal(sim.getRollbackAudits().length, 0);

    const failResult1 = sim.rollbackDeployment('invalid-id');
    assert.equal(failResult1.success, false);
    assert.equal(sim.getRollbackAudits().length, 0);

    const failResult2 = sim.rollbackDeployment('183');
    assert.equal(failResult2.success, false);
    assert.equal(sim.getRollbackAudits().length, 0);
  });

});


