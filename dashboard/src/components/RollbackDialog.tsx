import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, X } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await onConfirmRollback();
      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setErrorMsg(result.error || 'Rollback failed to execute');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Approve production rollback?</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          DeployGuard recommends rolling back <strong className="text-gray-900">payment-api</strong> from <span className="font-mono text-red-600 font-semibold">v1.8.3</span> to <span className="font-mono text-emerald-600 font-semibold">v1.8.2</span>. This action affects the production environment.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Service:</span>
            <span className="font-semibold text-gray-900">payment-api</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Deployment ID:</span>
            <span className="font-mono font-semibold text-gray-900">#184</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Version Transition:</span>
            <div className="font-mono flex items-center space-x-1.5 font-semibold">
              <span className="text-red-600">v1.8.3</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className="text-emerald-600">v1.8.2</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Risk Assessment:</span>
            <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
              HIGH
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Executing Rollback...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Approve Rollback</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
