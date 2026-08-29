import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, AlertOctagon } from 'lucide-react';
import type { InvestigationResult } from '../api/types';

interface InvestigationPanelProps {
  onInvestigate: () => Promise<InvestigationResult>;
  onRequestRollback: () => void;
  isRolledBack: boolean;
}

export const InvestigationPanel: React.FC<InvestigationPanelProps> = ({
  onInvestigate,
  onRequestRollback,
  isRolledBack
}) => {
  const [investigating, setInvestigating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<InvestigationResult | null>(null);

  const steps = [
    'Checking service health',
    'Analyzing production logs',
    'Correlating deployment history',
    'Inspecting Kubernetes state',
    'Determining root cause'
  ];

  const handleStart = async () => {
    setInvestigating(true);
    setProgressStep(0);
    setResult(null);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setProgressStep(i + 1);
    }

    const res = await onInvestigate();
    setResult(res);
    setInvestigating(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">AI Incident Investigation</h2>
        </div>
        <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
          {result ? 'Analysis Complete' : investigating ? 'Analyzing...' : 'Investigation Ready'}
        </span>
      </div>

      {!result && !investigating && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">Ready to analyze production failure</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
            DeployGuard AI will inspect live service metrics, error logs, deployment history, and Kubernetes pod states to diagnose root cause.
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
        <div className="py-4 space-y-3 max-w-md mx-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Investigation Progress
          </div>
          {steps.map((step, idx) => {
            const isDone = progressStep > idx;
            const isCurrent = progressStep === idx;
            return (
              <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <span className={isDone ? 'text-gray-900 font-medium' : isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                  {step}
                </span>
                {isDone ? (
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                ) : isCurrent ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="w-5 h-5 text-gray-300 flex items-center justify-center text-xs">•</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {result && (
        <div className="space-y-6">
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

          {/* Evidence List */}
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
