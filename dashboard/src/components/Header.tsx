import React from 'react';
import { ShieldAlert, Server, Activity, FileText, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'investigation' | 'kubernetes' | 'audit';
  setActiveTab: (tab: 'overview' | 'investigation' | 'kubernetes' | 'audit') => void;
  backendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, backendConnected }) => {
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
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono border border-gray-200">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">AI-powered incident investigation & safe remediation</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'overview'
                  ? 'bg-gray-100 text-gray-900'
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
                  ? 'bg-gray-100 text-gray-900'
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
                  ? 'bg-gray-100 text-gray-900'
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
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Audit Log</span>
            </button>
          </nav>

          {/* Right Status Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-gray-700">Production</span>
            </div>

            <div className={`hidden md:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded border ${
              backendConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{backendConnected ? 'MCP Server Active (port 8791)' : 'Demo Simulator Active'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
