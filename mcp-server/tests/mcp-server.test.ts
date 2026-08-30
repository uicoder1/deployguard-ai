import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startServer, stopServer, httpServer } from '../src/index.js';

describe('DeployGuard Production MCP Streamable HTTP Integration Tests', () => {
  let client: Client;
  let clientTransport: StreamableHTTPClientTransport;

  const PORT = 8791;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  /**
   * Safely extract text from an MCP tool response.
   * MCP content is a union type, so TypeScript cannot assume
   * that content[0] is always a text item.
   */
  function getText(res: any): string {
    const item = res.content?.find((content: any) => content.type === 'text');

    if (!item) {
      throw new Error('MCP response does not contain text content');
    }

    return item.text;
  }

  before(async () => {
    await startServer(PORT, '127.0.0.1');

    clientTransport = new StreamableHTTPClientTransport(
      new URL(`${BASE_URL}/mcp`)
    );

    client = new Client(
      {
        name: 'deployguard-test-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    await client.connect(clientTransport);
  });

  after(async () => {
    if (client) {
      try {
        await client.close();
      } catch { }
    }

    if (clientTransport) {
      try {
        await clientTransport.close();
      } catch { }
    }

    await stopServer();
  });

  // 1
  it('1. HTTP server starts on port 8791', () => {
    assert.ok(httpServer.listening, 'HTTP server must be listening');

    const address = httpServer.address();

    assert.ok(address && typeof address === 'object');
    assert.equal(address.port, PORT);
  });

  // 2
  it('2. GET /health returns 200 and correct status payload', async () => {
    const res = await fetch(`${BASE_URL}/health`);

    assert.equal(res.status, 200);

    const body = await res.json() as any;

    assert.equal(body.status, 'ok');
    assert.equal(body.server, 'deployguard-production');
  });

  // 3
  it('3. MCP endpoint /mcp is reachable', async () => {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: 'GET'
    });

    assert.notEqual(
      res.status,
      500,
      'Endpoint should respond cleanly without internal server error'
    );
  });

  // 4
  it('4. MCP client initialization succeeds', () => {
    assert.ok(
      client,
      'MCP Client connected over Streamable HTTP transport'
    );
  });

  // 5
  it('5. MCP tool listing contains exactly the nine tools', async () => {
    const toolsResult = await client.listTools();

    assert.ok(toolsResult.tools, 'Tools list should exist');

    assert.equal(toolsResult.tools.length, 9);

    const toolNames = toolsResult.tools
      .map(tool => tool.name)
      .sort();

    assert.deepEqual(toolNames, [
      'get_deployment_details',
      'get_k8s_deployment',
      'get_k8s_events',
      'get_k8s_logs',
      'get_k8s_pods',
      'get_recent_deployments',
      'get_service_logs',
      'get_service_status',
      'rollback_deployment'
    ]);
  });

  // 6
  it(
    '6. get_service_status("payment-api") returns critical status and 47.2% error rate',
    async () => {
      const res = await client.callTool({
        name: 'get_service_status',
        arguments: {
          serviceId: 'payment-api'
        }
      });

      assert.equal(res.isError, undefined);

      const status = JSON.parse(getText(res));

      assert.equal(status.id, 'payment-api');
      assert.equal(status.status, 'critical');
      assert.equal(status.errorRatePercent, 47.2);
      assert.equal(status.averageLatencyMs, 1840);
      assert.equal(status.healthyInstances, 2);
      assert.equal(status.unhealthyInstances, 5);
    }
  );

  // 7
  it(
    '7. get_service_logs("payment-api", "ERROR", 10) returns payment failure logs',
    async () => {
      const res = await client.callTool({
        name: 'get_service_logs',
        arguments: {
          serviceId: 'payment-api',
          level: 'ERROR',
          limit: 10
        }
      });

      assert.equal(res.isError, undefined);

      const logs = JSON.parse(getText(res));

      assert.ok(Array.isArray(logs));
      assert.ok(logs.length > 0);

      assert.ok(
        logs.every(
          (log: any) =>
            log.serviceId === 'payment-api' &&
            log.level === 'ERROR'
        )
      );

      assert.ok(
        logs.some(
          (log: any) =>
            log.message.includes('Payment processing failed')
        )
      );
    }
  );

  // 8
  it(
    '8. get_recent_deployments("payment-api") includes deployment #184',
    async () => {
      const res = await client.callTool({
        name: 'get_recent_deployments',
        arguments: {
          serviceId: 'payment-api'
        }
      });

      assert.equal(res.isError, undefined);

      const deployments = JSON.parse(getText(res));

      assert.ok(Array.isArray(deployments));

      assert.ok(
        deployments.some(
          (deployment: any) =>
            deployment.id === '184' &&
            deployment.version === '1.8.3'
        )
      );
    }
  );

  // 9
  it(
    '9. get_deployment_details("184") returns deployment #184',
    async () => {
      const res = await client.callTool({
        name: 'get_deployment_details',
        arguments: {
          deploymentId: '184'
        }
      });

      assert.equal(res.isError, undefined);

      const deployment = JSON.parse(getText(res));

      assert.equal(deployment.id, '184');
      assert.equal(deployment.serviceId, 'payment-api');
      assert.equal(deployment.version, '1.8.3');
      assert.equal(deployment.status, 'successful');
    }
  );

  // 10
  it(
    '10. Unknown service IDs produce a clear error',
    async () => {
      const res = await client.callTool({
        name: 'get_service_status',
        arguments: {
          serviceId: 'non-existent-service'
        }
      });

      assert.equal(res.isError, true);

      assert.ok(
        getText(res).includes('non-existent-service')
      );
    }
  );

  // 11
  it(
    '11. Unknown deployment IDs produce a clear error',
    async () => {
      const res = await client.callTool({
        name: 'get_deployment_details',
        arguments: {
          deploymentId: 'invalid-dep-id'
        }
      });

      assert.equal(res.isError, true);

      assert.ok(
        getText(res).includes('invalid-dep-id')
      );
    }
  );

  // 12
  it(
    '12. Supports multiple concurrent MCP sessions',
    async () => {
      const clientTransport2 =
        new StreamableHTTPClientTransport(
          new URL(`${BASE_URL}/mcp`)
        );

      const client2 = new Client(
        {
          name: 'deployguard-test-client-2',
          version: '1.0.0'
        },
        {
          capabilities: {}
        }
      );

      await client2.connect(clientTransport2);

      const toolsResult = await client2.listTools();

      assert.ok(toolsResult.tools);

      assert.equal(toolsResult.tools.length, 9);

      const toolNames = toolsResult.tools
        .map(tool => tool.name)
        .sort();

      assert.deepEqual(toolNames, [
        'get_deployment_details',
        'get_k8s_deployment',
        'get_k8s_events',
        'get_k8s_logs',
        'get_k8s_pods',
        'get_recent_deployments',
        'get_service_logs',
        'get_service_status',
        'rollback_deployment'
      ]);

      await client2.close();
      await clientTransport2.close();
    }
  );

  // 13
  it('13. Unknown session ID returns 404', async () => {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': 'non-existent-session-id'
      },

      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      })
    });

    assert.equal(res.status, 404);
  });

  // 14
  it(
    '14. Non-initialize request without session ID returns 400',
    async () => {
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },

        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list'
        })
      });

      assert.equal(res.status, 400);
    }
  );

  // 15
  it(
    '15. rollback_deployment tool works over Streamable HTTP transport',
    async () => {
      const res = await client.callTool({
        name: 'rollback_deployment',
        arguments: {
          deploymentId: '184'
        }
      });

      assert.equal(res.isError, undefined);

      const result = JSON.parse(getText(res));

      assert.equal(result.deploymentId, '184');
      assert.equal(result.service, 'payment-api');
      assert.equal(result.previousVersion, '1.8.3');
      assert.equal(result.restoredVersion, '1.8.2');
      assert.equal(result.simulated, true);

      assert.equal(
        result.resultingServiceStatus.status,
        'healthy'
      );

      assert.ok(result.auditRecord);

      assert.equal(
        result.auditRecord.deploymentId,
        '184'
      );

      assert.equal(
        result.auditRecord.service,
        'payment-api'
      );

      assert.equal(
        result.auditRecord.fromVersion,
        '1.8.3'
      );

      assert.equal(
        result.auditRecord.restoredVersion,
        '1.8.2'
      );

      assert.equal(
        result.auditRecord.simulated,
        true
      );

      assert.equal(
        result.auditRecord.resultingStatus,
        'healthy'
      );
    }
  );
});