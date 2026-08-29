import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, ArrowRight } from 'lucide-react';
import type { RollbackResult } from '../api/types';

interface RollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRollback: () => Promise<RollbackResult>;
  onSuccess: (result: RollbackResult) => void;
}

export const RollbackDialog: React.FC<RollbackDialogProps> = ({
  isOpen,
  onClose,
  onConfirmRollback,
  onSuccess
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);

    const result = await onConfirmRollback();
    setSubmitting(false);

    if (result.success) {
      onSuccess(result);
      onClose();
    } else {
      setError(result.error || 'Rollback execution failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-gray-800" />
            <h3 className="text-base font-semibold text-gray-900">Approve Production Rollback</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-md p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            DeployGuard recommends reverting <span className="font-semibold text-gray-900">payment-api</span> from <span className="font-mono text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">v1.8.3</span> to <span className="font-mono text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">v1.8.2</span>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Target Service:</span>
              <span className="font-medium text-gray-900">payment-api</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Deployment ID:</span>
              <span className="font-mono text-gray-900">#184</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Version:</span>
              <span className="font-mono text-red-600 font-medium">v1.8.3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target Version:</span>
              <span className="font-mono text-emerald-600 font-medium">v1.8.2</span>
            </div>
          </div>

          <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>This action modifies the simulated production environment and logs an audit record.</span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <span>Approve Rollback</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
