# DeployGuard

> An AI Incident Response Agent built around [TrueForge](https://github.com/truefoundry/trueforge), TrueFoundry's open-source agent harness.

Built for **The Agent Harness Hackathon**.

---

## 🚀 Overview

**DeployGuard** is an AI-powered production incident response agent designed to investigate, diagnose, and safely remediate software production incidents.

It acts like a virtual Site Reliability Engineer (SRE). When a production service enters a degraded or critical state, DeployGuard uses structured MCP tools to collect service metrics, application logs, deployment history, and Kubernetes state.

The agent correlates this evidence to identify a likely root cause and recommends a remediation.

For potentially destructive actions such as a deployment rollback, DeployGuard requires **explicit human approval before execution**.

DeployGuard is powered by:

- **TrueForge** for agent orchestration and tool execution
- **Gemini** for AI reasoning
- **Model Context Protocol (MCP)** for structured access to production tools
- A simulated production environment for safe incident-response testing
- A web dashboard for incident visibility, remediation, and audit history

---

## 🎯 Problem Statement

Modern cloud infrastructure and microservices generate large amounts of telemetry during outages and degraded states.

During an incident, engineers often need to manually correlate:

- Service health metrics
- Application error logs
- Recent deployments
- Kubernetes workload state
- Deployment changes
- Recovery status

This increases Mean Time to Resolution (MTTR) and creates opportunities for human error, especially during high-pressure production incidents.

DeployGuard addresses this problem by providing an agent that can:

1. Detect and investigate a production incident
2. Collect evidence from multiple structured tools
3. Correlate the evidence
4. Identify a likely root cause
5. Recommend a remediation
6. Pause for human approval before performing a critical action
7. Execute the approved remediation through a tool
8. Verify the resulting service state
9. Record the remediation in an audit trail

---

## 🏗️ Architecture

```text
                         User
                           │
                           ▼
                  ┌─────────────────┐
                  │    TrueForge    │
                  │   Agent Harness │
                  └────────┬────────┘
                           │
                    Gemini Reasoning
                           │
                           ▼
                  ┌─────────────────┐
                  │    MCP Server   │
                  │    DeployGuard  │
                  └────────┬────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       Service Status    Logs       Deployments
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                  Kubernetes State
                           │
                           ▼
                  Evidence Correlation
                           │
                           ▼
                    Root Cause Analysis
                           │
                           ▼
                 Remediation Recommendation
                           │
                           ▼
                  ┌──────────────────┐
                  │  HUMAN APPROVAL  │
                  └────────┬─────────┘
                           │
                      Approved?
                           │
                           ▼
                  rollback_deployment
                           │
                           ▼
                  Production Simulator
                           │
                           ▼
                  Recovery Verification
                           │
                           ▼
                     Audit Record
```

For additional architecture details, see [`docs/architecture.md`](docs/architecture.md).

---

## 🤖 TrueForge Integration

DeployGuard uses **TrueForge as the agent harness**, rather than using a model API as a standalone chatbot.

TrueForge provides the environment in which the DeployGuard agent reasons, selects tools, calls the MCP server, receives tool results, and continues the incident-response workflow.

The agent can:

1. Receive an incident investigation request
2. Determine which production tools are required
3. Call DeployGuard MCP tools
4. Collect structured evidence
5. Correlate the evidence
6. Identify a likely root cause
7. Recommend remediation
8. Stop for human approval before a critical action
9. Execute the approved rollback
10. Verify the resulting service state

The combination of TrueForge and MCP allows DeployGuard to operate as a tool-using incident-response agent rather than simply generating an incident report.

---

## 🛠️ Model Context Protocol (MCP) Tools

DeployGuard exposes five structured tools through its Streamable HTTP MCP server.

### `get_service_status`

Retrieves the current operational state of a service, including:

- Health status
- Version
- Error rate
- Average latency
- Healthy instances
- Unhealthy instances

### `get_service_logs`

Retrieves recent service logs with severity information.

The agent uses these logs to identify production errors and correlate them with the incident.

### `get_recent_deployments`

Retrieves recent deployment records for a service.

The agent uses deployment history to identify changes that may correlate with the incident.

### `get_deployment_details`

Retrieves detailed information about a specific deployment.

This gives the agent additional context about the deployment associated with the incident.

### `rollback_deployment`

Simulates rolling back a service deployment to the previous successful version.

This is the remediation tool and is executed only after the required human approval.

---

## 🔐 Human-in-the-Loop Safety

DeployGuard separates **incident investigation** from **production remediation**.

Read-only investigation tools can be used by the agent during autonomous analysis.

A rollback requires explicit human approval.

Before requesting approval, the agent provides:

- Affected service
- Deployment ID
- Current version
- Target rollback version
- Root cause
- Supporting evidence
- Risk assessment
- Recommended action

The workflow is:

```text
Incident
   ↓
Investigation
   ↓
Evidence Collection
   ↓
Root Cause Analysis
   ↓
Remediation Recommendation
   ↓
HUMAN APPROVAL
   ↓
Approved
   ↓
Rollback
   ↓
Recovery Verification
   ↓
Audit Record
```

This creates a clear safety boundary between AI reasoning and remediation.

---

## 🧪 Production Simulator

DeployGuard uses an isolated **simulated production environment** for incident-response testing.

The simulator provides realistic state for:

- Services
- Deployments
- Application logs
- Kubernetes deployments
- Kubernetes pods
- Kubernetes events
- Service health
- Rollback operations
- Audit records

The rollback workflow does not execute real production infrastructure commands.

It does not execute:

- Kubernetes commands
- Docker commands
- Shell commands
- Cloud infrastructure APIs

Instead, the rollback mutates the controlled simulator state and returns the resulting service status.

This makes it possible to demonstrate the complete incident-response workflow safely.

---

## 🚨 Example Incident

DeployGuard was tested against a simulated `payment-api` production incident.

### Initial State

```text
Service:              payment-api
Status:               CRITICAL
Version:              v1.8.3
Error Rate:           47.2%
Average Latency:      1840 ms
Healthy Instances:    2 / 7
Unhealthy Instances:  5
Deployment:           #184
```

The agent investigated the service, logs, and deployment history.

Recent deployment:

```text
Deployment #184
Version: v1.8.3
Description:
Payment gateway connection pool optimization v1.8.3
```

The agent then found database-related errors:

```text
HTTP 500 POST /v1/charge
DB Connection Timeout

Database connection acquire timeout
Pool exhausted for primary-db cluster

HTTP 500 POST /v1/refund
Connection reset by peer
```

The evidence correlated the incident with deployment `#184`.

The agent identified database connection-pool exhaustion as the likely root cause and recommended:

```text
Rollback deployment #184
Restore payment-api from v1.8.3 to v1.8.2
```

The agent then waited for human approval before executing the rollback.

---

## 🔄 Recovery Verification

After human approval, DeployGuard executes the simulated rollback and verifies the service state.

### Before Rollback

```text
Status:              CRITICAL
Version:             v1.8.3
Error Rate:          47.2%
Average Latency:     1840 ms
Healthy Instances:   2 / 7
```

### After Rollback

```text
Status:              HEALTHY
Version:             v1.8.2
Error Rate:          0.1%
Average Latency:     45 ms
Healthy Instances:   7 / 7
```

The rollback also creates an audit record containing:

- Deployment ID
- Service
- Previous version
- Restored version
- Reason
- Timestamp
- Simulation status
- Resulting service status

---

## 📊 Incident Response Lifecycle

DeployGuard follows this incident-response lifecycle:

```text
Incident Detected
       ↓
Investigate
       ↓
Collect Evidence
       ↓
Correlate Signals
       ↓
Identify Root Cause
       ↓
Recommend Remediation
       ↓
Human Approval
       ↓
Execute Rollback
       ↓
Verify Recovery
       ↓
Create Audit Record
```

---

## 🖥️ Dashboard

The DeployGuard dashboard provides visibility into:

- Service health
- Error rates
- Latency
- Healthy and unhealthy instances
- Deployment information
- Incident state
- Investigation results
- Evidence
- Remediation recommendations
- Recovery state
- Audit history

The dashboard is designed to make the agent's investigation and remediation understandable to an engineer during an incident.

---

## 📁 Repository Structure

```text
deployguard-ai/
│
├── README.md
├── LICENSE
│
├── docs/
│   └── architecture.md
│
├── simulator/
│   └── Production environment simulator
│
├── mcp-server/
│   └── MCP server and production tools
│
└── dashboard/
    └── DeployGuard web dashboard
```

### `docs/`

Architecture and design documentation.

### `simulator/`

Simulated production environment containing services, deployments, logs, incidents, and rollback state.

### `mcp-server/`

Streamable HTTP MCP server exposing the production investigation and remediation tools.

### `dashboard/`

Web dashboard for incident monitoring, investigation, remediation, and audit information.

---

## 🚀 Running DeployGuard

### Prerequisites

- Node.js
- npm
- Git
- Gemini model/API configuration
- TrueForge
- Modern web browser

### Clone the Repository

```bash
git clone https://github.com/uicoder1/deployguard-ai.git
cd deployguard-ai
```

### MCP Server

The DeployGuard MCP server exposes the production tools through Streamable HTTP.

Local MCP endpoint:

```text
http://127.0.0.1:8791/mcp
```

Health endpoint:

```text
http://127.0.0.1:8791/health
```

### TrueForge

Run the TrueForge agent harness:

```bash
npx @truefoundry/trueforge@latest
```

Configure the DeployGuard MCP server as the agent's MCP tool provider.

---

## 🧪 MCP Integration Tests

The MCP server includes integration tests covering the production incident workflow.

The tests cover functionality including:

- MCP server startup
- Health endpoint
- MCP endpoint availability
- MCP client initialization
- Tool discovery
- Service status retrieval
- Service log retrieval
- Recent deployment retrieval
- Deployment detail retrieval
- Invalid service handling
- Invalid deployment handling

Run the relevant tests from the MCP server directory:

```bash
npm test
```

---

## 🔎 Qodo Code Review Evidence

DeployGuard's substantive hackathon changes were developed through GitHub pull requests and reviewed by **Qodo** before merging.

### Representative Reviewed PR

**PR #2: `feat: add audited rollback remediation`**

[View PR #2](https://github.com/uicoder1/deployguard-ai/pull/2)

Qodo reviewed the rollback remediation implementation and identified two reliability/correctness issues:

1. Rollback success could be recorded repeatedly.
2. Audit records could remain mutable after creation.

The identified issues were addressed by improving the rollback flow and audit handling.

The final implementation ensures that rollback operations are handled correctly and that the resulting remediation state is recorded in the audit trail.

The findings were marked as resolved, the updated implementation was reviewed, and the final commit was merged into `main`.

The complete Qodo review history, findings, resolutions, and merged changes are available in [PR #2](https://github.com/uicoder1/deployguard-ai/pull/2).

---

## 🤝 AI Development Disclosure

AI coding assistants were used during development for implementation assistance, debugging, documentation, and code-review preparation.

The project author reviewed and understood the architecture, implementation, MCP integration, agent workflow, safety model, testing, and final technical decisions.

---

## 🎥 Demo

The demo demonstrates the complete DeployGuard workflow:

```text
Critical payment-api incident
            ↓
TrueForge Agent
            ↓
MCP Tool Calls
            ↓
Evidence Collection
            ↓
Root Cause Analysis
            ↓
Rollback Recommendation
            ↓
Human Approval
            ↓
rollback_deployment
            ↓
v1.8.3 → v1.8.2
            ↓
Service Recovery
            ↓
Audit Record
```

**Demo Video:**  
_Add the public demo video URL here before submission._

---

## 🛡️ Safety and Scope

DeployGuard is demonstrated against a simulated production environment.

The project does not connect the rollback workflow to real production infrastructure.

The simulator provides a safe environment for demonstrating:

- Agent investigation
- Evidence correlation
- Root-cause analysis
- Human approval
- Remediation
- Recovery verification
- Auditing

A real infrastructure deployment would require additional authentication, authorization, RBAC, policy enforcement, environment isolation, and operational safeguards.

---

## 🔮 Future Improvements

Potential future improvements include:

- Real Kubernetes integrations with strict RBAC
- Additional remediation actions
- Automated incident severity classification
- Advanced anomaly detection
- Persistent incident storage
- Slack or PagerDuty integration
- Staging verification before production remediation
- Policy-based approval requirements
- Multi-agent investigation workflows
- Historical incident analysis

---

## 📜 License

This project is licensed under the MIT License.

See the [`LICENSE`](LICENSE) file for details.