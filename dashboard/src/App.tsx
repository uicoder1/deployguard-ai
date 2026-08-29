import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { Investigation } from './pages/Investigation';
import { KubernetesPage } from './pages/Kubernetes';
import { AuditLogPage } from './pages/AuditLog';
import { RollbackDialog } from './components/RollbackDialog';
import { deployGuardApi, MCP_SERVER_URL } from './api/deployguard';
import type { DetailedInvestigationResult, StageStatus } from './api/deployguard';
import type { ServiceStatus, RollbackResult } from './api/types';
import { CheckCircle2, ShieldCheck, X, AlertTriangle, RefreshCw, Server } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'investigation' | 'kubernetes' | 'audit'>('overview');
  const [backendConnected, setBackendConnected] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

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

  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isRolledBack, setIsRolledBack] = useState(false);
  const [successBanner, setSuccessBanner] = useState<RollbackResult | null>(null);

  const checkConnection = async () => {
    setIsCheckingBackend(true);
    const health = await deployGuardApi.checkBackendConnection();
    setBackendConnected(health.connected);
    setIsSleeping(health.isSleeping);

    const serviceStatus = await deployGuardApi.getServiceStatus('payment-api');
    setStatus(serviceStatus);
    if (serviceStatus.status === 'healthy' || serviceStatus.version === '1.8.2') {
      setIsRolledBack(true);
    }
    setIsCheckingBackend(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleInvestigate = async (
    onStageUpdate: (stages: StageStatus[]) => void
  ): Promise<DetailedInvestigationResult> => {
    const res = await deployGuardApi.runInvestigation(onStageUpdate);
    return res;
  };

  const handleConfirmRollback = async (): Promise<RollbackResult> => {
    const res = await deployGuardApi.rollbackDeployment('184');
    return res;
  };

  const handleRollbackSuccess = (result: RollbackResult) => {
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
    setSuccessBanner(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased flex flex-col selection:bg-blue-100">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConnected={backendConnected}
        isSleeping={isSleeping}
        onRetryConnection={checkConnection}
      />

      {/* Backend Sleeping / Cold-start Banner */}
      {isSleeping && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-xs sm:text-sm text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Backend Unavailable / Sleeping:</strong> Render free instance at <code className="font-mono">{MCP_SERVER_URL}</code> may take 30–50s to wake up. Using production simulator cache.
              </span>
            </div>
            <button
              onClick={checkConnection}
              disabled={isCheckingBackend}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin' : ''}`} />
              <span>{isCheckingBackend ? 'Waking backend...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner Notification after Rollback */}
        {successBanner && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start space-x-3 text-xs sm:text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex items-center space-x-2">
                  <span>Rollback Completed</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs border border-emerald-300">
                    payment-api v1.8.3 → v1.8.2
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-emerald-800 text-xs">
                  <span>Service status: <strong className="uppercase">HEALTHY</strong></span>
                  <span>Healthy instances: <strong>7 / 7</strong></span>
                  <span className="flex items-center space-x-1 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit record created ({successBanner.auditRecord?.timestamp ? new Date(successBanner.auditRecord.timestamp).toLocaleTimeString() : 'Recorded'}).</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-500 hover:text-emerald-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <Overview
            status={status}
            onInvestigate={handleInvestigate}
            onRequestRollback={() => setIsRollbackModalOpen(true)}
            isRolledBack={isRolledBack}
          />
        )}

        {activeTab === 'investigation' && (
          <Investigation
            onRequestRollback={() => setIsRollbackModalOpen(true)}
            isRolledBack={isRolledBack}
          />
        )}

        {activeTab === 'kubernetes' && <KubernetesPage />}

        {activeTab === 'audit' && <AuditLogPage />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-400" />
            <strong className="text-gray-700">DeployGuard</strong> — AI Incident Investigation &amp; Safe Remediation
          </div>
          <div className="font-mono text-gray-400">
            DEMO_MODE=true · {MCP_SERVER_URL}
          </div>
        </div>
      </footer>

      {/* Human Approval Rollback Dialog */}
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
