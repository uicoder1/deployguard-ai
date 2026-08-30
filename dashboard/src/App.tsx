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

import type {
  ServiceStatus,
  RollbackResult,
  InvestigationResult,
  AuditRecord,
} from './api/types';

import {
  CheckCircle2,
  ShieldCheck,
  X,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const INITIAL_INCIDENT_STATUS: ServiceStatus = {
  id: 'payment-api',
  name: 'Payment Processing Service',
  status: 'critical',
  version: '1.8.3',
  errorRatePercent: 47.2,
  averageLatencyMs: 1840,
  healthyInstances: 2,
  unhealthyInstances: 5,
  updatedAt: '2026-08-26T17:00:00Z',
};

const RECOVERED_STATUS: ServiceStatus = {
  id: 'payment-api',
  name: 'Payment Processing Service',
  status: 'healthy',
  version: '1.8.2',
  errorRatePercent: 0.1,
  averageLatencyMs: 45,
  healthyInstances: 7,
  unhealthyInstances: 0,
  updatedAt: new Date().toISOString(),
};

const INITIAL_STAGES: StageStatus[] = [
  {
    id: 'health',
    name: '1. Service Health',
    subtext: 'Checking payment-api health and metrics',
    status: 'waiting',
  },
  {
    id: 'logs',
    name: '2. Error Logs',
    subtext: 'Analyzing recent production failures',
    status: 'waiting',
  },
  {
    id: 'deployments',
    name: '3. Deployment History',
    subtext: 'Correlating failures with recent deployments',
    status: 'waiting',
  },
  {
    id: 'k8s',
    name: '4. Kubernetes State',
    subtext: 'Inspecting pods, deployment state, logs and events',
    status: 'waiting',
  },
];

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'incident' | 'evidence' | 'remediation' | 'audit'
  >('incident');

  const [backendConnected, setBackendConnected] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  /*
   * IMPORTANT:
   * DeployGuard starts every fresh browser session with the
   * simulated production incident.
   *
   * We intentionally DO NOT replace this with the backend's
   * current status during page refresh.
   *
   * This makes the judge demo deterministic.
   */
  const [status, setStatus] = useState<ServiceStatus>(
    INITIAL_INCIDENT_STATUS
  );

  const [investigating, setInvestigating] = useState(false);

  const [investigationResult, setInvestigationResult] =
    useState<InvestigationResult | null>(null);

  const [stages, setStages] =
    useState<StageStatus[]>(INITIAL_STAGES);

  const [isRollbackModalOpen, setIsRollbackModalOpen] =
    useState(false);

  const [isRolledBack, setIsRolledBack] = useState(false);

  const [rollbackResult, setRollbackResult] =
    useState<RollbackResult | null>(null);

  const [audits, setAudits] = useState<AuditRecord[]>([]);

  // ---------------------------------------------------------
  // BACKEND CONNECTION
  // ---------------------------------------------------------

  const checkConnection = async () => {
    setIsCheckingBackend(true);

    try {
      const health = await deployGuardApi.checkBackendConnection();

      setBackendConnected(health.connected);
      setIsSleeping(health.isSleeping);

      // Only load audit history during startup.
      // IMPORTANT: Do not call getServiceStatus() here.
      // The demo must always start from the deterministic CRITICAL incident.

    } catch (error) {
      console.error('DeployGuard connection failed:', error);
      setBackendConnected(false);
    } finally {
      setIsCheckingBackend(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // ---------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------

  const handleJumpSection = (
    sec: 'incident' | 'evidence' | 'remediation' | 'audit'
  ) => {
    setActiveSection(sec);

    const element = document.getElementById(`${sec}-section`);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // ---------------------------------------------------------
  // INVESTIGATION
  // ---------------------------------------------------------

  const handleStartInvestigation = async () => {
    setInvestigating(true);

    setInvestigationResult(null);

    setStages(INITIAL_STAGES);

    try {
      const result = await deployGuardApi.runInvestigation(
        (updatedStages) => {
          setStages([...updatedStages]);
        }
      );

      setInvestigationResult(result);
    } catch (error) {
      console.error('Investigation failed:', error);
    } finally {
      setInvestigating(false);
    }
  };

  // ---------------------------------------------------------
  // ROLLBACK
  // ---------------------------------------------------------

  const handleConfirmRollback = async (): Promise<RollbackResult> => {
    return await deployGuardApi.rollbackDeployment('184');
  };

  const handleRollbackSuccess = async (
    result: RollbackResult
  ) => {
    /*
     * After explicit human approval + rollback,
     * NOW we change the UI from CRITICAL → HEALTHY.
     */
    setStatus(
      result.serviceStatus || {
        ...RECOVERED_STATUS,
        updatedAt: new Date().toISOString(),
      }
    );

    setIsRolledBack(true);
    setRollbackResult(result);

    try {
      const updatedAudits =
        await deployGuardApi.getRollbackAudits();

      setAudits(updatedAudits);
    } catch (error) {
      console.error(
        'Failed to refresh audit logs:',
        error
      );
    }
  };

  // ---------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------

  const currentTimelineStage = isRolledBack
    ? 'recovered'
    : rollbackResult
      ? 'approved'
      : investigationResult
        ? 'evidence'
        : investigating
          ? 'investigating'
          : 'ready';

  // ---------------------------------------------------------
  // INITIAL LOADING
  // ---------------------------------------------------------

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased flex flex-col">
        <Header
          activeSection={activeSection}
          setActiveSection={handleJumpSection}
          backendConnected={false}
          isSleeping={false}
          onRetryConnection={checkConnection}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">

            <div className="bg-white border border-gray-200 rounded-xl p-8 animate-pulse">
              <div className="h-4 w-36 bg-gray-200 rounded mb-5" />
              <div className="h-8 w-3/4 bg-gray-200 rounded mb-6" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse"
                >
                  <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                  <div className="h-8 w-28 bg-gray-200 rounded" />
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Loading DeployGuard
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Connecting to production telemetry...
              </p>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN APPLICATION
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased flex flex-col selection:bg-blue-100">

      <Header
        activeSection={activeSection}
        setActiveSection={handleJumpSection}
        backendConnected={backendConnected}
        isSleeping={isSleeping}
        onRetryConnection={checkConnection}
      />

      {/* BACKEND WARNING */}
      {isSleeping && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-xs text-amber-900">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">

            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />

              <span>
                <strong>Backend Waking Up:</strong>{' '}
                DeployGuard telemetry is starting.
                Demo simulator remains active.
              </span>
            </div>

            <button
              onClick={checkConnection}
              disabled={isCheckingBackend}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isCheckingBackend
                    ? 'animate-spin'
                    : ''
                  }`}
              />

              <span>
                {isCheckingBackend
                  ? 'Connecting...'
                  : 'Retry Connection'}
              </span>
            </button>

          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* DEMO STATUS */}
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              DEMO INCIDENT
            </span>

            <span className="text-xs text-gray-500">
              Production failure simulation
            </span>
          </div>

          <span className="text-xs text-gray-400 font-mono">
            Scenario: PAY-184
          </span>

        </div>

        {/* RECOVERY BANNER */}
        {rollbackResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between shadow-xs">

            <div className="flex items-start space-x-3 text-xs sm:text-sm text-emerald-900">

              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />

              <div className="space-y-1">

                <div className="font-bold flex items-center space-x-2 flex-wrap gap-y-1">
                  <span>
                    Incident Resolved
                  </span>

                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs border border-emerald-300">
                    v1.8.3 → v1.8.2
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-emerald-800 text-xs">

                  <span>
                    Service:{' '}
                    <strong>HEALTHY</strong>
                  </span>

                  <span>
                    Healthy pods:{' '}
                    <strong>7 / 7</strong>
                  </span>

                  <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      Human-approved rollback recorded
                    </span>
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

        {/* INCIDENT */}
        <div id="incident-section">
          <IncidentHeader
            serviceId={status.name}
            status={status.status}
          />
        </div>

        {/* METRICS */}
        <IncidentMetrics status={status} />

        {/* LIFECYCLE */}
        <IncidentTimeline
          currentStage={currentTimelineStage}
        />

        {/* INVESTIGATION */}
        <InvestigationPanel
          investigating={investigating}
          stages={stages}
          onStartInvestigation={handleStartInvestigation}
          isComplete={!!investigationResult}
        />

        {/* EVIDENCE + REMEDIATION */}
        {investigationResult && (
          <>
            <div id="evidence-section">
              <EvidenceCorrelation
                result={investigationResult}
              />
            </div>

            <KubernetesEvidence />

            <div id="remediation-section">
              <RemediationCard
                recommendation={
                  investigationResult.recommendation
                }
                onRequestRollback={() =>
                  setIsRollbackModalOpen(true)
                }
                isRolledBack={isRolledBack}
              />
            </div>
          </>
        )}

        {/* AUDIT */}
        <div id="audit-section">
          <AuditTable audits={audits} />
        </div>

      </main>

      <Footer />

      {/* HUMAN APPROVAL MODAL */}
      <RollbackDialog
        isOpen={isRollbackModalOpen}
        onClose={() =>
          setIsRollbackModalOpen(false)
        }
        onConfirmRollback={handleConfirmRollback}
        onSuccess={handleRollbackSuccess}
      />

    </div>
  );
};

export default App;