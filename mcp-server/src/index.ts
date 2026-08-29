import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

import { simulator } from 'deployguard-simulator';

import {
  getKubernetesDeployment,
  getKubernetesPods,
  getKubernetesPodLogs,
  getKubernetesEvents
} from './kubernetes.js';


/**
 * Create the DeployGuard MCP server.
 *
 * DeployGuard currently exposes two kinds of tools:
 *
 * 1. Simulator tools
 *    - Safe, deterministic incident-response demonstration
 *
 * 2. Kubernetes tools
 *    - Read real resources from the local Kubernetes cluster
 *    - No production mutation is performed by these tools
 */
export function createServerInstance(): McpServer {
  const server = new McpServer({
    name: 'deployguard-production',
    version: '1.0.0'
  });


  // ============================================================
  // SIMULATOR TOOLS
  // ============================================================

  // 1. get_service_status
  server.tool(
    'get_service_status',
    'Get the current health and operational metrics for a service.',
    {
      serviceId: z
        .string()
        .describe('The ID of the target service, e.g. payment-api')
    },
    async ({ serviceId }) => {
      const status = simulator.getServiceStatus(serviceId);

      if (!status) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error: Service with ID '${serviceId}' was not found.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2)
          }
        ]
      };
    }
  );


  // 2. get_service_logs
  server.tool(
    'get_service_logs',
    'Get recent log entries for a service with optional log level and limit filters.',
    {
      serviceId: z
        .string()
        .describe('The ID of the target service, e.g. payment-api'),

      level: z
        .enum(['INFO', 'WARN', 'ERROR', 'FATAL'])
        .optional()
        .describe('Filter logs by severity level'),

      limit: z
        .number()
        .optional()
        .default(20)
        .describe('Maximum number of log entries to retrieve (default: 20)')
    },
    async ({ serviceId, level, limit }) => {
      const logs = simulator.getLogs({
        serviceId,
        level,
        limit: limit ?? 20
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(logs, null, 2)
          }
        ]
      };
    }
  );


  // 3. get_recent_deployments
  server.tool(
    'get_recent_deployments',
    'Get recent deployment records, optionally filtered by service ID.',
    {
      serviceId: z
        .string()
        .optional()
        .describe('Optional service ID to filter deployment history')
    },
    async ({ serviceId }) => {
      const deployments = simulator.getRecentDeployments(serviceId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(deployments, null, 2)
          }
        ]
      };
    }
  );


  // 4. get_deployment_details
  server.tool(
    'get_deployment_details',
    'Get detailed metadata and status for a specific deployment ID.',
    {
      deploymentId: z
        .string()
        .describe('The deployment ID to query, e.g. 184')
    },
    async ({ deploymentId }) => {
      const deployment = simulator.getDeploymentDetails(deploymentId);

      if (!deployment) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error: Deployment with ID '${deploymentId}' was not found.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(deployment, null, 2)
          }
        ]
      };
    }
  );


  // 5. rollback_deployment
  //
  // IMPORTANT:
  // This is still the safe simulator rollback.
  // We are NOT allowing an AI agent to directly mutate Kubernetes yet.
  server.tool(
    'rollback_deployment',
    'Safely simulate rolling back a service deployment to the previous successful version. This only modifies the local DeployGuard production simulator.',
    {
      deploymentId: z
        .string()
        .describe('The deployment ID to roll back, e.g. 184')
    },
    async ({ deploymentId }) => {
      const result = simulator.rollbackDeployment(deploymentId);

      if (!result.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                result.error ||
                `Error rolling back deployment '${deploymentId}'.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: `Deployment #${result.deploymentId} safely rolled back.`,
                deploymentId: result.deploymentId,
                service: result.serviceId,
                previousVersion: result.previousVersion,
                restoredVersion: result.restoredVersion,
                simulated: result.simulated,
                resultingServiceStatus: result.serviceStatus,
                auditRecord: result.auditRecord
              },
              null,
              2
            )
          }
        ]
      };
    }
  );


  // ============================================================
  // REAL KUBERNETES READ-ONLY TOOLS
  // ============================================================

  // 6. get_k8s_deployment
  server.tool(
    'get_k8s_deployment',
    'Inspect a real Kubernetes deployment including replica health, container images, environment variables, readiness probes, and deployment conditions.',
    {
      name: z
        .string()
        .describe('Kubernetes deployment name, e.g. payment-api'),

      namespace: z
        .string()
        .optional()
        .default('default')
        .describe('Kubernetes namespace')
    },
    async ({ name, namespace }) => {
      try {
        const deployment = await getKubernetesDeployment(
          name,
          namespace ?? 'default'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(deployment, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                `Kubernetes deployment lookup failed for ` +
                `'${name}': ${String(error)}`
            }
          ]
        };
      }
    }
  );


  // 7. get_k8s_pods
  server.tool(
    'get_k8s_pods',
    'Inspect real Kubernetes pods including readiness, restart counts, phases, node placement, container states, and health conditions.',
    {
      namespace: z
        .string()
        .optional()
        .default('default')
        .describe('Kubernetes namespace'),

      labelSelector: z
        .string()
        .optional()
        .describe(
          'Optional Kubernetes label selector, e.g. app=payment-api'
        )
    },
    async ({ namespace, labelSelector }) => {
      try {
        const pods = await getKubernetesPods(
          namespace ?? 'default',
          labelSelector
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pods, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                `Kubernetes pod lookup failed: ${String(error)}`
            }
          ]
        };
      }
    }
  );


  // 8. get_k8s_logs
  server.tool(
    'get_k8s_logs',
    'Retrieve logs from a real Kubernetes pod for incident investigation.',
    {
      podName: z
        .string()
        .describe('Kubernetes pod name'),

      namespace: z
        .string()
        .optional()
        .default('default')
        .describe('Kubernetes namespace'),

      container: z
        .string()
        .optional()
        .describe('Optional container name')
    },
    async ({ podName, namespace, container }) => {
      try {
        const logs = await getKubernetesPodLogs(
          podName,
          namespace ?? 'default',
          container
        );

        return {
          content: [
            {
              type: 'text',
              text: logs
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                `Kubernetes pod log retrieval failed for ` +
                `'${podName}': ${String(error)}`
            }
          ]
        };
      }
    }
  );


  // 9. get_k8s_events
  server.tool(
    'get_k8s_events',
    'Inspect recent Kubernetes events to identify scheduling, image, readiness, deployment, and pod failures.',
    {
      namespace: z
        .string()
        .optional()
        .default('default')
        .describe('Kubernetes namespace')
    },
    async ({ namespace }) => {
      try {
        const events = await getKubernetesEvents(
          namespace ?? 'default'
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(events, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                `Kubernetes event lookup failed: ${String(error)}`
            }
          ]
        };
      }
    }
  );


  return server;
}


// ============================================================
// STREAMABLE HTTP TRANSPORT
// ============================================================

export const transports = new Map<
  string,
  StreamableHTTPServerTransport
>();


export const httpServer = createServer(
  async (
    req: IncomingMessage,
    res: ServerResponse
  ) => {
    const host =
      req.headers.host || '127.0.0.1:8791';

    const url = new URL(
      req.url || '/',
      `http://${host}`
    );


    // ----------------------------------------------------------
    // CORS headers for browser dashboard
    // ----------------------------------------------------------

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, DELETE, PUT'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Accept, mcp-session-id, Mcp-Session-Id'
    );

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // ----------------------------------------------------------
    // API Adapter routes for frontend dashboard
    // ----------------------------------------------------------

    if (url.pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');

      if (url.pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', server: 'deployguard-production' }));
        return;
      }

      if (url.pathname === '/api/audits' && req.method === 'GET') {
        const audits = simulator.getRollbackAudits();
        res.writeHead(200);
        res.end(JSON.stringify(audits));
        return;
      }

      if (url.pathname === '/api/investigate' && req.method === 'POST') {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            rootCause:
              'Deployment #184 (v1.8.3) introduced database connection pool exhaustion.',
            confidence: 'CONFIRMED',
            evidence: [
              'Connection pool reached 48/50 active connections',
              'Database connection timeouts followed',
              'Pool exhaustion caused payment failures',
              'Multiple pods failed health checks',
              'Incident started shortly after deployment #184'
            ],
            recommendation: {
              action: 'Rollback deployment #184',
              serviceId: 'payment-api',
              deploymentId: '184',
              fromVersion: 'v1.8.3',
              toVersion: 'v1.8.2',
              risk: 'HIGH',
              reason:
                'The v1.8.3 connection pool optimization correlates with the production failure.'
            }
          })
        );
        return;
      }

      if (url.pathname === '/api/rollback' && req.method === 'POST') {
        let bodyText = '';
        try {
          bodyText = await new Promise<string>((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => resolve(data));
            req.on('error', (err) => reject(err));
          });
        } catch {}

        let deploymentId = '184';
        if (bodyText) {
          try {
            const parsed = JSON.parse(bodyText);
            if (parsed.deploymentId) deploymentId = parsed.deploymentId;
          } catch {}
        }

        const result = simulator.rollbackDeployment(deploymentId);
        if (!result.success) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: result.error }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // GET /api/services/:serviceId/logs
      const serviceLogsMatch = url.pathname.match(/^\/api\/services\/([^/]+)\/logs$/);
      if (serviceLogsMatch && req.method === 'GET') {
        const serviceId = serviceLogsMatch[1];
        const level = url.searchParams.get('level') as any;
        const limitStr = url.searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 20;

        const logs = simulator.getLogs({ serviceId, level, limit });
        res.writeHead(200);
        res.end(JSON.stringify(logs));
        return;
      }

      // GET /api/services/:serviceId
      const serviceMatch = url.pathname.match(/^\/api\/services\/([^/]+)$/);
      if (serviceMatch && req.method === 'GET') {
        const serviceId = serviceMatch[1];
        const status = simulator.getServiceStatus(serviceId);
        if (!status) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: `Service '${serviceId}' not found` }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(status));
        return;
      }

      // GET /api/deployments/details/:id or /api/deployments/:id_or_service
      const detailsMatch = url.pathname.match(/^\/api\/deployments\/details\/([^/]+)$/);
      if (detailsMatch && req.method === 'GET') {
        const id = detailsMatch[1];
        const dep = simulator.getDeploymentDetails(id);
        if (!dep) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: `Deployment '${id}' not found` }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(dep));
        return;
      }

      const depMatch = url.pathname.match(/^\/api\/deployments\/([^/]+)$/);
      if (depMatch && req.method === 'GET') {
        const param = depMatch[1];
        // If param is a numeric deployment ID like '184' or '183'
        const depById = simulator.getDeploymentDetails(param);
        if (depById) {
          res.writeHead(200);
          res.end(JSON.stringify(depById));
          return;
        }
        // Otherwise treat as serviceId (e.g. 'payment-api')
        const deps = simulator.getRecentDeployments(param);
        res.writeHead(200);
        res.end(JSON.stringify(deps));
        return;
      }

      // Kubernetes REST endpoints
      const k8sDepMatch = url.pathname.match(/^\/api\/kubernetes\/deployment\/([^/]+)$/);
      if (k8sDepMatch && req.method === 'GET') {
        const name = k8sDepMatch[1];
        const namespace = url.searchParams.get('namespace') || 'default';
        try {
          const dep = await getKubernetesDeployment(name, namespace);
          res.writeHead(200);
          res.end(JSON.stringify(dep));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
        return;
      }

      if (url.pathname === '/api/kubernetes/pods' && req.method === 'GET') {
        const namespace = url.searchParams.get('namespace') || 'default';
        const labelSelector = url.searchParams.get('labelSelector') || undefined;
        try {
          const pods = await getKubernetesPods(namespace, labelSelector);
          res.writeHead(200);
          res.end(JSON.stringify(pods));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
        return;
      }

      if (url.pathname === '/api/kubernetes/logs' && req.method === 'GET') {
        const podName = url.searchParams.get('podName') || '';
        const namespace = url.searchParams.get('namespace') || 'default';
        const container = url.searchParams.get('container') || undefined;
        try {
          const logs = await getKubernetesPodLogs(podName, namespace, container);
          res.writeHead(200);
          res.end(JSON.stringify({ logs }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
        return;
      }

      if (url.pathname === '/api/kubernetes/events' && req.method === 'GET') {
        const namespace = url.searchParams.get('namespace') || 'default';
        try {
          const events = await getKubernetesEvents(namespace);
          res.writeHead(200);
          res.end(JSON.stringify(events));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API route not found' }));
      return;
    }

    // ----------------------------------------------------------
    // Health endpoint
    // ----------------------------------------------------------

    if (
      url.pathname === '/health' &&
      req.method === 'GET'
    ) {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });

      res.end(
        JSON.stringify({
          status: 'ok',
          server: 'deployguard-production'
        })
      );

      return;
    }


    // ----------------------------------------------------------
    // MCP endpoint
    // ----------------------------------------------------------

    if (url.pathname === '/mcp') {
      const sessionId =
        (req.headers['mcp-session-id'] ||
          req.headers['Mcp-Session-Id']) as
          | string
          | undefined;


      // Existing MCP session
      if (sessionId) {
        const transport =
          transports.get(sessionId);

        if (!transport) {
          res.writeHead(404, {
            'Content-Type': 'application/json'
          });

          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32001,
                message: 'Session not found'
              },
              id: null
            })
          );

          return;
        }


        try {
          await transport.handleRequest(
            req,
            res
          );
        } catch (err) {
          console.error(
            'MCP handleRequest error:',
            err
          );

          if (!res.headersSent) {
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });

            res.end(
              JSON.stringify({
                error: String(err)
              })
            );
          }
        }

        return;
      }


      // New MCP session
      if (req.method === 'POST') {
        try {
          const sessionServer =
            createServerInstance();

          const transport =
            new StreamableHTTPServerTransport({
              sessionIdGenerator: () =>
                randomUUID(),

              onsessioninitialized: (id) => {
                transports.set(
                  id,
                  transport
                );
              },

              onsessionclosed: (id) => {
                transports.delete(id);

                sessionServer
                  .close()
                  .catch(() => {});
              }
            });


          await sessionServer.connect(
            transport
          );

          await transport.handleRequest(
            req,
            res
          );
        } catch (err) {
          console.error(
            'MCP initialize handleRequest error:',
            err
          );

          if (!res.headersSent) {
            res.writeHead(500, {
              'Content-Type': 'application/json'
            });

            res.end(
              JSON.stringify({
                error: String(err)
              })
            );
          }
        }

        return;
      }


      // Invalid MCP request
      res.writeHead(400, {
        'Content-Type': 'application/json'
      });

      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message:
              'Bad Request: Non-initialize request missing mcp-session-id header'
          },
          id: null
        })
      );

      return;
    }


    // ----------------------------------------------------------
    // Unknown endpoint
    // ----------------------------------------------------------

    res.writeHead(404, {
      'Content-Type': 'application/json'
    });

    res.end(
      JSON.stringify({
        error: 'Not Found'
      })
    );
  }
);


// ============================================================
// SERVER LIFECYCLE
// ============================================================

export async function startServer(
  port = 8791,
  host = '0.0.0.0'
): Promise<void> {
  return new Promise((resolve) => {
    httpServer.listen(
      port,
      host,
      () => {
        console.error(
          `DeployGuard MCP Streamable HTTP Server running on http://${host}:${port}/mcp`
        );

        resolve();
      }
    );
  });
}


export async function stopServer(): Promise<void> {
  for (const transport of transports.values()) {
    try {
      await transport.close();
    } catch {}
  }

  transports.clear();


  if (httpServer.listening) {
    if (
      typeof httpServer.closeAllConnections ===
      'function'
    ) {
      httpServer.closeAllConnections();
    }

    await new Promise<void>((resolve) => {
      httpServer.close(() =>
        resolve()
      );
    });
  }
}


// ============================================================
// MAIN ENTRY POINT
// ============================================================

function isExecutedAsMain(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  try {
    const currentFilePath =
      fileURLToPath(import.meta.url);

    const argvPath =
      process.argv[1];

    return argvPath === argvPath &&
      argvPath === currentFilePath;
  } catch {
    return false;
  }
}


if (isExecutedAsMain()) {
  startServer().catch((err) => {
    console.error(
      'Fatal error starting DeployGuard MCP Server:',
      err
    );

    process.exit(1);
  });
}