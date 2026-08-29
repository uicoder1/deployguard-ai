import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { AuditRecord } from '../api/types';

interface AuditTableProps {
  audits: AuditRecord[];
}

export const AuditTable: React.FC<AuditTableProps> = ({ audits }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Production Remediation Audit Log</h2>
          <p className="text-sm text-gray-500">Immutable record of all automated and human-approved remediation actions</p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>All remediation actions are recorded.</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
