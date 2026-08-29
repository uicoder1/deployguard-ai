import React, { useEffect, useState } from 'react';
import { Timeline } from '../components/Timeline';
import type { LogEntry } from '../api/types';
import { deployGuardApi } from '../api/deployguard';
import { Sparkles, Terminal, ArrowRight } from 'lucide-react';

interface InvestigationProps {
  onRequestRollback: () => void;
  isRolledBack: boolean;
}

export const Investigation: React.FC<InvestigationProps> = ({
  onRequestRollback,
  isRolledBack
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    deployGuardApi.getServiceLogs('payment-api', undefined, 10).then(setLogs);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Detailed Incident Investigation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Deep-dive correlation across service health, deployment diffs, error logs, and Kubernetes pod diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vertical Event Timeline */}
          <Timeline />

          {/* Error Logs Viewer */}
          <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden font-mono text-xs">
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-gray-300">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-gray-200">Production Log Stream — payment-api</span>
              </div>
              <span className="text-[11px] text-gray-500">Filter: ERROR/FATAL (Limit 10)</span>
            </div>
            <div className="p-4 text-gray-300 space-y-2 overflow-x-auto max-h-80">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-[11px] leading-relaxed">
                  <span className="text-gray-500 shrink-0">{log.timestamp.slice(11, 19)}</span>
                  <span className={`shrink-0 font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    log.level === 'FATAL' ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-gray-200">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Root Cause Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3 mb-4">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Root Cause Summary</h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              Deployment #184 (v1.8.3) optimized connection pool limits from 100 to 50 connections with a strict 5000ms acquire timeout. Under peak transaction load, all 50 database connections became saturated, creating a request queue overflow and HTTP 500 probe failures.
            </p>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Confidence:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                CONFIRMED (100%)
              </span>
            </div>
          </div>

          {/* Deployment Correlation */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
              Deployment Correlation
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Culprit Deployment:</span>
                <span className="font-mono text-gray-900 font-semibold">#184 (v1.8.3)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Author:</span>
                <span className="text-gray-800">alex.chen</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commit Hash:</span>
                <span className="font-mono text-gray-600">a1b2c3d4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stable Predecessor:</span>
                <span className="font-mono text-emerald-700 font-semibold">#183 (v1.8.2)</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-gray-900 text-white rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-semibold uppercase text-gray-300">Recommended Action</span>
              <span className="text-xs bg-red-900/60 text-red-200 border border-red-700/50 px-2 py-0.5 rounded font-mono">
                Risk: HIGH
              </span>
            </div>

            <p className="text-xs text-gray-300">
              Revert payment-api deployment from <span className="font-mono text-red-300">v1.8.3</span> back to <span className="font-mono text-emerald-300">v1.8.2</span> to immediately restore 100-connection pool ceiling.
            </p>

            {isRolledBack ? (
              <div className="w-full bg-emerald-900/50 text-emerald-300 border border-emerald-700 px-3 py-2 rounded text-xs font-semibold text-center">
                ✓ Rollback Completed
              </div>
            ) : (
              <button
                onClick={onRequestRollback}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Request Rollback</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
