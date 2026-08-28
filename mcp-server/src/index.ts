import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { simulator } from 'deployguard-simulator';

export function createServerInstance(): McpServer {
  const server = new McpServer({
    name: 'deployguard-production',
    version: '1.0.0'
  });

  // 1. get_service_status
  server.tool(
    'get_service_status',
    'Get the current health and operational metrics for a service.',
    {
      serviceId: z.string().describe('The ID of the target service, e.g. payment-api')
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
      serviceId: z.string().describe('The ID of the target service, e.g. payment-api'),
      level: z.enum(['INFO', 'WARN', 'ERROR', 'FATAL']).optional().describe('Filter logs by severity level'),
      limit: z.number().optional().default(20).describe('Maximum number of log entries to retrieve (default: 20)')
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
      serviceId: z.string().optional().describe('Optional service ID to filter deployment history')
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
      deploymentId: z.string().describe('The deployment ID to query, e.g. 184')
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
  server.tool(
    'rollback_deployment',
    'Safely simulate rolling back a service deployment to the previous successful version. This only modifies the local DeployGuard production simulator.',
    {
      deploymentId: z.string().describe('The deployment ID to roll back, e.g. 184')
    },
    async ({ deploymentId }) => {
      const result = simulator.rollbackDeployment(deploymentId);
      if (!result.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: result.error || `Error rolling back deployment '${deploymentId}'.`
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

  return server;
}

export const transports = new Map<string, StreamableHTTPServerTransport>();

export const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const host = req.headers.host || '127.0.0.1:8791';
  const url = new URL(req.url || '/', `http://${host}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'deployguard-production' }));
    return;
  }

  if (url.pathname === '/mcp') {
    const sessionId = (req.headers['mcp-session-id'] || req.headers['Mcp-Session-Id']) as string | undefined;

    if (sessionId) {
      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
        return;
      }
      try {
        await transport.handleRequest(req, res);
      } catch (err) {
        console.error('MCP handleRequest error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(err) }));
        }
      }
      return;
    }

    if (req.method === 'POST') {
      try {
        const sessionServer = createServerInstance();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, transport);
          },
          onsessionclosed: (id) => {
            transports.delete(id);
            sessionServer.close().catch(() => {});
          }
        });

        await sessionServer.connect(transport);
        await transport.handleRequest(req, res);
      } catch (err) {
        console.error('MCP initialize handleRequest error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(err) }));
        }
      }
      return;
    }

    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32600, message: 'Bad Request: Non-initialize request missing mcp-session-id header' }, id: null }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

export async function startServer(port = 8791, host = '0.0.0.0'): Promise<void> {
  return new Promise((resolve) => {
    httpServer.listen(port, host, () => {
      console.error(`DeployGuard MCP Streamable HTTP Server running on http://${host}:${port}/mcp`);
      resolve();
    });
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
    if (typeof httpServer.closeAllConnections === 'function') {
      httpServer.closeAllConnections();
    }
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  }
}

function isExecutedAsMain(): boolean {
  if (!process.argv[1]) return false;
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const argvPath = process.argv[1];
    return argvPath === currentFilePath;
  } catch {
    return false;
  }
}

if (isExecutedAsMain()) {
  startServer().catch((err) => {
    console.error('Fatal error starting DeployGuard MCP Server:', err);
    process.exit(1);
  });
}
