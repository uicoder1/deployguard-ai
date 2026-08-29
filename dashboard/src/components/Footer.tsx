import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <strong className="text-gray-700 font-semibold">DeployGuard</strong>
          <span>— Production incident investigation &amp; safe remediation</span>
        </div>
        <div className="font-mono text-gray-400">
          v1.0
        </div>
      </div>
    </footer>
  );
};
