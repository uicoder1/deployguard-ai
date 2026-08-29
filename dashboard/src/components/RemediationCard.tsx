import React from 'react';
import { ShieldCheck, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import type { InvestigationResult } from '../api/types';

interface RemediationCardProps {
  recommendation: InvestigationResult['recommendation'];
  onRequestRollback: () => void;
  isRolledBack: boolean;
}

export const RemediationCard: React.FC<RemediationCardProps> = ({
  recommendation,
  onRequestRollback,
  isRolledBack
}) => {
  return (
    <div id="remediation-section" className="bg-gray-900 text-white rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Recommended Action
          </h3>
        </div>
        <span className="text-xs bg-red-900/60 text-red-200 border border-red-700/50 px-2.5 py-0.5 rounded font-mono font-semibold">
          Risk: {recommendation.risk}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-gray-400 block mb-1">Target Remediation:</span>
          <span className="text-base font-bold text-white">{recommendation.action}</span>
        </div>

        <div>
          <span className="text-gray-400 block mb-1">Version Transition:</span>
          <div className="inline-flex items-center space-x-2 font-mono text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded">
            <span className="text-red-300 font-semibold">{recommendation.fromVersion}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-emerald-300 font-semibold">{recommendation.toVersion}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-300 pt-3 border-t border-gray-800">
        <span className="text-gray-400 block mb-1 font-medium">Rationale:</span>
        <p className="leading-relaxed">{recommendation.reason}</p>
      </div>

      <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Human approval required before production remediation.</span>
        </div>

        {isRolledBack ? (
          <div className="w-full sm:w-auto bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-5 py-2.5 rounded-md text-xs font-bold text-center flex items-center justify-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Rollback Executed ✓</span>
          </div>
        ) : (
          <button
            onClick={onRequestRollback}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-md shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Request Rollback</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
