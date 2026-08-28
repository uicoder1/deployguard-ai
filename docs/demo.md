# DeployGuard Demo & Hackathon Evaluation Guide

> An AI Incident Response Agent built around [TrueForge](https://github.com/truefoundry/trueforge), TrueFoundry's open-source agent harness, powered by Gemini models and Model Context Protocol (MCP).

---

## 🎯 1. What DeployGuard Does

**DeployGuard** acts as an autonomous virtual Site Reliability Engineer (SRE). When production alerts trigger, DeployGuard:
1. **Queries Telemetry Automatically**: Uses structured Model Context Protocol (MCP) tools to inspect service metrics, error logs, and recent deployment records.
2. **Diagnoses Root Cause**: Correlates error spikes and database timeouts with recent code deployments.
3. **Enforces Human-in-the-Loop Safeguards**: Formulates a remediation plan and **requires explicit human operator approval** before taking any action.
4. **Executes Safe Rollbacks**: Executes a simulated rollback against the production state.
5. **Verifies Recovery**: Independently queries post-remediation metrics to verify service health restoration.

---

## 🚨 2. Production Incident Scenario

The demo environment simulates a critical production outage (`INC-2026-0842`):
- **Target Service**: `payment-api` (Payment Processing Service)
- **Trigger Event**: Deployment `#184` released version `v1.8.3` ("Payment gateway connection pool optimization").
- **Impact**:
  - Service status degraded to **`CRITICAL`**.
  - Error rate spiked to **`47.2%`** (threshold: 5.0%).
  - Average latency reached **`1840 ms`**.
  - **`5` out of `7`** service instances failed readiness health checks.
- **Log Footprint**:
  - `HTTP 500 POST /v1/charge - Payment processing failed: DB Connection Timeout after 5000ms`
  - `Database connection acquire timeout: pool exhausted for primary-db cluster`
  - Readiness probe TCP 8080 timeouts on worker pods.

---

## 🔍 3. Autonomous Investigation Workflow

When instructed to triage an incident, DeployGuard executes an autonomous diagnostic sequence:
```text
Alert Triggered
   ↓
get_service_status("payment-api")  --> Identifies CRITICAL status & 47.2% error rate
   ↓
get_recent_deployments("payment-api") --> Identifies recent Deployment #184 (v1.8.3)
   ↓
get_service_logs("payment-api", "ERROR") --> Identifies DB Connection Timeout logs post-#184
   ↓
get_deployment_details("184") --> Confirms commit & description of offending release
```

---

## 🛠️ 4. The Five Model Context Protocol (MCP) Tools

DeployGuard exposes 5 structured tools via Streamable HTTP transport on port `8791`:

| Tool Name | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `get_service_status` | Read-Only | Retrieves health status, error rates, latencies, and pod instance counts. | `{ serviceId: string }` |
| `get_service_logs` | Read-Only | Retrieves recent log entries filtered by severity level (`INFO`, `WARN`, `ERROR`, `FATAL`). | `{ serviceId?: string, level?: string, limit?: number }` |
| `get_recent_deployments` | Read-Only | Retrieves deployment history across all services or a specific service. | `{ serviceId?: string }` |
| `get_deployment_details` | Read-Only | Retrieves detailed metadata (version, commit hash, timestamp) for a deployment. | `{ deploymentId: string }` |
| `rollback_deployment` | Remediation | Safely simulates rolling back a service deployment to its previous successful version. | `{ deploymentId: string }` |

---

## 🛡️ 5. Human Approval Before Remediation

DeployGuard enforces strict **Human-in-the-Loop (HITL)** guardrails:

- **Automated Inspection**: Telemetry gathering and diagnostic tool calls run automatically.
- **Mandatory Approval Gate**: The agent **NEVER** calls `rollback_deployment` without explicit human operator consent.
- **Required Approval Pitch**: Before requesting confirmation, the agent must present:
  - **Affected Service**: `payment-api` (`Payment Processing Service`)
  - **Deployment ID**: `#184`
  - **Current Version**: `v1.8.3`
  - **Rollback Target Version**: `v1.8.2`
  - **Reason**: Database connection pool exhaustion introduced in `v1.8.3`.
  - **Risk Assessment**: Reverts connection pool settings back to stable `v1.8.2` configuration.
- **Strict Halting Policy**: If the operator responds with "No", asks a non-approval question, or asks to "investigate further", the agent halts without calling remediation.

---

## 🔄 6. Simulated Rollback Behavior

When `rollback_deployment("184")` is executed:
1. **Validation**: Confirms `#184` is the currently active deployment for `payment-api` and that previous successful deployment `#183` (`v1.8.2`) exists.
2. **Version Reversion**: Sets `payment-api` version from `1.8.3` to `1.8.2`.
3. **Status Restoration**: Restores service health metrics (`healthy`, `0.1%` error rate, `45ms` latency, `7/7` healthy instances).
4. **Deployment History Retention**: Marks Deployment `#184` status as `'rolled_back'` without deleting deployment logs or history.
5. **Incident Closure**: Updates incident `INC-2026-0842` status from `'OPEN'` to `'RESOLVED'`.

---

## 🩺 7. Independent Post-Rollback Verification

Immediately after `rollback_deployment` succeeds, the agent MUST call `get_service_status("payment-api")` to verify that the simulated environment reflects restored health:
```json
{
  "id": "payment-api",
  "status": "healthy",
  "errorRatePercent": 0.1,
  "averageLatencyMs": 45,
  "healthyInstances": 7,
  "unhealthyInstances": 0
}
```

---

## 📊 8. Expected Before / After Metrics for Deployment #184

| Metric / Parameter | Pre-Rollback (Active Outage) | Post-Rollback (Restored State) |
| :--- | :--- | :--- |
| **Service Version** | `1.8.3` | `1.8.2` |
| **Service Health Status** | `critical` 🔴 | `healthy` 🟢 |
| **Error Rate** | `47.2%` | `0.1%` |
| **Average Latency** | `1840 ms` | `45 ms` |
| **Healthy Pod Instances** | `2` | `7` |
| **Unhealthy Pod Instances** | `5` | `0` |
| **Deployment #184 Status** | `successful` | `rolled_back` |
| **Incident Status** | `OPEN` | `RESOLVED` |

---

## 💬 9. Exact TrueForge Demo Prompts

Follow this step-by-step prompt flow during a live TrueForge demonstration:

### Step 1: Trigger Investigation
> **User Prompt**:  
> `"Investigate the active critical alert on the payment-api service."`  
>  
> **Expected Agent Behavior**: Calls `get_service_status("payment-api")` and reports `critical` status with 47.2% error rate.

### Step 2: Correlate Deployment & Logs
> **User Prompt**:  
> `"Find the recent deployment and error logs for payment-api to identify the root cause."`  
>  
> **Expected Agent Behavior**: Calls `get_recent_deployments("payment-api")`, `get_deployment_details("184")`, and `get_service_logs("payment-api", "ERROR")`. Identifies Deployment `#184` (`v1.8.3`) as the cause due to database connection pool exhaustion.

### Step 3: Propose Remediation & Request Approval
> **User Prompt**:  
> `"Recommend a remediation plan to fix the outage."`  
>  
> **Expected Agent Behavior**: Recommends rolling back Deployment `#184` (`v1.8.3` → `v1.8.2`). **STOPS** and explicitly asks the user: *"Do you approve rolling back deployment #184 for payment-api from v1.8.3 to v1.8.2?"*

### Step 4: Execute Approved Rollback & Verify
> **User Prompt**:  
> `"Yes, I approve rolling back deployment 184."`  
>  
> **Expected Agent Behavior**: Calls `rollback_deployment("184")`, receives success payload, then immediately calls `get_service_status("payment-api")` to confirm metrics have returned to `healthy` (0.1% error rate, 45ms latency).

---

## ⚠️ 10. Safety Limitations

- **Simulator-Only Execution**: The `rollback_deployment` tool mutates the in-memory `ProductionSimulator` state inside `deployguard-simulator`.
- **No Infrastructure Touchpoints**: Does **NOT** execute shell commands, system binaries, Docker containers, Kubernetes (`kubectl`), or cloud provider APIs (AWS/GCP/Azure).
- **Deterministic Evaluation**: Ensures safe, repeatable evaluation of agent decision-making within the TrueForge agent harness sandbox.
