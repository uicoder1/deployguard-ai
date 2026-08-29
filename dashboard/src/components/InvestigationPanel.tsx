import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, AlertOctagon } from 'lucide-react';
import type { DetailedInvestigationResult, StageStatus } from '../api/deployguard';

interface InvestigationPanelProps {
  onInvestigate: (onStageUpdate: (stages: StageStatus[]) => void) => Promise<DetailedInvestigationResult>;
  onRequestRollback: () => void;
  isRolledBack: boolean;
}

export const InvestigationPanel: React.FC<InvestigationPanelProps> = ({
  onInvestigate,
  onRequestRollback,
  isRolledBack
}) => {
  const [investigating, setInvestigating] = useState(false);
  const [stages, setStages] = useState<StageStatus[]>([
    { name: '1. Service Health', status: 'loading' },
    { name: '2. Error Logs', status: 'loading' },
    { name: '3. Deployment History', status: 'loading' },
    { name: '4. Kubernetes State', status: 'loading' }
  ]);
  const [result, setResult] = useState<DetailedInvestigationResult | null>(null);

  const handleStart = async () => {
    setInvestigating(true);
    setResult(null);

    try {
      const res = await onInvestigate((updatedStages) => {
        setStages([...updatedStages]);
      });
      setResult(res);
    } catch {
      // Error handling
    } finally {
      setInvestigating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">AI Incident Investigation</h2>
        </div>
        <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
          {result ? 'Analysis Complete' : investigating ? 'Retrieving Evidence...' : 'Investigation Ready'}
        </span>
      </div>

      {!result && !investigating && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">Ready to analyze production failure</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
            DeployGuard will retrieve live service metrics, error logs, deployment records, and Kubernetes cluster telemetry to diagnose root cause.
          </p>
          <button
            onClick={handleStart}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Investigate Incident</span>
          </button>
        </div>
      )}

      {investigating && (
        <div className="py-4 space-y-3 max-w-lg mx-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Retrieving Production Evidence Across 4 Telemetry Stages
          </div>
          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 border border-gray-100 rounded-md">
              <div className="flex items-center space-x-2.5">
                <span className="font-medium text-gray-900">{stage.name}</span>
                {stage.details && (
                  <span className="text-xs text-gray-500 font-mono">({stage.details})</span>
                )}
              </div>

              {stage.status === 'success' && (
                <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              )}
              {stage.status === 'loading' && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              {stage.status === 'error' && (
                <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Evidence Stages Review */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {result.stages.map((st, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2.5">
                <div className="flex items-center justify-between font-semibold text-gray-900 mb-1">
                  <span>{st.name}</span>
                  {st.status === 'success' ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-amber-600 font-bold">!</span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 block truncate">{st.details || 'Retrieved'}</span>
              </div>
            ))}
          </div>

          {/* Root Cause Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Root Cause Identified</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Confidence: {result.confidence}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{result.rootCause}</p>
          </div>

          {/* Correlated Production Evidence */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Correlated Production Evidence
            </h4>
            <ul className="space-y-2">
              {result.evidence.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 bg-white border border-gray-100 p-2.5 rounded">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Remediation Box */}
          <div className="bg-gray-900 text-white rounded-lg p-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-semibold tracking-tight text-white uppercase">Recommended Remediation</h4>
              </div>
              <span className="text-xs bg-red-900/60 text-red-200 border border-red-700/50 px-2 py-0.5 rounded font-mono">
                Risk: {result.recommendation.risk}
              </span>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Action:</span>
                <span className="font-semibold text-white">{result.recommendation.action}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Version Transition:</span>
                <div className="font-mono text-xs flex items-center space-x-2 bg-gray-800 px-2.5 py-1 rounded">
                  <span className="text-red-300">{result.recommendation.fromVersion}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-emerald-300">{result.recommendation.toVersion}</span>
                </div>
              </div>

              <div className="text-xs text-gray-300 pt-2 border-t border-gray-800">
                <span className="text-gray-400 block mb-0.5">Rationale:</span>
                {result.recommendation.reason}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-400 flex items-center space-x-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Human approval required before production remediation.</span>
              </p>

              {isRolledBack ? (
                <div className="w-full sm:w-auto bg-emerald-900/50 text-emerald-300 border border-emerald-700 px-4 py-2 rounded-md text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Rollback Executed</span>
                </div>
              ) : (
                <button
                  onClick={onRequestRollback}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-md shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Request Rollback</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
