import React, { useState, useEffect } from 'react';
import { Server, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { deployGuardApi } from '../api/deployguard';
import type { KubernetesDeployment, KubernetesPod, KubernetesEvent } from '../api/types';

export const KubernetesEvidence: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deployment, setDeployment] = useState<KubernetesDeployment | null>(null);
  const [pods, setPods] = useState<KubernetesPod[] | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [events, setEvents] = useState<KubernetesEvent[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && !loaded) {
      Promise.all([
        deployGuardApi.getKubernetesDeployment('payment-api', 'default'),
        deployGuardApi.getKubernetesPods('default'),
        deployGuardApi.getKubernetesPodLogs('payment-api-79f9d8459-x8j2p', 'default'),
        deployGuardApi.getKubernetesEvents('default')
      ]).then(([depRes, podRes, logRes, evtRes]) => {
        setDeployment(depRes);
        setPods(podRes);
        setLogs(logRes);
        setEvents(evtRes);
        setLoaded(true);
      });
    }
  }, [isOpen, loaded]);

  return (
    <div id="kubernetes-section" className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center space-x-2.5">
          <Server className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
            Infrastructure Evidence (Kubernetes Cluster Telemetry)
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{isOpen ? 'Hide technical details' : 'Inspect deployment, pods, logs & events'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-gray-200 space-y-6 text-xs">
          {/* Workload Replicas */}
          {deployment && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-gray-900 font-mono">Deployment: {deployment.name}</span>
              <div className="flex items-center space-x-4 font-mono text-gray-700">
                <span>Desired: {deployment.replicas.desired}</span>
                <span>Ready: {deployment.replicas.ready}</span>
                <span>Available: {deployment.replicas.available}</span>
              </div>
            </div>
          )}

          {/* Pods Table */}
          {pods && (
            <div>
              <h4 className="font-semibold text-gray-900 uppercase tracking-wider text-[11px] mb-2">
                Active Kubernetes Pods
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="w-full text-left font-mono">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="p-2">Pod Name</th>
                      <th className="p-2">Ready</th>
                      <th className="p-2">Restarts</th>
                      <th className="p-2">Node</th>
                      <th className="p-2">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pods.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 font-bold text-gray-900">{p.name}</td>
                        <td className="p-2">
                          <span className={p.ready === '1/1' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                            {p.ready}
                          </span>
                        </td>
                        <td className="p-2 text-gray-600">{p.restarts}</td>
                        <td className="p-2 text-gray-500">{p.node}</td>
                        <td className="p-2 text-gray-500">{p.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cluster Events */}
          {events && (
            <div>
              <h4 className="font-semibold text-gray-900 uppercase tracking-wider text-[11px] mb-2">
                Recent Cluster Events
              </h4>
              <div className="space-y-1.5 font-mono">
                {events.map((evt, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 border border-gray-100 rounded flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        evt.type === 'Warning' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {evt.type}
                      </span>
                      <span className="font-bold text-gray-800">{evt.reason}</span>
                      <span className="text-gray-600">{evt.message}</span>
                    </div>
                    <span className="text-gray-400 shrink-0">{evt.timestamp.slice(11, 19)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Container Log Terminal */}
          {logs && (
            <div className="bg-gray-950 text-gray-200 rounded-md overflow-hidden font-mono text-[11px]">
              <div className="px-3 py-2 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-gray-400">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>payment-api-79f9d8459-x8j2p pod logs</span>
                </div>
              </div>
              <pre className="p-3 text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
                {logs}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
