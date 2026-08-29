import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { Investigation } from './pages/Investigation';
import { KubernetesPage } from './pages/Kubernetes';
import { AuditLogPage } from './pages/AuditLog';
import { RollbackDialog } from './components/RollbackDialog';
import { deployGuardApi } from './api/deployguard';
import type { ServiceStatus, RollbackResult } from './api/types';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'investigation' | 'kubernetes' | 'audit'>('overview');
  const [backendConnected, setBackendConnected] = useState(false);
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

  const loadStatus = async () => {
    const health = await deployGuardApi.getHealth();
    setBackendConnected(health.server === 'deployguard-production');

    const serviceStatus = await deployGuardApi.getServiceStatus('payment-api');
    setStatus(serviceStatus);
    if (serviceStatus.status === 'healthy' || serviceStatus.version === '1.8.2') {
      setIsRolledBack(true);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleInvestigate = async () => {
    return await deployGuardApi.runInvestigation();
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-blue-100 flex flex-col">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConnected={backendConnected}
      />

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
                    <span>Audit record created.</span>
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
          <div>
            <strong className="text-gray-700">DeployGuard</strong> — Production Incident Investigation & Safe Remediation
          </div>
          <div className="font-mono text-gray-400">
            DEMO_MODE=true · Streamable HTTP MCP server port 8791
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
