import { simulator } from './simulator.js';

function runCLI() {
  console.log('====================================================');
  console.log('           DEPLOYGUARD PRODUCTION SIMULATOR         ');
  console.log('====================================================\n');

  const summary = simulator.getEnvironmentSummary();
  console.log('📊 Environment Summary:');
  console.log(`   - Total Services: ${summary.totalServices}`);
  console.log(`   - Critical Services: ${summary.criticalServices.join(', ') || 'None'}`);
  console.log(`   - Active Incidents: ${summary.activeIncidentsCount}`);
  console.log(`   - Latest Deployment: #${summary.latestDeploymentId}\n`);

  console.log('🩺 Services Overview:');
  const services = simulator.getServices();
  for (const s of services) {
    const badge = s.status === 'critical' ? '🔴 CRITICAL' : '🟢 HEALTHY';
    console.log(`   • ${s.id} (${s.name}): ${badge} | Version: ${s.version} | Error Rate: ${s.errorRatePercent}% | Latency: ${s.averageLatencyMs}ms`);
  }

  console.log('\n🚀 Recent Deployments:');
  const deployments = simulator.getRecentDeployments();
  for (const d of deployments) {
    console.log(`   • #${d.id} | Service: ${d.serviceId} | Version: ${d.version} | Status: ${d.status.toUpperCase()} | Time: ${d.timestamp}`);
    console.log(`     Desc: "${d.description}"`);
  }

  console.log('\n🚨 Active Incidents:');
  const incidents = simulator.getIncidents();
  for (const inc of incidents) {
    console.log(`   • [${inc.id}] ${inc.title}`);
    console.log(`     Severity: ${inc.severity} | Triggered By: Deployment #${inc.triggeringDeploymentId}`);
    console.log(`     Summary: ${inc.summary}`);
  }

  console.log('\n📜 Recent Error & Warning Logs:');
  const errorLogs = simulator.getLogs({ level: 'ERROR' });
  for (const log of errorLogs) {
    console.log(`   [${log.timestamp}] [${log.serviceId}] [${log.level}]: ${log.message}`);
  }

  console.log('\n====================================================');
}

export * from './types.js';
export * from './data.js';
export * from './simulator.js';

if (process.argv[1] && process.argv[1].includes('index')) {
  runCLI();
}
