import React from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { StageStatus } from '../api/deployguard';

interface InvestigationPanelProps {
  investigating: boolean;
  stages: StageStatus[];
  onStartInvestigation: () => void;
  isComplete: boolean;
}

export const InvestigationPanel: React.FC<InvestigationPanelProps> = ({
  investigating,
  stages,
  onStartInvestigation,
  isComplete
}) => {
  return (
    <div id="investigation-section" className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {isComplete
                ? 'Production Evidence Correlated'
                : investigating
                ? 'Investigating Production Incident'
                : 'Production Incident Investigation'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {investigating
              ? 'DeployGuard is correlating production telemetry to identify the root cause.'
              : 'Correlate service metrics, error logs, deployment records, and Kubernetes state.'}
          </p>
        </div>

        {!investigating && !isComplete && (
          <button
            onClick={onStartInvestigation}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-md shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Investigate Incident</span>
          </button>
        )}
      </div>

      {/* 4 Evidence Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const isDone = stage.status === 'complete';
          const isChecking = stage.status === 'checking';
          const isFailed = stage.status === 'failed';

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-md border text-xs transition-colors ${
                isDone
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : isChecking
                  ? 'bg-blue-50/50 border-blue-200'
                  : isFailed
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="text-gray-900">{stage.name}</span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {isChecking && <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                {isFailed && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                {stage.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">{stage.subtext}</p>
              {stage.details && (
                <span className="inline-block mt-2 font-mono text-[10px] bg-white border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                  {stage.details}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
