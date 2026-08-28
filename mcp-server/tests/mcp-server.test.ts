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

  before(async () => {
    // 1. Start HTTP Server on port 8791
    await startServer(PORT, '127.0.0.1');

    // 2. Initialize MCP Streamable HTTP Client
    clientTransport = new StreamableHTTPClientTransport(new URL(`${BASE_URL}/mcp`));
    client = new Client({ name: 'deployguard-test-client', version: '1.0.0' }, { capabilities: {} });
    await client.connect(clientTransport);
  });

  after(async () => {
    if (client) {
      try {
        await client.close();
      } catch {}
    }
    if (clientTransport) {
      try {
        await clientTransport.close();
      } catch {}
    }
    await stopServer();
  });

  it('1. HTTP server starts on port 8791', () => {
    assert.ok(httpServer.listening, 'HTTP server must be listening');
    const address = httpServer.address();
    assert.ok(address && typeof address === 'object');
    assert.equal(address.port, PORT);
  });

  it('2. GET /health returns 200 and correct status payload', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);

    const body = await res.json() as any;
    assert.equal(body.status, 'ok');
    assert.equal(body.server, 'deployguard-production');
  });

  it('3. MCP endpoint /mcp is reachable', async () => {
    const res = await fetch(`${BASE_URL}/mcp`, { method: 'GET' });
    // Streamable HTTP endpoint responds to GET/POST requests (returns 400/404 when missing session headers)
    assert.notEqual(res.status, 500, 'Endpoint should respond cleanly without internal server error');
  });

  it('4. MCP client initialization succeeds', () => {
    assert.ok(client, 'MCP Client connected over Streamable HTTP transport');
  });

  it('5. MCP tool listing contains exactly the five tools', async () => {
    const toolsResult = await client.listTools();
    assert.ok(toolsResult.tools, 'Tools list should exist');
    assert.equal(toolsResult.tools.length, 5);

    const toolNames = toolsResult.tools.map(t => t.name).sort();
    assert.deepEqual(toolNames, [
      'get_deployment_details',
      'get_recent_deployments',
      'get_service_logs',
      'get_service_status',
      'rollback_deployment'
    ]);
  });

  it('6. get_service_status("payment-api") returns critical status and 47.2% error rate', async () => {
    const res = await client.callTool({
      name: 'get_service_status',
      arguments: { serviceId: 'payment-api' }
    });

    assert.equal(res.isError, undefined);
    assert.ok(Array.isArray(res.content));
    assert.equal(res.content[0].type, 'text');

    const status = JSON.parse(res.content[0].text as string);
    assert.equal(status.id, 'payment-api');
    assert.equal(status.status, 'critical');
    assert.equal(status.errorRatePercent, 47.2);
    assert.equal(status.averageLatencyMs, 1840);
    assert.equal(status.healthyInstances, 2);
    assert.equal(status.unhealthyInstances, 5);
  });

  it('7. get_service_logs("payment-api", "ERROR", 10) returns payment failure logs', async () => {
    const res = await client.callTool({
      name: 'get_service_logs',
      arguments: { serviceId: 'payment-api', level: 'ERROR', limit: 10 }
    });

    assert.equal(res.isError, undefined);
    const logs = JSON.parse(res.content[0].text as string);
    assert.ok(Array.isArray(logs));
    assert.ok(logs.length > 0);
    assert.ok(logs.every((l: any) => l.serviceId === 'payment-api' && l.level === 'ERROR'));
    assert.ok(logs.some((l: any) => l.message.includes('Payment processing failed')));
  });

  it('8. get_recent_deployments("payment-api") includes deployment #184', async () => {
    const res = await client.callTool({
      name: 'get_recent_deployments',
      arguments: { serviceId: 'payment-api' }
    });

    assert.equal(res.isError, undefined);
    const deployments = JSON.parse(res.content[0].text as string);
    assert.ok(Array.isArray(deployments));
    assert.ok(deployments.some((d: any) => d.id === '184' && d.version === '1.8.3'));
  });

  it('9. get_deployment_details("184") returns deployment #184', async () => {
    const res = await client.callTool({
      name: 'get_deployment_details',
      arguments: { deploymentId: '184' }
    });

    assert.equal(res.isError, undefined);
    const dep = JSON.parse(res.content[0].text as string);
    assert.equal(dep.id, '184');
    assert.equal(dep.serviceId, 'payment-api');
    assert.equal(dep.version, '1.8.3');
    assert.equal(dep.status, 'successful');
  });

  it('10. Unknown service IDs produce a clear error', async () => {
    const res = await client.callTool({
      name: 'get_service_status',
      arguments: { serviceId: 'non-existent-service' }
    });

    assert.equal(res.isError, true);
    assert.ok((res.content[0].text as string).includes('non-existent-service'));
  });

  it('11. Unknown deployment IDs produce a clear error', async () => {
    const res = await client.callTool({
      name: 'get_deployment_details',
      arguments: { deploymentId: 'invalid-dep-id' }
    });

    assert.equal(res.isError, true);
    assert.ok((res.content[0].text as string).includes('invalid-dep-id'));
  });

  it('12. Supports multiple concurrent MCP sessions', async () => {
    const clientTransport2 = new StreamableHTTPClientTransport(new URL(`${BASE_URL}/mcp`));
    const client2 = new Client({ name: 'deployguard-test-client-2', version: '1.0.0' }, { capabilities: {} });
    await client2.connect(clientTransport2);

    const toolsResult = await client2.listTools();
    assert.ok(toolsResult.tools);
    assert.equal(toolsResult.tools.length, 5);

    await client2.close();
    await clientTransport2.close();
  });

  it('13. Unknown session ID returns 404', async () => {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': 'non-existent-session-id'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    });
    assert.equal(res.status, 404);
  });

  it('14. Non-initialize request without session ID returns 400', async () => {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    });
    assert.equal(res.status, 400);
  });

  it('15. rollback_deployment tool works over Streamable HTTP transport', async () => {
    const res = await client.callTool({
      name: 'rollback_deployment',
      arguments: { deploymentId: '184' }
    });

    assert.equal(res.isError, undefined);
    assert.ok(Array.isArray(res.content));
    assert.equal(res.content[0].type, 'text');

    const result = JSON.parse(res.content[0].text as string);
    assert.equal(result.deploymentId, '184');
    assert.equal(result.service, 'payment-api');
    assert.equal(result.previousVersion, '1.8.3');
    assert.equal(result.restoredVersion, '1.8.2');
    assert.equal(result.simulated, true);
    assert.equal(result.resultingServiceStatus.status, 'healthy');

    assert.ok(result.auditRecord);
    assert.equal(result.auditRecord.deploymentId, '184');
    assert.equal(result.auditRecord.service, 'payment-api');
    assert.equal(result.auditRecord.fromVersion, '1.8.3');
    assert.equal(result.auditRecord.restoredVersion, '1.8.2');
    assert.equal(result.auditRecord.simulated, true);
    assert.equal(result.auditRecord.resultingStatus, 'healthy');
  });
});

