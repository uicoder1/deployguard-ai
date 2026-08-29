import React, { useEffect, useState } from 'react';
import { KubernetesPanel } from '../components/KubernetesPanel';
import { deployGuardApi } from '../api/deployguard';
import type { KubernetesDeployment, KubernetesPod, KubernetesEvent } from '../api/types';

export const KubernetesPage: React.FC = () => {
  const [deployment, setDeployment] = useState<KubernetesDeployment | null>(null);
  const [pods, setPods] = useState<KubernetesPod[] | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [events, setEvents] = useState<KubernetesEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKubernetesData = async () => {
    setIsLoading(true);
    try {
      const [depRes, podRes, logRes, evtRes] = await Promise.all([
        deployGuardApi.getKubernetesDeployment('payment-api', 'default'),
        deployGuardApi.getKubernetesPods('default'),
        deployGuardApi.getKubernetesPodLogs('payment-api-79f9d8459-x8j2p', 'default'),
        deployGuardApi.getKubernetesEvents('default')
      ]);

      setDeployment(depRes);
      setPods(podRes);
      setLogs(logRes);
      setEvents(evtRes);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchKubernetesData();
  }, []);

  return (
    <KubernetesPanel
      deployment={deployment}
      pods={pods}
      logs={logs}
      events={events}
      onRefresh={fetchKubernetesData}
      isLoading={isLoading}
    />
  );
};
