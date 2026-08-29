import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig
} from '@kubernetes/client-node';

const kubeConfig = new KubeConfig();
kubeConfig.loadFromDefault();

const appsApi = kubeConfig.makeApiClient(AppsV1Api);
const coreApi = kubeConfig.makeApiClient(CoreV1Api);

export interface KubernetesDeploymentSummary {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  conditions: unknown[];
  containers: Array<{
    name: string;
    image: string;
    env?: unknown[];
    readinessProbe?: unknown;
  }>;
}

export async function getKubernetesDeployment(
  name: string,
  namespace = 'default'
): Promise<KubernetesDeploymentSummary> {
  const response = await appsApi.readNamespacedDeployment({
    name,
    namespace
  });

  const deployment = response;

  return {
    name: deployment.metadata?.name ?? name,
    namespace: deployment.metadata?.namespace ?? namespace,
    replicas: deployment.spec?.replicas ?? 0,
    readyReplicas: deployment.status?.readyReplicas ?? 0,
    availableReplicas: deployment.status?.availableReplicas ?? 0,
    updatedReplicas: deployment.status?.updatedReplicas ?? 0,
    conditions: deployment.status?.conditions ?? [],
    containers: (deployment.spec?.template?.spec?.containers ?? []).map(
      (container) => ({
        name: container.name,
        image: container.image ?? '',
        env: container.env,
        readinessProbe: container.readinessProbe
      })
    )
  };
}

export async function getKubernetesPods(
  namespace = 'default',
  labelSelector?: string
) {
  const response = await coreApi.listNamespacedPod({
    namespace,
    labelSelector
  });

  return response.items.map((pod) => ({
    name: pod.metadata?.name,
    namespace: pod.metadata?.namespace,
    phase: pod.status?.phase,
    podIP: pod.status?.podIP,
    nodeName: pod.spec?.nodeName,
    containers: pod.status?.containerStatuses?.map((container) => ({
      name: container.name,
      ready: container.ready,
      restartCount: container.restartCount,
      state: container.state
    })) ?? [],
    conditions: pod.status?.conditions ?? []
  }));
}

export async function getKubernetesPodLogs(
  podName: string,
  namespace = 'default',
  container?: string
): Promise<string> {
  const response = await coreApi.readNamespacedPodLog({
    name: podName,
    namespace,
    container
  });

  return String((response as any).body ?? response);
}

export async function getKubernetesEvents(
  namespace = 'default'
) {
  const response = await coreApi.listNamespacedEvent({
    namespace
  });

  return response.items
    .sort((a, b) => {
      const aTime =
        a.lastTimestamp?.getTime?.() ??
        a.eventTime?.getTime?.() ??
        0;

      const bTime =
        b.lastTimestamp?.getTime?.() ??
        b.eventTime?.getTime?.() ??
        0;

      return bTime - aTime;
    })
    .map((event) => ({
      type: event.type,
      reason: event.reason,
      message: event.message,
      involvedObject: {
        kind: event.involvedObject?.kind,
        name: event.involvedObject?.name
      },
      firstTimestamp: event.firstTimestamp,
      lastTimestamp: event.lastTimestamp,
      count: event.count
    }));
}