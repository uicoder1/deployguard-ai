import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface IncidentTimelineProps {
  currentStage: 'ready' | 'investigating' | 'evidence' | 'approved' | 'recovered';
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ currentStage }) => {
  const steps = [
    { key: 'detected', label: 'Incident detected', done: true },
    { key: 'investigating', label: 'Investigation', done: currentStage !== 'ready' },
    { key: 'evidence', label: 'Evidence collected', done: currentStage === 'evidence' || currentStage === 'approved' || currentStage === 'recovered' },
    { key: 'root_cause', label: 'Root cause identified', done: currentStage === 'evidence' || currentStage === 'approved' || currentStage === 'recovered' },
    { key: 'remediation', label: 'Remediation recommended', done: currentStage === 'evidence' || currentStage === 'approved' || currentStage === 'recovered' },
    { key: 'approval', label: 'Human approval', done: currentStage === 'approved' || currentStage === 'recovered' },
    { key: 'rollback', label: 'Rollback', done: currentStage === 'recovered' },
    { key: 'recovery', label: 'Recovery', done: currentStage === 'recovered' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Incident Response Lifecycle
        </span>
        <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
          {currentStage === 'ready' && 'Current Stage: Investigation Ready'}
          {currentStage === 'investigating' && 'Current Stage: Investigating...'}
          {currentStage === 'evidence' && 'Current Stage: Root Cause Confirmed'}
          {currentStage === 'approved' && 'Current Stage: Rollback Executing...'}
          {currentStage === 'recovered' && 'Current Stage: Service Recovered ✓'}
        </span>
      </div>

      {/* Responsive Horizontal Workflow Bar */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[720px] justify-between text-xs">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center space-x-1.5 shrink-0">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0"></div>
                )}
                <span className={`font-medium ${step.done ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
