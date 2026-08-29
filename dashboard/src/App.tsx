import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IncidentHeader } from './components/IncidentHeader';
import { IncidentMetrics } from './components/IncidentMetrics';
import { IncidentTimeline } from './components/IncidentTimeline';
import { InvestigationPanel } from './components/InvestigationPanel';
import { EvidenceCorrelation } from './components/EvidenceCorrelation';
import { RemediationCard } from './components/RemediationCard';
import { KubernetesEvidence } from './components/KubernetesEvidence';
import { RollbackDialog } from './components/RollbackDialog';
import { AuditTable } from './components/AuditTable';
import { Footer } from './components/Footer';

import { deployGuardApi, MCP_SERVER_URL } from './api/deployguard';
import type { StageStatus } from './api/deployguard';
import type { ServiceStatus, RollbackResult, InvestigationResult, AuditRecord } from './api/types';
import { CheckCircle2, ShieldCheck, X, AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'incident' | 'evidence' | 'remediation' | 'audit'>('incident');
  const [backendConnected, setBackendConnected] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  // Core Service Status State
  const [status, setStatus] = useState<ServiceStatus>({
    id: 'payment-api',
    name: 'Payment Processing Service',
    status: 'critical',
    version: '1.8.3',
    errorRatePercent: 47.2,
    averageLatencyMs: 1840,
    healthyInstances: 2,
    unhealthyInstances: 5,
    updatedAt: new Date().toISOString()
  });

  // Investigation Workflow State
  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<InvestigationResult | null>(null);
  const [stages, setStages] = useState<StageStatus[]>([
    { id: 'health', name: '1. Service Health', subtext: 'Checking payment-api health and metrics', status: 'waiting' },
    { id: 'logs', name: '2. Error Logs', subtext: 'Analyzing recent production failures', status: 'waiting' },
    { id: 'deployments', name: '3. Deployment History', subtext: 'Correlating failures with recent deployments', status: 'waiting' },
    { id: 'k8s', name: '4. Kubernetes State', subtext: 'Inspecting pods, deployment state, logs and events', status: 'waiting' }
  ]);

  // Rollback Approval State
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isRolledBack, setIsRolledBack] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<RollbackResult | null>(null);
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  // Check Backend Connection on Mount
  const checkConnection = async () => {
    setIsCheckingBackend(true);
    const health = await deployGuardApi.checkBackendConnection();
    setBackendConnected(health.connected);
    setIsSleeping(health.isSleeping);

    const [currentStatus, auditList] = await Promise.all([
      deployGuardApi.getServiceStatus('payment-api'),
      deployGuardApi.getRollbackAudits()
    ]);

    setStatus(currentStatus);
    setAudits(auditList);

    if (currentStatus.status === 'healthy' || currentStatus.version === '1.8.2') {
      setIsRolledBack(true);
    }
    setIsCheckingBackend(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Handle Section Jumping from Header Nav
  const handleJumpSection = (sec: 'incident' | 'evidence' | 'remediation' | 'audit') => {
    setActiveSection(sec);
    const el = document.getElementById(`${sec}-section`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Trigger Multi-Stage Evidence Retrieval
  const handleStartInvestigation = async () => {
    setInvestigating(true);
    setInvestigationResult(null);

    try {
      const res = await deployGuardApi.runInvestigation((updatedStages) => {
        setStages([...updatedStages]);
      });
      setInvestigationResult(res);
    } catch {
      // Graceful error handling
    } finally {
      setInvestigating(false);
    }
  };

  // Confirm Rollback Call to Backend
  const handleConfirmRollback = async (): Promise<RollbackResult> => {
    return await deployGuardApi.rollbackDeployment('184');
  };

  // Handle Rollback Success State
  const handleRollbackSuccess = async (result: RollbackResult) => {
    if (result.serviceStatus) {
      setStatus(result.serviceStatus);
    } else {
      setStatus((prev) => ({
        ...prev,
        status: 'healthy',
        version: '1.8.2',
        errorRatePercent: 0.1,
        averageLatencyMs: 45,
        healthyInstances: 7,
        unhealthyInstances: 0
      }));
    }
    setIsRolledBack(true);
    setRollbackResult(result);

    const updatedAudits = await deployGuardApi.getRollbackAudits();
    setAudits(updatedAudits);
  };

  // Current Lifecycle Stage Determination
  const currentTimelineStage = isRolledBack
    ? 'recovered'
    : rollbackResult
    ? 'approved'
    : investigationResult
    ? 'evidence'
    : investigating
    ? 'investigating'
    : 'ready';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased flex flex-col selection:bg-blue-100">
      {/* Header Navigation */}
      <Header
        activeSection={activeSection}
        setActiveSection={handleJumpSection}
        backendConnected={backendConnected}
        isSleeping={isSleeping}
        onRetryConnection={checkConnection}
      />

      {/* Backend Sleeping Banner */}
      {isSleeping && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-xs text-amber-900">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Backend Waking Up:</strong> Render free instance at <code className="font-mono">{MCP_SERVER_URL}</code> is starting up (may take ~45s). DeployGuard simulator cache active.
              </span>
            </div>
            <button
              onClick={checkConnection}
              disabled={isCheckingBackend}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin' : ''}`} />
              <span>{isCheckingBackend ? 'Waking backend...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Single Story Screen */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Post-Rollback Recovery Banner */}
        {rollbackResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between shadow-xs">
            <div className="flex items-start space-x-3 text-xs sm:text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex items-center space-x-2">
                  <span>Rollback Completed Successfully</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs border border-emerald-300">
                    payment-api v1.8.3 → v1.8.2
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-emerald-800 text-xs">
                  <span>Service status: <strong className="uppercase">HEALTHY</strong></span>
                  <span>Healthy instances: <strong>7 / 7</strong></span>
                  <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit record created in system log.</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setRollbackResult(null)}
              className="text-emerald-500 hover:text-emerald-700 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. PRODUCTION INCIDENT HEADER */}
        <div id="incident-section">
          <IncidentHeader
            serviceId={status.name || 'payment-api'}
            status={status.status}
          />
        </div>

        {/* 2. COMPACT METRICS ROW */}
        <IncidentMetrics status={status} />

        {/* 3. WORKFLOW TIMELINE */}
        <IncidentTimeline currentStage={currentTimelineStage} />

        {/* 4. INVESTIGATION PANEL (4 Stages) */}
        <InvestigationPanel
          investigating={investigating}
          stages={stages}
          onStartInvestigation={handleStartInvestigation}
          isComplete={!!investigationResult}
        />

        {/* 5. CORRELATED EVIDENCE & CAUSAL CHAIN (Appears after investigation) */}
        {investigationResult && (
          <>
            <EvidenceCorrelation result={investigationResult} />

            {/* Expandable Kubernetes Infrastructure Evidence */}
            <KubernetesEvidence />

            {/* 6. RECOMMENDED REMEDIATION CARD */}
            <RemediationCard
              recommendation={investigationResult.recommendation}
              onRequestRollback={() => setIsRollbackModalOpen(true)}
              isRolledBack={isRolledBack}
            />
          </>
        )}

        {/* 7. AUDIT LOG & LIFECYCLE */}
        <AuditTable audits={audits} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Human Approval Confirmation Dialog */}
      <RollbackDialog
        isOpen={isRollbackModalOpen}
        onClose={() => setIsRollbackModalOpen(false)}
        onConfirmRollback={handleConfirmRollback}
        onSuccess={handleRollbackSuccess}
      />
    </div>
  );
};

export default App;
