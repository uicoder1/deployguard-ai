# DeployGuard

> AI-powered production incident response agent built with [TrueForge](https://github.com/truefoundry/trueforge).

Built for **The Agent Harness Hackathon**.

## 🚀 Live Demo

**Dashboard:** https://dashboard-anshu-gupta.vercel.app

**Source Code:** https://github.com/uicoder1/deployguard-ai

**Demo Video:** [Add your 3-minute demo video link here]

---

## 🎯 What is DeployGuard?

DeployGuard is an AI SRE agent that investigates production incidents, identifies likely root causes, recommends remediation, and safely executes approved actions.

Instead of manually checking metrics, logs, and deployments, the agent collects and correlates the evidence automatically.

### Example incident

A `payment-api` service experiences:

- 47.2% error rate
- 1840ms latency
- 5/7 unhealthy instances
- Failures beginning after deployment `#184`

DeployGuard investigates the incident, correlates the evidence, identifies deployment `#184` as the likely cause, and recommends a rollback.

The rollback **cannot happen automatically**.

The agent asks the human for approval first.

After approval:

```text
Investigation
      ↓
Evidence collection
      ↓
Root cause analysis
      ↓
Remediation recommendation
      ↓
Human approval
      ↓
rollback_deployment
      ↓
Recovery verification
      ↓
Audit record
```

---

## 🧠 Why TrueForge?

DeployGuard runs its AI agent through **TrueForge**, TrueFoundry's open-source agent harness.

TrueForge handles the agent execution and tool-calling loop:

```text
User
  ↓
TrueForge Agent
  ↓
Gemini
  ↓
MCP Tools
  ↓
Evidence → Diagnosis → Remediation
```

This is not a simple model wrapper. The agent uses TrueForge to reason over structured production tools and execute the incident-response workflow.

---

## 🛠️ MCP Tools

DeployGuard exposes five tools through a Streamable HTTP MCP server:

| Tool | Purpose |
|---|---|
| `get_service_status` | Service health and metrics |
| `get_service_logs` | Application error/warning logs |
| `get_recent_deployments` | Recent deployment history |
| `get_deployment_details` | Deployment metadata |
| `rollback_deployment` | Simulated deployment rollback |

---

## 🔐 Human-in-the-Loop Safety

Rollback is a potentially destructive action.

DeployGuard therefore requires **explicit human approval** before calling:

```text
rollback_deployment
```

The agent must explain:

- affected service
- deployment being rolled back
- current and target versions
- root-cause reasoning
- risk

The production environment is simulated. No real Kubernetes, Docker, cloud, or production infrastructure is modified.

---

## 📊 Demo Scenario

The included simulator contains a realistic payment incident:

**Deployment:** `#184`  
**Version:** `v1.8.3`  
**Error rate:** `47.2%`  
**Latency:** `1840ms`  
**Healthy pods:** `2/7`

The agent correlates deployment history and database connection-pool errors, recommends rollback, waits for human approval, executes the simulated rollback, and verifies recovery.

After rollback:

```text
Error rate:       47.2% → 0.1%
Latency:          1840ms → 45ms
Healthy pods:     2/7 → 7/7
Version:          1.8.3 → 1.8.2
```

---

## 🔎 Qodo Code Review Evidence

Substantive hackathon changes were developed through GitHub pull requests and reviewed by **Qodo** before merging.

### Representative PR

**PR #2: feat: add audited rollback remediation**

https://github.com/uicoder1/deployguard-ai/pull/2

Qodo identified two reliability/correctness issues:

1. Rollback audit records could be lost or incorrectly handled.
2. Historical audit records needed to remain reliable after remediation.

The findings were addressed by improving rollback audit handling and ensuring the resulting service state is refreshed correctly.

The PR was reviewed by Qodo, the findings were resolved, and the implementation was merged into `main`.

---

## 📁 Project Structure

```text
deployguard-ai/
├── dashboard/      # DeployGuard web dashboard
├── frontend/       # Frontend application
├── mcp-server/     # Streamable HTTP MCP server
├── simulator/      # Production incident simulator
└── docs/           # Architecture documentation
```

---

## ▶️ Running Locally

### MCP Server

```bash
cd mcp-server
npm install
npm test
npm start
```

The MCP server runs on:

```text
http://127.0.0.1:8791/mcp
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

---

## 🤖 AI Development Disclosure

AI coding assistants were used during development for implementation, debugging, documentation, and code review preparation. The project architecture, technical decisions, testing, and final implementation were reviewed and understood by the project author.

---

## 📜 License

MIT License.