# DeployGuard MCP Server (`deployguard-production`)

The **DeployGuard Production MCP Server** is a Model Context Protocol (MCP) server providing read-only inspection tools for AI incident response agents like DeployGuard (powered by TrueForge).

---

## 🌐 Endpoints

- **MCP Streamable HTTP Endpoint**: `http://127.0.0.1:8791/mcp` (POST/GET)
- **Health Check Endpoint**: `http://127.0.0.1:8791/health` (GET)

---

## 🎯 Overview & Purpose

This server connects directly to the `deployguard-simulator` package as its single source of truth. It exposes standardized Model Context Protocol (MCP) tools over **Streamable HTTP transport** on port `8791`, enabling TrueForge agents to query production telemetry, service status, recent deployments, and application logs.

> [!NOTE]
> **Local-Only**: Bound specifically to `0.0.0.0:8791` for secure local development and multiple MCP sessions.  
> **Human-in-the-Loop Safeguards**: Inspection is automated, but remediation tools like `rollback_deployment` are strictly simulated against the in-memory simulator and REQUIRE explicit user approval before execution.

---

## 🛠️ Exposed MCP Tools

1. **`get_service_status`**
   - **Inputs**: `{ serviceId: string }`
   - **Description**: Returns operational metrics (status, error rate %, latency ms, healthy/unhealthy instances).

2. **`get_service_logs`**
   - **Inputs**: `{ serviceId: string, level?: string, limit?: number }`
   - **Description**: Returns recent log traces for a service with level filtering (`INFO`, `WARN`, `ERROR`, `FATAL`).

3. **`get_recent_deployments`**
   - **Inputs**: `{ serviceId?: string }`
   - **Description**: Returns deployment history across all services or a specific service.

4. **`get_deployment_details`**
   - **Inputs**: `{ deploymentId: string }`
   - **Description**: Returns detailed metadata for a specific deployment (e.g. version, commit hash, timestamp).

5. **`rollback_deployment`**
   - **Inputs**: `{ deploymentId: string }`
   - **Description**: Safely simulates rolling back a service deployment to the previous successful version in the local DeployGuard simulator.
   - **Safety Guarantee**: Does NOT execute shell commands, Docker, Kubernetes, or cloud APIs. Strictly mutates the local in-memory simulator state.

---

## 🤖 Agent Operating Instructions & Human-in-the-Loop Policy

1. **Autonomous Investigation**:
   - The agent performs root-cause investigation automatically using read-only tools (`get_service_status`, `get_service_logs`, `get_recent_deployments`, `get_deployment_details`).

2. **Explicit User Approval Required**:
   - Remediation via `rollback_deployment` is **NEVER** executed automatically.
   - Before calling `rollback_deployment`, the agent MUST explicitly prompt the user for approval with details on:
     - **Affected Service**
     - **Deployment ID**
     - **Current Version**
     - **Rollback Target Version**
     - **Reason**
     - **Risk**
   - If the user denies or has not clearly approved (e.g., asking to "investigate" or recommending a solution), stop and do NOT invoke `rollback_deployment`.
   - After a successful rollback, call `get_service_status` to verify the restored healthy service state.

---

## 💻 Installation, Build & Usage

### 1. Install Dependencies
```bash
cd mcp-server
npm install
```

### 2. Run Integration Tests
```bash
npm test
```

### 3. Build Production JavaScript Output
```bash
npm run build
```

### 4. Run Development Streamable HTTP Server
```bash
npm run dev
# or
npm run dev:http
```

### 5. Run Production HTTP Server
```bash
npm start
```
