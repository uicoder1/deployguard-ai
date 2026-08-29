import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeSection: 'incident' | 'evidence' | 'remediation' | 'audit';
  setActiveSection: (section: 'incident' | 'evidence' | 'remediation' | 'audit') => void;
  backendConnected: boolean;
  isSleeping: boolean;
  onRetryConnection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  setActiveSection,
  backendConnected,
  isSleeping,
  onRetryConnection
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
              DG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 tracking-tight text-base sm:text-lg">DeployGuard</span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block font-normal">
                AI-powered production incident response
              </p>
            </div>
          </div>

          {/* Minimal Navigation */}
          <nav className="flex space-x-1 sm:space-x-2">
            {(['incident', 'evidence', 'remediation', 'audit'] as const).map((section) => {
              const label = section.charAt(0).toUpperCase() + section.slice(1);
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Far Right: Production Indicator */}
          <div className="flex items-center space-x-3">
            {isSleeping ? (
              <button
                onClick={onRetryConnection}
                className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                title="Render backend sleeping. Click to wake."
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Backend Waking</span>
                <RefreshCw className="w-3 h-3 text-amber-600 ml-0.5" />
              </button>
            ) : (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs">
                <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="font-medium text-gray-700">Production</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
