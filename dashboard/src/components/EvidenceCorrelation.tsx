import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { InvestigationResult } from '../api/types';

interface EvidenceCorrelationProps {
  result: InvestigationResult;
}

export const EvidenceCorrelation: React.FC<EvidenceCorrelationProps> = ({ result }) => {
  const causalChain = [
    { title: 'Deployment #184', desc: 'v1.8.3 deployed 17:00 UTC' },
    { title: 'Pool Exhaustion', desc: '48/50 active connections' },
    { title: 'DB Timeouts', desc: 'Acquire timeout >5000ms' },
    { title: 'Payment Failures', desc: 'Queue overflow 142 reqs' },
    { title: 'HTTP 500 Errors', desc: '47.2% error rate spike' },
    { title: 'Pod Failures', desc: '5/7 liveness probes failed' }
  ];

  return (
    <div id="evidence-section" className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Root Cause Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Root Cause Identified</span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200">
              Confidence: {result.confidence}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">{result.rootCause}</h3>
        </div>

        <div className="flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 shrink-0 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Telemetry Correlated</span>
        </div>
      </div>

      {/* Why DeployGuard Believes This */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
          Why DeployGuard Believes This (Correlated Production Evidence)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {result.evidence.map((item, index) => (
            <div key={index} className="flex items-start space-x-2.5 p-3 bg-gray-50 border border-gray-100 rounded-md">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span className="text-gray-800 font-medium leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How the evidence connects (Causal Chain) */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            How the evidence connects (Causal Chain)
          </h4>
          <span className="text-[11px] text-gray-400">Multi-source correlation sequence</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] justify-between text-xs">
            {causalChain.map((node, idx) => (
              <React.Fragment key={idx}>
                <div className="bg-gray-900 text-white p-3 rounded-md min-w-[120px] text-center shadow-xs">
                  <div className="font-bold text-white text-xs">{node.title}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{node.desc}</div>
                </div>
                {idx < causalChain.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
