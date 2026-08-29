import React from 'react';
import { ShieldAlert, Server, Activity, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'investigation' | 'kubernetes' | 'audit';
  setActiveTab: (tab: 'overview' | 'investigation' | 'kubernetes' | 'audit') => void;
  backendConnected: boolean;
  isSleeping: boolean;
  onRetryConnection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  backendConnected,
  isSleeping,
  onRetryConnection
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
              DG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 tracking-tight text-lg">DeployGuard</span>
                <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono border border-amber-200 font-semibold">
                  DEMO_MODE=true
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">AI-powered incident investigation &amp; safe remediation</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'overview'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-gray-500" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('investigation')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'investigation'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-4 h-4 text-gray-500" />
              <span>Investigation</span>
            </button>

            <button
              onClick={() => setActiveTab('kubernetes')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'kubernetes'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Server className="w-4 h-4 text-gray-500" />
              <span>Kubernetes</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'audit'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Audit Log</span>
            </button>
          </nav>

          {/* Right Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-gray-700">Production</span>
            </div>

            {isSleeping ? (
              <button
                onClick={onRetryConnection}
                className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                title="Render service is sleeping. Click to wake up."
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Backend Sleeping</span>
                <RefreshCw className="w-3 h-3 text-amber-600 ml-1" />
              </button>
            ) : (
              <div
                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded border ${
                  backendConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                <span className="font-medium">
                  {backendConnected ? 'MCP Backend Active' : 'Production Simulator Active'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
