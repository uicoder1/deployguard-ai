# DeployGuard

> An AI Incident Response Agent built around [TrueForge](https://github.com/truefoundry/trueforge), TrueFoundry's open-source agent harness.

Built for **The Agent Harness Hackathon**.

---

## 🚀 Overview

**DeployGuard** is an intelligent AI incident response agent designed to automatically triage, diagnose, and resolve software production incidents safely and efficiently. Powered by TrueFoundry's **TrueForge** agent harness and Google's **Gemini** models, DeployGuard acts as a virtual site reliability engineer (SRE) equipped with human-in-the-loop guardrails.

---

## 🎯 Problem Statement

Modern cloud infrastructure and microservices produce complex telemetry during outages or degraded states. SRE and DevOps teams face:
- High Mean Time to Resolution (MTTR) due to manual log inspection and metrics analysis.
- Risk of human error or unintended escalation during high-stress outages.
- Lack of standardized, safe execution sandboxes for automated remediation actions.

**DeployGuard** addresses these challenges by orchestrating autonomous investigation workflows using structured tools (MCP), isolated sandbox testing, and mandatory human approval gates before executing critical remediations.

---

## 🏗️ Project Architecture

```text
User
  ↓
DeployGuard Agent
  ↓
TrueForge
  ├── Gemini model
  ├── MCP tools
  ├── Sandbox
  └── Human approval
       ↓
Production Simulator
```

For detailed architectural notes, see [`docs/architecture.md`](docs/architecture.md).

---

## 🛠️ Model Context Protocol (MCP) Tools

DeployGuard exposes 5 structured tools via its Streamable HTTP MCP server:

1. **`get_service_status`**: Retrieve operational metrics and health status for microservices.
2. **`get_service_logs`**: Retrieve recent log entries with severity filtering.
3. **`get_recent_deployments`**: Retrieve recent deployment records.
4. **`get_deployment_details`**: Retrieve metadata for a specific deployment ID.
5. **`rollback_deployment`**: Safely simulate rolling back a service deployment to the previous successful version.

---

## 🤖 Agent Operating Instructions & Human-in-the-Loop Policy

- **Autonomous Investigation**: The agent automatically queries telemetry tools to triage and diagnose root causes.
- **Human Approval Gate**: Remediation via `rollback_deployment` is **NEVER** executed automatically. The agent must explicitly ask the user for approval, explaining:
  - Affected service name & ID
  - Target deployment ID
  - Current version & rollback target version
  - Root cause reason
  - Risk assessment
- **Safety Guarantee**: `rollback_deployment` only mutates the in-memory `ProductionSimulator` state and does not execute real shell commands, Kubernetes, Docker, or cloud API calls.
- **Verification**: Following a approved rollback, the agent executes `get_service_status` to verify that the service state has been restored to healthy.

---

## 📁 Repository Structure

```text
deployguard-ai/
├── README.md
├── .gitignore
├── LICENSE
├── docs/
│   └── architecture.md
├── simulator/
├── mcp-server/
└── frontend/
```

- **`docs/`**: Architecture documentation and design specifications.
- **`simulator/`**: Isolated production environment simulator for incident scenarios.
- **`mcp-server/`**: Model Context Protocol (MCP) server providing tools and system metrics to the agent.
- **`frontend/`**: Web user interface for monitoring incidents, viewing execution traces, and approving agent actions.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
