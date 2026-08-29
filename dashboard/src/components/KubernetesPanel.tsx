import React from 'react';
import { Server, Terminal, AlertCircle, RefreshCw } from 'lucide-react';
import type { KubernetesDeployment, KubernetesPod, KubernetesEvent } from '../api/types';

interface KubernetesPanelProps {
  deployment: KubernetesDeployment | null;
  pods: KubernetesPod[] | null;
  logs: string | null;
  events: KubernetesEvent[] | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const KubernetesPanel: React.FC<KubernetesPanelProps> = ({
  deployment,
  pods,
  logs,
  events,
  onRefresh,
  isLoading
}) => {
  const isK8sAvailable = deployment !== null || pods !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kubernetes Production View</h2>
          <p className="text-sm text-gray-500">Live cluster workload telemetry and container diagnostic events</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {!isK8sAvailable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3 text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">Kubernetes connection unavailable</span>
            <p className="text-xs text-amber-700 mt-0.5">
              Could not reach local Kubernetes cluster API. Showing simulated cluster workload state.
            </p>
          </div>
        </div>
      )}

      {/* Deployment Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Deployment Workload
            </h3>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
            {deployment?.status || 'Running'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500 block">Deployment Name</span>
            <span className="font-semibold text-gray-900 mt-0.5 block">{deployment?.name || 'payment-api'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Container Image</span>
            <span className="font-mono text-gray-800 mt-0.5 block truncate">
              {deployment?.containers[0]?.image || 'nginx:1.27'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Replicas</span>
            <span className="font-medium text-gray-900 mt-0.5 block">
              {deployment ? `${deployment.replicas.ready} / ${deployment.replicas.desired}` : '1 / 1'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Namespace</span>
            <span className="font-mono text-gray-700 mt-0.5 block">{deployment?.namespace || 'default'}</span>
          </div>
        </div>
      </div>

      {/* Pods Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Active Pod Instances
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Pod Name</th>
                <th className="px-4 py-2.5">Ready</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Restarts</th>
                <th className="px-4 py-2.5">Node</th>
                <th className="px-4 py-2.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {(pods && pods.length > 0 ? pods : [
                {
                  name: 'payment-api-79f9d8459-x8j2p',
                  namespace: 'default',
                  phase: 'Running',
                  ready: '1/1',
                  restarts: 0,
                  node: 'kind-control-plane',
                  ip: '10.244.0.5'
                }
              ]).map((pod, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{pod.name}</td>
                  <td className="px-4 py-3 text-gray-700">{pod.ready}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                      pod.phase === 'Running' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {pod.phase}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{pod.restarts}</td>
                  <td className="px-4 py-3 text-gray-600">{pod.node}</td>
                  <td className="px-4 py-3 text-gray-500">{pod.ip || '10.244.0.5'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Kubernetes Cluster Events
          </h3>
        </div>
        <div className="divide-y divide-gray-100 text-xs">
          {(events && events.length > 0 ? events : [
            {
              type: 'Warning',
              reason: 'Unhealthy',
              object: 'pod/payment-api-79f9d8459-x8j2p',
              message: 'Liveness probe failed: HTTP probe failed with statuscode: 500',
              timestamp: '2026-08-26T17:04:30Z'
            },
            {
              type: 'Normal',
              reason: 'Started',
              object: 'pod/payment-api-79f9d8459-x8j2p',
              message: 'Started container payment-api',
              timestamp: '2026-08-26T17:00:05Z'
            }
          ]).map((evt, idx) => (
            <div key={idx} className="p-3.5 flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-2.5">
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold shrink-0 mt-0.5 ${
                  evt.type === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {evt.reason}
                </span>
                <div>
                  <span className="font-mono text-gray-500 mr-2">{evt.object}</span>
                  <span className="text-gray-900">{evt.message}</span>
                </div>
              </div>
              <span className="text-gray-400 font-mono text-[11px] shrink-0">{evt.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logs Terminal Section */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden font-mono text-xs">
        <div className="px-4 py-2.5 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-gray-400">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-200 text-xs font-semibold">Pod Log Stream — payment-api</span>
          </div>
          <span className="text-[11px] text-gray-500">kubectl logs -n default payment-api</span>
        </div>
        <div className="p-4 text-gray-300 space-y-1.5 overflow-x-auto max-h-64 whitespace-pre-wrap">
          {logs || 'No logs retrieved from cluster.'}
        </div>
      </div>
    </div>
  );
};
