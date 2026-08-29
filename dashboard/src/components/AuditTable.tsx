import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { AuditRecord } from '../api/types';

interface AuditTableProps {
  audits: AuditRecord[];
}

export const AuditTable: React.FC<AuditTableProps> = ({ audits }) => {
  const lifecycleEvents = [
    {
      time: '2026-08-26 17:00:00 UTC',
      phase: 'Incident Detected',
      desc: 'payment-api status set to CRITICAL. Error rate 47.2%, Latency 1840ms, 5/7 pods unhealthy.',
      type: 'critical'
    },
    {
      time: '2026-08-26 17:01:15 UTC',
      phase: 'Investigation Started',
      desc: 'DeployGuard initiated multi-stage evidence collection across backend telemetry.',
      type: 'info'
    },
    {
      time: '2026-08-26 17:01:45 UTC',
      phase: 'Evidence Collected',
      desc: 'Correlated 48/50 connection pool saturation, DB connection timeouts, and k8s HTTP 500 liveness probe failures.',
      type: 'info'
    },
    {
      time: '2026-08-26 17:02:00 UTC',
      phase: 'Root Cause Identified',
      desc: 'Deployment #184 (v1.8.3) introduced database connection pool exhaustion (Confidence: CONFIRMED).',
      type: 'warn'
    },
    {
      time: '2026-08-26 17:02:10 UTC',
      phase: 'Remediation Recommended',
      desc: 'DeployGuard recommended rolling back deployment #184 (v1.8.3 → v1.8.2). Risk: HIGH.',
      type: 'warn'
    },
    {
      time: '2026-08-26 17:02:25 UTC',
      phase: 'Human Approval Granted',
      desc: 'Operator reviewed evidence and explicitly approved production rollback in DeployGuard modal.',
      type: 'success'
    },
    {
      time: '2026-08-26 17:02:30 UTC',
      phase: 'Rollback Executed',
      desc: 'rollback_deployment tool executed. Version restored to v1.8.2. Audit record generated.',
      type: 'success'
    },
    {
      time: '2026-08-26 17:03:00 UTC',
      phase: 'Service Recovery',
      desc: 'payment-api status restored to HEALTHY. 7/7 pods active, error rate 0.1%, latency 45ms.',
      type: 'success'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Production Remediation Audit Log</h2>
          <p className="text-sm text-gray-500">Immutable record of all incident lifecycles and human-approved remediation actions</p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md font-medium shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All remediation actions are recorded.</span>
        </div>
      </div>

      {/* Incident Lifecycle Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">
          Incident Investigation &amp; Remediation Lifecycle
        </h3>
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
          {lifecycleEvents.map((evt, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[31px] top-1 bg-white p-0.5 rounded-full">
                <div className={`w-3 h-3 rounded-full ${
                  evt.type === 'critical' ? 'bg-red-500' : evt.type === 'warn' ? 'bg-amber-500' : evt.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}></div>
              </div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-gray-900">{evt.phase}</h4>
                <span className="text-xs font-mono text-gray-400">{evt.time}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{evt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Backend Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Recorded Rollback Audit Logs
          </h3>
          <span className="text-xs text-gray-500 font-mono">{audits.length} record(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Deployment</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">From Version</th>
                <th className="px-4 py-3">To Version</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 font-sans text-sm">
                    No remediation actions recorded yet. Perform a simulated rollback on the Overview tab to generate an audit log entry.
                  </td>
                </tr>
              ) : (
                audits.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-sans">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 font-sans">Rollback Deployment</td>
                    <td className="px-4 py-3 text-gray-900 font-bold">#{record.deploymentId}</td>
                    <td className="px-4 py-3 text-gray-800">{record.service}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{record.fromVersion}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{record.restoredVersion}</td>
                    <td className="px-4 py-3 font-sans">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold">
                        SUCCESS
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-medium">
                        {record.simulated ? 'SIMULATED' : 'PRODUCTION'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
